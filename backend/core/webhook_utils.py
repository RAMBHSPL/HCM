"""
Async webhook dispatcher for HCM push notifications.
Fires an HTTP POST to the registered webhook_url on an API key
whenever a shift roster or core entity event occurs.
"""
import json
import threading
import hashlib
import hmac
import time
import uuid
import requests
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
    from django.db import connection
    connection.close()
    from core.models import APIKey, APIKeyUsageLog  # local import to avoid circular deps
    try:
        api_key = APIKey.objects.get(id=api_key_id)
    except Exception as err:
        print(f"[Webhook Error fetching key {api_key_id}]: {err}")
        return

    # SCM Webhook requirements config
    event_id = str(uuid.uuid4())
    timestamp = str(int(time.time()))

    try:
        sequence = APIKeyUsageLog.objects.count() + 1
    except Exception:
        sequence = int(time.time())

    # Build SCM standard envelope body
    body = {
        "event_id": event_id,
        "event_type": event,
        "occurred_at": timezone.now().isoformat() + "Z",
        "sequence": sequence,
        "entity": event.split('.')[0] if '.' in event else 'unknown',
        "entity_id": payload.get('id') or payload.get('employee_id') or payload.get('position_id'),
        "data": payload,
        "changes": {},
        "reason": "system_sync",
        "actor": {
            "id": 1,
            "name": "System"
        }
    }
    body_str = json.dumps(body, default=str)

    # Compute SCM HMAC-SHA256 signature: HMAC-SHA256(secret, "<X-HCM-Timestamp>.<raw request body>")
    signature_base = f"{timestamp}.{body_str}"
    signature = hmac.new(
        api_key.key.encode(),
        signature_base.encode(),
        hashlib.sha256
    ).hexdigest()

    delays = [30, 120, 600]
    max_retries = len(delays)
    status_code = None

    for attempt in range(max_retries):
        delivery_id = str(uuid.uuid4())
        headers = {
            "Content-Type": "application/json",
            "X-HCM-Event-Id": event_id,
            "X-HCM-Event-Type": event,
            "X-HCM-Delivery-Id": delivery_id,
            "X-HCM-Timestamp": timestamp,
            "X-HCM-Signature": f"sha256={signature}",
            "X-HCM-Attempt": str(attempt + 1),
            "User-Agent": "HCM-Webhook/1.0",
        }

        try:
            resp = requests.post(
                webhook_url,
                data=body_str,
                headers=headers,
                timeout=10,
            )
            status_code = resp.status_code
            resp.raise_for_status()
            print(f"[Webhook] [OK] {event} -> {webhook_url} [{resp.status_code}]")
            break
        except requests.RequestException as e:
            if hasattr(e, 'response') and getattr(e, 'response', None) is not None:
                status_code = e.response.status_code
            print(f"[Webhook] [FAIL] Attempt {attempt + 1}/{max_retries} failed for {event} -> {webhook_url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(delays[attempt])

    # Record delivery log for full tracking & audits in API Key Management UI
    try:
        APIKeyUsageLog.objects.create(
            api_key=api_key,
            endpoint=f"[WEBHOOK {event}] {webhook_url}",
            method="POST",
            status_code=status_code or 500,
            user_agent="HCM-Webhook-Engine/1.0"
        )
    except Exception:
        pass


def is_in_api_key_scope(api_key, payload, event: str = None) -> bool:
    """Validate if the payload is within the allowed scope of the API key."""
    scope = api_key.scope or {}
    if not scope or scope.get('type', 'GLOBAL') == 'GLOBAL':
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
    position = None

    # Handle Position payload directly vs Employee/Shift payload
    is_pos_payload = (event and event.startswith('position.')) or ('parent_position_id' in payload and 'job_name' in payload)

    if is_pos_payload:
        pos_id = payload.get('id')
        if pos_id:
            try:
                position = Position.objects.prefetch_related('office', 'department', 'section').get(id=pos_id)
            except Position.DoesNotExist:
                pass
    else:
        emp_id = payload.get('employee_id') or payload.get('id')
        if emp_id:
            try:
                employee = Employee.objects.get(id=emp_id)
            except Employee.DoesNotExist:
                pass

        pos_id = payload.get('position_id')
        if pos_id:
            try:
                position = Position.objects.prefetch_related('office', 'department', 'section').get(id=pos_id)
            except Position.DoesNotExist:
                pass

    def position_matches(pos):
        if not pos:
            return False

        if 'OFFICE' in grouped and hasattr(pos, 'office_id') and str(pos.office_id) in grouped['OFFICE']:
            return True
        if 'DEPARTMENT' in grouped and hasattr(pos, 'department_id') and str(pos.department_id) in grouped['DEPARTMENT']:
            return True
        if 'SECTION' in grouped and hasattr(pos, 'section_id') and str(pos.section_id) in grouped['SECTION']:
            return True
        if 'ROLE' in grouped and hasattr(pos, 'role_id') and str(pos.role_id) in grouped['ROLE']:
            return True
        if 'LEVEL' in grouped and hasattr(pos, 'level_id') and str(pos.level_id) in grouped['LEVEL']:
            return True
        if 'PROJECT' in grouped:
            proj_id = None
            if hasattr(pos, 'section') and pos.section and getattr(pos.section, 'project_id', None):
                proj_id = pos.section.project_id
            elif hasattr(pos, 'department') and pos.department and getattr(pos.department, 'project_id', None):
                proj_id = pos.department.project_id
            elif hasattr(pos, 'office') and pos.office and hasattr(pos.office, 'projects'):
                p_first = pos.office.projects.first()
                if p_first:
                    proj_id = p_first.id
            if proj_id and str(proj_id) in grouped['PROJECT']:
                return True
        off = getattr(pos, 'office', None)
        if off:
            if 'CLUSTER' in grouped and getattr(off, 'cluster_id', None) and str(off.cluster_id) in grouped['CLUSTER']:
                return True
            if 'MANDAL' in grouped and getattr(off, 'mandal_id', None) and str(off.mandal_id) in grouped['MANDAL']:
                return True
            if 'DISTRICT' in grouped and getattr(off, 'district_id', None) and str(off.district_id) in grouped['DISTRICT']:
                return True
            if 'STATE' in grouped and getattr(off, 'state_id', None) and str(off.state_id) in grouped['STATE']:
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


def _dispatch_direct(webhook_url: str, event: str, payload: dict):
    """Direct send for global DEFAULT_WEBHOOK_URL configured in settings/.env."""
    event_id = str(uuid.uuid4())
    timestamp = str(int(time.time()))
    body = {
        "event_id": event_id,
        "event_type": event,
        "occurred_at": timezone.now().isoformat() + "Z",
        "sequence": int(time.time()),
        "entity": event.split('.')[0] if '.' in event else 'unknown',
        "entity_id": payload.get('id') or payload.get('employee_id') or payload.get('position_id'),
        "data": payload,
        "changes": {},
        "reason": "system_sync",
        "actor": {
            "id": 1,
            "name": "System"
        }
    }
    body_str = json.dumps(body, default=str)
    headers = {
        "Content-Type": "application/json",
        "X-HCM-Event-Id": event_id,
        "X-HCM-Event-Type": event,
        "X-HCM-Delivery-Id": str(uuid.uuid4()),
        "X-HCM-Timestamp": timestamp,
        "User-Agent": "HCM-Webhook/1.0",
    }
    try:
        resp = requests.post(webhook_url, data=body_str, headers=headers, timeout=10)
        print(f"[Webhook Direct] ✓ {event} → {webhook_url} [{resp.status_code}]")
    except Exception as e:
        print(f"[Webhook Direct] ✗ Failed for {event} → {webhook_url}: {e}")


def fire_shift_webhook(event: str, payload: dict):
    """
    Find all active API keys that have a webhook_url configured and
    include `event` in their webhook_events list, then dispatch asynchronously.
    Also supports global DEFAULT_WEBHOOK_URL from settings/.env.
    Flushes cache to guarantee zero-latency updated data on API reads.
    """
    from core.models import APIKey  # local import
    from django.conf import settings
    from django.core.cache import cache

    # Instantly invalidate cache on roster/shift/entity changes
    try:
        cache.clear()
    except Exception:
        pass

    keys = list(APIKey.objects.filter(
        is_active=True,
        webhook_url__isnull=False,
    ).exclude(webhook_url=''))
    print(f'[DEBUG Webhook] Event: {event}, Matching Keys Found: {len(keys)}')

    default_url = getattr(settings, 'DEFAULT_WEBHOOK_URL', None) or getattr(settings, 'WEBHOOK_URL', None)

    # If no custom API keys with webhook URLs are registered, but a DEFAULT_WEBHOOK_URL is set in .env
    if not keys and default_url:
        t = threading.Thread(
            target=_dispatch_direct,
            args=(default_url, event, payload),
            daemon=True,
        )
        t.start()
        return

    for api_key in keys:
        subscribed = api_key.webhook_events
        if subscribed and event not in subscribed:
            print(f"[DEBUG Key {api_key.id}] Skipped event mismatch: {subscribed}")
            continue

        if not is_in_api_key_scope(api_key, payload, event):
            print(f"[DEBUG Key {api_key.id}] Skipped scope mismatch")
            continue

        urls = [u.strip() for u in api_key.webhook_url.split(',') if u.strip()]
        for target_url in urls:
            print(f"[DEBUG Key {api_key.id}] Dispatching thread to {target_url}")
            t = threading.Thread(
                target=_dispatch,
                args=(target_url, event, payload, api_key.id),
                daemon=True,
            )
            t.start()

