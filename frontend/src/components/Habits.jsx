import React, { useState, useEffect } from 'react';

const SUBJECT_CHOICES = [
  { value: 'programming', label: 'Programming' },
  { value: 'language', label: 'Language' },
  { value: 'design', label: 'Design' },
  { value: 'soft_skills', label: 'Soft Skills' }
];

const FREQUENCY_CHOICES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

function Habits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [currentHabitId, setCurrentHabitId] = useState(null);
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(SUBJECT_CHOICES[0].value);
  const [frequency, setFrequency] = useState(FREQUENCY_CHOICES[0].value);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const getCsrfToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
  };

  const fetchHabits = async () => {
    try {
      const res = await fetch('/api/habits/');
      const data = await res.json();
      if (res.ok) {
        setHabits(data.habits);
      } else {
        setError(data.error || 'Failed to fetch habits');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const resetForm = () => {
    setTopic('');
    setSubject(SUBJECT_CHOICES[0].value);
    setFrequency(FREQUENCY_CHOICES[0].value);
    setEstimatedTime('');
    setStartDate('');
    setIsEditing(false);
    setCurrentHabitId(null);
    setFormError('');
    setFormSuccess('');
  };

  const startEdit = (habit) => {
    setTopic(habit.topic);
    setSubject(habit.subject);
    setFrequency(habit.frequency);
    setEstimatedTime(habit.estimated_time);
    setStartDate(habit.start_date);
    setIsEditing(true);
    setCurrentHabitId(habit.id);
    setFormError('');
    setFormSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    
    try {
      const res = await fetch(`/api/habits/${id}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });
      if (res.ok) {
        setHabits(habits.filter(h => h.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete habit');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!topic || !subject || !frequency || !estimatedTime || !startDate) {
      setFormError('All fields are required.');
      return;
    }

    if (parseInt(estimatedTime) <= 0) {
      setFormError('Estimated time must be positive.');
      return;
    }

    const payload = {
      topic,
      subject,
      frequency,
      estimated_time: parseInt(estimatedTime),
      start_date: startDate
    };

    const url = isEditing ? `/api/habits/${currentHabitId}/` : '/api/habits/';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setFormSuccess(isEditing ? 'Habit updated!' : 'Habit created!');
        if (isEditing) {
          setHabits(habits.map(h => h.id === currentHabitId ? data.habit : h));
        } else {
          setHabits([...habits, data.habit]);
        }
        setTimeout(() => resetForm(), 2000);
      } else {
        setFormError(data.error || 'Failed to save habit');
      }
    } catch (err) {
      setFormError('Network error');
    }
  };

  if (loading) return <div>Loading habits...</div>;

  const formatSubject = (subject) => {
    if (!subject) return '';
    return subject.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="module-container">
      <div className="form-panel">
        <h3>{isEditing ? 'Edit Habit' : 'Create New Habit'}</h3>
        {formError && <div className="error-message">{formError}</div>}
        {formSuccess && <div className="success-message">{formSuccess}</div>}
        
        <form onSubmit={handleSubmit} className="data-form">
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
            <label>Frequency</label>
            <select value={frequency} onChange={e => setFrequency(e.target.value)}>
              {FREQUENCY_CHOICES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          
          <div className="form-group">
            <label>Estimated Time (mins)</label>
            <input type="number" min="1" value={estimatedTime} onChange={e => setEstimatedTime(e.target.value)} required />
          </div>
          
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
          </div>
          
          <div className="button-group">
            <button type="submit">{isEditing ? 'Update' : 'Create'}</button>
            {isEditing && <button type="button" className="cancel-button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="list-panel">
        <h3>Your Habits</h3>
        {error && <div className="error-message">{error}</div>}
        {habits.length === 0 ? (
          <p>No habits found. Create one!</p>
        ) : (
          <div className="card-grid">
            {habits.map(habit => (
              <div key={habit.id} className="data-card">
                <h4>{habit.topic}</h4>
                <div className="card-details">
                  <p><strong>Subject:</strong> {formatSubject(habit.subject)}</p>
                  <p><strong>Frequency:</strong> {habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}</p>
                  <p><strong>Time:</strong> {habit.estimated_time}m</p>
                  <p><strong>Start:</strong> {habit.start_date}</p>
                </div>
                <div className="card-actions">
                  <button onClick={() => startEdit(habit)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(habit.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Habits;
