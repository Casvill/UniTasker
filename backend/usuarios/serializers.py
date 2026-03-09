from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "daily_hour_limit"]
        extra_kwargs = {
            "password": {"write_only": True},
            "daily_hour_limit": {"required": False},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
