from rest_framework import viewsets, status
from django.contrib.auth import get_user_model
from .serializers import UsuarioSerializer, DailyHourLimitSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView

User = get_user_model()


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UsuarioSerializer

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return User.objects.filter(id=self.request.user.id)


class DailyHourLimitView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = DailyHourLimitSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = DailyHourLimitSerializer(
            request.user, data=request.data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
