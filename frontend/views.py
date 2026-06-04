from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Count, F
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from api.models import Appointment, InventoryItem, Pet, Service

from .data import DASHBOARD_HIGHLIGHTS, HOW_IT_WORKS, LANDING_STATS, SERVICES, TESTIMONIALS


def _format_ugx(value):
    return f"UGX {value:,.0f}"


def _sync_seed_services():
    for item in SERVICES:
        Service.objects.get_or_create(
            name=item["name"],
            defaults={
                "duration": item["duration"],
                "price": item["price"],
                "description": item["description"],
            },
        )


def _services_for_display():
    _sync_seed_services()
    service_images = {item["name"]: item["image"] for item in SERVICES}
    return [
        {
            "id": service.id,
            "name": service.name,
            "duration": service.duration,
            "price": service.price,
            "price_label": _format_ugx(service.price),
            "description": service.description,
            "image": service_images.get(service.name, "cutest-puppy.jpg"),
        }
        for service in Service.objects.all().order_by("price")
    ]


def _dashboard_path_for(user):
    if user.role == "admin":
        return reverse("frontend:admin-dashboard")
    if user.role == "groomer":
        return reverse("frontend:groomer-dashboard")
    return reverse("frontend:customer-dashboard")


def landing(request):
    return render(
        request,
        "frontend/landing.html",
        {
            "services": _services_for_display(),
            "stats": LANDING_STATS,
            "testimonials": TESTIMONIALS,
            "steps": HOW_IT_WORKS,
            "highlights": DASHBOARD_HIGHLIGHTS,
        },
    )


@require_http_methods(["GET", "POST"])
def book(request):
    services = _services_for_display()
    selected_service = request.GET.get("service", "")

    if request.method == "POST":
        service = Service.objects.filter(pk=request.POST.get("service")).first()
        appointment_date = request.POST.get("date")
        appointment_time = request.POST.get("time")
        owner_name = request.POST.get("owner_name", "").strip()
        pet_name = request.POST.get("pet_name", "").strip()
        breed = request.POST.get("breed", "").strip()

        if not all([service, appointment_date, appointment_time, owner_name, pet_name, breed]):
            messages.error(request, "Please complete all required booking fields.")
        else:
            pet = None
            if request.user.is_authenticated and request.user.role == "customer":
                pet, _ = Pet.objects.get_or_create(
                    owner=request.user,
                    name=pet_name,
                    defaults={
                        "breed": breed,
                        "age": request.POST.get("age", ""),
                        "weight": request.POST.get("weight", ""),
                        "notes": request.POST.get("notes", ""),
                    },
                )

            notes = ". ".join(
                item
                for item in [
                    f"Breed: {breed}",
                    f"Age: {request.POST.get('age', '').strip()}" if request.POST.get("age") else "",
                    f"Weight: {request.POST.get('weight', '').strip()}" if request.POST.get("weight") else "",
                    f"Contact: {request.POST.get('email', '').strip()} / {request.POST.get('phone', '').strip()}",
                    request.POST.get("notes", "").strip(),
                ]
                if item
            )

            Appointment.objects.create(
                customer=request.user if request.user.is_authenticated else None,
                customer_name=owner_name,
                pet=pet,
                pet_name=pet_name,
                service=service,
                date=appointment_date,
                time=appointment_time,
                notes=notes,
            )
            messages.success(request, "Booking request sent. Staff will confirm the appointment soon.")
            return redirect("frontend:book")

    return render(
        request,
        "frontend/booking.html",
        {
            "services": services,
            "selected_service": selected_service,
            "today": timezone.localdate().isoformat(),
        },
    )


@require_http_methods(["GET", "POST"])
def login_view(request):
    if request.user.is_authenticated:
        return redirect(_dashboard_path_for(request.user))

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        user = authenticate(request, username=username, password=password)
        if user is None and "@" in username:
            matched = get_user_model().objects.filter(email__iexact=username).first()
            if matched:
                user = authenticate(request, username=matched.username, password=password)

        if user is not None:
            login(request, user)
            return redirect(_dashboard_path_for(user))

        messages.error(request, "Invalid username or password.")

    return render(request, "frontend/auth/login.html")


def logout_view(request):
    logout(request)
    return redirect("frontend:landing")


@require_http_methods(["GET", "POST"])
def register(request):
    if request.user.is_authenticated:
        return redirect(_dashboard_path_for(request.user))

    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        password_confirm = request.POST.get("password_confirm", "")

        if password != password_confirm:
            messages.error(request, "Passwords do not match.")
        elif get_user_model().objects.filter(username__iexact=username).exists():
            messages.error(request, "That username is already taken.")
        elif get_user_model().objects.filter(email__iexact=email).exists():
            messages.error(request, "That email is already registered.")
        else:
            try:
                validate_password(password)
            except ValidationError as error:
                messages.error(request, " ".join(error.messages))
            else:
                user = get_user_model().objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=request.POST.get("first_name", "").strip(),
                    last_name=request.POST.get("last_name", "").strip(),
                    phone=request.POST.get("phone", "").strip(),
                    location=request.POST.get("location", "").strip(),
                    role="customer",
                )
                login(request, user)
                return redirect("frontend:customer-dashboard")

    return render(request, "frontend/auth/register.html")


@login_required(login_url="frontend:login")
def dashboard_redirect(request):
    return redirect(_dashboard_path_for(request.user))


def _dashboard_context(request, title, subtitle):
    user = request.user
    appointments = Appointment.objects.select_related("service", "groomer", "customer", "pet")
    pets = Pet.objects.select_related("owner")
    inventory = InventoryItem.objects.all()

    if user.role == "customer":
        appointments = appointments.filter(customer=user)
        pets = pets.filter(owner=user)
    elif user.role == "groomer":
        appointments = appointments.filter(groomer=user)

    upcoming = appointments.exclude(status__in=["completed", "cancelled"]).order_by("date", "time")[:8]
    return {
        "title": title,
        "subtitle": subtitle,
        "appointments": upcoming,
        "appointment_count": appointments.count(),
        "pet_count": pets.count(),
        "low_stock_count": inventory.filter(quantity__lte=F("threshold")).count(),
        "status_counts": appointments.values("status").annotate(total=Count("id")).order_by("status"),
        "inventory": inventory.order_by("name")[:8],
    }


@login_required(login_url="frontend:login")
def admin_dashboard(request):
    if request.user.role != "admin":
        return redirect(_dashboard_path_for(request.user))
    return render(
        request,
        "frontend/dashboard.html",
        _dashboard_context(request, "Admin dashboard", "Appointments, staff workflows, and inventory in one view."),
    )


@login_required(login_url="frontend:login")
def groomer_dashboard(request):
    if request.user.role != "groomer":
        return redirect(_dashboard_path_for(request.user))
    return render(
        request,
        "frontend/dashboard.html",
        _dashboard_context(request, "Groomer dashboard", "Assigned visits and pet notes for the day ahead."),
    )


@login_required(login_url="frontend:login")
def customer_dashboard(request):
    if request.user.role != "customer":
        return redirect(_dashboard_path_for(request.user))
    return render(
        request,
        "frontend/dashboard.html",
        _dashboard_context(request, "Customer dashboard", "Your pets, bookings, and appointment history."),
    )
