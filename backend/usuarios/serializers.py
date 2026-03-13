from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class DailyHourLimitSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["daily_hour_limit"]

    def validate_daily_hour_limit(self, value):
        if value < 1 or value > 16:
            raise serializers.ValidationError(
                "El límite diario debe estar entre 1 y 16 horas."
            )
        return value
