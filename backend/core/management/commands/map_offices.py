import openpyxl
import difflib
import re
from django.core.management.base import BaseCommand
from core.models import Office

class Command(BaseCommand):
    help = 'Map and insert SAC and Vehicle codes from the Excel report into L9 offices uniquely'

    def add_arguments(self, parser):
        parser.add_argument('--commit', action='store_true', help='Commit changes to the database')

    def clean_name(self, n):
        if not n:
            return ""
        n = str(n).replace('104-MMU-AP', '').replace('104-MMU', '')
        # Remove any non-alphanumeric chars
        n = ''.join(c for c in n if c.isalnum()).lower().strip()
        return n

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting Office mapping process...'))
        
        excel_path = r"C:\Users\user\Downloads\all 104SEGment&Service codes (1) (1).xlsx"
        self.stdout.write(f"Reading Excel: {excel_path}")
        
        try:
            wb = openpyxl.load_workbook(excel_path, data_only=True)
            ws = wb.active
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to open Excel file: {e}"))
            return

        excel_records = []
        for row in ws.iter_rows(min_row=2, max_row=2000, values_only=True):
            if not any(row) or row[0] is None:
                break
            
            base_loc = row[8]      # Column I: Base Location
            base_code = row[9]     # Column J: Base Location Code
            sac = row[11]          # Column L: SAC
            vehicle_code = row[13] # Column N: SFC (Vehicle Code)
            
            if not base_loc and not base_code:
                continue
                
            excel_records.append({
                'base_loc': base_loc,
                'base_code': base_code,
                'sac': sac,
                'vehicle_code': vehicle_code,
                'clean_loc': self.clean_name(base_loc),
                'clean_code': self.clean_name(base_code)
            })

        self.stdout.write(self.style.SUCCESS(f"Loaded {len(excel_records)} rows from Excel."))

        # Load L9 offices for AP 104 project
        project_name = 'AP 104 - Mobile Medical Unit'
        l9_offices = list(Office.objects.filter(level__level_code='L9', facility_master__project__name=project_name))
        self.stdout.write(f"Loaded {len(l9_offices)} L9 offices for project '{project_name}'.")

        # Prep match dicts
        exact_code_map = {rec['clean_code']: rec for rec in excel_records if rec['clean_code']}
        exact_loc_map = {rec['clean_loc']: rec for rec in excel_records if rec['clean_loc']}
        excel_clean_names = list(set([rec['clean_loc'] for rec in excel_records if rec['clean_loc']] + 
                                     [rec['clean_code'] for rec in excel_records if rec['clean_code']]))

        # Sort offices: primary ones first, secondary/numbered ones last
        def sort_key(office):
            name = office.name.lower()
            if re.search(r'[-_\s]\d+$', name):
                return (1, name)
            return (0, name)

        l9_offices.sort(key=sort_key)

        assigned_sacs = {}  # sac -> office_id
        updated_count = 0
        unmatched_count = 0
        commit = options['commit']

        for office in l9_offices:
            c_name = self.clean_name(office.name)
            match_rec = None

            # 1. Exact match on clean Base Location Code
            if c_name in exact_code_map:
                match_rec = exact_code_map[c_name]
            # 2. Exact match on clean Base Location
            elif c_name in exact_loc_map:
                match_rec = exact_loc_map[c_name]
            # 3. Base name match (strip trailing digits)
            else:
                base_name_clean = re.sub(r'\d+$', '', c_name)
                if base_name_clean in exact_code_map:
                    match_rec = exact_code_map[base_name_clean]
                elif base_name_clean in exact_loc_map:
                    match_rec = exact_loc_map[base_name_clean]
                # 4. Fuzzy match
                else:
                    close_matches = difflib.get_close_matches(c_name, excel_clean_names, n=1, cutoff=0.85)
                    if close_matches:
                        match_name = close_matches[0]
                        match_rec = exact_code_map.get(match_name) or exact_loc_map.get(match_name)

            if match_rec:
                base_sac = match_rec['sac']
                target_sac = base_sac
                new_vc = match_rec['vehicle_code']

                # Suffix SAC if already taken
                suffix = 2
                while target_sac in assigned_sacs and assigned_sacs[target_sac] != office.id:
                    target_sac = f"{base_sac}-{suffix}"
                    suffix += 1

                assigned_sacs[target_sac] = office.id

                old_sac = office.sac
                old_vc = office.vehicle_code

                # Update database if different
                if old_sac != target_sac or old_vc != new_vc:
                    office.sac = target_sac
                    office.vehicle_code = new_vc
                    if commit:
                        office.save()
                    updated_count += 1
                    self.stdout.write(f"Mapped: {office.name} -> SAC: {target_sac}, Vehicle: {new_vc}")
            else:
                unmatched_count += 1
                self.stdout.write(self.style.WARNING(f"Unmatched: {office.name} (Clean: {c_name})"))

        self.stdout.write(f"\n--- Mapping Summary ---")
        self.stdout.write(f"Total offices checked: {len(l9_offices)}")
        self.stdout.write(f"Successfully matched and updated: {updated_count}")
        self.stdout.write(f"Unmatched: {unmatched_count}")

        if commit:
            self.stdout.write(self.style.SUCCESS("Successfully updated database records!"))
        else:
            self.stdout.write(self.style.WARNING("DRY RUN: No database changes were made. Run with --commit to save changes."))
