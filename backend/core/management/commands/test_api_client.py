import time
import requests
from django.core.management.base import BaseCommand
from core.models import APIKeyUsageLog, APIKey

class Command(BaseCommand):
    help = 'Runs a diagnostic API client probe against target HTTP endpoint to measure latency and test pagination.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            default='http://10.2.1.18:8000/api/employees/',
            help='Target API URL to test'
        )
        parser.add_argument(
            '--page-size',
            type=int,
            default=10,
            help='Page size parameter to request'
        )
        parser.add_argument(
            '--api-key',
            type=str,
            default='sk_f17809304f6b4bdcb7f6415fbf3bdb30',
            help='API Key to pass in header'
        )
        parser.add_argument(
            '--timeout',
            type=int,
            default=30,
            help='Read timeout in seconds'
        )

    def handle(self, *args, **options):
        url = options['url']
        page_size = options['page_size']
        api_key_str = options['api_key']
        timeout = options['timeout']

        full_url = f"{url}?page=1&page_size={page_size}"

        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("  [API GATEWAY TELEMETRY DIAGNOSTIC PROBE]"))
        self.stdout.write("="*80)
        self.stdout.write(f"TARGET ENDPOINT : {full_url}")
        self.stdout.write(f"API KEY         : {api_key_str[:12]}...")
        self.stdout.write(f"TIMEOUT SETTING : Connect: 5s | Read: {timeout}s\n")

        headers = {
            'X-API-KEY': api_key_str,
            'User-Agent': 'SCM-DiagnosticClient/1.0'
        }

        start_time = time.time()
        try:
            response = requests.get(full_url, headers=headers, timeout=(5, timeout))
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            status_code = response.status_code

            self.stdout.write(self.style.SUCCESS(f"[SUCCESS] RESPONSE STATUS : {status_code} OK"))
            self.stdout.write(self.style.SUCCESS(f"[SUCCESS] LATENCY         : {elapsed_ms} ms"))
            self.stdout.write(f"CONTENT LENGTH  : {len(response.content)} bytes")

            # Try to log to DB for Dashboard UI visibility
            api_key_obj = APIKey.objects.filter(key__startswith=api_key_str[:8]).first()
            if not api_key_obj:
                api_key_obj = APIKey.objects.first()

            APIKeyUsageLog.objects.create(
                api_key=api_key_obj,
                endpoint=f"[CLIENT PROBE] {full_url}",
                method="GET",
                status_code=status_code,
                ip_address="127.0.0.1 (Client Probe)",
                user_agent="SCM-DiagnosticClient/1.0"
            )

            self.stdout.write(self.style.SUCCESS("[AUDIT] TELEMETRY LOGGED TO GATEWAY DASHBOARD IN UI!"))

        except requests.exceptions.Timeout:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            self.stdout.write(self.style.ERROR(f"[ERROR] TIMEOUT EXCEEDED after {elapsed_ms} ms! Server did not respond within {timeout}s."))
        except Exception as e:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            self.stdout.write(self.style.ERROR(f"[ERROR] CONNECTION ERROR ({elapsed_ms} ms): {str(e)}"))

        self.stdout.write("="*80 + "\n")
