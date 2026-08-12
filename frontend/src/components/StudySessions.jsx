import React, { useState, useEffect } from 'react';

const SUBJECT_CHOICES = [
  { value: 'programming', label: 'Programming' },
  { value: 'language', label: 'Language' },
  { value: 'design', label: 'Design' },
  { value: 'soft_skills', label: 'Soft Skills' }
];

function StudySessions() {
  const [sessions, setSessions] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [habitId, setHabitId] = useState('');
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(SUBJECT_CHOICES[0].value);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const getLocalDatetimeLocal = () => {
    const now = new Date();
    // Offset in milliseconds
    const tzOffset = now.getTimezoneOffset() * 60000;
    // Format YYYY-MM-DDThh:mm
    return (new Date(now - tzOffset)).toISOString().slice(0, 16);
  };

  const [studiedAt, setStudiedAt] = useState(getLocalDatetimeLocal());
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const getCsrfToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
  };

  const fetchData = async () => {
    try {
      const [sessRes, habRes] = await Promise.all([
        fetch('/api/study-sessions/'),
        fetch('/api/habits/')
      ]);
      
      const sessData = await sessRes.json();
      const habData = await habRes.json();
      
      if (sessRes.ok && habRes.ok) {
        setSessions(sessData.study_sessions);
        setHabits(habData.habits);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setHabitId('');
    setTopic('');
    setSubject(SUBJECT_CHOICES[0].value);
    setDuration('');
    setNotes('');
    setStudiedAt(getLocalDatetimeLocal());
    setFormError('');
    setFormSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this study session?')) return;
    
    try {
      const res = await fetch(`/api/study-sessions/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete session');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!topic || !subject || !duration || !studiedAt) {
      setFormError('Topic, subject, duration, and date are required.');
      return;
    }

    if (parseInt(duration) <= 0) {
      setFormError('Duration must be positive.');
      return;
    }

    const payload = {
      habit: habitId ? parseInt(habitId) : null,
      topic,
      subject,
      duration: parseInt(duration),
      notes,
      studied_at: studiedAt
    };

    try {
      const res = await fetch('/api/study-sessions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFormSuccess('Study session logged!');
        setSessions([data.study_session, ...sessions]); // Add to top
        setTimeout(() => resetForm(), 2000);
      } else {
        setFormError(data.error || 'Failed to log session');
      }
    } catch (err) {
      setFormError('Network error');
    }
  };

  // When a habit is selected, auto-fill topic and subject if they are empty
  const handleHabitChange = (e) => {
    const selectedId = e.target.value;
    setHabitId(selectedId);
    
    if (selectedId) {
      const selectedHabit = habits.find(h => h.id === parseInt(selectedId));
      if (selectedHabit) {
        if (!topic) setTopic(selectedHabit.topic);
        setSubject(selectedHabit.subject);
      }
    }
  };

  if (loading) return <div>Loading study sessions...</div>;

  return (
    <div className="module-container">
      <div className="form-panel">
        <h3>Log Study Session</h3>
        {formError && <div className="error-message">{formError}</div>}
        {formSuccess && <div className="success-message">{formSuccess}</div>}
        
        <form onSubmit={handleSubmit} className="data-form">
          <div className="form-group">
            <label>Link to Habit (Optional)</label>
            <select value={habitId} onChange={handleHabitChange}>
              <option value="">-- None --</option>
              {habits.map(h => <option key={h.id} value={h.id}>{h.topic}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Topic</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label>Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECT_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>Duration (mins)</label>
            <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Date & Time</label>
            {/* Using datetime-local for simpler native picker */}
            <input type="datetime-local" value={studiedAt} onChange={e => setStudiedAt(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="3"></textarea>
          </div>
          
          <div className="button-group">
            <button type="submit">Log Session</button>
          </div>
        </form>
      </div>

      <div className="list-panel">
        <h3>Study Sessions</h3>
        {error && <div className="error-message">{error}</div>}
        {sessions.length === 0 ? (
          <p>No study sessions logged yet.</p>
        ) : (
          <div className="card-grid">
            {sessions.map(session => {
              const d = new Date(session.studied_at);
              const formattedDate = !isNaN(d.getTime()) ? d.toLocaleString() : session.studied_at;
              return (
                <div key={session.id} className="data-card">
                  <h4>{session.topic}</h4>
                  <div className="card-details">
                    <p><strong>Subject:</strong> {session.subject}</p>
                    <p><strong>Duration:</strong> {session.duration}m</p>
                    <p><strong>Date:</strong> {formattedDate}</p>
                    {session.habit_id && <p><strong>Linked Habit:</strong> Yes</p>}
                    {session.notes && <p className="notes-preview"><strong>Notes:</strong> {session.notes}</p>}
                  </div>
                  <div className="card-actions">
                    <button className="delete-button" onClick={() => handleDelete(session.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudySessions;
