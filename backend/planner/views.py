from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Actividad, Tarea, RegistroAvance
from django.shortcuts import get_object_or_404
from .serializers import (
    ActividadSerializer,
    TareaSerializer,
    RegistroAvanceSerializer,
    HoyTareaSerializer,
)
from datetime import date, timedelta
from .services import detectar_conflicto_reprogramacion


# ------------------------------------------------------------------------------------
class ActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, "swagger_fake_view", False):
            print(
                f"[Swagger] {self.__class__.__name__}: Generación del esquema, queryset vacío."
            )
            return Actividad.objects.none()

        return Actividad.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

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
                },
                status=status.HTTP_200_OK,
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
            },
            status=status.HTTP_200_OK,
        )


# ------------------------------------------------------------------------------------
class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    # -------------------------------------------------------------------
    def get_queryset(self):

        if getattr(self, "swagger_fake_view", False):
            print(
                f"[Swagger] {self.__class__.__name__}: Generación del esquema, queryset vacío."
            )
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
                {"actividad": ["Este campo es obligatorio."]},
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
        """
        GET /api/tareas/hoy/

        Query params opcionales:
            - curso
            - estado

        Retorna:
          {
            "vencidas": [...],
            "para_hoy": [...],
            "proximas": [...]
          }
        """
        user = request.user
        today = date.today()
        window_end = today + timedelta(days=7)

        curso_filter = request.query_params.get("curso", "").strip()
        estado_filter = request.query_params.get("estado", "").strip().lower()

        base_qs = Tarea.objects.filter(actividad__usuario=user)

        if curso_filter:
            base_qs = base_qs.filter(actividad__curso__icontains=curso_filter)

        if estado_filter:
            valid_estados = ["pendiente", "hecha", "pospuesta"]
            if estado_filter in valid_estados:
                base_qs = base_qs.filter(estado=estado_filter)

        vencidas_qs = base_qs.filter(fecha_objetivo__lt=today).order_by(
            "fecha_objetivo", "horas_estimadas"
        )
        para_hoy_qs = base_qs.filter(fecha_objetivo=today).order_by("horas_estimadas")
        proximas_qs = base_qs.filter(
            fecha_objetivo__gt=today, fecha_objetivo__lte=window_end
        ).order_by("fecha_objetivo", "horas_estimadas")

        vencidas = HoyTareaSerializer(
            vencidas_qs, many=True, context={"request": request}
        ).data
        para_hoy = HoyTareaSerializer(
            para_hoy_qs, many=True, context={"request": request}
        ).data
        proximas = HoyTareaSerializer(
            proximas_qs, many=True, context={"request": request}
        ).data

        total = len(vencidas) + len(para_hoy) + len(proximas)

        mensaje = None
        if total == 0:
            if curso_filter or estado_filter:
                mensaje = "No se encontraron tareas con los filtros aplicados"
            else:
                mensaje = "No tienes tareas programadas"

        return Response(
            {
                "vencidas": vencidas,
                "para_hoy": para_hoy,
                "proximas": proximas,
                "total": total,
                "mensaje": mensaje,
            }
        )

    # -------------------------------------------------------------------
    @action(detail=True, methods=["patch"], url_path="registrar-avance")
    def registrar_avance(self, request, pk=None):
        tarea = self.get_object()

        estado = request.data.get("estado")
        nota = request.data.get("nota", None)

        estados_validos = ["pendiente", "hecha", "pospuesta"]

        if not estado:
            return Response(
                {"estado": ["Este campo es obligatorio."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if estado not in estados_validos:
            return Response(
                {"estado": ["Estado no válido."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tarea.estado = estado

        # Solo actualiza la nota si viene en el request.
        # Así no borras una nota anterior por accidente.
        if nota is not None:
            tarea.nota = nota.strip()

        tarea.save()

        return Response(
            {
                "message": "Tarea actualizada",
                "id": tarea.id,
                "estado": tarea.estado,
                "nota": tarea.nota,
            },
            status=status.HTTP_200_OK,
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
                    "message": f"Quedarías con {resultado['nuevo_total']}h planificadas (límite {resultado['limite_diario']}h)",
                },
                status=status.HTTP_200_OK,
            )

        tarea.fecha_objetivo = nueva_fecha
        tarea.horas_estimadas = nuevas_horas
        tarea.save()

        return Response(
            {"conflict": False, "message": "Tarea reprogramada correctamente"}
        )


# ------------------------------------------------------------------------------------
class RegistroAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        if getattr(self, "swagger_fake_view", False):
            print(
                f"[Swagger] {self.__class__.__name__}: Generación del esquema, queryset vacío."
            )
            return RegistroAvance.objects.none()

        return RegistroAvance.objects.filter(
            tarea__actividad__usuario=self.request.user
        )


# ------------------------------------------------------------------------------------