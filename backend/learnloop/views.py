import json
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.http import require_POST, require_GET, require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import IntegrityError
from django.utils import timezone
from .models import Habit, StudySession, SubjectChoices
import datetime
import calendar

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
                print("DEBUG duration received:", repr(data.get('duration')))
                print("DEBUG duration after int:", duration)
                if duration <= 0:
                    return JsonResponse({'error': 'Duration must be positive.'}, status=400)
            except ValueError:
                return JsonResponse({'error': 'Duration must be a number.'}, status=400)

            from django.utils.dateparse import parse_datetime
            try:
                studied_at_dt = parse_datetime(studied_at)
                if studied_at_dt is None:
                    raise ValueError
                if timezone.is_naive(studied_at_dt):
                    tz = timezone.get_current_timezone()
                    studied_at_dt = timezone.make_aware(studied_at_dt, timezone=tz)
            except (ValueError, TypeError):
                return JsonResponse({'error': 'Invalid date format for studied_at.'}, status=400)

            if studied_at_dt > timezone.now():
                return JsonResponse({'error': 'Study sessions cannot be scheduled for the future.'}, status=400)

            habit_obj = None
            if habit_id:
                try:
                    # Isolate by checking if the habit belongs to the current user
                    habit_obj = Habit.objects.get(id=habit_id, user=request.user)
                    if studied_at_dt.astimezone(timezone.get_current_timezone()).date() < habit_obj.start_date:
                        return JsonResponse({'error': 'Study session cannot precede habit start date.'}, status=400)
                except Habit.DoesNotExist:
                    return JsonResponse({'error': 'Habit not found or does not belong to you.'}, status=400)

            print("DEBUG duration being saved:", duration)
            session = StudySession.objects.create(
                user=request.user,
                habit=habit_obj,
                topic=topic,
                subject=subject,
                duration=duration,
                notes=notes,
                studied_at=studied_at_dt
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

@require_GET
def analytics_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required.'}, status=401)
        
    user_sessions = list(StudySession.objects.filter(user=request.user))
    user_habits = list(Habit.objects.filter(user=request.user))
    
    # Use timezone-aware current date
    tz = timezone.get_current_timezone()
    now = timezone.now().astimezone(tz)
    today = now.date()
    
    valid_sessions = [
        s for s in user_sessions
        if s.studied_at.astimezone(tz) <= now
    ]

    # Total study time
    total_study_minutes = sum(
        s.duration
        for s in valid_sessions
    )
    
    # Process session dates
    session_dates = set()
    for s in valid_sessions:
        s_date = s.studied_at.astimezone(tz).date()
        session_dates.add(s_date)
            
    sorted_dates = sorted(list(session_dates), reverse=True)
    
    # Current streak
    current_streak = 0
    if sorted_dates:
        curr_date = today
        if sorted_dates[0] == today:
            current_streak = 1
            idx = 1
        elif sorted_dates[0] == today - datetime.timedelta(days=1):
            current_streak = 1
            curr_date = today - datetime.timedelta(days=1)
            idx = 1
        else:
            idx = 0
            
        if current_streak > 0:
            for d in sorted_dates[idx:]:
                if d == curr_date - datetime.timedelta(days=1):
                    current_streak += 1
                    curr_date = d
                else:
                    break
                    
    # Best study day
    day_totals = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0} # Mon(0) - Sun(6)
    for s in valid_sessions:
        s_date = s.studied_at.astimezone(tz).date()
        day_totals[s_date.weekday()] += s.duration
            
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    best_study_day = "None yet"
    if total_study_minutes > 0:
        best_day_idx = max(day_totals, key=day_totals.get)
        best_study_day = day_names[best_day_idx]
        
    # Best study time
    from collections import defaultdict
    hour_totals = defaultdict(int)
    for s in valid_sessions:
        s_hour = s.studied_at.astimezone(tz).hour
        hour_totals[s_hour] += s.duration
        
    best_study_time = "None yet"
    study_time_distribution = []
    if hour_totals:
        best_hour = max(hour_totals, key=hour_totals.get)
        best_study_time = f"{best_hour:02d}:00"
        for hour, mins in sorted(hour_totals.items()):
            study_time_distribution.append({"hour": hour, "minutes": mins})
        
    # Completion Percentage
    total_expected = 0
    total_completed = 0
    
    from collections import defaultdict
    topic_progress = []

    for h in user_habits:
        start = h.start_date
        if start > today:
            continue # Habit hasn't started yet
            
        if h.frequency == Habit.FrequencyChoices.DAILY:
            durations_by_date = defaultdict(int)
            for s in valid_sessions:
                if s.habit_id == h.id:
                    s_date = s.studied_at.astimezone(tz).date()
                    if start <= s_date <= today:
                        durations_by_date[s_date] += s.duration
                        
            expected = (today - start).days + 1
            completed = sum(
                1 for d in range(expected)
                if durations_by_date[start + datetime.timedelta(days=d)] >= h.estimated_time
            )
            total_expected += expected
            total_completed += completed
            
        elif h.frequency == Habit.FrequencyChoices.WEEKLY:
            durations_by_week = defaultdict(int)
            for s in valid_sessions:
                if s.habit_id == h.id:
                    s_date = s.studied_at.astimezone(tz).date()
                    if start <= s_date <= today:
                        week_num = (s_date - start).days // 7
                        durations_by_week[week_num] += s.duration
                        
            expected = ((today - start).days // 7) + 1
            completed = sum(
                1 for w in range(expected)
                if durations_by_week[w] >= h.estimated_time
            )
            total_expected += expected
            total_completed += completed
            
        current_minutes = 0
        if h.frequency == Habit.FrequencyChoices.DAILY:
            current_minutes = sum(
                s.duration for s in valid_sessions 
                if s.habit_id == h.id and s.studied_at.astimezone(tz).date() == today
            )
        elif h.frequency == Habit.FrequencyChoices.WEEKLY:
            week_num = (today - start).days // 7
            current_minutes = sum(
                s.duration for s in valid_sessions
                if s.habit_id == h.id and start <= s.studied_at.astimezone(tz).date() <= today and (s.studied_at.astimezone(tz).date() - start).days // 7 == week_num
            )
            
        habit_percentage = 0
        if h.estimated_time > 0:
            habit_percentage = min(100, round((current_minutes / h.estimated_time) * 100))
            
        topic_progress.append({
            "habit_id": h.id,
            "topic": h.topic,
            "subject": h.subject,
            "frequency": h.get_frequency_display().capitalize() if hasattr(h, 'get_frequency_display') else str(h.frequency).capitalize(),
            "estimated_time": h.estimated_time,
            "current_minutes": current_minutes,
            "completion_percentage": habit_percentage
        })
            
    completion_percentage = 0
    if total_expected > 0:
        completion_percentage = min(100, round((total_completed / total_expected) * 100))
        
    # Weekly Activity (Last 7 days including today)
    weekly_activity = []
    for i in range(6, -1, -1):
        d = today - datetime.timedelta(days=i)
        mins = sum(s.duration for s in valid_sessions if s.studied_at.astimezone(tz).date() == d)
        weekly_activity.append({
            "date": str(d),
            "minutes": mins
        })
        
    # Monthly Activity (Days of the current month up to today)
    monthly_activity = []
    for i in range(1, today.day + 1):
        d = today.replace(day=i)
        mins = sum(s.duration for s in valid_sessions if s.studied_at.astimezone(tz).date() == d)
        monthly_activity.append({
            "date": str(d),
            "minutes": mins
        })

    # Retention Estimate
    topic_latest_session = {}
    for s in valid_sessions:
        topic = s.topic
        if topic not in topic_latest_session or s.studied_at.astimezone(tz) > topic_latest_session[topic].astimezone(tz):
            topic_latest_session[topic] = s.studied_at.astimezone(tz)
            
    retention = []
    for topic, latest_dt in topic_latest_session.items():
        days_since = (today - latest_dt.date()).days
        topic_sessions = [s for s in valid_sessions if s.topic == topic]
        num_sessions = len(topic_sessions)
        
        base_score = 100 - (days_since * 10)
        bonus = (num_sessions - 1) * 5
        score = max(0, min(100, base_score + bonus))
        
        retention.append({
            "topic": topic,
            "score": score,
            "days_since_study": days_since
        })
        
    retention.sort(key=lambda x: x["score"])

    return JsonResponse({
        "total_study_minutes": total_study_minutes,
        "current_streak": current_streak,
        "best_study_day": best_study_day,
        "best_study_time": best_study_time,
        "study_time_distribution": study_time_distribution,
        "completion_percentage": completion_percentage,
        "weekly_activity": weekly_activity,
        "monthly_activity": monthly_activity,
        "retention": retention,
        "topic_progress": topic_progress
    })
