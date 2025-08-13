import threading
import random
from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.views import APIView

class OTP_APIView(APIView):
    stored_otp = None
    otp_timer = None

    @classmethod
    def reset_otp(cls):
        cls.stored_otp = None
        cls.otp_timer = None

    def post(self, request):
        email = request.data.get("email", "").strip()

        if not email:
            return JsonResponse({"status": -1, "message": "Email is required"}, status=200)

        otp = random.randint(100000, 999999)
        recipient_list = [email]

        try:
            send_mail(
                subject="OTP Verification",
                message=f"Your OTP is {otp}",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=recipient_list,
                fail_silently=False,
            )

            # Store OTP and start/reset timer
            OTP_APIView.stored_otp = otp
            if OTP_APIView.otp_timer is not None:
                OTP_APIView.otp_timer.cancel()

            OTP_APIView.otp_timer = threading.Timer(60, OTP_APIView.reset_otp)
            OTP_APIView.otp_timer.start()

            return JsonResponse({"status": 1, "message": "OTP sent successfully"})
        except Exception as e:
            return JsonResponse({"status": -2, "message": f"Email sending failed: {str(e)}"})


class OTPVerify_APIView(APIView):
    def post(self, request):
        written_code = request.data.get("code")

        if not written_code:
            return JsonResponse({"status": -1, "message": "Code is required"}, status=200)

        if str(written_code) == str(OTP_APIView.stored_otp):
            # Correct OTP
            if OTP_APIView.otp_timer is not None:
                OTP_APIView.otp_timer.cancel()
            OTP_APIView.reset_otp()

            return JsonResponse({
                "status": 0,
                "message": "OTP Verified Successfully",
                "data": None,
            }, status=200)
        else:
            # Incorrect OTP
            if OTP_APIView.otp_timer is not None:
                OTP_APIView.otp_timer.cancel()
            OTP_APIView.reset_otp()

            return JsonResponse({
                "status": -2,
                "message": "OTP Not Correct",
                "data": None,
            }, status=200)
