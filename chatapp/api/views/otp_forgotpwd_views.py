import random
import threading
from django.core.mail import send_mail
from django.http import JsonResponse, response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.conf import settings



class OTP_ForgotPWD_APIView(APIView):
    stored_otp = None
    otp_timer = None

    @classmethod
    def reset_otp(cls):
        cls.stored_otp = None
        cls.otp_timer = None
    def post(self, request):

        fetched_email = request.data['email']

        if User.objects.filter(email=fetched_email).exists():
            otp = random.randint(100000, 999999)
            recipient_list = [fetched_email]

            try:
                send_mail(
                    subject="OTP Verification for Password Reset",
                    message=f"Hello {User.objects.filter(email=fetched_email)[0].username}. Your OTP for Password Reset is {otp}",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=recipient_list,
                    fail_silently=False,
                )

                # Store OTP and start/reset timer
                OTP_ForgotPWD_APIView.stored_otp = otp
                if OTP_ForgotPWD_APIView.otp_timer is not None:
                    OTP_ForgotPWD_APIView.otp_timer.cancel()

                OTP_ForgotPWD_APIView.otp_timer = threading.Timer(60, OTP_ForgotPWD_APIView.reset_otp)
                OTP_ForgotPWD_APIView.otp_timer.start()

                return JsonResponse({"status": 1, "message": "OTP sent successfully"})
            except Exception as e:
                return JsonResponse({"status": -2, "message": f"Email sending failed: {str(e)}"})



        return JsonResponse({
            'status': 0,
            'message': 'User is not Registered with this Email',
            'data': None
        },status =200)



class OTPVerifyPWD(APIView):
    def post(self, request):
        written_code = request.data.get("code")

        if not written_code:
            return JsonResponse({"status": -1, "message": "Code is required"}, status=200)

        if str(written_code) == str(OTP_ForgotPWD_APIView.stored_otp):
            # Correct OTP
            if OTP_ForgotPWD_APIView.otp_timer is not None:
                OTP_ForgotPWD_APIView.otp_timer.cancel()
            OTP_ForgotPWD_APIView.reset_otp()

            return JsonResponse({
                "status": 0,
                "message": "OTP Verified Successfully",
                "data": None,
            }, status=200)
        else:
            # Incorrect OTP
            if OTP_ForgotPWD_APIView.otp_timer is not None:
                OTP_ForgotPWD_APIView.otp_timer.cancel()
            OTP_ForgotPWD_APIView.reset_otp()

            return JsonResponse({
                "status": -2,
                "message": "OTP Not Correct",
                "data": None,
            }, status=200)



class ChangePasswordAPIView(APIView):
    def post(self, request):
        email = request.data.get("email")
        new_password = request.data.get("password")

        if not email or not new_password:
            return JsonResponse({
                "status": -1,
                "message": "Email and new password are required."
            }, status=200)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)  # hashes the password
            user.save()

            return JsonResponse({
                "status": 1,
                "message": "Password changed successfully."
            }, status=200)

        except User.DoesNotExist:
            return JsonResponse({
                "status": 0,
                "message": "User with this email does not exist."
            }, status=200)
