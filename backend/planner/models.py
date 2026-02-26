from django.db import models
from django.conf import settings
from django.db.models.signals import post_delete
from django.dispatch import receiver

# ------------------------------------------------------------


class Actividad(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="actividades"
    )

    TIPOS = [
        ("examen", "Examen"),
        ("quiz", "Quiz"),
        ("taller", "Taller"),
        ("proyecto", "Proyecto"),
        ("otro", "Otro"),
    ]

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("hecha", "Hecha"),
    ]

    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    tipo = models.CharField(max_length=20, choices=TIPOS, default="otro")
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    curso = models.CharField(max_length=255)
    fecha_entrega = models.DateField()
    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titulo

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_estado = None
        if not is_new:
            old_estado = Actividad.objects.get(pk=self.pk).estado

        super().save(*args, **kwargs)

        # Si el estado cambió a 'hecha', marcar todas las tareas como 'hecha'
        if self.estado == "hecha" and (is_new or old_estado != "hecha"):
            self.tareas.all().update(estado="hecha")
        # Si el estado cambió a 'pendiente', podrías querer resetear tareas, 
        # pero por ahora lo dejamos así para no ser destructivo.


# ------------------------------------------------------------


class Tarea(models.Model):

    actividad = models.ForeignKey(
        Actividad, on_delete=models.CASCADE, related_name="tareas"
    )

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("hecha", "Hecha"),
    ]

    nombre = models.CharField(max_length=255)
    fecha_objetivo = models.DateField()
    horas_estimadas = models.DecimalField(max_digits=5, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="pendiente")
    creada_en = models.DateTimeField(auto_now_add=True)
    actualizada_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        actividad = self.actividad
        if self.estado == "pendiente":
            if actividad.estado != "pendiente":
                actividad.estado = "pendiente"
                actividad.save(update_fields=["estado"])
        else:
            # Si esta tarea es 'hecha', verificar si todas las demás también lo son
            if not actividad.tareas.filter(estado="pendiente").exists():
                if actividad.estado != "hecha":
                    actividad.estado = "hecha"
                    actividad.save(update_fields=["estado"])


# ------------------------------------------------------------


class RegistroAvance(models.Model):

    tarea = models.ForeignKey(Tarea, on_delete=models.CASCADE, related_name="registros")

    fecha = models.DateField()
    nota = models.TextField(blank=True)
    horas_reales = models.FloatField(null=True, blank=True)

    creada_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Registro {self.tarea.nombre} - {self.fecha}"


# ------------------------------------------------------------


@receiver(post_delete, sender=Tarea)
def sync_actividad_on_tarea_delete(sender, instance, **kwargs):
    actividad = instance.actividad
    # Si no quedan tareas, ¿qué hacemos? 
    # Por ahora, recalculamos basado en las que quedan.
    if not actividad.tareas.filter(estado="pendiente").exists() and actividad.tareas.exists():
        if actividad.estado != "hecha":
            actividad.estado = "hecha"
            actividad.save(update_fields=["estado"])
    elif actividad.tareas.filter(estado="pendiente").exists():
        if actividad.estado != "pendiente":
            actividad.estado = "pendiente"
            actividad.save(update_fields=["estado"])
