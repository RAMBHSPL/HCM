import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models import Position
from django.db.models import Count

print("MDP Positions Breakdown by Office Level / Position Level / Role")
print("=" * 70)

mdp = Position.objects.filter(section__name='M.D.P.').select_related(
    'role', 'office__level', 'level'
)
breakdown = (
    mdp.values('office__level__name', 'level__name', 'level__rank', 'role__name')
    .annotate(c=Count('id'))
    .order_by('level__rank', 'office__level__name')
)

for r in breakdown:
    print(
        f"Pos Level: {r['level__name']} (rank {r['level__rank']}) | "
        f"Office Level: {r['office__level__name']} | "
        f"Role: {r['role__name']} | "
        f"Count: {r['c']}"
    )

print()
print("Sample L9 (FACILITATE) MDP positions:")
l9_mdp = mdp.filter(office__level__name='FACILITATE')
print(f"  Total L9 MDP: {l9_mdp.count()}")
for p in l9_mdp[:5]:
    print(f"  [{p.id}] {p.name} | Role: {p.role.name if p.role else None}")
