import os
import django
from decimal import Decimal
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'realestate.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from properties.models import Property, PropertyImage, PropertyLike, PropertyView
from bookings.models import Booking
from payments.models import Payment
from favorites.models import Favorite
from reviews.models import Review
from users.models import Follow

User = get_user_model()

def clear_all_data():
    """Clear all existing data"""
    print("Clearing existing data...")
    PropertyView.objects.all().delete()
    PropertyLike.objects.all().delete()
    PropertyImage.objects.all().delete()
    Property.objects.all().delete()
    Booking.objects.all().delete()
    Payment.objects.all().delete()
    Favorite.objects.all().delete()
    Review.objects.all().delete()
    Follow.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()
    print("✓ All data cleared")

def create_users():
    """Create sample users"""
    print("\n📝 Creating users...")
    
    # Create regular users
    regular_users_data = [
        {'username': 'john_doe', 'email': 'john@example.com', 'phone': '0771122334', 
         'first_name': 'John', 'last_name': 'Doe', 'location': 'Kololo', 'district': 'Kampala Central'},
        {'username': 'jane_smith', 'email': 'jane@example.com', 'phone': '0772233445', 
         'first_name': 'Jane', 'last_name': 'Smith', 'location': 'Naguru', 'district': 'Kampala Central'},
        {'username': 'robert_kay', 'email': 'robert@example.com', 'phone': '0773344556', 
         'first_name': 'Robert', 'last_name': 'Kay', 'location': 'Ntinda', 'district': 'Nakawa'},
        {'username': 'mary_williams', 'email': 'mary@example.com', 'phone': '0774455667', 
         'first_name': 'Mary', 'last_name': 'Williams', 'location': 'Kira', 'district': 'Wakiso'},
        {'username': 'david_brown', 'email': 'david@example.com', 'phone': '0775566778', 
         'first_name': 'David', 'last_name': 'Brown', 'location': 'Najjera', 'district': 'Wakiso'},
        {'username': 'sarah_johnson', 'email': 'sarah@example.com', 'phone': '0776677889', 
         'first_name': 'Sarah', 'last_name': 'Johnson', 'location': 'Muyenga', 'district': 'Makindye'},
        {'username': 'paul_mukasa', 'email': 'paul@example.com', 'phone': '0777788990', 
         'first_name': 'Paul', 'last_name': 'Mukasa', 'location': 'Bweyogerere', 'district': 'Wakiso'},
        {'username': 'lisa_ndagire', 'email': 'lisa@example.com', 'phone': '0778899001', 
         'first_name': 'Lisa', 'last_name': 'Ndagire', 'location': 'Kisementi', 'district': 'Kampala Central'},
    ]
    
    regular_users = []
    for user_data in regular_users_data:
        user = User.objects.create_user(
            username=user_data['username'],
            email=user_data['email'],
            password='password123',
            phone=user_data['phone'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            is_agent=False,
            is_verified=True,
            location=user_data.get('location', ''),
            district=user_data.get('district', ''),
            city='Kampala',
            bio=f"Property enthusiast looking for the perfect {'home' if random.random() > 0.5 else 'investment'}"
        )
        regular_users.append(user)
    
    # Create agents
    agents_data = [
        {'username': 'kampala_properties', 'email': 'agent1@example.com', 'phone': '0779900112',
         'first_name': 'Sarah', 'last_name': 'Okello', 'company': 'Kampala Properties Ltd',
         'bio': '⭐ 5.0 ★ Expert in Kampala real estate with 10+ years experience. Specializing in luxury homes and commercial properties.',
         'specialty': 'Luxury Homes', 'experience': 10},
        {'username': 'uganda_homes', 'email': 'agent2@example.com', 'phone': '0780011223',
         'first_name': 'Michael', 'last_name': 'Mukasa', 'company': 'Uganda Homes',
         'bio': '⭐ 4.9 ★ Helping families find their dream homes since 2015. Specializing in family homes and apartments.',
         'specialty': 'Family Homes', 'experience': 8},
        {'username': 'prime_estates', 'email': 'agent3@example.com', 'phone': '0781122334',
         'first_name': 'Grace', 'last_name': 'Nakato', 'company': 'Prime Estates',
         'bio': '⭐ 4.8 ★ Luxury properties and commercial real estate expert. Serving Kampala\'s elite clientele.',
         'specialty': 'Luxury & Commercial', 'experience': 12},
        {'username': 'city_properties', 'email': 'agent4@example.com', 'phone': '0782233445',
         'first_name': 'James', 'last_name': 'Ssebunya', 'company': 'City Properties',
         'bio': '⭐ 4.7 ★ Affordable housing solutions in Kampala. Helping first-time buyers find their perfect home.',
         'specialty': 'Affordable Housing', 'experience': 7},
        {'username': 'royal_homes', 'email': 'agent5@example.com', 'phone': '0783344556',
         'first_name': 'Patricia', 'last_name': 'Nabatanzi', 'company': 'Royal Homes',
         'bio': '⭐ 4.9 ★ Premium properties for discerning clients. Over 15 years of real estate excellence.',
         'specialty': 'Premium Properties', 'experience': 15},
        {'username': 'green_land', 'email': 'agent6@example.com', 'phone': '0784455667',
         'first_name': 'Robert', 'last_name': 'Ssali', 'company': 'Green Land Realty',
         'bio': '⭐ 4.6 ★ Specializing in land and development properties. Expert in property investment.',
         'specialty': 'Land & Investment', 'experience': 6},
        {'username': 'metro_realty', 'email': 'agent7@example.com', 'phone': '0785566778',
         'first_name': 'Alice', 'last_name': 'Nakamya', 'company': 'Metro Realty',
         'bio': '⭐ 4.8 ★ Your trusted partner for property in Kampala. Fast, reliable, and professional service.',
         'specialty': 'General Real Estate', 'experience': 9},
    ]
    
    agents = []
    for agent_data in agents_data:
        agent = User.objects.create_user(
            username=agent_data['username'],
            email=agent_data['email'],
            password='password123',
            phone=agent_data['phone'],
            first_name=agent_data['first_name'],
            last_name=agent_data['last_name'],
            is_agent=True,
            is_verified=True,
            bio=agent_data['bio'],
            location='Kampala',
            city='Kampala'
        )
        agents.append(agent)
    
    print(f"✓ Created {len(regular_users)} regular users and {len(agents)} agents")
    return regular_users, agents

def create_properties(agents):
    """Create sample properties"""
    print("\n🏠 Creating properties...")
    
    properties_data = [
        # Kololo - High-end
        {
            'title': 'Modern 3 Bedroom House with Garden',
            'description': 'Beautiful modern house with spacious rooms, modern kitchen, and a beautiful garden. Located in the heart of Kololo, close to all amenities including Acacia Mall, international schools, and hospitals. Features include: \n• 3 spacious bedrooms with built-in wardrobes\n• 3 modern bathrooms\n• Fully equipped kitchen with granite countertops\n• Large living and dining area\n• Beautiful garden with mature trees\n• Parking for 2 cars\n• 24/7 security system',
            'property_type': 'house', 'transaction_type': 'rent', 'price': 3500000,
            'bedrooms': 3, 'bathrooms': 3, 'square_meters': 250,
            'latitude': 0.3389, 'longitude': 32.5833,
            'address': 'Kololo Hill Drive', 'city': 'Kampala', 'district': 'Kampala Central',
            'features': ['Garden', 'Parking', 'Security', 'Water Tank']
        },
        {
            'title': 'Luxury 4 Bedroom Villa with Pool',
            'description': 'Stunning villa with panoramic views of Kampala city. Features a swimming pool, landscaped gardens, and state-of-the-art security. Perfect for families looking for luxury living. Amenities include: \n• 4 en-suite bedrooms\n• Modern kitchen with island\n• Swimming pool\n• Entertainment area\n• Staff quarters\n• Solar system\n• Borehole water',
            'property_type': 'house', 'transaction_type': 'sale', 'price': 850000000,
            'bedrooms': 4, 'bathrooms': 4, 'square_meters': 400,
            'latitude': 0.3383, 'longitude': 32.5967,
            'address': 'Naguru Hill', 'city': 'Kampala', 'district': 'Kampala Central',
            'features': ['Pool', 'Garden', 'Solar', 'Staff Quarters']
        },
        # Ntinda - Mid-range
        {
            'title': '2 Bedroom Apartment in Secure Complex',
            'description': 'Cozy apartment in a secure complex with 24/7 security, parking, and backup generator. Close to shopping centers and schools. The apartment features: \n• Open plan living and dining\n• Modern kitchen with cabinets\n• 2 bedrooms with wardrobes\n• 2 bathrooms\n• Balcony with city view\n• Shared compound',
            'property_type': 'apartment', 'transaction_type': 'rent', 'price': 1500000,
            'bedrooms': 2, 'bathrooms': 2, 'square_meters': 120,
            'latitude': 0.3470, 'longitude': 32.6136,
            'address': 'Ntinda Road', 'city': 'Kampala', 'district': 'Nakawa',
            'features': ['Security', 'Parking', 'Generator', 'Balcony']
        },
        # Kira - Family homes
        {
            'title': 'Spacious 3 Bedroom Family Home in Kira',
            'description': 'Perfect family home in a quiet, secure neighborhood. Includes a garden, parking, and security system. Features: \n• 3 bedrooms (master en-suite)\n• 2 bathrooms\n• Large living room\n• Dining area\n• Kitchen with pantry\n• Veranda\n• Garden\n• Parking for 2 cars',
            'property_type': 'house', 'transaction_type': 'rent', 'price': 1200000,
            'bedrooms': 3, 'bathrooms': 2, 'square_meters': 180,
            'latitude': 0.4000, 'longitude': 32.6333,
            'address': 'Kira Town', 'city': 'Kira', 'district': 'Wakiso',
            'features': ['Garden', 'Parking', 'Security', 'Veranda']
        },
        # Najjera - Affordable
        {
            'title': 'Modern 2 Bedroom Apartment - Najjera',
            'description': 'Brand new apartment with modern finishes. Walking distance to shops and restaurants. Features include: \n• 2 bedrooms with built-in wardrobes\n• 1 bathroom\n• Open plan living and kitchen\n• Balcony\n• Secure parking\n• 24/7 security',
            'property_type': 'apartment', 'transaction_type': 'rent', 'price': 800000,
            'bedrooms': 2, 'bathrooms': 1, 'square_meters': 80,
            'latitude': 0.3514, 'longitude': 32.6217,
            'address': 'Najjera', 'city': 'Najjera', 'district': 'Wakiso',
            'features': ['Security', 'Parking', 'Balcony']
        },
        # Muyenga - Luxury
        {
            'title': 'Luxury 5 Bedroom Mansion in Muyenga',
            'description': 'Elegant mansion with 5 spacious bedrooms, staff quarters, swimming pool, and entertainment area. One of the finest properties in Muyenga. Features: \n• 5 en-suite bedrooms\n• Large living and dining areas\n• Modern kitchen\n• Swimming pool\n• Gym\n• Entertainment area\n• Staff quarters\n• Landscaped gardens\n• Solar system\n• Borehole',
            'property_type': 'house', 'transaction_type': 'sale', 'price': 1200000000,
            'bedrooms': 5, 'bathrooms': 5, 'square_meters': 600,
            'latitude': 0.3090, 'longitude': 32.6143,
            'address': 'Muyenga Tank Hill', 'city': 'Kampala', 'district': 'Makindye',
            'features': ['Pool', 'Gym', 'Staff Quarters', 'Solar', 'Garden']
        },
        # Makindye - Budget friendly
        {
            'title': 'Affordable 1 Bedroom Studio in Makindye',
            'description': 'Perfect for singles or students. Secure area with easy access to public transport. Features: \n• 1 bedroom\n• 1 bathroom\n• Kitchenette\n• Living area\n• Shared compound\n• Security',
            'property_type': 'apartment', 'transaction_type': 'rent', 'price': 400000,
            'bedrooms': 1, 'bathrooms': 1, 'square_meters': 45,
            'latitude': 0.2816, 'longitude': 32.6025,
            'address': 'Makindye', 'city': 'Kampala', 'district': 'Makindye',
            'features': ['Security', 'Water Supply']
        },
        # Bweyogerere - Family
        {
            'title': '4 Bedroom Family Home in Bweyogerere',
            'description': 'Spacious home with large compound, perfect for a growing family. Close to schools and shopping centers. Features: \n• 4 bedrooms\n• 3 bathrooms\n• Large living area\n• Dining room\n• Kitchen\n• Compound\n• Parking\n• Security',
            'property_type': 'house', 'transaction_type': 'rent', 'price': 1800000,
            'bedrooms': 4, 'bathrooms': 3, 'square_meters': 220,
            'latitude': 0.3761, 'longitude': 32.6589,
            'address': 'Bweyogerere', 'city': 'Bweyogerere', 'district': 'Wakiso',
            'features': ['Compound', 'Parking', 'Security']
        },
        # Kisementi - Commercial/High-end
        {
            'title': 'Luxury 3 Bedroom Condo in Kisementi',
            'description': 'High-end condo with gym, pool, and 24/7 security. Perfect for expats and professionals. Amenities: \n• 3 bedrooms (all en-suite)\n• Modern kitchen\n• Open plan living\n• Gym\n• Swimming pool\n• 24/7 security\n• Underground parking\n• Backup generator',
            'property_type': 'condo', 'transaction_type': 'rent', 'price': 5000000,
            'bedrooms': 3, 'bathrooms': 3, 'square_meters': 180,
            'latitude': 0.3289, 'longitude': 32.5997,
            'address': 'Kisementi', 'city': 'Kampala', 'district': 'Kampala Central',
            'features': ['Pool', 'Gym', 'Security', 'Parking', 'Generator']
        },
        # Commercial property
        {
            'title': 'Commercial Building in Nansana',
            'description': 'Mixed-use commercial building with retail spaces and offices. Great investment opportunity. Features: \n• Ground floor: 4 retail shops\n• First floor: 6 offices\n• Second floor: 2 apartments\n• Parking for 10 cars\n• 24/7 security\n• Generator\n• Water storage',
            'property_type': 'commercial', 'transaction_type': 'sale', 'price': 950000000,
            'bedrooms': 0, 'bathrooms': 4, 'square_meters': 800,
            'latitude': 0.3679, 'longitude': 32.5333,
            'address': 'Nansana Town', 'city': 'Nansana', 'district': 'Wakiso',
            'features': ['Security', 'Generator', 'Parking', 'Water Tank']
        },
        # Land property
        {
            'title': 'Agricultural Land in Gayaza',
            'description': 'Large agricultural land suitable for farming or investment. Water source available. Features: \n• 5 acres of fertile land\n• Borehole available\n• Access road\n• Near main road\n• Suitable for farming or development',
            'property_type': 'land', 'transaction_type': 'sale', 'price': 150000000,
            'bedrooms': 0, 'bathrooms': 0, 'square_meters': 5000,
            'latitude': 0.4944, 'longitude': 32.6167,
            'address': 'Gayaza Road', 'city': 'Gayaza', 'district': 'Wakiso',
            'features': ['Borehole', 'Access Road', 'Fertile Land']
        },
        # Additional properties for variety
        {
            'title': 'Executive 2 Bedroom Apartment - Bukoto',
            'description': 'Executive apartment with modern finishes and city views. Features: \n• 2 en-suite bedrooms\n• Modern kitchen\n• Spacious living area\n• Balcony\n• Parking\n• 24/7 security\n• Gym access',
            'property_type': 'apartment', 'transaction_type': 'rent', 'price': 2200000,
            'bedrooms': 2, 'bathrooms': 2, 'square_meters': 110,
            'latitude': 0.3425, 'longitude': 32.5903,
            'address': 'Bukoto', 'city': 'Kampala', 'district': 'Kampala Central',
            'features': ['Security', 'Parking', 'Gym', 'Balcony']
        },
        {
            'title': 'Charming 3 Bedroom Cottage - Entebbe',
            'description': 'Beautiful cottage near Lake Victoria. Perfect for retreat or family home. Features: \n• 3 bedrooms\n• 2 bathrooms\n• Large garden\n• Lake view\n• Parking\n• Security',
            'property_type': 'house', 'transaction_type': 'rent', 'price': 2500000,
            'bedrooms': 3, 'bathrooms': 2, 'square_meters': 200,
            'latitude': 0.0589, 'longitude': 32.4749,
            'address': 'Entebbe', 'city': 'Entebbe', 'district': 'Wakiso',
            'features': ['Garden', 'Lake View', 'Parking', 'Security']
        },
    ]
    
    properties_created = []
    for i, prop_data in enumerate(properties_data):
        owner = agents[i % len(agents)]
        property_obj = Property.objects.create(
            owner=owner,
            is_available=True,
            is_verified=True,
            views_count=random.randint(50, 500),
            likes_count=random.randint(5, 50),
            **{k: v for k, v in prop_data.items() if k != 'features'}
        )
        properties_created.append(property_obj)
    
    print(f"✓ Created {len(properties_created)} properties")
    return properties_created

def create_property_views(properties, regular_users):
    """Create property views"""
    print("\n👁️ Creating property views...")
    
    for property_obj in properties[:10]:
        # Create views from random users
        for _ in range(random.randint(3, 15)):
            user = random.choice(regular_users) if random.random() > 0.3 else None
            PropertyView.objects.create(
                property=property_obj,
                user=user,
                ip_address=f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}",
                created_at=timezone.now() - timedelta(days=random.randint(1, 30))
            )
    
    print(f"✓ Created property views")

