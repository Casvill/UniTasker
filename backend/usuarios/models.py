from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    daily_hour_limit = models.FloatField(default=6)
