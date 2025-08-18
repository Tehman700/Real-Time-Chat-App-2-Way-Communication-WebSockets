from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from api.middleware import JWTAuthMiddleware
import api.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMiddleware(
        URLRouter(api.routing.websocket_urlpatterns)
    ),
})
