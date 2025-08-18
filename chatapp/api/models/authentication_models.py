from django.db import models
from django.contrib.auth.models import User

class User_Data(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    created = models.DateTimeField(auto_now_add=True)
    mobile_number = models.CharField(max_length=120)
    email_address = models.EmailField()
    class Meta:
        ordering = ['created']

    def __str__(self):
        return f"{self.user.username}"



class LoginModel(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    username = models.CharField(max_length=120)
    password = models.CharField(max_length=255)


    class Meta:
        ordering = ['created']



class FriendRequest(models.Model):
    sender = models.ForeignKey(User, related_name="sent_requests", on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name="received_requests", on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=[("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected")],
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)
