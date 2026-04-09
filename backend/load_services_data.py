import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realestate.settings')
django.setup()

from services.models import ServiceCategory, Service

# Create categories
categories = [
    {'name': 'Home Decoration', 'icon': '🎨', 'order': 1},
    {'name': 'Cleaning', 'icon': '🧹', 'order': 2},
    {'name': 'Moving & Relocation', 'icon': '🚚', 'order': 3},
    {'name': 'Renovation', 'icon': '🔨', 'order': 4},
    {'name': 'Furniture Supply', 'icon': '🛋️', 'order': 5},
    {'name': 'Security Systems', 'icon': '🔒', 'order': 6},
]

for cat_data in categories:
    ServiceCategory.objects.get_or_create(
        name=cat_data['name'],
        defaults=cat_data
    )

# Create services
decoration = ServiceCategory.objects.get(name='Home Decoration')
cleaning = ServiceCategory.objects.get(name='Cleaning')
moving = ServiceCategory.objects.get(name='Moving & Relocation')

services = [
    {
        'category': decoration,
        'name': 'Interior Design Consultation',
        'description': 'Professional interior design services to transform your space',
        'price': 150000,
        'price_unit': 'room',
        'duration': '2-3 hours',
        'provider': 'Design Studio Uganda',
        'provider_phone': '0771234567',
        'is_featured': True,
    },
    {
        'category': cleaning,
        'name': 'Deep Cleaning Service',
        'description': 'Complete deep cleaning for your home or office',
        'price': 80000,
        'price_unit': 'room',
        'duration': '3-4 hours',
        'provider': 'Sparkle Cleaners',
        'provider_phone': '0772345678',
        'is_featured': True,
    },
    {
        'category': moving,
        'name': 'Professional Moving Service',
        'description': 'Safe and efficient moving services',
        'price': 200000,
        'price_unit': 'trip',
        'duration': '1 day',
        'provider': 'Easy Move Uganda',
        'provider_phone': '0773456789',
        'is_featured': True,
    },
]

for service_data in services:
    Service.objects.get_or_create(
        name=service_data['name'],
        defaults=service_data
    )

print("Services data loaded successfully!")