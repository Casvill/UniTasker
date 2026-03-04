from django.test import TestCase
from datetime import timedelta

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

class JWTUnauthorizedCasesTests(APITestCase):
    """
    Esto es un conjutno de tests que validan los escenarios de acceso no autorizado
    a un endpoint protegido que usa JWT.

    Atributos:
        user (User): Usuario de prueba creado para la generacion de tokens.
        protected_url (str): Endpoint que requiere autenticacion JWT.

    Casos para testing:
        - test_no_token_returns_401:
            Verifica que una solicitud sin header autenticado
            returns: HTTP 401 Unauthorized.

        - test_invalid_token_returns_401:
            Verifica que una solicitud con un JWT inválido
            returns: HTTP 401 Unauthorized.

        - test_expired_token_returns_401:
            Verifica que una solicitud con un JWT expirado
            returns: HTTP 401 Unauthorized.
    """
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester_de_jwt",
            password="Contrasenia!",
        )
        #Ejemplo de un endpoint
        self.protected_url = "/api/actividades/"

    def test_no_token_returns_401(self):
        """
        Se hace una petición al endpoint pero sin enviar ningun token
        """
        response = self.client.get(self.protected_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_returns_401(self):
        """
        Se agrega un header Authorization con un token falso y se hace la petición
        """
        self.client.credentials(HTTP_AUTHORIZATION="Bearer token.invalido")
        response = self.client.get(self.protected_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_token_returns_401(self):
        """
        Se genera un token valido pero luego lo hacemos expirar y se hace la petición
        """
        expired = AccessToken.for_user(self.user)
        expired.set_exp(lifetime=timedelta(seconds=-1))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(expired)}")
        response = self.client.get(self.protected_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class JWTLoginErrorHandlingTests(APITestCase):
    """
    Para este conjunto de test validan el manejo seguro de errores en el
    endpoint de autenticación JWT (/api/token/) 

    Casos para testing:
        - test_existing_user_wrong_credentials & test_invalid_credentials
            Ambos verifican que el sistema responda con 401 y un mensaje genérico cuando las 
            credenciales son inválidas, en uno creamos un usuario real e intentamos la autenticación
            con una credencial invalida, en otro ambas son invalidad.
    """
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester_de_mensaje",
            email="tester@unitasker.com",
            password="Contrasenia_correcta",
        )

    def test_existing_user_wrong_credentials(self):
        """
        Verifica que un usuario existente con contraseña incorrecta
        retorne 401 y mensaje genérico.
        """
        response = self.client.post(
            "/api/token/",
            {
                "email": "tester@unitasker.com",
                "password": "Contrasenia_incorrecta"
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get("detail"), "Credenciales inválidas.")

    def test_invalid_credentials(self):
        """
        Verifica que cuando ambas credenciales (en este caso)
        retorne 401 y mensaje genérico.
        """
        response = self.client.post(
            "/api/token/",
            {
                "email": "noexiste@unitasker.com", 
                "password": "Contrasenia_mala",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data.get("detail"), "Credenciales inválidas.")