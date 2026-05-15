from django.db.models import Sum, Count
from .models import Tarea
from decimal import Decimal

# ---------------------------------------------------------------------
# REGLA GLOBAL DEL SISTEMA (IMPORTANTE)
# ---------------------------------------------------------------------
ESTADOS_CARGA = ["pendiente", "hecha"]


# ---------------------------------------------------------------------
# CARGA DIARIA (BASE DEL SISTEMA)
# ---------------------------------------------------------------------
def calcular_horas_planificadas(usuario, fecha, tarea_excluir_id=None):
    """
    Calcula la carga real del día:
    SOLO tareas pendientes + hechas.
    """

    tareas = Tarea.objects.filter(
        actividad__usuario=usuario,
        fecha_objetivo=fecha,
        estado__in=ESTADOS_CARGA,
    )

    if tarea_excluir_id:
        tareas = tareas.exclude(id=tarea_excluir_id)

    resultado = tareas.aggregate(total_horas=Sum("horas_estimadas"))

    return resultado["total_horas"] or 0


# ---------------------------------------------------------------------
# CONFLICTO AL REPROGRAMAR
# ---------------------------------------------------------------------
def detectar_conflicto_reprogramacion(
    usuario, fecha, horas_subtarea, tarea_excluir_id=None
):
    limite_diario = usuario.daily_hour_limit

    horas_del_dia = calcular_horas_planificadas(
        usuario=usuario,
        fecha=fecha,
        tarea_excluir_id=tarea_excluir_id
    )

    nuevo_total = Decimal(horas_del_dia) + Decimal(horas_subtarea)

    return {
        "conflicto": nuevo_total > limite_diario,
        "horas_del_dia": horas_del_dia,
        "nuevo_total": nuevo_total,
        "limite_diario": limite_diario,
    }


# ---------------------------------------------------------------------
# CONFLICTO REAL DEL DÍA
# ---------------------------------------------------------------------
def detectar_conflicto_dia(usuario, fecha):
    limite_diario = usuario.daily_hour_limit

    horas_del_dia = calcular_horas_planificadas(
        usuario=usuario,
        fecha=fecha
    )

    return horas_del_dia > limite_diario


# ---------------------------------------------------------------------
# RESUMEN MENSUAL
# ---------------------------------------------------------------------
def obtener_resumen_mensual(usuario, month, year):

    tareas = Tarea.objects.filter(
        actividad__usuario=usuario,
        fecha_objetivo__year=year,
        fecha_objetivo__month=month,
        estado__in=ESTADOS_CARGA
    ).values("fecha_objetivo__day").annotate(
        count=Count("id"),
        total_horas=Sum("horas_estimadas")
    )

    resultado = []

    for t in tareas:
        dia = t["fecha_objetivo__day"]

        resultado.append({
            "day": dia,
            "count": t["count"],
            "hasConflict": t["total_horas"] > usuario.daily_hour_limit
        })

    return resultado


# ---------------------------------------------------------------------
# DETALLE DIARIO
# ---------------------------------------------------------------------
def obtener_detalle_diario(usuario, fecha):

    tareas = Tarea.objects.filter(
        actividad__usuario=usuario,
        fecha_objetivo=fecha
    ).select_related("actividad")

    total_horas = sum(t.horas_estimadas for t in tareas)

    return {
        "date": str(fecha),
        "hasConflict": total_horas > usuario.daily_hour_limit,
        "items": [
            {
                "id": t.id,
                "name": t.nombre,
                "activityName": t.actividad.titulo,
                "courseName": t.actividad.curso,
                "effort": t.horas_estimadas,
                "status": t.estado,  
            }
            for t in tareas
        ]
    }