def create_property_likes(properties, regular_users):
    """Create property likes"""
    print("\n❤️ Creating property likes...")
    
    like_count = 0
    for property_obj in properties:
        # Each property gets liked by 2-8 users
        num_likes = random.randint(2, 8)
        users_to_like = random.sample(regular_users, min(num_likes, len(regular_users)))
        for user in users_to_like:
            PropertyLike.objects.get_or_create(
                user=user,
                property=property_obj
            )
            like_count += 1
    
    print(f"✓ Created {like_count} property likes")

def create_bookings(properties, regular_users):
    """Create bookings"""
    print("\n📅 Creating bookings...")
    
    booking_statuses = ['pending', 'confirmed', 'completed', 'cancelled']
    status_weights = [0.4, 0.3, 0.2, 0.1]  # 40% pending, 30% confirmed, etc.
    
    bookings_created = []
    for i, property_obj in enumerate(properties[:10]):  # Create bookings for first 10 properties
        user = regular_users[i % len(regular_users)]
        visit_date = timezone.now() + timedelta(days=random.randint(1, 30))
        
        booking = Booking.objects.create(
            user=user,
            property=property_obj,
            visit_date=visit_date,
            message=f"I'm interested in viewing this property. I'd like to schedule a visit on {visit_date.strftime('%B %d, %Y')}. Please confirm availability.",
            status=random.choices(booking_statuses, weights=status_weights)[0],
            booking_fee=Decimal('10000.00')
        )
        bookings_created.append(booking)
    
    print(f"✓ Created {len(bookings_created)} bookings")
    return bookings_created

