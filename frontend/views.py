from django.contrib import messages
from datetime import time as dtime
from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Count, F
from django.shortcuts import redirect, render, get_object_or_404
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils import timezone
from django.views.decorators.http import require_http_methods

from api.models import Appointment, InventoryItem, Pet, Service, AuditLog, Notification, RestockRequest, InventoryUsageLog


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
@login_required(login_url="frontend:login")
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
            try:
                date_obj = timezone.datetime.strptime(appointment_date, "%Y-%m-%d").date()
                time_obj = timezone.datetime.strptime(appointment_time, "%H:%M").time()
            except ValueError:
                messages.error(request, "Enter a valid appointment date and time.")
            else:
                if date_obj < timezone.localdate():
                    messages.error(request, "Appointment date must be today or in the future.")
                elif not (dtime(9, 0) <= time_obj <= dtime(18, 0)):
                    messages.error(request, "Appointment time must be between 09:00 and 18:00.")
                else:
                    pet = None
                    if request.user.is_authenticated and request.user.role == "customer":
                        pet, created = Pet.objects.get_or_create(
                            owner=request.user,
                            name=pet_name,
                            defaults={
                                "breed": breed,
                                "age": request.POST.get("age", ""),
                                "weight": request.POST.get("weight", ""),
                                "notes": request.POST.get("notes", ""),
                            },
                        )
                        if not created:
                            pet.breed = breed
                            pet.age = request.POST.get("age", "")
                            pet.weight = request.POST.get("weight", "")
                            pet.notes = request.POST.get("notes", "")
                            pet.save()

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

                    customer = request.user if (request.user.is_authenticated and request.user.role == "customer") else None
                    Appointment.objects.create(
                        customer=customer,
                        customer_name=owner_name,
                        pet=pet,
                        pet_name=pet_name,
                        service=service,
                        date=date_obj,
                        time=time_obj,
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
        if request.user.must_change_password:
            return redirect("frontend:change-password")
        return redirect(_dashboard_path_for(request.user))

    next_url = request.GET.get("next") or request.POST.get("next") or ""

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
            AuditLog.log_action(user, "login", "User", user.id)
            if user.must_change_password:
                messages.warning(request, "You must change your temporary password before proceeding.")
                return redirect("frontend:change-password")
            if next_url and url_has_allowed_host_and_scheme(
                next_url,
                allowed_hosts={request.get_host()},
                require_https=request.is_secure(),
            ):
                return redirect(next_url)
            return redirect(_dashboard_path_for(user))

        messages.error(request, "Invalid username or password.")

    return render(request, "frontend/auth/login.html", {"next_url": next_url})


def logout_view(request):
    if request.user.is_authenticated:
        AuditLog.log_action(request.user, "logout", "User", request.user.id)
    logout(request)
    return redirect("frontend:landing")



@require_http_methods(["GET", "POST"])
def register(request):
    if request.user.is_authenticated:
        return redirect(_dashboard_path_for(request.user))

    next_url = request.GET.get("next") or request.POST.get("next") or ""

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
                if next_url and url_has_allowed_host_and_scheme(
                    next_url,
                    allowed_hosts={request.get_host()},
                    require_https=request.is_secure(),
                ):
                    return redirect(next_url)
                return redirect("frontend:customer-dashboard")

    return render(request, "frontend/auth/register.html", {"next_url": next_url})


@login_required(login_url="frontend:login")
def dashboard_redirect(request):
    if request.user.must_change_password:
        return redirect("frontend:change-password")
    return redirect(_dashboard_path_for(request.user))


@login_required(login_url="frontend:login")
@require_http_methods(["GET", "POST"])
def change_password(request):
    if request.method == "POST":
        password = request.POST.get("password")
        password_confirm = request.POST.get("password_confirm")

        if not password or not password_confirm:
            messages.error(request, "Please enter all password fields.")
        elif password != password_confirm:
            messages.error(request, "Passwords do not match.")
        else:
            try:
                validate_password(password, request.user)
            except ValidationError as error:
                messages.error(request, " ".join(error.messages))
            else:
                user = request.user
                user.set_password(password)
                user.must_change_password = False
                user.initial_password = ""  # admin can no longer see it — user owns this password now
                user.save()
                update_session_auth_hash(request, user)
                AuditLog.log_action(user, "change_password", "User", user.id)
                messages.success(request, "Password updated successfully.")
                return redirect(_dashboard_path_for(user))

    return render(request, "frontend/auth/change_password.html")


@login_required(login_url="frontend:login")
def admin_dashboard(request):
    if request.user.role != "admin":
        return redirect(_dashboard_path_for(request.user))
    if request.user.must_change_password:
        return redirect("frontend:change-password")

    appointments = Appointment.objects.select_related("service", "groomer", "customer", "pet").order_by("-date", "-time")
    inventory = InventoryItem.objects.all().order_by("name")
    restock_requests = RestockRequest.objects.select_related("item").all().order_by("-created_at")
    staff_members = get_user_model().objects.filter(role__in=["admin", "groomer"]).order_by("username")
    groomers = get_user_model().objects.filter(role="groomer").order_by("first_name", "username")
    audit_logs = AuditLog.objects.select_related("user").all().order_by("-timestamp")[:150]

    # Customer activity: audit logs for users with role=customer
    customer_logs = AuditLog.objects.select_related("user").filter(
        user__role="customer"
    ).order_by("-timestamp")[:200]

    # Metrics
    appointment_count = appointments.count()
    pet_count = Pet.objects.count()
    low_stock_count = inventory.filter(quantity__lte=F("threshold")).count()

    context = {
        "title": "Admin Dashboard",
        "subtitle": "Appointments, staff workflows, and inventory in one view.",
        "appointments": appointments[:50],
        "inventory": inventory,
        "restock_requests": restock_requests,
        "staff_members": staff_members,
        "groomers": groomers,
        "audit_logs": audit_logs,
        "customer_logs": customer_logs,
        "appointment_count": appointment_count,
        "pet_count": pet_count,
        "low_stock_count": low_stock_count,
    }
    return render(request, "frontend/dashboard_admin.html", context)


@login_required(login_url="frontend:login")
def groomer_dashboard(request):
    if request.user.role != "groomer":
        return redirect(_dashboard_path_for(request.user))
    if request.user.must_change_password:
        return redirect("frontend:change-password")

    appointments = Appointment.objects.filter(groomer=request.user).select_related("service", "customer", "pet").order_by("date", "time")
    inventory = InventoryItem.objects.all().order_by("name")
    usage_logs = InventoryUsageLog.objects.filter(groomer=request.user).select_related("item").order_by("-timestamp")[:20]

    # Metrics
    appointment_count = appointments.count()
    low_stock_count = inventory.filter(quantity__lte=F("threshold")).count()

    context = {
        "title": "Groomer Dashboard",
        "subtitle": "Assigned visits and pet notes for the day ahead.",
        "appointments": appointments,
        "inventory": inventory,
        "usage_logs": usage_logs,
        "appointment_count": appointment_count,
        "low_stock_count": low_stock_count,
    }
    return render(request, "frontend/dashboard_groomer.html", context)


@login_required(login_url="frontend:login")
def customer_dashboard(request):
    if request.user.role != "customer":
        return redirect(_dashboard_path_for(request.user))
    if request.user.must_change_password:
        return redirect("frontend:change-password")

    if request.method == "POST" and request.POST.get("action") == "update_profile":
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        email = request.POST.get("email", "").strip()
        phone = request.POST.get("phone", "").strip()
        location = request.POST.get("location", "").strip()

        if not email:
            messages.error(request, "Email address is required.")
            return redirect("frontend:customer-dashboard")

        if get_user_model().objects.filter(email__iexact=email).exclude(pk=request.user.pk).exists():
            messages.error(request, "That email is already associated with another account.")
            return redirect("frontend:customer-dashboard")

        user = request.user
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.phone = phone
        user.location = location
        user.save(update_fields=["first_name", "last_name", "email", "phone", "location"])
        AuditLog.log_action(user, "update_profile", "User", user.id)
        messages.success(request, "Your profile has been updated.")
        return redirect("frontend:customer-dashboard")

    appointments = Appointment.objects.filter(customer=request.user).select_related("service", "groomer", "pet").order_by("-date", "-time")
    pets = Pet.objects.filter(owner=request.user).order_by("name")
    notifications = Notification.objects.filter(user=request.user).order_by("-created_at")

    # Metrics
    appointment_count = appointments.count()
    pet_count = pets.count()
    unread_notifications_count = notifications.filter(is_read=False).count()

    context = {
        "title": "Customer Dashboard",
        "subtitle": "Your pets, bookings, and appointment history.",
        "appointments": appointments,
        "pets": pets,
        "notifications": notifications[:30],
        "appointment_count": appointment_count,
        "pet_count": pet_count,
        "unread_notifications_count": unread_notifications_count,
    }
    return render(request, "frontend/dashboard_customer.html", context)


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def mark_notification_read(request, pk):
    notification = get_object_or_404(Notification, pk=pk, user=request.user)
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return redirect("frontend:customer-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def manage_pet(request):
    if request.user.role != "customer":
        return redirect("frontend:dashboard")

    pet_id = request.POST.get("pet_id")
    name = request.POST.get("name", "").strip()
    breed = request.POST.get("breed", "").strip()
    age = request.POST.get("age", "").strip()
    weight = request.POST.get("weight", "").strip()
    notes = request.POST.get("notes", "").strip()

    if not name:
        messages.error(request, "Pet name is required.")
        return redirect("frontend:customer-dashboard")

    if pet_id:
        pet = get_object_or_404(Pet, pk=pet_id, owner=request.user)
        pet.name = name
        pet.breed = breed
        pet.age = age
        pet.weight = weight
        pet.notes = notes
        pet.save()
        messages.success(request, f"Pet '{name}' updated successfully.")
        AuditLog.log_action(request.user, "update_pet", "Pet", pet.id)
    else:
        pet = Pet.objects.create(
            owner=request.user,
            name=name,
            breed=breed,
            age=age,
            weight=weight,
            notes=notes
        )
        messages.success(request, f"Pet '{name}' added successfully.")
        AuditLog.log_action(request.user, "create_pet", "Pet", pet.id)

    return redirect("frontend:customer-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def delete_pet(request, pk):
    pet = get_object_or_404(Pet, pk=pk, owner=request.user)
    pet_name = pet.name
    pet.delete()
    messages.success(request, f"Pet '{pet_name}' deleted.")
    AuditLog.log_action(request.user, "delete_pet", "Pet", pk)
    return redirect("frontend:customer-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def manage_inventory(request):
    if request.user.role != "admin":
        return redirect("frontend:dashboard")

    item_id = request.POST.get("item_id")
    name = request.POST.get("name", "").strip()
    category = request.POST.get("category", "").strip()
    quantity_str = request.POST.get("quantity", "0").strip()
    unit = request.POST.get("unit", "").strip()
    threshold_str = request.POST.get("threshold", "0").strip()
    supplier_name = request.POST.get("supplier_name", "").strip()
    expiry_date_str = request.POST.get("expiry_date", "").strip()

    if not name or not category or not unit:
        messages.error(request, "Name, Category, and Unit are required.")
        return redirect("frontend:admin-dashboard")

    try:
        quantity = int(quantity_str)
        threshold = int(threshold_str)
    except ValueError:
        messages.error(request, "Quantity and Threshold must be integers.")
        return redirect("frontend:admin-dashboard")

    expiry_date = None
    if expiry_date_str:
        try:
            expiry_date = timezone.datetime.strptime(expiry_date_str, "%Y-%m-%d").date()
        except ValueError:
            messages.error(request, "Invalid expiry date format. Use YYYY-MM-DD.")
            return redirect("frontend:admin-dashboard")

    if item_id:
        item = get_object_or_404(InventoryItem, pk=item_id)
        old_quantity = item.quantity
        item.name = name
        item.category = category
        item.quantity = quantity
        item.unit = unit
        item.threshold = threshold
        item.supplier_name = supplier_name
        item.expiry_date = expiry_date
        item.save()
        messages.success(request, f"Inventory item '{name}' updated.")
        AuditLog.log_action(request.user, "update_inventory", "InventoryItem", item.id, {"old_qty": old_quantity, "new_qty": quantity})
    else:
        item = InventoryItem.objects.create(
            name=name,
            category=category,
            quantity=quantity,
            unit=unit,
            threshold=threshold,
            supplier_name=supplier_name,
            expiry_date=expiry_date
        )
        messages.success(request, f"Inventory item '{name}' created.")
        AuditLog.log_action(request.user, "create_inventory", "InventoryItem", item.id)

    return redirect("frontend:admin-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def delete_inventory(request, pk):
    if request.user.role != "admin":
        return redirect("frontend:dashboard")
    item = get_object_or_404(InventoryItem, pk=pk)
    name = item.name
    item.delete()
    messages.success(request, f"Inventory item '{name}' deleted.")
    AuditLog.log_action(request.user, "delete_inventory", "InventoryItem", pk)
    return redirect("frontend:admin-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def log_inventory_usage(request):
    if request.user.role != "groomer":
        return redirect("frontend:dashboard")

    item_id = request.POST.get("item_id")
    quantity_used_str = request.POST.get("quantity_used", "0").strip()
    notes = request.POST.get("notes", "").strip()

    item = get_object_or_404(InventoryItem, pk=item_id)
    try:
        quantity_used = int(quantity_used_str)
        if quantity_used <= 0:
            raise ValueError
    except ValueError:
        messages.error(request, "Quantity used must be a positive integer.")
        return redirect("frontend:groomer-dashboard")

    if item.quantity < quantity_used:
        messages.error(request, f"Cannot log usage. Only {item.quantity} {item.unit} of '{item.name}' in stock.")
        return redirect("frontend:groomer-dashboard")

    log = InventoryUsageLog.objects.create(
        item=item,
        groomer=request.user,
        quantity_used=quantity_used,
        notes=notes
    )
    item.quantity = max(0, item.quantity - quantity_used)
    item.save()

    AuditLog.log_action(request.user, "log_usage", "InventoryUsageLog", log.id, {"item": item.name, "qty_used": quantity_used})
    messages.success(request, f"Logged usage of {quantity_used} {item.unit} for '{item.name}'.")
    return redirect("frontend:groomer-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def request_restock(request):
    if request.user.role not in ["groomer", "admin"]:
        return redirect("frontend:dashboard")

    item_id = request.POST.get("item_id")
    quantity_str = request.POST.get("quantity", "0").strip()

    item = get_object_or_404(InventoryItem, pk=item_id)
    try:
        quantity = int(quantity_str)
        if quantity <= 0:
            raise ValueError
    except ValueError:
        messages.error(request, "Quantity must be a positive integer.")
        return redirect("frontend:dashboard")

    req = RestockRequest.objects.create(
        item=item,
        quantity=quantity,
        status="pending"
    )

    AuditLog.log_action(request.user, "request_restock", "RestockRequest", req.id, {"item": item.name, "qty": quantity})
    messages.success(request, f"Restock request for {quantity} {item.unit} of '{item.name}' submitted.")
    return redirect("frontend:dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def approve_restock(request, pk):
    if request.user.role != "admin":
        return redirect("frontend:dashboard")

    req = get_object_or_404(RestockRequest, pk=pk)
    if req.status != "pending":
        messages.error(request, "Restock request is not pending.")
        return redirect("frontend:admin-dashboard")

    req.status = "approved"
    req.save(update_fields=["status"])

    AuditLog.log_action(request.user, "approve_restock", "RestockRequest", req.id)
    messages.success(request, f"Restock request for '{req.item.name}' approved.")
    return redirect("frontend:admin-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def complete_restock(request, pk):
    if request.user.role != "admin":
        return redirect("frontend:dashboard")

    req = get_object_or_404(RestockRequest, pk=pk)
    if req.status != "approved":
        messages.error(request, "Restock request must be approved first.")
        return redirect("frontend:admin-dashboard")

    item = req.item
    old_qty = item.quantity
    item.quantity += req.quantity
    item.save(update_fields=["quantity"])

    req.status = "completed"
    req.save(update_fields=["status"])

    AuditLog.log_action(request.user, "complete_restock", "RestockRequest", req.id, {"qty_added": req.quantity, "new_qty": item.quantity})
    messages.success(request, f"Restock request completed. Added {req.quantity} {item.unit} to '{item.name}'.")
    return redirect("frontend:admin-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def manage_staff(request):
    if request.user.role != "admin":
        return redirect("frontend:dashboard")

    action = request.POST.get("action")

    if action == "create":
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        role = request.POST.get("role", "groomer").strip()
        password = request.POST.get("password", "").strip()

        if not username or not email or not password or role not in ["admin", "groomer"]:
            messages.error(request, "Username, Email, password, and valid Role are required.")
            return redirect("frontend:admin-dashboard")

        if get_user_model().objects.filter(username__iexact=username).exists():
            messages.error(request, "Username is already taken.")
            return redirect("frontend:admin-dashboard")

        try:
            validate_password(password)
        except ValidationError as error:
            messages.error(request, " ".join(error.messages))
            return redirect("frontend:admin-dashboard")

        user = get_user_model().objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=role,
            must_change_password=True,
            initial_password=password,  # store plain-text so admin can see it until changed
        )
        AuditLog.log_action(request.user, "create_staff", "User", user.id, {"role": role, "username": username})
        messages.success(request, f"Staff account for '{username}' created. They must change password on login.")

    elif action == "reset_password":
        user_id = request.POST.get("user_id")
        new_password = request.POST.get("new_password", "").strip()

        user = get_object_or_404(get_user_model(), pk=user_id)
        if user.role not in ["admin", "groomer"]:
            messages.error(request, "Cannot reset password for customers from here.")
            return redirect("frontend:admin-dashboard")

        if not new_password:
            messages.error(request, "Password is required.")
            return redirect("frontend:admin-dashboard")

        try:
            validate_password(new_password)
        except ValidationError as error:
            messages.error(request, " ".join(error.messages))
            return redirect("frontend:admin-dashboard")

        user.set_password(new_password)
        user.must_change_password = True
        user.initial_password = new_password  # admin can see the new temp password until changed
        user.save()

        AuditLog.log_action(request.user, "reset_password", "User", user.id)
        messages.success(request, f"Password reset for '{user.username}'. They must change password on login.")

    return redirect("frontend:admin-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def update_appointment_status(request, pk):
    user = request.user
    if user.role not in ["admin", "groomer"]:
        return redirect("frontend:dashboard")

    appointment = get_object_or_404(Appointment, pk=pk)
    if user.role == "groomer" and appointment.groomer != user:
        messages.error(request, "You are not assigned to this appointment.")
        return redirect("frontend:dashboard")

    new_status = request.POST.get("status")
    allowed = [choice for choice, _ in Appointment.STATUS_CHOICES]

    if new_status not in allowed:
        messages.error(request, "Invalid status choice.")
        return redirect("frontend:dashboard")

    old_status = appointment.status
    appointment.status = new_status
    appointment.save()

    AuditLog.log_action(user, "update_status", "Appointment", appointment.id, {"old_status": old_status, "new_status": new_status})
    messages.success(request, f"Appointment status updated to '{appointment.get_status_display()}'.")
    return redirect(_dashboard_path_for(user))


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def assign_appointment_groomer(request, pk):
    if request.user.role != "admin":
        return redirect("frontend:dashboard")

    appointment = get_object_or_404(Appointment, pk=pk)
    groomer_id = request.POST.get("groomer_id")
    if not groomer_id:
        messages.error(request, "Please select a groomer to assign.")
        return redirect("frontend:admin-dashboard")

    groomer = get_user_model().objects.filter(pk=groomer_id, role="groomer").first()
    if groomer is None:
        messages.error(request, "Selected groomer is not valid.")
        return redirect("frontend:admin-dashboard")

    old_groomer = appointment.groomer
    appointment.groomer = groomer
    if appointment.status == "pending":
        appointment.status = "confirmed"
        appointment.save(update_fields=["groomer", "status"])
    else:
        appointment.save(update_fields=["groomer"])

    AuditLog.log_action(
        request.user,
        "assign_groomer",
        "Appointment",
        appointment.id,
        {"old_groomer": old_groomer.username if old_groomer else None, "new_groomer": groomer.username},
    )
    messages.success(request, f"Groomer '{groomer.get_full_name() or groomer.username}' assigned to the appointment.")
    return redirect("frontend:admin-dashboard")


@login_required(login_url="frontend:login")
@require_http_methods(["POST"])
def submit_feedback(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk, customer=request.user)

    if appointment.status != "completed":
        messages.error(request, "Feedback can only be submitted for completed appointments.")
        return redirect("frontend:customer-dashboard")

    if hasattr(appointment, "feedback"):
        messages.error(request, "Feedback has already been submitted.")
        return redirect("frontend:customer-dashboard")

    rating_str = request.POST.get("rating", "5").strip()
    comments = request.POST.get("comments", "").strip()

    try:
        rating = int(rating_str)
        if not (1 <= rating <= 5):
            raise ValueError
    except ValueError:
        messages.error(request, "Rating must be an integer between 1 and 5.")
        return redirect("frontend:customer-dashboard")

    from api.models import AppointmentFeedback
    feedback = AppointmentFeedback.objects.create(
        appointment=appointment,
        rating=rating,
        comments=comments
    )

    AuditLog.log_action(request.user, "submit_feedback", "AppointmentFeedback", feedback.id, {"rating": rating})
    messages.success(request, "Thank you for your rating!")
    return redirect("frontend:customer-dashboard")


