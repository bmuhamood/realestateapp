from rest_framework import serializers
from .models import Booking, BookingHistory
from properties.serializers import PropertySerializer
from users.serializers import UserSerializer


class BookingStatusSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'status', 'status_display', 'updated_at']
        read_only_fields = ['id', 'status_display', 'updated_at']

    def validate_status(self, value):
        valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed']
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f'Invalid status. Must be one of: {valid_statuses}'
            )
        return value

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if representation.get('id'):
            representation['id'] = str(representation['id'])
        return representation


class BookingSerializer(serializers.ModelSerializer):
    property_detail = serializers.SerializerMethodField()
    user_detail = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    visit_date_formatted = serializers.SerializerMethodField()  # ✅ Add this

    class Meta:
        model = Booking
        fields = [
            'id',
            'user',
            'property_detail',
            'user_detail',
            'visit_date',
            'visit_date_formatted',  # ✅ Now properly defined
            'message',
            'status',
            'status_display',
            'booking_fee',
            'created_at',
            'updated_at',
            'confirmed_at',
            'cancelled_at',
            'completed_at',
            'cancellation_reason',
        ]
        read_only_fields = (
            'id', 'user', 'status', 'booking_fee',
            'created_at', 'updated_at',
        )

    def get_visit_date_formatted(self, obj):
        """Format the visit date for display"""
        if obj.visit_date:
            return obj.visit_date.strftime('%B %d, %Y at %I:%M %p')
        return None

    def get_property_detail(self, obj):
        try:
            prop = obj.property_obj
            if prop is None:
                return None
            return PropertySerializer(prop, context=self.context).data
        except Exception:
            return None

    def get_user_detail(self, obj):
        try:
            user = obj.user
            if user is None:
                return None
            return UserSerializer(user, context=self.context).data
        except Exception:
            return None

    def validate_visit_date(self, value):
        from django.utils import timezone
        if value <= timezone.now():
            raise serializers.ValidationError("Visit date must be in the future")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        return super().create(validated_data)

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Stringify the UUID id
        if representation.get('id'):
            representation['id'] = str(representation['id'])

        # Expose the property UUID as string under 'property'
        try:
            if instance.property_obj_id:
                representation['property'] = str(instance.property_obj_id)
            elif instance.property_obj:
                representation['property'] = str(instance.property_obj.id)
        except Exception:
            representation['property'] = None

        return representation


class BookingHistorySerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = BookingHistory
        fields = (
            'id', 'booking', 'action', 'action_display',
            'old_status', 'new_status', 'changed_by', 'changed_by_name',
            'notes', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_changed_by_name(self, obj):
        try:
            if obj.changed_by:
                full = f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip()
                return full or obj.changed_by.username
        except Exception:
            pass
        return None

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if representation.get('id'):
            representation['id'] = str(representation['id'])
        if representation.get('booking'):
            representation['booking'] = str(representation['booking'])
        return representation