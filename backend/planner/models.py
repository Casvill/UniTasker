from django.db import models
from django.conf import settings

# ------------------------------------------------------------


class Actividad(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="actividades"
    )
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    fecha_entrega = models.DateField()
    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


# ------------------------------------------------------------


class Tarea(models.Model):

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("hecha", "Hecha"),
        ("pospuesta", "Pospuesta"),
    ]

    actividad = models.ForeignKey(
        Actividad, on_delete=models.CASCADE, related_name="tareas"
    )

    titulo = models.CharField(max_length=255)
    fecha_objetivo = models.DateField()
    horas_estimadas = models.FloatField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")

    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo


# ------------------------------------------------------------


class RegistroAvance(models.Model):

    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name="registros")

    fecha = models.DateField()
    nota = models.TextField(blank=True)
    horas_reales = models.FloatField(null=True, blank=True)

    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Registro {self.tarea.titulo} - {self.fecha}"


# ------------------------------------------------------------