def create_payments(properties, regular_users, bookings):
    """Create payments"""
    print("\n💰 Creating payments...")
    
    payment_methods = ['mtn', 'airtel', 'card', 'cash']
    payment_statuses = ['completed', 'pending', 'failed']
    
    payments_created = []
    
    # Create payments for completed bookings
    completed_bookings = [b for b in bookings if b.status == 'completed']
    for booking in completed_bookings[:5]:
        payment = Payment.objects.create(
            user=booking.user,
            property=booking.property,
            booking=booking,
            amount=booking.booking_fee,
            payment_method=random.choice(payment_methods),
            reference=f"PAY-{random.randint(100000, 999999)}",
            status='completed',
            phone_number=f'077{random.randint(100000, 999999)}'
        )
        payments_created.append(payment)
    
    # Create additional payments without bookings
    for i in range(5):
        user = regular_users[i % len(regular_users)]
        property_obj = properties[i % len(properties)]
        payment = Payment.objects.create(
            user=user,
            property=property_obj,
            amount=Decimal(random.choice(['10000', '25000', '50000', '100000'])),
            payment_method=random.choice(payment_methods),
            reference=f"PAY-{random.randint(100000, 999999)}",
            status=random.choice(payment_statuses),
            phone_number=f'077{random.randint(100000, 999999)}'
        )
        payments_created.append(payment)
    
    print(f"✓ Created {len(payments_created)} payments")

