from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from datetime import date, timedelta, datetime

from .models import Actividad, Tarea, RegistroAvance
from .serializers import (
    ActividadSerializer,
    TareaSerializer,
    RegistroAvanceSerializer,
    HoyTareaSerializer,
)
from .services import (
    detectar_conflicto_reprogramacion,
    obtener_resumen_mensual,
    obtener_detalle_diario,
)

# ------------------------------------------------------------------------------------
class ActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Actividad.objects.none()

        return Actividad.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    # -------------------------------------------------------------------
    @action(detail=True, methods=["get"], url_path="progreso")
    def progreso(self, request, pk=None):
        actividad = self.get_object()
        tareas = actividad.tareas.all()

        total = tareas.count()
        hechas = tareas.filter(estado="hecha").count()
        pospuestas = tareas.filter(estado="pospuesta").count()
        pendientes = tareas.filter(estado="pendiente").count()

        if total == 0:
            return Response(
                {
                    "total_subtareas": 0,
                    "hechas": 0,
                    "pospuestas": 0,
                    "pendientes": 0,
                    "progreso_porcentaje": 0,
                    "mensaje": "No hay subtareas",
                }
            )

        progreso = round((hechas / total) * 100)

        return Response(
            {
                "total_subtareas": total,
                "hechas": hechas,
                "pospuestas": pospuestas,
                "pendientes": pendientes,
                "progreso_porcentaje": progreso,
                "mensaje": f"Actividad completada en un {progreso}%",
            }
        )


# ------------------------------------------------------------------------------------
class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    # -------------------------------------------------------------------
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Tarea.objects.none()

        actividad_id = self.request.query_params.get("actividad")
        queryset = Tarea.objects.filter(actividad__usuario=self.request.user)

        if actividad_id:
            get_object_or_404(Actividad, id=actividad_id, usuario=self.request.user)
            queryset = queryset.filter(actividad_id=actividad_id)

        return queryset.order_by("fecha_objetivo")

    # -------------------------------------------------------------------
    def create(self, request, *args, **kwargs):
        actividad_id = request.data.get("actividad")

        if not actividad_id:
            return Response(
                {"detail": "El campo actividad es obligatorio"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        actividad = get_object_or_404(Actividad, id=actividad_id, usuario=request.user)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(actividad=actividad)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # -------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="hoy")
    def hoy(self, request):
        user = request.user
        today = date.today()
        window_end = today + timedelta(days=7)

        curso_filter = request.query_params.get("curso", "").strip()
        estado_filter = request.query_params.get("estado", "").strip().lower()

        base_qs = Tarea.objects.filter(actividad__usuario=user)

        if curso_filter:
            base_qs = base_qs.filter(actividad__curso__icontains=curso_filter)

        if estado_filter in ["pendiente", "hecha", "pospuesta"]:
            base_qs = base_qs.filter(estado=estado_filter)

        vencidas_qs = base_qs.filter(fecha_objetivo__lt=today).order_by(
            "fecha_objetivo", "horas_estimadas"
        )
        para_hoy_qs = base_qs.filter(fecha_objetivo=today).order_by("horas_estimadas")
        proximas_qs = base_qs.filter(
            fecha_objetivo__gt=today, fecha_objetivo__lte=window_end
        ).order_by("fecha_objetivo", "horas_estimadas")

        return Response(
            {
                "vencidas": HoyTareaSerializer(vencidas_qs, many=True).data,
                "para_hoy": HoyTareaSerializer(para_hoy_qs, many=True).data,
                "proximas": HoyTareaSerializer(proximas_qs, many=True).data,
            }
        )

    # -------------------------------------------------------------------
    @action(detail=True, methods=["patch"], url_path="registrar-avance")
    def registrar_avance(self, request, pk=None):
        tarea = self.get_object()
        estado = request.data.get("estado")
        nota = request.data.get("nota", None)

        if estado not in ["pendiente", "hecha", "pospuesta"]:
            return Response(
                {"detail": "Estado no válido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tarea.estado = estado

        if nota is not None:
            tarea.nota = nota.strip()

        tarea.save()

        return Response(
            {
                "message": "Estado actualizado correctamente",
                "id": tarea.id,
                "estado": tarea.estado,
                "nota": tarea.nota,
            }
        )

    # -------------------------------------------------------------------
    @action(detail=True, methods=["patch"])
    def reprogramar(self, request, pk=None):
        tarea = self.get_object()
        nueva_fecha = request.data.get("fecha_objetivo", tarea.fecha_objetivo)
        nuevas_horas = request.data.get("horas_estimadas", tarea.horas_estimadas)

        try:
            nuevas_horas = float(nuevas_horas)
        except (TypeError, ValueError):
            nuevas_horas = float(tarea.horas_estimadas)

        resultado = detectar_conflicto_reprogramacion(
            usuario=request.user,
            fecha=nueva_fecha,
            horas_subtarea=nuevas_horas,
            tarea_excluir_id=tarea.id,
        )

        if resultado["conflicto"]:
            return Response(
                {
                    "conflict": True,
                    "planned_hours": float(resultado["nuevo_total"]),
                    "daily_limit": float(resultado["limite_diario"]),
                    "message": f"Excedes el límite diario ({resultado['limite_diario']}h)",
                }
            )

        tarea.fecha_objetivo = nueva_fecha
        tarea.horas_estimadas = nuevas_horas
        tarea.save()

        return Response(
            {"conflict": False, "message": "Tarea reprogramada correctamente"}
        )

    # -------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="calendario-mensual")
    def calendario_mensual(self, request):
        month = request.query_params.get("month")
        year = request.query_params.get("year")

        if not month or not year:
            return Response(
                {"detail": "month y year son obligatorios"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"detail": "month y year deben ser números"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (1 <= month <= 12):
            return Response(
                {"detail": "month debe estar entre 1 y 12"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = obtener_resumen_mensual(request.user, month, year)
        return Response(data)

    # -------------------------------------------------------------------
    @action(detail=False, methods=["get"], url_path="calendario-dia")
    def calendario_dia(self, request):
        fecha = request.query_params.get("date")

        if not fecha:
            return Response(
                {"detail": "date es obligatorio (YYYY-MM-DD)"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"detail": "Formato de fecha inválido"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = obtener_detalle_diario(request.user, fecha_obj)
        return Response(data)


# ------------------------------------------------------------------------------------
class RegistroAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return RegistroAvance.objects.none()

        return RegistroAvance.objects.filter(
            tarea__actividad__usuario=self.request.user
        )