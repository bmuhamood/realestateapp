# signals.py (create this file)
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from .models import ServiceBooking, PropertyBooking  # Your booking models
from backend.chatbot.consumers import send_notification

@receiver(post_save, sender=ServiceBooking)
def send_booking_notification(sender, instance, created, **kwargs):
    if created:
        # Send notification to property owner or user
        async_to_sync(send_notification)(
            user_id=instance.service.provider_id,  # Adjust based on your model
            title="New Service Booking!",
            message=f"{instance.user.username} booked {instance.service.name}",
            notification_type="booking",
            url=f"/dashboard/bookings/{instance.id}"
        )