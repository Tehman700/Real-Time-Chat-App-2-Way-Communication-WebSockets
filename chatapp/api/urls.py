from django.urls import path
from api.views.authentication_views import RegisterAPIView, LoginViewSet, AlreadyExistsAPIView
from api.views.otp_views import OTP_APIView, OTPVerify_APIView
from api.views.otp_forgotpwd_views import OTP_ForgotPWD_APIView,OTPVerifyPWD,ChangePasswordAPIView
from api.views.list_usernames import ListUsernameAPIView
from api.views.friend_requests_views import send_friend_request,respond_friend_request

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='registering'),
    path('login/', LoginViewSet.as_view({'post': 'create'}), name='login'),
    path('otpMech/', OTP_APIView.as_view(), name='otpMech'),
    path('otpVerifyMech/', OTPVerify_APIView.as_view(), name='otpVerifyMech'),
    path('alreadyexists/', AlreadyExistsAPIView.as_view(), name='alreadyExists'),
    path('forgotpwdemail/', OTP_ForgotPWD_APIView.as_view(), name='forgotpwdemail'),
    path('otppwdverify/', OTPVerifyPWD.as_view() , name='otppwdverify'),
    path('changepwd/', ChangePasswordAPIView.as_view(), name='changepwd'),

    path('listusername/',  ListUsernameAPIView.as_view(), name='listusername'),
    path("friend-request/<int:user_id>/", send_friend_request),
    path("friend-request/respond/<int:request_id>/", respond_friend_request),
]
