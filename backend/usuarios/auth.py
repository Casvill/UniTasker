from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class SafeTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        "no_active_account": "Credenciales inválidas.",
    }

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except Exception:
            raise AuthenticationFailed("Credenciales inválidas.")


class SafeTokenObtainPairView(TokenObtainPairView):
    serializer_class = SafeTokenObtainPairSerializer