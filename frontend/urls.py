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
]

