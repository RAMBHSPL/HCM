from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db.models.deletion import ProtectedError
from django.db import IntegrityError, DatabaseError
import re

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # If it's a ProtectedError, DRF doesn't handle it by default, so it's None
    if response is None and isinstance(exc, ProtectedError):
        # Identify what is protecting the object
        protected_objects = exc.protected_objects
        model_names = {obj._meta.verbose_name.title() for obj in protected_objects}
        
        return Response({
            'detail': f"Cannot delete this item because it is referenced by {', '.join(model_names)}.",
            'protected_objects': [str(obj) for obj in protected_objects[:5]] # Show first 5
        }, status=status.HTTP_400_BAD_REQUEST)

    # Catch IntegrityError / DatabaseError (unique constraint violations, FK failures, etc.)
    # These are NOT handled by DRF by default, so they bubble up as 500 HTML pages.
    if response is None and isinstance(exc, (IntegrityError, DatabaseError)):
        msg = str(exc)

        # Detect duplicate/unique constraint
        if 'Duplicate entry' in msg or 'UNIQUE constraint' in msg or 'unique constraint' in msg:
            # Try to extract the field name from the error
            match = re.search(r"Duplicate entry '(.+)' for key '(.+)'", msg)
            if match:
                field_hint = match.group(2).replace('_', ' ').title()
                friendly = f"A record with this {field_hint} already exists. Please use a different name or code."
            else:
                friendly = "A record with these values already exists. Please check for duplicate name or code."
            return Response(
                {'error': 'Duplicate Value', 'details': friendly},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generic DB error — return 400 with safe message (never 500 HTML)
        return Response(
            {'error': 'Database Error', 'details': 'A database error occurred. Please check your input and try again.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    return response
