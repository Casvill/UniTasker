from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Actividad, Tarea, RegistroAvance
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from .serializers import ActividadSerializer, TareaSerializer, RegistroAvanceSerializer, HoyTareaSerializer, TareaUpdateStatusSerializer
from datetime import date, timedelta

# ------------------------------------------------------------------------------------
class ActividadViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Actividad.objects.none()
        return Actividad.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

# ------------------------------------------------------------------------------------

class TareaViewSet(viewsets.ModelViewSet):
    serializer_class = TareaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Tarea.objects.none()
        actividad_id = self.request.query_params.get("actividad")
        queryset = Tarea.objects.select_related('actividad').filter(
            actividad__usuario=self.request.user
        )
        if actividad_id:
            get_object_or_404(Actividad, id=actividad_id, usuario=self.request.user)
            queryset = queryset.filter(actividad_id=actividad_id)
        return queryset.order_by("fecha_objetivo")

    def perform_update(self, serializer):
        serializer.save()

    def _get_capacidad_detalle(self, user, fecha, exclude_id=None):
        """Helper consolidado para calcular la carga de un día."""
        if not fecha:
            return None
        
        queryset = Tarea.objects.filter(
            actividad__usuario=user,
            fecha_objetivo=fecha
        ).exclude(estado="pospuesta")
        
        if exclude_id:
            try:
                queryset = queryset.exclude(id=int(exclude_id))
            except (ValueError, TypeError):
                pass
        
        total_planificado = float(queryset.aggregate(total=Sum("horas_estimadas"))["total"] or 0)
        limite = user.daily_hour_limit
        hay_conflicto = total_planificado > limite
        
        return {
            "fecha": str(fecha),
            "conflict": hay_conflicto,
            "planned_hours": total_planificado,
            "daily_limit": limite,
            "message": f"Quedarías con {total_planificado:g}h planificadas (límite {limite:g}h)" if hay_conflicto else ""
        }

    def update(self, request, *args, **kwargs):
        if request.method == 'PATCH' and set(request.data.keys()) <= {'estado'}:
            instance = self.get_object()
            serializer = TareaUpdateStatusSerializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            response_data = serializer.data
        else:
            response = super().update(request, *args, **kwargs)
            response_data = response.data
            instance = self.get_object()
        
        response_data["capacidad_diaria"] = self._get_capacidad_detalle(request.user, instance.fecha_objetivo)
        return Response(response_data, headers={"Link": "</api/tareas/hoy/>; rel=prefetch"})

    def create(self, request, *args, **kwargs):
        actividad_id = request.data.get("actividad")
        if not actividad_id:
            return Response({"actividad": ["Este campo es obligatorio."]}, status=status.HTTP_400_BAD_REQUEST)

        actividad = get_object_or_404(Actividad, id=actividad_id, usuario=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(actividad=actividad)

        response_data = serializer.data
        response_data["capacidad_diaria"] = self._get_capacidad_detalle(request.user, instance.fecha_objetivo)
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="validar-capacidad")
    def validar_capacidad(self, request):
        fecha_str = request.query_params.get("fecha")
        exclude_id = request.query_params.get("exclude_id")
        horas_nueva_str = request.query_params.get("horas")

        if not fecha_str:
            return Response({"error": "El parámetro 'fecha' es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Obtenemos la base (excluyendo la tarea si se pide)
            res = self._get_capacidad_detalle(request.user, fecha_str, exclude_id)
            
            # Si se proporcionan horas, simulamos la nueva carga
            if horas_nueva_str is not None:
                horas_nueva = float(horas_nueva_str)
                nuevo_total = res["planned_hours"] + horas_nueva
                limite = res["daily_limit"]
                hay_conflicto = nuevo_total > limite
                
                res["planned_hours"] = nuevo_total
                res["conflict"] = hay_conflicto
                res["message"] = f"Quedarías con {nuevo_total:g}h planificadas (límite {limite:g}h)" if hay_conflicto else ""

            return Response(res)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
        if estado_filter:
            valid_estados = ["pendiente", "hecha", "pospuesta"]
            if estado_filter in valid_estados:
                base_qs = base_qs.filter(estado=estado_filter)

        vencidas_qs = base_qs.filter(fecha_objetivo__lt=today).order_by("fecha_objetivo", "horas_estimadas")
        para_hoy_qs = base_qs.filter(fecha_objetivo=today).order_by("horas_estimadas")
        proximas_qs = base_qs.filter(fecha_objetivo__gt=today, fecha_objetivo__lte=window_end).order_by("fecha_objetivo", "horas_estimadas")

        vencidas = HoyTareaSerializer(vencidas_qs, many=True, context={"request": request}).data
        para_hoy = HoyTareaSerializer(para_hoy_qs, many=True, context={"request": request}).data
        proximas = HoyTareaSerializer(proximas_qs, many=True, context={"request": request}).data

        return Response({
            "vencidas": vencidas,
            "para_hoy": para_hoy,
            "proximas": proximas,
            "total": len(vencidas) + len(para_hoy) + len(proximas),
            "mensaje": None if (len(vencidas) + len(para_hoy) + len(proximas)) > 0 else "No tienes tareas programadas",
        })

# ------------------------------------------------------------------------------------

class RegistroAvanceViewSet(viewsets.ModelViewSet):
    serializer_class = RegistroAvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return RegistroAvance.objects.none()
        return RegistroAvance.objects.filter(tarea__actividad__usuario=self.request.user)
