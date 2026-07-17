from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_vehicleswaplog_new_vehicle_no_a_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='apikey',
            name='webhook_url',
            field=models.URLField(
                blank=True,
                help_text='URL to POST shift roster change events to',
                max_length=500,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='apikey',
            name='webhook_events',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='List of events to fire: shift.assigned, shift.unassigned, shift.bulk_assigned',
            ),
        ),
    ]
