from django.http import JsonResponse
from django.shortcuts import redirect


class EnforcePasswordChangeMiddleware:
    """Redirect authenticated users to change-password when required."""

    AUTH_WHITELIST = (
        "/login/",
        "/logout/",
        "/register/",
        "/change-password/",
        "/api/auth/login/",
        "/api/auth/register/",
        "/api/auth/token/refresh/",
        "/api/auth/change-password/",
    )
    STATIC_PREFIXES = ("/static/", "/media/")

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        path = request.path_info

        if user and getattr(user, "is_authenticated", False) and getattr(user, "must_change_password", False):
            if path.startswith(self.STATIC_PREFIXES) or path in self.AUTH_WHITELIST:
                return self.get_response(request)

            if path.startswith("/api/"):
                return JsonResponse({"detail": "Password change required."}, status=403)

            return redirect("frontend:change-password")

        return self.get_response(request)