def create_favorites(properties, regular_users):
    """Create favorites"""
    print("\n⭐ Creating favorites...")
    
    favorite_count = 0
    for user in regular_users:
        # Each user favorites 2-5 properties
        num_favorites = random.randint(2, 5)
        properties_to_favorite = random.sample(properties, min(num_favorites, len(properties)))
        for property_obj in properties_to_favorite:
            Favorite.objects.get_or_create(
                user=user,
                property=property_obj
            )
            favorite_count += 1
    
    print(f"✓ Created {favorite_count} favorites")

def create_reviews(regular_users, agents, properties):
    """Create detailed reviews"""
    print("\n⭐ Creating reviews...")
    
    review_comments = {
        5: [  # 5-star reviews
            "⭐️⭐️⭐️⭐️⭐️ Absolutely outstanding service! Sarah went above and beyond to find me the perfect home. Her knowledge of the Kampala market is unmatched. The entire process was smooth and stress-free. I couldn't be happier with my new home!",
            "⭐️⭐️⭐️⭐️⭐️ Michael is a true professional. He helped me find a great apartment within my budget and negotiated a better price than I expected. Highly recommend!",
            "⭐️⭐️⭐️⭐️⭐️ Grace is amazing! She showed me several properties and was patient throughout the entire process. Her expertise in luxury properties is evident. Thank you for helping me find my dream home!",
            "⭐️⭐️⭐️⭐️⭐️ James made buying my first home so easy! He explained everything clearly and was always available to answer my questions. The best real estate agent in Kampala!",
            "⭐️⭐️⭐️⭐️⭐️ Patricia is an absolute gem! She found us a beautiful family home that exceeded our expectations. Her attention to detail and dedication to her clients is remarkable.",
            "⭐️⭐️⭐️⭐️⭐️ Robert is very knowledgeable about land investments. He helped me find a great piece of land in a developing area. His advice was invaluable.",
            "⭐️⭐️⭐️⭐️⭐️ Alice is professional, responsive, and truly cares about her clients. She helped me rent a great apartment within 3 days! Highly recommended.",
        ],
        4: [  # 4-star reviews
            "⭐️⭐️⭐️⭐️ Good experience overall. Sarah was helpful and responsive. The property matched the description. Would recommend.",
            "⭐️⭐️⭐️⭐️ Michael did a good job finding me a property. Process was smooth but took a bit longer than expected. Still satisfied.",
            "⭐️⭐️⭐️⭐️ Grace knows her stuff! The property was exactly as described. Communication was good throughout.",
            "⭐️⭐️⭐️⭐️ James helped me find a rental property quickly. Good service, though I wish there were more options in my budget.",
        ],
        3: [  # 3-star reviews
            "⭐⭐⭐ Decent experience. Sarah was professional but I felt the process could have been faster. Property was okay.",
            "⭐⭐⭐ Michael was friendly but there were some communication gaps. The property was as advertised though.",
            "⭐⭐⭐ Average experience. Grace knew her market but the property needed some work before moving in.",
        ]
    }
    
    reviews_created = []
    
    # Create reviews for each agent
    for agent in agents:
        # Each agent gets 5-12 reviews
        num_reviews = random.randint(5, 12)
        users_for_reviews = random.sample(regular_users, min(num_reviews, len(regular_users)))
        
        for user in users_for_reviews:
            # Select rating based on agent's popularity
            if agent.username in ['kampala_properties', 'royal_homes']:
                rating = 5  # Top agents get mostly 5 stars
            elif agent.username in ['uganda_homes', 'metro_realty']:
                rating = random.choices([5, 4, 3], weights=[0.6, 0.3, 0.1])[0]
            else:
                rating = random.choices([5, 4, 3], weights=[0.4, 0.4, 0.2])[0]
            
            comment = random.choice(review_comments.get(rating, review_comments[4]))
            
            # Find a property this agent owns
            agent_properties = [p for p in properties if p.owner == agent]
            if agent_properties:
                property_obj = agent_properties[0]
            else:
                property_obj = random.choice(properties)
            
            # Create review without status field
            review = Review.objects.create(
                user=user,
                agent=agent,
                property=property_obj,
                rating=rating,
                comment=comment,
                created_at=timezone.now() - timedelta(days=random.randint(1, 60))
            )
            reviews_created.append(review)
    
    # Add some specific reviews for variety
    specific_reviews = [
        {
            'user': regular_users[0] if len(regular_users) > 0 else None,
            'agent': agents[0] if len(agents) > 0 else None,
            'rating': 5,
            'comment': "⭐️⭐️⭐️⭐️⭐️ I've worked with several agents in Kampala, but Sarah at Kampala Properties is by far the best! She found me a beautiful 3-bedroom house in Kololo that perfectly matched my needs. The entire process was smooth from viewing to signing. Her knowledge of the market and negotiation skills are excellent. I will definitely use her services again and recommend her to all my friends!",
            'property': properties[0] if len(properties) > 0 else None
        },
        {
            'user': regular_users[1] if len(regular_users) > 1 else None,
            'agent': agents[1] if len(agents) > 1 else None,
            'rating': 5,
            'comment': "⭐️⭐️⭐️⭐️⭐️ Michael made finding a rental property so easy! He listened to what I wanted and showed me properties that actually matched my criteria. He was always on time, professional, and responsive. Within 2 weeks, I found a great apartment in Ntinda. The landlord even reduced the price thanks to Michael's negotiation. Highly recommend!",
            'property': properties[2] if len(properties) > 2 else (properties[0] if properties else None)
        },
        {
            'user': regular_users[2] if len(regular_users) > 2 else None,
            'agent': agents[2] if len(agents) > 2 else None,
            'rating': 4,
            'comment': "⭐️⭐️⭐️⭐️ Grace is very knowledgeable about luxury properties. She showed me several beautiful homes in Muyenga and Naguru. The property we eventually settled on is amazing! The only reason I'm not giving 5 stars is because the process took a bit longer than expected, but that's partly due to the seller. Overall great experience.",
            'property': properties[5] if len(properties) > 5 else (properties[0] if properties else None)
        },
        {
            'user': regular_users[3] if len(regular_users) > 3 else None,
            'agent': agents[4] if len(agents) > 4 else None,
            'rating': 5,
            'comment': "⭐️⭐️⭐️⭐️⭐️ Patricia is incredible! She helped my family find our dream home in Kira. Her patience and understanding of what we needed made all the difference. She showed us over 10 properties and never rushed us. The house we bought is perfect, and we got it at a fair price. Thank you Patricia!",
            'property': properties[3] if len(properties) > 3 else (properties[0] if properties else None)
        },
        {
            'user': regular_users[4] if len(regular_users) > 4 else None,
            'agent': agents[3] if len(agents) > 3 else None,
            'rating': 4,
            'comment': "⭐️⭐️⭐️⭐️ James helped me find a rental apartment in Najjera. He was professional and knowledgeable about the area. The apartment is exactly what I was looking for - modern, secure, and within my budget. Good communication throughout. Would recommend!",
            'property': properties[4] if len(properties) > 4 else (properties[0] if properties else None)
        },
        {
            'user': regular_users[5] if len(regular_users) > 5 else None,
            'agent': agents[5] if len(agents) > 5 else None,
            'rating': 5,
            'comment': "⭐️⭐️⭐️⭐️⭐️ Robert is the land expert! He helped me understand the investment potential of different areas and found me a great plot in a developing area. His advice on land registration and due diligence was invaluable. If you're looking to invest in land, Robert is your guy!",
            'property': properties[9] if len(properties) > 9 else (properties[0] if properties else None)
        },
        {
            'user': regular_users[6] if len(regular_users) > 6 else None,
            'agent': agents[6] if len(agents) > 6 else None,
            'rating': 4,
            'comment': "⭐️⭐️⭐️⭐️ Alice was very helpful in finding me a commercial space for my business. She understood exactly what I needed and showed me several options. The location we settled on is perfect - good visibility and foot traffic. Process was smooth. Would use her services again.",
            'property': properties[8] if len(properties) > 8 else (properties[0] if properties else None)
        },
    ]
    
    for review_data in specific_reviews:
        # Skip if any required data is missing
        if not review_data['user'] or not review_data['agent'] or not review_data['property']:
            continue
            
        # Check if review already exists
        if not Review.objects.filter(user=review_data['user'], agent=review_data['agent']).exists():
            Review.objects.create(
                user=review_data['user'],
                agent=review_data['agent'],
                property=review_data['property'],
                rating=review_data['rating'],
                comment=review_data['comment'],
                created_at=timezone.now() - timedelta(days=random.randint(1, 60))
            )
            reviews_created.append(review_data)
    
    print(f"✓ Created {len(reviews_created)} reviews")
    
    # Display agent ratings
    for agent in agents:
        agent_reviews = Review.objects.filter(agent=agent)
        if agent_reviews.exists():
            avg_rating = sum(r.rating for r in agent_reviews) / agent_reviews.count()
            print(f"  📊 {agent.username}: {avg_rating:.1f}★ ({agent_reviews.count()} reviews)")

