from django.contrib.auth import authenticate, get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone


class SafeTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    default_error_messages = {
        "no_active_account": "Credenciales inválidas.",
    }

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip().lower()
        password = attrs.get("password") or ""

        if not email or not password:
            raise AuthenticationFailed("Credenciales inválidas.")

        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            username = user.get_username()
        except User.DoesNotExist:
            raise AuthenticationFailed("Credenciales inválidas.")

        authenticated = authenticate(
            request=self.context.get("request"),
            username=username,
            password=password,
        )

        if not authenticated:
            raise AuthenticationFailed("Credenciales inválidas.")

        authenticated.last_login = timezone.now()
        authenticated.save(update_fields=["last_login"])

        # Generar tokens
        refresh = self.get_token(authenticated)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class SafeTokenObtainPairView(TokenObtainPairView):
    serializer_class = SafeTokenObtainPairSerializer