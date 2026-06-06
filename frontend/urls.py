from django.urls import path

from . import views

app_name = "frontend"

urlpatterns = [
    path("", views.landing, name="landing"),
    path("book/", views.book, name="book"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("register/", views.register, name="register"),
    path("dashboard/", views.dashboard_redirect, name="dashboard"),
    path("admin-dashboard/", views.admin_dashboard, name="admin-dashboard"),
    path("groomer/", views.groomer_dashboard, name="groomer-dashboard"),
    path("customer/", views.customer_dashboard, name="customer-dashboard"),
    path("change-password/", views.change_password, name="change-password"),
    path("notifications/mark-read/<int:pk>/", views.mark_notification_read, name="mark-notification-read"),
    path("pets/manage/", views.manage_pet, name="manage-pet"),
    path("pets/delete/<int:pk>/", views.delete_pet, name="delete-pet"),
    path("inventory/manage/", views.manage_inventory, name="manage-inventory"),
    path("inventory/delete/<int:pk>/", views.delete_inventory, name="delete-inventory"),
    path("inventory/log-usage/", views.log_inventory_usage, name="log-inventory-usage"),
    path("inventory/restock/", views.request_restock, name="request-restock"),
    path("inventory/restock/approve/<int:pk>/", views.approve_restock, name="approve-restock"),
    path("inventory/restock/complete/<int:pk>/", views.complete_restock, name="complete-restock"),
    path("staff/manage/", views.manage_staff, name="manage-staff"),
    path("appointment/<int:pk>/update-status/", views.update_appointment_status, name="update-appointment-status"),
    path("appointment/<int:pk>/assign-groomer/", views.assign_appointment_groomer, name="assign-appointment-groomer"),
    path("appointment/<int:pk>/feedback/", views.submit_feedback, name="submit-feedback"),
]


