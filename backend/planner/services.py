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

def detectar_conflicto_reprogramacion(usuario, fecha, horas_subtarea, tarea_excluir_id=None):
    """
    Determina si reprogramar una subtarea genera sobrecarga diaria.

    - usuario: usuario autenticado
    - fecha: fecha a la que se quiere mover la tarea
    - horas_subtarea: horas estimadas de la subtarea
    - tarea_excluir_id: id de la tarea que se está reprogramando
    """

    # 1. obtener límite diario del usuario
    limite_diario = usuario.daily_hour_limit

    # 2. obtener horas ya planificadas para el día
    horas_del_dia = calcular_horas_planificadas(
        usuario=usuario,
        fecha=fecha,
        tarea_excluir_id=tarea_excluir_id
    )

    # 3. calcular nuevo total
    nuevo_total = Decimal(horas_del_dia) + Decimal(horas_subtarea)

    # 4. comparar con límite
    hay_conflicto = nuevo_total > limite_diario

    return {
        "conflicto": hay_conflicto,
        "horas_del_dia": horas_del_dia,
        "nuevo_total": nuevo_total,
        "limite_diario": limite_diario,
    }

#---------------------------------------------------------------------------------------------