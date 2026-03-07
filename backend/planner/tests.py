from django.test import TestCase
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import Actividad, Tarea

class HoyEndpointOrderingTests(APITestCase):
    """
    Tests para el endpoint GET /api/tareas/hoy/ para verificar 
    que el backend agrupa y ordena subtareas:
         
    - Grupos: Vencidas / Para hoy / Próximas 
    - Orden:
        * Vencidas: fecha más antigua primero
        * Para hoy: (solo desempate por horas)
        * Próximas: fecha más cercana primero
    - Desempate: menor horas_estimadas primero

    Atributos:
        user (User): Usuario de prueba.
        activity (Actividad): actividad del usuario.
        varias Tarea instanciadas para cubrir los tres grupos.

    Casos de testing:
        - test_hoy_groups_and_ordering:
            Verifica que la respuesta contenga las tres claves ("vencidas",
            "para_hoy", "proximas") y que el orden de cada grupo cumpla
            las reglas.
    """
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester_de_hoy", password="Contrasenia!"
        )
        self.activity = Actividad.objects.create(
            usuario=self.user,
            titulo="Actividad prueba",
            curso="Curso Pruena",
            tipo="otro",
            fecha_entrega=date.today() + timedelta(days=30),
        )

        today = date.today()

        # asignar tareas vencidas 
        self.v_old_near = Tarea.objects.create(
            actividad=self.activity,
            nombre="Vencida reciente",
            fecha_objetivo=today - timedelta(days=1),
            horas_estimadas=Decimal("2.0"),
        )
        self.v_old_far = Tarea.objects.create(
            actividad=self.activity,
            nombre="Vencida antigua",
            fecha_objetivo=today - timedelta(days=5),
            horas_estimadas=Decimal("1.0"),
        )

        # asignar tareas para hoy
        self.t1 = Tarea.objects.create(
            actividad=self.activity,
            nombre="Hoy esfuerzo3",
            fecha_objetivo=today,
            horas_estimadas=Decimal("3.0"),
        )
        self.t2 = Tarea.objects.create(
            actividad=self.activity,
            nombre="Hoy esfuerzo1",
            fecha_objetivo=today,
            horas_estimadas=Decimal("1.0"),
        )

        # asignar tareas próximas 
        self.p_far = Tarea.objects.create(
            actividad=self.activity,
            nombre="Proxima lejana",
            fecha_objetivo=today + timedelta(days=4),
            horas_estimadas=Decimal("2.0"),
        )
        self.p_near = Tarea.objects.create(
            actividad=self.activity,
            nombre="Proxima cercana",
            fecha_objetivo=today + timedelta(days=1),
            horas_estimadas=Decimal("1.0"),
        )

        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token)}")

    def test_hoy_groups_and_ordering(self):
        resp = self.client.get("/api/tareas/hoy/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        data = resp.data
        self.assertIn("vencidas", data)
        self.assertIn("para_hoy", data)
        self.assertIn("proximas", data)

        # Vencidas
        vencidas_ids = [t["id"] for t in data["vencidas"]]
        self.assertEqual(vencidas_ids, [self.v_old_far.id, self.v_old_near.id])

        # Para hoy
        hoy_ids = [t["id"] for t in data["para_hoy"]]
        self.assertEqual(hoy_ids, [self.t2.id, self.t1.id])

        # Próximas
        proximas_ids = [t["id"] for t in data["proximas"]]
        self.assertEqual(proximas_ids, [self.p_near.id, self.p_far.id])

        # Resultado esperado (solo nombres), el mismo orden que se verifica arriba:
        # Vencidas: ["Vencida antigua", "Vencida reciente"]
        # Para hoy: ["Hoy esfuerzo1", "Hoy esfuerzo3"]
        # Próximas: ["Proxima cercana", "Proxima lejana"]
        
"""

Desde la carpeta del backend:
python manage.py test planner --keepdb -v 2

"""