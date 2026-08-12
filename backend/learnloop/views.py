import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import IntegrityError
from .models import Habit, StudySession, SubjectChoices
import datetime

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

# Helper function to serialize a habit
def serialize_habit(habit):
    return {
        'id': habit.id,
        'topic': habit.topic,
        'subject': habit.subject,
        'frequency': habit.frequency,
        'estimated_time': habit.estimated_time,
        'start_date': str(habit.start_date),
        'created_at': str(habit.created_at),
    }

# Helper function to serialize a study session
def serialize_study_session(session):
    return {
        'id': session.id,
        'habit_id': session.habit.id if session.habit else None,
        'topic': session.topic,
        'subject': session.subject,
        'duration': session.duration,
        'notes': session.notes,
        'studied_at': str(session.studied_at),
        'created_at': str(session.created_at),
    }

@require_http_methods(["GET", "POST"])
def habits_list_create_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == "GET":
        habits = Habit.objects.filter(user=request.user)
        return JsonResponse({'success': True, 'habits': [serialize_habit(h) for h in habits]})

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            topic = data.get('topic')
            subject = data.get('subject')
            frequency = data.get('frequency')
            estimated_time = data.get('estimated_time')
            start_date = data.get('start_date')

            if not all([topic, subject, frequency, estimated_time, start_date]):
                return JsonResponse({'error': 'All fields are required.'}, status=400)
            
            if subject not in [choice[0] for choice in SubjectChoices.choices]:
                return JsonResponse({'error': 'Invalid subject.'}, status=400)
                
            if frequency not in [choice[0] for choice in Habit.FrequencyChoices.choices]:
                return JsonResponse({'error': 'Invalid frequency.'}, status=400)
                
            try:
                estimated_time = int(estimated_time)
                if estimated_time <= 0:
                    return JsonResponse({'error': 'Estimated time must be positive.'}, status=400)
            except ValueError:
                return JsonResponse({'error': 'Estimated time must be a number.'}, status=400)
                
            # Basic start_date validation
            try:
                datetime.datetime.strptime(start_date, '%Y-%m-%d')
            except ValueError:
                return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)

            habit = Habit.objects.create(
                user=request.user,
                topic=topic,
                subject=subject,
                frequency=frequency,
                estimated_time=estimated_time,
                start_date=start_date
            )
            return JsonResponse({'success': True, 'habit': serialize_habit(habit)}, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

@require_http_methods(["GET", "PUT", "DELETE"])
def habit_detail_view(request, habit_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        habit = Habit.objects.get(id=habit_id, user=request.user)
    except Habit.DoesNotExist:
        return JsonResponse({'error': 'Habit not found.'}, status=404)

    if request.method == "GET":
        return JsonResponse({'success': True, 'habit': serialize_habit(habit)})

    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            # Only update provided fields
            if 'topic' in data: habit.topic = data['topic']
            
            if 'subject' in data:
                if data['subject'] not in [c[0] for c in SubjectChoices.choices]:
                    return JsonResponse({'error': 'Invalid subject.'}, status=400)
                habit.subject = data['subject']
                
            if 'frequency' in data:
                if data['frequency'] not in [c[0] for c in Habit.FrequencyChoices.choices]:
                    return JsonResponse({'error': 'Invalid frequency.'}, status=400)
                habit.frequency = data['frequency']
                
            if 'estimated_time' in data:
                try:
                    et = int(data['estimated_time'])
                    if et <= 0: return JsonResponse({'error': 'Estimated time must be positive.'}, status=400)
                    habit.estimated_time = et
                except ValueError:
                    return JsonResponse({'error': 'Estimated time must be a number.'}, status=400)
                    
            if 'start_date' in data:
                try:
                    datetime.datetime.strptime(data['start_date'], '%Y-%m-%d')
                    habit.start_date = data['start_date']
                except ValueError:
                    return JsonResponse({'error': 'Invalid date format. Use YYYY-MM-DD.'}, status=400)
                    
            habit.save()
            return JsonResponse({'success': True, 'habit': serialize_habit(habit)})
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'An unexpected error occurred.'}, status=500)

    elif request.method == "DELETE":
        habit.delete()
        return JsonResponse({'success': True})

@require_http_methods(["GET", "POST"])
def study_sessions_list_create_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    if request.method == "GET":
        sessions = StudySession.objects.filter(user=request.user).order_by('-studied_at')
        return JsonResponse({'success': True, 'study_sessions': [serialize_study_session(s) for s in sessions]})

    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            habit_id = data.get('habit')
            topic = data.get('topic')
            subject = data.get('subject')
            duration = data.get('duration')
            notes = data.get('notes', '')
            studied_at = data.get('studied_at')

            if not all([topic, subject, duration, studied_at]):
                return JsonResponse({'error': 'Topic, subject, duration, and studied_at are required.'}, status=400)

            if subject not in [choice[0] for choice in SubjectChoices.choices]:
                return JsonResponse({'error': 'Invalid subject.'}, status=400)
                
            try:
                duration = int(duration)
                if duration <= 0:
                    return JsonResponse({'error': 'Duration must be positive.'}, status=400)
            except ValueError:
                return JsonResponse({'error': 'Duration must be a number.'}, status=400)

            habit_obj = None
            if habit_id:
                try:
                    # Isolate by checking if the habit belongs to the current user
                    habit_obj = Habit.objects.get(id=habit_id, user=request.user)
                except Habit.DoesNotExist:
                    return JsonResponse({'error': 'Habit not found or does not belong to you.'}, status=400)

            session = StudySession.objects.create(
                user=request.user,
                habit=habit_obj,
                topic=topic,
                subject=subject,
                duration=duration,
                notes=notes,
                studied_at=studied_at
            )
            return JsonResponse({'success': True, 'study_session': serialize_study_session(session)}, status=201)

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': f'An unexpected error occurred: {str(e)}'}, status=500)

@require_http_methods(["GET", "DELETE"])
def study_session_detail_view(request, session_id):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)

    try:
        session = StudySession.objects.get(id=session_id, user=request.user)
    except StudySession.DoesNotExist:
        return JsonResponse({'error': 'Study session not found.'}, status=404)

    if request.method == "GET":
        return JsonResponse({'success': True, 'study_session': serialize_study_session(session)})

    elif request.method == "DELETE":
        session.delete()
        return JsonResponse({'success': True})