def create_follows(regular_users, agents):
    """Create follows"""
    print("\n👥 Creating follows...")
    
    follow_count = 0
    for user in regular_users:
        # Each user follows 2-4 agents
        num_follows = random.randint(2, min(4, len(agents)))
        if num_follows > 0 and len(agents) > 0:
            agents_to_follow = random.sample(agents, num_follows)
            for agent in agents_to_follow:
                Follow.objects.get_or_create(
                    follower=user,
                    following=agent
                )
                follow_count += 1
    
    print(f"✓ Created {follow_count} follows")

def print_summary():
    """Print summary of created data"""
    print("\n" + "="*60)
    print("📊 SAMPLE DATA SUMMARY")
    print("="*60)
    
    print(f"\n👥 Users:")
    print(f"   • Regular users: {User.objects.filter(is_agent=False).count()}")
    print(f"   • Agents: {User.objects.filter(is_agent=True).count()}")
    
    print(f"\n🏠 Properties:")
    print(f"   • Total: {Property.objects.count()}")
    print(f"   • For Rent: {Property.objects.filter(transaction_type='rent').count()}")
    print(f"   • For Sale: {Property.objects.filter(transaction_type='sale').count()}")
    for prop_type in ['house', 'apartment', 'land', 'commercial', 'condo']:
        count = Property.objects.filter(property_type=prop_type).count()
        if count > 0:
            print(f"   • {prop_type.title()}: {count}")
    
    print(f"\n📅 Bookings: {Booking.objects.count()}")
    print(f"💰 Payments: {Payment.objects.count()}")
    print(f"⭐ Favorites: {Favorite.objects.count()}")
    print(f"❤️ Likes: {PropertyLike.objects.count()}")
    print(f"👁️ Views: {PropertyView.objects.count()}")
    print(f"📝 Reviews: {Review.objects.count()}")
    print(f"👥 Follows: {Follow.objects.count()}")
    
    print("\n⭐ Top Rated Agents:")
    for agent in User.objects.filter(is_agent=True):
        # Get all reviews for this agent (no status filter since status doesn't exist)
        reviews = Review.objects.filter(agent=agent)
        if reviews.exists():
            avg = sum(r.rating for r in reviews) / reviews.count()
            print(f"   • {agent.username}: {avg:.1f}★ ({reviews.count()} reviews)")
        else:
            print(f"   • {agent.username}: No reviews yet")
    
    print("\n🏠 Most Popular Properties (by views):")
    for prop in Property.objects.all().order_by('-views_count')[:5]:
        print(f"   • {prop.title[:40]}: {prop.views_count} views, {prop.likes_count} likes")
    
    print("\n📍 Properties by Location:")
    locations = Property.objects.values('city', 'district').distinct()
    for loc in locations:
        count = Property.objects.filter(city=loc['city']).count()
        print(f"   • {loc['city']} ({loc['district']}): {count} properties")
        
