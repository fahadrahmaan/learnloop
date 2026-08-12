# LearnLoop — Project Documentation

## 1. Project Overview

LearnLoop is a full-stack learning management and study-tracking application.

The application allows users to define recurring learning habits, record actual study sessions, and view analytics describing their learning activity and progress.

The project uses a React/Vite frontend and a Django backend with SQLite.

## 2. Architecture

LearnLoop follows a frontend/backend architecture.

```text
React + Vite
     |
     | HTTP requests
     v
Django Backend
     |
     v
SQLite Database
```

The React frontend is responsible for:

- User interface
- Forms
- Dashboard
- Habit management
- Study-session management
- Timeline and analytics presentation

The Django backend is responsible for:

- Authentication
- Data validation
- Database operations
- Habit and study-session logic
- Analytics calculations
- User data isolation

## 3. Database Models

### Habit

The Habit model represents a recurring learning goal.

Main fields:

- `user` — Django User associated with the habit
- `topic` — learning topic
- `subject` — subject category
- `frequency` — daily or weekly
- `estimated_time` — target duration in minutes
- `start_date` — date from which the habit begins
- `created_at` — creation timestamp
- `updated_at` — last modification timestamp

Each habit belongs to one user.

### StudySession

The StudySession model represents an actual learning session.

Main fields:

- `user` — Django User associated with the session
- `habit` — optional linked Habit
- `topic` — topic studied
- `subject` — subject category
- `duration` — actual study duration in minutes
- `notes` — optional notes
- `studied_at` — date and time of the session
- `created_at` — creation timestamp

A study session can exist without a linked habit.

The relationship to a habit uses `SET_NULL`, so deleting a habit does not delete its existing study sessions.

## 4. Authentication

LearnLoop uses Django's built-in authentication system.

Users can:

- Register
- Log in
- Log out
- Access authenticated application data

Backend views check whether the request user is authenticated before returning protected data.

User-specific queries are filtered using the authenticated Django user.

This prevents users from accessing another user's habits or study sessions.

## 5. Habit Logic

A habit contains a target study duration and recurrence frequency.

### Daily Habit

A daily habit expects the target duration to be completed each day from its start date through the current date.

Example:

```text
Habit:
Coding
Daily
60 minutes
```

If the user studies:

```text
30 minutes + 30 minutes
```

on the same day, the daily requirement is considered completed.

### Weekly Habit

A weekly habit uses its target duration for each seven-day period beginning from the habit's start-date cycle.

Study sessions linked to the habit are aggregated within the relevant week.

## 6. Study Session Logic

Study sessions store duration directly in minutes.

For example:

```text
30
```

represents exactly 30 minutes.

Sessions can optionally be associated with a habit.

When a habit is selected while creating a study session, the application can use the habit's topic and subject as convenient defaults.

The backend validates that a linked habit belongs to the authenticated user.

Future study sessions are rejected.

## 7. Analytics

The dashboard analytics are calculated from valid study sessions and active habits belonging to the authenticated user.

### Total Study Time

Total duration is calculated from valid study sessions.

Future sessions are excluded.

### Current Streak

The current streak is based on consecutive calendar dates containing valid study activity.

The calculation considers today, yesterday, and consecutive previous study dates.

Future sessions are excluded.

### Best Study Day

Study durations are grouped by day of the week.

The weekday with the highest accumulated study duration is shown as the best study day.

### Best Study Time

Study durations are grouped by the hour in which sessions occurred.

The hour with the highest accumulated study duration is shown as the best study time.

### Overall Habit Completion

Overall Habit Completion represents the percentage of expected habit periods that have been fully completed.

For a daily habit, a period is completed when the total linked study duration for that day reaches the habit's estimated target.

For a weekly habit, the equivalent calculation is performed for the relevant weekly period.

The calculation is:

```text
completed periods / expected periods × 100
```

The result is capped at 100%.

## 8. Topic Progress

Topic Progress is separate from Overall Habit Completion.

It represents progress toward the current target of each active habit.

For a daily habit:

```text
today's linked study minutes
/
habit target minutes
× 100
```

For a weekly habit:

```text
current week's linked study minutes
/
habit target minutes
× 100
```

The result is capped at 100%.

Example:

```text
Target: 240 minutes
Studied: 60 minutes

Progress = 60 / 240 × 100
         = 25%
```

Each habit is tracked independently using its habit ID.

Unlinked study sessions do not create Topic Progress entries.

## 9. Weekly and Monthly Activity

The dashboard provides study activity for:

- The previous seven days including today
- Each day of the current month up to today

Study duration is aggregated by calendar date.

Future sessions are excluded.

## 10. Retention / Review Estimate

LearnLoop provides a simple retention estimate for studied topics.

The calculation considers:

- The most recent study date for the topic
- The number of sessions recorded for the topic

The score decreases as more time passes since the latest study and receives a small bonus based on repeated study sessions.

The result is limited to a range of 0–100%.

This feature is intended as a simple review/retention indicator and is not presented as a scientifically validated memory model.

## 11. Timezone Handling

The application uses:

```text
Asia/Kolkata
```

as the configured timezone.

Study-session dates are converted using Django timezone-aware datetime handling before calendar-based analytics are calculated.

This helps ensure that sessions are grouped according to the application's configured local timezone.

## 12. Frontend Components

The React frontend contains components responsible for the main application areas.

Examples include:

- Authentication
- Dashboard
- Habits
- Study Sessions
- Timeline

The dashboard consumes analytics returned by the Django backend and renders the corresponding metrics and visualizations.

## 13. Admin Interface

The Django admin interface registers:

- Habit
- StudySession

The admin configuration provides:

- List displays
- Filtering
- Search functionality

This makes it easier to inspect application data during development.

## 14. Security and Data Isolation

The backend applies user-level filtering to protected resources.

For example:

```python
Habit.objects.filter(user=request.user)
```

and:

```python
StudySession.objects.filter(user=request.user)
```

Linked habits are also validated against the authenticated user before a study session is created.

This prevents users from linking sessions to another user's habits.

## 15. Validation

The project was validated using:

```powershell
python manage.py check
```

The Django system check completed without issues.

The React frontend was validated using:

```powershell
npm run build
```

The production Vite build completed successfully.

## 16. Development Workflow

The project uses Git and GitHub for version control.

Development changes were implemented incrementally, with milestones pushed to the main branch.

The final repository contains the source code, migrations, backend dependency file, and project documentation.

## 17. Current Scope

The completed application focuses on:

- Learning habits
- Study sessions
- Authentication
- Progress tracking
- Analytics
- Retention estimates
- Study timeline

Optional extensions such as AI recommendations, flashcards, PDF export, bookmarks, and production deployment are outside the current implementation scope.