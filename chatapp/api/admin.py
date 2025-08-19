from django.contrib import admin
from api.models.authentication_models import User_Data,LoginModel
from api.models.chatting_models import GroupMessage, ChatGroup

admin.site.register(User_Data)
admin.site.register(LoginModel)
admin.site.register(GroupMessage)
admin.site.register(ChatGroup)


