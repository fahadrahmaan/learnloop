import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST, require_GET
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import IntegrityError

@require_POST
def register_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and password are required.'}, status=400)
            
        # Create user (using email as username)
        try:
            user = User.objects.create_user(username=email, email=email, password=password)
            return JsonResponse({'success': True, 'message': 'Registration successful.'}, status=201)
        except IntegrityError:
            return JsonResponse({'error': 'A user with that email already exists.'}, status=400)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

@require_POST
def login_view(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and password are required.'}, status=400)
            
        user = authenticate(request, username=email, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({
                'success': True, 
                'user': {
                    'id': user.id,
                    'email': user.email
                }
            })
        else:
            return JsonResponse({'error': 'Invalid credentials.'}, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)
    except Exception as e:
        return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

@require_POST
def logout_view(request):
    logout(request)
    return JsonResponse({'success': True})

@require_GET
@ensure_csrf_cookie
def me_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'email': request.user.email
            }
        })
    else:
        return JsonResponse({'authenticated': False}, status=401)
