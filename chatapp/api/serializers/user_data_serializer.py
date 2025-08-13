from django.contrib.auth import authenticate
from rest_framework import serializers
from api.models.authentication_models import User_Data


class User_Data_Serializer(serializers.ModelSerializer):
    class Meta:
        model = User_Data
        fields = '__all__'


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)


    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)

            if not user:
                raise serializers.ValidationError('Invalid credentials')

            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')

            # Return the authenticated user
            return user
        else:
            raise serializers.ValidationError('Must provide username and password')