def main():
    """Main function to load all sample data"""
    print("\n" + "="*60)
    print("🏢 UGANDA PROPERTY APP - SAMPLE DATA LOADER")
    print("="*60)
    
    try:
        # Clear existing data
        clear_all_data()
        
        # Create all sample data
        regular_users, agents = create_users()
        properties = create_properties(agents)
        create_property_views(properties, regular_users)
        create_property_likes(properties, regular_users)
        bookings = create_bookings(properties, regular_users)
        create_payments(properties, regular_users, bookings)
        create_favorites(properties, regular_users)
        create_reviews(regular_users, agents, properties)
        create_follows(regular_users, agents)
        
        # Print summary
        print_summary()
        
        print("\n" + "="*60)
        print("✅ SAMPLE DATA LOADED SUCCESSFULLY!")
        print("="*60)
        print("\n🔗 Access your data at:")
        print("   • Admin Panel: http://localhost:8000/admin")
        print("   • Properties API: http://localhost:8000/api/properties/")
        print("   • Users API: http://localhost:8000/api/users/")
        print("\n👤 Login credentials:")
        print("   • Superuser: created earlier")
        print("   • Regular user: john_doe / password123")
        print("   • Agent: kampala_properties / password123")
        
    except Exception as e:
        print(f"\n❌ Error loading sample data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()