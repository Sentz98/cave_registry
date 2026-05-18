from django.contrib.gis.db import models
from django.contrib.auth.models import User


class Cave(models.Model):
    GEOLOGY_CHOICES = [
        ("limestone", "Limestone"),
        ("dolomite", "Dolomite"),
        ("gypsum", "Gypsum"),
        ("other", "Other"),
    ]

    registry_id = models.CharField(max_length=50, unique=True)
    plaque_number = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=255)
    location = models.PointField(srid=4326, geography=True)
    elevation = models.IntegerField(blank=True, null=True)
    length = models.FloatField(blank=True, null=True)
    depth_positive = models.FloatField(blank=True, null=True)
    depth_negative = models.FloatField(blank=True, null=True)

    # Enrichment fields
    municipality = models.CharField(max_length=255, blank=True, null=True)
    valley = models.CharField(max_length=255, blank=True, null=True)
    geology = models.CharField(
        max_length=50, choices=GEOLOGY_CHOICES, blank=True, null=True
    )
    description = models.TextField(blank=True, null=True)
    last_survey_date = models.DateField(blank=True, null=True)

    parking_location = models.PointField(srid=4326, geography=True, blank=True, null=True)
    parking_notes = models.CharField(max_length=500, blank=True, null=True)

    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.registry_id} - {self.name}"


def cave_media_path(instance, filename):
    return f"caves/{instance.cave.registry_id}/{filename}"


class CaveMedia(models.Model):
    MEDIA_TYPE_CHOICES = [
        ("photo", "Photo"),
        ("survey_pdf", "Survey PDF"),
        ("survey_image", "Survey Image"),
    ]

    cave = models.ForeignKey(Cave, on_delete=models.CASCADE, related_name="media")
    file = models.FileField(upload_to=cave_media_path)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    caption = models.CharField(max_length=255, blank=True, null=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.media_type} for {self.cave.registry_id}"
