from django.db.models import Sum
from .models import Tarea
from decimal import Decimal

#---------------------------------------------------------------------------------------------

def calcular_horas_planificadas(usuario, fecha, tarea_excluir_id=None):
    """
    Calcula la suma de horas estimadas de tareas del usuario
    para una fecha específica.

    - usuario: usuario autenticado
    - fecha: fecha que se quiere evaluar
    - tarea_excluir_id: id de la tarea que se está reprogramando
    """

    tareas = Tarea.objects.filter(
        actividad__usuario=usuario,
        fecha_objetivo=fecha,
        estado="pendiente"  # opcional pero recomendable
    )

    # excluir tarea que se está reprogramando
    if tarea_excluir_id:
        tareas = tareas.exclude(id=tarea_excluir_id)

    resultado = tareas.aggregate(
        total_horas=Sum("horas_estimadas")
    )

    return resultado["total_horas"] or 0

#---------------------------------------------------------------------------------------------

