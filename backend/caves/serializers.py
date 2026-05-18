from django.contrib.gis.geos import Point
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer, GeometryField
from .models import Cave, CaveMedia


class CaveSerializer(serializers.ModelSerializer):
    location = GeometryField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    parking_latitude = serializers.SerializerMethodField()
    parking_longitude = serializers.SerializerMethodField()

    class Meta:
        model = Cave
        fields = [
            "id",
            "registry_id",
            "plaque_number",
            "name",
            "location",
            "latitude",
            "longitude",
            "elevation",
            "length",
            "depth_positive",
            "depth_negative",
            "municipality",
            "valley",
            "geology",
            "description",
            "last_survey_date",
            "parking_latitude",
            "parking_longitude",
            "parking_notes",
            "is_published",
            "created_at",
            "updated_at",
        ]

    def get_latitude(self, obj):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj):
        return obj.location.x if obj.location else None

    def get_parking_latitude(self, obj):
        return obj.parking_location.y if obj.parking_location else None

    def get_parking_longitude(self, obj):
        return obj.parking_location.x if obj.parking_location else None


class CaveGeoSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Cave
        geo_field = "location"
        fields = [
            "registry_id",
            "name",
            "elevation",
            "depth_positive",
            "depth_negative",
            "length",
        ]


class CaveWriteSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(write_only=True)
    longitude = serializers.FloatField(write_only=True)
    parking_latitude = serializers.FloatField(write_only=True, required=False, allow_null=True)
    parking_longitude = serializers.FloatField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Cave
        fields = [
            "id",
            "registry_id",
            "plaque_number",
            "name",
            "latitude",
            "longitude",
            "elevation",
            "length",
            "depth_positive",
            "depth_negative",
            "municipality",
            "valley",
            "geology",
            "description",
            "last_survey_date",
            "parking_latitude",
            "parking_longitude",
            "parking_notes",
            "is_published",
        ]

    def get_fields(self):
        fields = super().get_fields()
        if self.instance:
            fields["registry_id"].read_only = True
        return fields

    def create(self, validated_data):
        lat = validated_data.pop("latitude")
        lon = validated_data.pop("longitude")
        validated_data["location"] = Point(lon, lat, srid=4326)
        p_lat = validated_data.pop("parking_latitude", None)
        p_lon = validated_data.pop("parking_longitude", None)
        if p_lat is not None and p_lon is not None:
            validated_data["parking_location"] = Point(p_lon, p_lat, srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop("latitude", None)
        lon = validated_data.pop("longitude", None)
        if lat is not None and lon is not None:
            validated_data["location"] = Point(lon, lat, srid=4326)
        p_lat = validated_data.pop("parking_latitude", None)
        p_lon = validated_data.pop("parking_longitude", None)
        if p_lat is not None and p_lon is not None:
            validated_data["parking_location"] = Point(p_lon, p_lat, srid=4326)
        elif "parking_latitude" in self.initial_data and self.initial_data["parking_latitude"] in (None, ""):
            validated_data["parking_location"] = None
        return super().update(instance, validated_data)


class CaveMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = CaveMedia
        fields = [
            "id",
            "file",
            "media_type",
            "caption",
            "file_url",
            "uploaded_by",
            "uploaded_at",
        ]
        extra_kwargs = {"file": {"write_only": True}}

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
