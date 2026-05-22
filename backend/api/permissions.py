from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUserRole(BasePermission):
    """Allows access only to users with role == 'admin'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsGroomerUserRole(BasePermission):
    """Allows access only to users with role == 'groomer'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'groomer')


class IsCustomerUserRole(BasePermission):
    """Allows access only to users with role == 'customer'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'customer')


class IsStaffRole(BasePermission):
    """Allows access to admin or groomer roles."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('admin', 'groomer')
        )


class IsOwnerOrStaff(BasePermission):
    """
    Object-level permission.
    Read/write allowed to the resource owner (customer) or to staff (admin / groomer).
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        # Staff always passes
        if request.user.role in ('admin', 'groomer'):
            return True

        # Check common owner fields
        owner = getattr(obj, 'owner', None) or getattr(obj, 'customer', None) or getattr(obj, 'user', None)
        return owner == request.user
