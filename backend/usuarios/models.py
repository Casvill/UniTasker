from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    daily_hour_limit = models.FloatField(default=6)

    def __str__(self):
        return f"Post: {self.username} - Limite diário: {self.daily_hour_limit} horas"
