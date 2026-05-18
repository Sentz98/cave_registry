import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("caves", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="cave",
            name="parking_location",
            field=django.contrib.gis.db.models.fields.PointField(
                blank=True, geography=True, null=True, srid=4326
            ),
        ),
        migrations.AddField(
            model_name="cave",
            name="parking_notes",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
