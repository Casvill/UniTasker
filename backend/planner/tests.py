from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Actividad, Tarea
from datetime import date

User = get_user_model()

class SyncLogicTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.actividad = Actividad.objects.create(
            usuario=self.user,
            titulo="Test Actividad",
            curso="Test Curso",
            fecha_entrega=date.today(),
            estado="pendiente"
        )
        self.tarea1 = Tarea.objects.create(
            actividad=self.actividad,
            nombre="Tarea 1",
            fecha_objetivo=date.today(),
            horas_estimadas=1.0,
            estado="pendiente"
        )
        self.tarea2 = Tarea.objects.create(
            actividad=self.actividad,
            nombre="Tarea 2",
            fecha_objetivo=date.today(),
            horas_estimadas=1.0,
            estado="pendiente"
        )

    def test_marking_all_tasks_done_marks_activity_done(self):
        self.tarea1.estado = "hecha"
        self.tarea1.save()
        self.actividad.refresh_from_db()
        self.assertEqual(self.actividad.estado, "pendiente")

        self.tarea2.estado = "hecha"
        self.tarea2.save()
        self.actividad.refresh_from_db()
        self.assertEqual(self.actividad.estado, "hecha")

    def test_marking_activity_done_marks_all_tasks_done(self):
        self.actividad.estado = "hecha"
        self.actividad.save()
        
        self.tarea1.refresh_from_db()
        self.tarea2.refresh_from_db()
        
        self.assertEqual(self.tarea1.estado, "hecha")
        self.assertEqual(self.tarea2.estado, "hecha")

    def test_marking_task_pending_marks_activity_pending(self):
        # First mark all as done
        self.actividad.estado = "hecha"
        self.actividad.save()
        
        # Now mark one task as pending
        self.tarea1.estado = "pendiente"
        self.tarea1.save()
        
        self.actividad.refresh_from_db()
        self.assertEqual(self.actividad.estado, "pendiente")

    def test_deleting_pending_task_marks_activity_done_if_rest_are_done(self):
        self.tarea1.estado = "hecha"
        self.tarea1.save()
        
        # tarea2 is still pending
        self.actividad.refresh_from_db()
        self.assertEqual(self.actividad.estado, "pendiente")
        
        # Delete the only pending task
        self.tarea2.delete()
        
        self.actividad.refresh_from_db()
        self.assertEqual(self.actividad.estado, "hecha")
