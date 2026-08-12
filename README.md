# LearnLoop

LearnLoop is a full-stack learning and study-tracking application designed to help users build consistent learning habits, record study sessions, and understand their learning progress through analytics.

## Features

### Authentication

- User registration
- User login
- User logout
- Session-based authentication
- User-specific data isolation

### Learning Habits

Users can create and manage learning habits with:

- Topic
- Subject
- Daily or weekly frequency
- Estimated study time
- Start date
- Edit and delete functionality

### Study Sessions

Users can log actual study sessions with:

- Optional linked habit
- Topic
- Subject
- Duration in minutes
- Date and time
- Optional notes
- Delete functionality

Study sessions can also exist independently of a habit.

Future study sessions are rejected by the backend.

### Dashboard & Analytics

The dashboard provides:

- Total study time
- Current study streak
- Overall habit completion rate
- Best study day
- Best study time
- Weekly activity
- Monthly activity
- Topic progress
- Retention / review estimate
- Study timeline

### Topic Progress

Topic Progress shows progress toward the current target of each active habit.

For example, for a 240-minute daily target:

- 60 minutes studied → 25%
- 120 minutes studied → 50%
- 240 or more minutes studied → 100%

Progress is calculated independently for each habit.

### Retention / Review

LearnLoop provides a simple retention estimate based on:

- How recently a topic was studied
- The number of study sessions for that topic

This is a simple review indicator and is not intended to represent a scientifically validated memory model.

## Tech Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Backend

- Python
- Django

### Database

- SQLite

### Development Tools

- Git
- GitHub
- VS Code
- npm

## Project Structure

```text
learnloop/
├── README.md
├── PROJECT_DOCUMENTATION.md
├── .gitignore
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py
│   │   └── wsgi.py
│   └── learnloop/
│       ├── models.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       └── migrations/
│
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── components/
        ├── App.jsx
        └── index.css
```

## Requirements

- Python 3.11+
- Node.js and npm
- Git

## Backend Setup

Open a terminal in the project root:

```powershell
cd backend
```

Create a virtual environment if one does not already exist:

```powershell
python -m venv venv
```

Activate it on Windows:

```powershell
.\venv\Scripts\activate
```

Install the backend dependencies:

```powershell
pip install -r requirements.txt
```

Run database migrations:

```powershell
python manage.py migrate
```

Start the Django development server:

```powershell
python manage.py runserver
```

The backend normally runs at:

```text
http://127.0.0.1:8000/
```

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
```

Install the frontend dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173/
```

## Running the Application

LearnLoop currently uses separate development servers for the frontend and backend.

### Terminal 1 — Django

```powershell
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

### Terminal 2 — React/Vite

```powershell
cd frontend
npm run dev
```

Open the frontend URL shown by Vite.

## Database

The application currently uses SQLite for development.

Django migrations are included in the repository. Recreate the database schema with:

```powershell
python manage.py migrate
```

## Environment Variables

The current local development version does not require additional environment variables.

For production deployment, sensitive configuration such as Django's secret key and database credentials should be stored using environment variables rather than committed to the repository.

## API

The Django backend provides endpoints for:

- Authentication
- Habits
- Study sessions
- Analytics

The React frontend communicates with these endpoints to create, retrieve, update, and delete learning data and to retrieve dashboard analytics.

## Validation

Backend:

```powershell
python manage.py check
```

Frontend:

```powershell
npm run build
```

Both checks were successfully completed during development.

## Future Improvements

Possible future enhancements include:

- AI-powered learning recommendations
- AI-generated flashcards
- Spaced-repetition scheduling
- PDF progress reports
- Learning-resource bookmarks
- Production deployment

## Author

Fahad Rahman