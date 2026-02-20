from rest_framework import serializers
from .models import Actividad, Tarea, RegistroAvance


class ActividadSerializer(serializers.ModelSerializer):

    class Meta:
        model = Actividad
        fields = "__all__"
        read_only_fields = ["usuario", "creada_en"]


class TareaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tarea
        fields = "__all__"
        read_only_fields = ["creada_en"]


class RegistroAvanceSerializer(serializers.ModelSerializer):

    class Meta:
        model = RegistroAvance
        fields = "__all__"
        read_only_fields = ["creada_en"]
