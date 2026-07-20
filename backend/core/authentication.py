from rest_framework import authentication, exceptions
from .models import APIKey, APIKeyUsageLog
from django.utils import timezone

class APIKeyAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # 1. Check headers
        key = request.headers.get('X-Api-Key') or request.META.get('HTTP_X_API_KEY')
        if not key:
            # Check Authorization: Api-Key <key>
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Api-Key '):
                key = auth_header.split(' ')[1]
        
        if not key:
            return None

        # 2. Validate Key
        try:
            api_key = APIKey.objects.get(key=key)
        except APIKey.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid API Key')

        if not api_key.is_active:
             raise exceptions.AuthenticationFailed('API Key is revoked')

        if api_key.valid_until and api_key.valid_until < timezone.now().date():
             raise exceptions.AuthenticationFailed('API Key has expired')
        
        # 3. Non-blocking async logging and stats update
        import threading
        
        def _record_usage(key_id, remote_addr, path, method, user_agent):
            try:
                from django.db import models
                APIKey.objects.filter(id=key_id).update(
                    usage_count=models.F('usage_count') + 1,
                    last_used=timezone.now()
                )
                APIKeyUsageLog.objects.create(
                    api_key_id=key_id,
                    ip_address=remote_addr,
                    endpoint=path,
                    method=method,
                    user_agent=user_agent
                )
            except Exception:
                pass

        threading.Thread(
            target=_record_usage,
            args=(
                api_key.id,
                request.META.get('REMOTE_ADDR'),
                request.path,
                request.method,
                request.META.get('HTTP_USER_AGENT')
            ),
            daemon=True
        ).start()

        # 4. Return User and Key
        # We return the Creator as the content_object user, but the 'auth' object is the key itself
        return (api_key.user, api_key)
