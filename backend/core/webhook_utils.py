"""
Async webhook dispatcher for HCM push notifications.
Fires an HTTP POST to the registered webhook_url on an API key
whenever a shift roster event occurs.

Events fired:
  shift.assigned       — single assignment created/updated
  shift.unassigned     — single assignment deleted
  shift.bulk_assigned  — bulk_assign action completed
  shift.bulk_deleted   — bulk_delete action completed
"""
import json
import threading
import hashlib
import hmac
import time
import datetime
import requests  # pip install requests (already in requirements)
from django.utils import timezone


def _build_signature(payload_str: str, secret: str) -> str:
    """HMAC-SHA256 signature so receiving apps can verify authenticity."""
    return hmac.new(
        secret.encode(),
        payload_str.encode(),
        hashlib.sha256
    ).hexdigest()


def _dispatch(webhook_url: str, event: str, payload: dict, api_key_id: int):
    """Blocking send — called in a daemon thread."""
    from core.models import APIKey  # local import to avoid circular deps
    try:
        api_key = APIKey.objects.get(id=api_key_id)
    except APIKey.DoesNotExist:
        return

    # Build body
    body = {
        "event": event,
        "timestamp": timezone.now().isoformat(),
        "source": "HCM Shift Roster",
        "data": payload,
    }
    body_str = json.dumps(body, default=str)

    # Sign with key value for verification
    signature = hmac.new(
        api_key.key.encode(),
        body_str.encode(),
        hashlib.sha256
    ).hexdigest()

    headers = {
        "Content-Type": "application/json",
        "X-HCM-Event": event,
        "X-HCM-Signature": f"sha256={signature}",
        "X-HCM-Api-Key": api_key.key[:8] + "...",
        "User-Agent": "HCM-Webhook/1.0",
    }

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.post(
                webhook_url,
                data=body_str,
                headers=headers,
                timeout=10,
            )
            resp.raise_for_status()
            print(f"[Webhook] ✓ {event} → {webhook_url} [{resp.status_code}]")
            return
        except requests.RequestException as e:
            wait = 2 ** attempt  # exponential backoff: 1s, 2s, 4s
            print(f"[Webhook] ✗ Attempt {attempt + 1}/{max_retries} failed for {event} → {webhook_url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(wait)

    print(f"[Webhook] ✗ All retries exhausted for {event} → {webhook_url}")


def is_in_api_key_scope(api_key, payload) -> bool:
    """Validate if the shift payload is within the allowed scope of the API key."""
    scope = api_key.scope
    if scope.get('type') == 'GLOBAL':
        return True

    entities = scope.get('entities', [])
    if not entities:
        return False

    grouped = {}
    for ent in entities:
        et = ent.get('type')
        eid = str(ent.get('id'))
        if et and eid:
            if et not in grouped:
                grouped[et] = set()
            grouped[et].add(eid)

    from core.models import Employee, Position
    employee = None
    if 'employee_id' in payload:
        try:
            employee = Employee.objects.get(id=payload['employee_id'])
        except Employee.DoesNotExist:
            pass

    position = None
    if 'position_id' in payload:
        try:
            position = Position.objects.prefetch_related('office', 'department', 'section').get(id=payload['position_id'])
        except Position.DoesNotExist:
            pass

    # Helper function to check if a specific position matches the grouped scopes
    def position_matches(pos):
        if not pos:
            return False
        
        # Office check
        if 'OFFICE' in grouped and str(pos.office_id) in grouped['OFFICE']:
            return True
        # Department check
        if 'DEPARTMENT' in grouped and str(pos.department_id) in grouped['DEPARTMENT']:
            return True
        # Section check
        if 'SECTION' in grouped and str(pos.section_id) in grouped['SECTION']:
            return True
        # Role check
        if 'ROLE' in grouped and str(pos.role_id) in grouped['ROLE']:
            return True
        # Level check
        if 'LEVEL' in grouped and str(pos.office.level_id) in grouped['LEVEL']:
            return True
        # Project check
        if 'PROJECT' in grouped:
            proj_id = (pos.section.project_id if pos.section else None) or (pos.department.project_id if pos.department else None)
            if proj_id and str(proj_id) in grouped['PROJECT']:
                return True
        # Geo check
        off = pos.office
        if off:
            if 'CLUSTER' in grouped and off.cluster_id and str(off.cluster_id) in grouped['CLUSTER']:
                return True
            if 'MANDAL' in grouped and off.mandal_id and str(off.mandal_id) in grouped['MANDAL']:
                return True
            if 'DISTRICT' in grouped and off.district_id and str(off.district_id) in grouped['DISTRICT']:
                return True
            if 'STATE' in grouped and off.state_id and str(off.state_id) in grouped['STATE']:
                return True
            if 'COUNTRY' in grouped and off.country_id and str(off.country_id) in grouped['COUNTRY']:
                return True
            if 'CONTINENT' in grouped and off.country and off.country.continent_ref_id and str(off.country.continent_ref_id) in grouped['CONTINENT']:
                return True
        return False

    # Check Employee direct scopes and position scopes
    if employee:
        if 'EMPLOYEE' in grouped and str(employee.id) in grouped['EMPLOYEE']:
            return True
        for pos in employee.positions.all():
            if 'POSITION' in grouped and str(pos.id) in grouped['POSITION']:
                return True
            if position_matches(pos):
                return True

    # Check Position direct scopes
    if position:
        if 'POSITION' in grouped and str(position.id) in grouped['POSITION']:
            return True
        if position_matches(position):
            return True

    return False


def fire_shift_webhook(event: str, payload: dict):
    """
    Find all active API keys that have a webhook_url configured and
    include `event` in their webhook_events list, then dispatch asynchronously.

    Args:
        event:   One of: shift.assigned, shift.unassigned,
                         shift.bulk_assigned, shift.bulk_deleted
        payload: Dict of roster data to include in the webhook body
    """
    from core.models import APIKey  # local import

    keys = APIKey.objects.filter(
        is_active=True,
        webhook_url__isnull=False,
    ).exclude(webhook_url='')

    for api_key in keys:
        # Check if this key has subscribed to the event
        subscribed = api_key.webhook_events
        # If webhook_events is empty list → fire ALL events (opt-in to everything)
        if subscribed and event not in subscribed:
            continue

        # Enforce API Key scoping constraints on the payload data
        if not is_in_api_key_scope(api_key, payload):
            continue

        t = threading.Thread(
            target=_dispatch,
            args=(api_key.webhook_url, event, payload, api_key.id),
            daemon=True,
        )
        t.start()
