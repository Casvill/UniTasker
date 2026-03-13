from django.test import TestCase
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken

from .models import Actividad, Tarea


def create_actividad(user, titulo, curso, tipo="examen", fecha=None):
    return Actividad.objects.create(
        usuario=user,
        titulo=titulo,
        curso=curso,
        tipo=tipo,
        fecha_entrega=fecha or date.today() + timedelta(days=5),
    )


def create_tarea(actividad, nombre, fecha=None, horas=1, estado="pendiente"):
    return Tarea.objects.create(
        actividad=actividad,
        nombre=nombre,
        fecha_objetivo=fecha or date.today(),
        horas_estimadas=Decimal(str(horas)),
        estado=estado,
    )


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
        self.activity = create_actividad(
            self.user,
            "Actividad prueba",
            "Curso Pruena",
            "otro",
            date.today() + timedelta(days=30),
        )

        today = date.today()

        # asignar tareas vencidas
        self.v_old_near = create_tarea(
            self.activity, "Vencida reciente", today - timedelta(days=1), 2.0
        )
        self.v_old_far = create_tarea(
            self.activity, "Vencida antigua", today - timedelta(days=5), 1.0
        )

        # asignar tareas para hoy
        self.t1 = create_tarea(
            self.activity,
            "Hoy esfuerzo3",
            today,
            3.0,
        )
        self.t2 = create_tarea(self.activity, "Hoy esfuerzo1", today, 1.0)

        # asignar tareas próximas
        self.p_far = create_tarea(
            self.activity, "Proxima lejana", today + timedelta(days=4), 2.0
        )
        self.p_near = create_tarea(
            self.activity, "Proxima cercana", today + timedelta(days=1), 1.0
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


class HoyEndpointFiltersAndMessagesTests(APITestCase):
    """
    Tests para el endpoint GET /api/tareas/hoy/ que validan los filtros y los mensajes de respuesta.

    Casos para testing:
        - test_hoy_empty_message:
            Verifica que, sin actividades ni tareas, el mensaje sea el de vacío.
        - test_hoy_activity_no_tasks_with_filter:
            Verifica que, al aplicar un filtro de curso sin tareas, el mensaje sea el de "no se encontraron tareas con los filtros aplicados".
        - test_hoy_filter_by_course:
            Verifica que, al filtrar por curso, solo se devuelvan las tareas correspondientes a ese curso.
        - test_hoy_filter_by_estado:
            Verifica que, al filtrar por estado ("pendiente" o "hecha"), solo se devuelvan las tareas con ese estado.

    Utiliza los helpers create_actividad y create_tarea definidos en este archivo.
    """

    def assert_empty_response(self, resp, msg_contains):
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["vencidas"], [])
        self.assertEqual(resp.data["para_hoy"], [])
        self.assertEqual(resp.data["proximas"], [])
        self.assertEqual(resp.data["total"], 0)
        self.assertIsNotNone(resp.data["mensaje"])
        self.assertIn(msg_contains, resp.data["mensaje"])

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="tester_de_filtros", password="Contrasenia1!"
        )
        self.client.force_authenticate(self.user)

    def test_hoy_empty_message(self):
        """Sin tareas ni actividades, muestra mensaje de vacío"""
        resp = self.client.get("/api/tareas/hoy/")
        self.assertEqual(resp.status_code, 200)
        self.assert_empty_response(resp, "No tienes tareas programadas")

    def test_hoy_activity_no_tasks_with_filter(self):
        """filtro aplicado pero no existen tareas de ese curso, muestra mensaje de filtro"""
        resp = self.client.get("/api/tareas/hoy/?curso=Mate")
        self.assertEqual(resp.status_code, 200)
        self.assert_empty_response(
            resp, "No se encontraron tareas con los filtros aplicados"
        )

    def test_hoy_filter_by_course(self):
        """Dos actividades, cada una con una tarea, filtro por curso"""
        self.act1 = create_actividad(self.user, "Matemáticas", "Mate 1")
        self.act2 = create_actividad(self.user, "Historia", "Hist 2")
        self.t1 = create_tarea(self.act1, "Tarea mate", date.today(), 1)
        self.t2 = create_tarea(self.act2, "Tarea hist", date.today(), 1)
        # Filtro por curso que solo matchee una
        resp = self.client.get("/api/tareas/hoy/?curso=Hist")
        self.assertEqual(resp.status_code, 200)
        data = resp.data
        # Solo debe haber una tarea en para_hoy
        self.assertEqual(len(data["para_hoy"]), 1)
        # El nombre de la tarea devuelta debe ser "Tarea hist"
        self.assertEqual(data["para_hoy"][0]["nombre"], "Tarea hist")

    def test_hoy_filter_by_estado(self):
        """Filtrar por estado 'pendiente' y 'hecha'"""
        self.act = create_actividad(self.user, "Ciencias", "Ciencias 1")
        self.t1 = create_tarea(
            self.act, "TareaPendiente", date.today(), 1, estado="pendiente"
        )
        self.t2 = create_tarea(self.act, "TareaHecha", date.today(), 1, estado="hecha")

        # Solo pendiente
        resp = self.client.get("/api/tareas/hoy/?estado=pendiente")
        self.assertEqual(resp.status_code, 200)
        # Debe haber solo una tarea en el grupo "para_hoy"
        self.assertEqual(len(resp.data["para_hoy"]), 1)
        # El nombre de la tarea devuelta debe ser "TareaPendiente"
        self.assertEqual(resp.data["para_hoy"][0]["nombre"], "TareaPendiente")

        # Solo hecha
        resp2 = self.client.get("/api/tareas/hoy/?estado=hecha")
        self.assertEqual(resp2.status_code, 200)
        # Debe haber solo una tarea en el grupo "para_hoy"
        self.assertEqual(len(resp2.data["para_hoy"]), 1)
        # El nombre de la tarea devuelta debe ser "TareaHecha"
        self.assertEqual(resp2.data["para_hoy"][0]["nombre"], "TareaHecha")


"""

Desde la carpeta del backend:
python manage.py test planner --keepdb -v 2

"""
