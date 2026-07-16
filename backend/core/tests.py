from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from core.models import Employee, Position, Shift, PositionShiftRoster, Role
import datetime

class PositionShiftRosterBulkTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_superuser(username='admin', password='adminpassword', email='admin@example.com')
        self.client.force_authenticate(user=self.user)

        # Create basic dependencies
        self.role = Role.objects.create(name="Software Developer")
        self.position = Position.objects.create(name="Engineer", role=self.role)
        self.employee1 = Employee.objects.create(name="John Doe", employee_code="EMP001")
        self.employee2 = Employee.objects.create(name="Jane Smith", employee_code="EMP002")

        self.shift1 = Shift.objects.create(
            name="Morning Shift",
            start_time=datetime.time(8, 0),
            end_time=datetime.time(16, 0)
        )
        self.shift2 = Shift.objects.create(
            name="Evening Shift",
            start_time=datetime.time(16, 0),
            end_time=datetime.time(23, 59)
        )
        self.shift_overlap = Shift.objects.create(
            name="Midday Shift",
            start_time=datetime.time(12, 0),
            end_time=datetime.time(20, 0)
        )

    def test_bulk_assign_success(self):
        data = {
            'employee': self.employee1.id,
            'position': self.position.id,
            'shift': self.shift1.id,
            'dates': ['2026-07-20', '2026-07-21', '2026-07-22'],
            'overwrite': False
        }
        response = self.client.post('/api/position-shift-rosters/bulk-assign/', data, format='json')
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(len(res_data['success_dates']), 3)
        self.assertEqual(len(res_data['skipped_dates']), 0)
        self.assertEqual(PositionShiftRoster.objects.count(), 3)

    def test_bulk_assign_exclusivity_conflict_without_overwrite(self):
        # Assign shift1 to employee1 on 2026-07-20
        PositionShiftRoster.objects.create(
            employee=self.employee1,
            position=self.position,
            shift=self.shift1,
            date=datetime.date(2026, 7, 20)
        )

        # Try to bulk-assign shift1 to employee2 on 2026-07-20 and 2026-07-21
        data = {
            'employee': self.employee2.id,
            'position': self.position.id,
            'shift': self.shift1.id,
            'dates': ['2026-07-20', '2026-07-21'],
            'overwrite': False
        }
        response = self.client.post('/api/position-shift-rosters/bulk-assign/', data, format='json')
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['success_dates'], ['2026-07-21'])
        self.assertEqual(len(res_data['skipped_dates']), 1)
        self.assertEqual(res_data['skipped_dates'][0]['date'], '2026-07-20')
        # Check that count is 2 (the existing one + the new one on the 21st)
        self.assertEqual(PositionShiftRoster.objects.count(), 2)

    def test_bulk_assign_exclusivity_conflict_with_overwrite(self):
        # Assign shift1 to employee1 on 2026-07-20
        PositionShiftRoster.objects.create(
            employee=self.employee1,
            position=self.position,
            shift=self.shift1,
            date=datetime.date(2026, 7, 20)
        )

        # Try to bulk-assign shift1 to employee2 on 2026-07-20 and 2026-07-21 with overwrite=True
        data = {
            'employee': self.employee2.id,
            'position': self.position.id,
            'shift': self.shift1.id,
            'dates': ['2026-07-20', '2026-07-21'],
            'overwrite': True
        }
        response = self.client.post('/api/position-shift-rosters/bulk-assign/', data, format='json')
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['success_dates'], ['2026-07-20', '2026-07-21'])
        self.assertEqual(len(res_data['skipped_dates']), 0)
        
        # Verify that employee2 replaced employee1 on 2026-07-20
        roster_20 = PositionShiftRoster.objects.get(position=self.position, shift=self.shift1, date='2026-07-20')
        self.assertEqual(roster_20.employee.id, self.employee2.id)

    def test_bulk_assign_overlap_conflict(self):
        # Assign shift1 (08:00 - 16:00) to employee1 on 2026-07-20 on a different position
        other_position = Position.objects.create(name="Lead Engineer", role=self.role)
        PositionShiftRoster.objects.create(
            employee=self.employee1,
            position=other_position,
            shift=self.shift1,
            date=datetime.date(2026, 7, 20)
        )

        # Try to bulk-assign shift_overlap (12:00 - 20:00) to employee1 on 2026-07-20 (overlapping) and 2026-07-21 (non-overlapping)
        data = {
            'employee': self.employee1.id,
            'position': self.position.id,
            'shift': self.shift_overlap.id,
            'dates': ['2026-07-20', '2026-07-21'],
            'overwrite': False
        }
        response = self.client.post('/api/position-shift-rosters/bulk-assign/', data, format='json')
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['success_dates'], ['2026-07-21'])
        self.assertEqual(len(res_data['skipped_dates']), 1)
        self.assertEqual(res_data['skipped_dates'][0]['date'], '2026-07-20')
        self.assertIn("overlap", res_data['skipped_dates'][0]['reason'])

    def test_bulk_delete(self):
        # Create some rosters
        for d in [datetime.date(2026, 7, 20), datetime.date(2026, 7, 21), datetime.date(2026, 7, 22)]:
            PositionShiftRoster.objects.create(
                employee=self.employee1,
                position=self.position,
                shift=self.shift1,
                date=d
            )
        self.assertEqual(PositionShiftRoster.objects.count(), 3)

        # Perform bulk delete for two of the dates
        data = {
            'position': self.position.id,
            'shift': self.shift1.id,
            'dates': ['2026-07-20', '2026-07-21']
        }
        response = self.client.post('/api/position-shift-rosters/bulk-delete/', data, format='json')
        self.assertEqual(response.status_code, 200)
        res_data = response.json()
        self.assertTrue(res_data['success'])
        self.assertEqual(res_data['deleted_count'], 2)
        self.assertEqual(PositionShiftRoster.objects.count(), 1)
