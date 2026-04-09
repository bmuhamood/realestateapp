from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from properties.models import Property, PropertyImage, PropertyLike
from users.models import Follow
from bookings.models import Booking
from payments.models import Payment
from favorites.models import Favorite
from reviews.models import Review
import random
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Load sample data for the Uganda Property App'

    def handle(self, *args, **kwargs):
        self.stdout.write('Loading sample data...')
        
        # Clear existing data (optional)
        self.stdout.write('Clearing existing data...')
        PropertyLike.objects.all().delete()
        PropertyImage.objects.all().delete()
        Property.objects.all().delete()
        Follow.objects.all().delete()
        Booking.objects.all().delete()
        Payment.objects.all().delete()
        Favorite.objects.all().delete()
        Review.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        
        # Create sample users
        self.create_users()
        
        # Create sample properties
        self.create_properties()
        
        # Create sample bookings
        self.create_bookings()
        
        # Create sample payments
        self.create_payments()
        
        # Create sample favorites
        self.create_favorites()
        
        # Create sample reviews
        self.create_reviews()
        
        # Create sample follows
        self.create_follows()
        
        self.stdout.write(self.style.SUCCESS('Sample data loaded successfully!'))

    def create_users(self):
        self.stdout.write('Creating users...')
        
        # Regular users
        regular_users = [
            {'username': 'john_doe', 'email': 'john@example.com', 'phone': '0771122334', 'first_name': 'John', 'last_name': 'Doe'},
            {'username': 'jane_smith', 'email': 'jane@example.com', 'phone': '0772233445', 'first_name': 'Jane', 'last_name': 'Smith'},
            {'username': 'robert_kay', 'email': 'robert@example.com', 'phone': '0773344556', 'first_name': 'Robert', 'last_name': 'Kay'},
            {'username': 'mary_williams', 'email': 'mary@example.com', 'phone': '0774455667', 'first_name': 'Mary', 'last_name': 'Williams'},
            {'username': 'david_brown', 'email': 'david@example.com', 'phone': '0775566778', 'first_name': 'David', 'last_name': 'Brown'},
        ]
        
        for user_data in regular_users:
            User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='password123',
                phone=user_data['phone'],
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                is_agent=False,
                is_verified=True
            )
        
        # Agents
        agents = [
            {'username': 'kampala_properties', 'email': 'agent1@example.com', 'phone': '0776677889', 
             'first_name': 'Sarah', 'last_name': 'Okello', 'company': 'Kampala Properties Ltd', 'bio': 'Expert in Kampala real estate with 10 years experience'},
            {'username': 'uganda_homes', 'email': 'agent2@example.com', 'phone': '0777788990', 
             'first_name': 'Michael', 'last_name': 'Mukasa', 'company': 'Uganda Homes', 'bio': 'Specializing in family homes and apartments'},
            {'username': 'prime_estates', 'email': 'agent3@example.com', 'phone': '0778899001', 
             'first_name': 'Grace', 'last_name': 'Nakato', 'company': 'Prime Estates', 'bio': 'Luxury properties and commercial real estate'},
            {'username': 'city_properties', 'email': 'agent4@example.com', 'phone': '0779900112', 
             'first_name': 'James', 'last_name': 'Ssebunya', 'company': 'City Properties', 'bio': 'Affordable housing solutions in Kampala'},
            {'username': 'royal_homes', 'email': 'agent5@example.com', 'phone': '0780011223', 
             'first_name': 'Patricia', 'last_name': 'Nabatanzi', 'company': 'Royal Homes', 'bio': 'Premium properties for discerning clients'},
        ]
        
        for agent_data in agents:
            User.objects.create_user(
                username=agent_data['username'],
                email=agent_data['email'],
                password='password123',
                phone=agent_data['phone'],
                first_name=agent_data['first_name'],
                last_name=agent_data['last_name'],
                is_agent=True,
                is_verified=True,
                bio=agent_data['bio']
            )
        
        self.stdout.write(f'Created {len(regular_users)} regular users and {len(agents)} agents')

    def create_properties(self):
        self.stdout.write('Creating properties...')
        
        agents = User.objects.filter(is_agent=True)
        
        properties_data = [
            # Kampala properties
            {
                'title': 'Modern 3 Bedroom House in Kololo',
                'description': 'Beautiful modern house with spacious rooms, modern kitchen, and a beautiful garden. Located in the heart of Kololo, close to all amenities.',
                'property_type': 'house',
                'transaction_type': 'rent',
                'price': 3500000,
                'bedrooms': 3,
                'bathrooms': 3,
                'square_meters': 250,
                'latitude': 0.3389,
                'longitude': 32.5833,
                'address': 'Kololo Hill Drive, Kampala',
                'city': 'Kampala',
                'district': 'Kampala Central',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Luxury 4 Bedroom Villa in Naguru',
                'description': 'Stunning villa with panoramic views, swimming pool, and landscaped gardens. Perfect for families looking for luxury living.',
                'property_type': 'house',
                'transaction_type': 'sale',
                'price': 850000000,
                'bedrooms': 4,
                'bathrooms': 4,
                'square_meters': 400,
                'latitude': 0.3383,
                'longitude': 32.5967,
                'address': 'Naguru Hill, Kampala',
                'city': 'Kampala',
                'district': 'Kampala Central',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': '2 Bedroom Apartment in Ntinda',
                'description': 'Cozy apartment in a secure complex with 24/7 security, parking, and backup generator. Close to shopping centers and schools.',
                'property_type': 'apartment',
                'transaction_type': 'rent',
                'price': 1500000,
                'bedrooms': 2,
                'bathrooms': 2,
                'square_meters': 120,
                'latitude': 0.3470,
                'longitude': 32.6136,
                'address': 'Ntinda Road, Kampala',
                'city': 'Kampala',
                'district': 'Nakawa',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Commercial Land in Bugolobi',
                'description': 'Prime commercial land ideal for business development. Located along main road with high visibility.',
                'property_type': 'land',
                'transaction_type': 'sale',
                'price': 450000000,
                'bedrooms': 0,
                'bathrooms': 0,
                'square_meters': 1000,
                'latitude': 0.3161,
                'longitude': 32.6150,
                'address': 'Bugolobi Industrial Area, Kampala',
                'city': 'Kampala',
                'district': 'Kampala Central',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Modern 5 Bedroom Mansion in Muyenga',
                'description': 'Elegant mansion with 5 spacious bedrooms, staff quarters, swimming pool, and entertainment area. One of the finest properties in Muyenga.',
                'property_type': 'house',
                'transaction_type': 'sale',
                'price': 1200000000,
                'bedrooms': 5,
                'bathrooms': 5,
                'square_meters': 600,
                'latitude': 0.3090,
                'longitude': 32.6143,
                'address': 'Muyenga Tank Hill, Kampala',
                'city': 'Kampala',
                'district': 'Makindye',
                'is_available': True,
                'is_verified': True,
            },
            # Wakiso properties
            {
                'title': '3 Bedroom House in Kira',
                'description': 'Spacious family home in a quiet neighborhood. Includes a garden, parking, and security system.',
                'property_type': 'house',
                'transaction_type': 'rent',
                'price': 1200000,
                'bedrooms': 3,
                'bathrooms': 2,
                'square_meters': 180,
                'latitude': 0.4000,
                'longitude': 32.6333,
                'address': 'Kira Town, Wakiso',
                'city': 'Kira',
                'district': 'Wakiso',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Modern 2 Bedroom Apartment in Najjera',
                'description': 'Brand new apartment with modern finishes. Walking distance to shops and restaurants.',
                'property_type': 'apartment',
                'transaction_type': 'rent',
                'price': 800000,
                'bedrooms': 2,
                'bathrooms': 1,
                'square_meters': 80,
                'latitude': 0.3514,
                'longitude': 32.6217,
                'address': 'Najjera, Wakiso',
                'city': 'Najjera',
                'district': 'Wakiso',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Commercial Building in Nansana',
                'description': 'Mixed-use commercial building with retail spaces and offices. Great investment opportunity.',
                'property_type': 'commercial',
                'transaction_type': 'sale',
                'price': 950000000,
                'bedrooms': 0,
                'bathrooms': 4,
                'square_meters': 800,
                'latitude': 0.3679,
                'longitude': 32.5333,
                'address': 'Nansana Town, Wakiso',
                'city': 'Nansana',
                'district': 'Wakiso',
                'is_available': True,
                'is_verified': True,
            },
            # More properties in other areas
            {
                'title': 'Affordable 1 Bedroom Studio in Makindye',
                'description': 'Perfect for singles or students. Secure area with easy access to public transport.',
                'property_type': 'apartment',
                'transaction_type': 'rent',
                'price': 400000,
                'bedrooms': 1,
                'bathrooms': 1,
                'square_meters': 45,
                'latitude': 0.2816,
                'longitude': 32.6025,
                'address': 'Makindye, Kampala',
                'city': 'Kampala',
                'district': 'Makindye',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': '4 Bedroom Family Home in Bweyogerere',
                'description': 'Spacious home with large compound, perfect for a growing family. Close to schools and shopping centers.',
                'property_type': 'house',
                'transaction_type': 'rent',
                'price': 1800000,
                'bedrooms': 4,
                'bathrooms': 3,
                'square_meters': 220,
                'latitude': 0.3761,
                'longitude': 32.6589,
                'address': 'Bweyogerere, Wakiso',
                'city': 'Bweyogerere',
                'district': 'Wakiso',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Luxury Condo in Kisementi',
                'description': 'High-end condo with gym, pool, and 24/7 security. Perfect for expats and professionals.',
                'property_type': 'condo',
                'transaction_type': 'rent',
                'price': 5000000,
                'bedrooms': 3,
                'bathrooms': 3,
                'square_meters': 180,
                'latitude': 0.3289,
                'longitude': 32.5997,
                'address': 'Kisementi, Kampala',
                'city': 'Kampala',
                'district': 'Kampala Central',
                'is_available': True,
                'is_verified': True,
            },
            {
                'title': 'Agricultural Land in Gayaza',
                'description': 'Large agricultural land suitable for farming or investment. Water source available.',
                'property_type': 'land',
                'transaction_type': 'sale',
                'price': 150000000,
                'bedrooms': 0,
                'bathrooms': 0,
                'square_meters': 5000,
                'latitude': 0.4944,
                'longitude': 32.6167,
                'address': 'Gayaza Road, Wakiso',
                'city': 'Gayaza',
                'district': 'Wakiso',
                'is_available': True,
                'is_verified': True,
            },
        ]
        
        properties_created = []
        for i, prop_data in enumerate(properties_data):
            owner = agents[i % len(agents)]
            property_obj = Property.objects.create(
                owner=owner,
                **prop_data
            )
            
            # Create property images (simulated)
            # In a real scenario, you'd have actual image files
            # For now, we'll just create placeholder image objects
            property_obj.save()
            properties_created.append(property_obj)
        
        # Add sample property likes
        users = User.objects.filter(is_agent=False)
        for property_obj in properties_created[:5]:
            for user in users[:3]:
                PropertyLike.objects.get_or_create(
                    user=user,
                    property=property_obj
                )
        
        self.stdout.write(f'Created {len(properties_created)} properties')

    def create_bookings(self):
        self.stdout.write('Creating bookings...')
        
        users = User.objects.filter(is_agent=False)
        properties = Property.objects.all()[:8]
        
        booking_dates = [
            timezone.now() + timedelta(days=1),
            timezone.now() + timedelta(days=3),
            timezone.now() + timedelta(days=5),
            timezone.now() + timedelta(days=7),
            timezone.now() + timedelta(days=10),
        ]
        
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        
        for i, property_obj in enumerate(properties):
            user = users[i % len(users)]
            booking = Booking.objects.create(
                user=user,
                property=property_obj,
                visit_date=random.choice(booking_dates),
                message=f"I'm interested in viewing this {property_obj.property_type}. Please confirm availability.",
                status=random.choice(statuses)
            )
        
        self.stdout.write(f'Created {len(properties)} bookings')

    def create_payments(self):
        self.stdout.write('Creating payments...')
        
        users = User.objects.filter(is_agent=False)
        properties = Property.objects.all()[:6]
        
        payment_methods = ['mtn', 'airtel', 'card', 'cash']
        
        for i, property_obj in enumerate(properties):
            user = users[i % len(users)]
            payment = Payment.objects.create(
                user=user,
                property=property_obj,
                amount=Decimal('10000.00'),
                payment_method=random.choice(payment_methods),
                reference=f'PAY-{random.randint(100000, 999999)}',
                status='completed',
                phone_number=f'077{random.randint(100000, 999999)}'
            )
        
        self.stdout.write(f'Created {len(properties)} payments')

    def create_favorites(self):
        self.stdout.write('Creating favorites...')
        
        users = User.objects.filter(is_agent=False)
        properties = Property.objects.all()
        
        for user in users[:3]:
            favorite_properties = random.sample(list(properties), min(3, len(properties)))
            for property_obj in favorite_properties:
                Favorite.objects.get_or_create(
                    user=user,
                    property=property_obj
                )
        
        self.stdout.write(f'Created favorites for {len(users[:3])} users')

    def create_reviews(self):
        self.stdout.write('Creating reviews...')
        
        users = User.objects.filter(is_agent=False)
        agents = User.objects.filter(is_agent=True)
        
        review_comments = [
            "Great agent! Very professional and helpful.",
            "Excellent service, found me the perfect home.",
            "Very knowledgeable about the property market.",
            "Highly recommend, very responsive and efficient.",
            "Good experience, would work with again.",
            "Helped me find a great property within my budget.",
            "Very patient and understanding throughout the process.",
            "Excellent communication and follow-up.",
        ]
        
        ratings = [4, 5, 5, 4, 5, 3, 5, 4, 5]
        
        for user in users[:5]:
            for agent in agents[:3]:
                Review.objects.create(
                    user=user,
                    agent=agent,
                    rating=random.choice(ratings),
                    comment=random.choice(review_comments),
                    property=Property.objects.filter(owner=agent).first()
                )
        
        self.stdout.write(f'Created reviews for agents')

    def create_follows(self):
        self.stdout.write('Creating follows...')
        
        users = User.objects.filter(is_agent=False)
        agents = User.objects.filter(is_agent=True)
        
        for user in users[:4]:
            for agent in agents[:2]:
                Follow.objects.get_or_create(
                    follower=user,
                    following=agent
                )
        
        self.stdout.write(f'Created follows between users and agents')