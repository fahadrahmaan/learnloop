import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, sessionsRes] = await Promise.all([
        fetch('/api/analytics/'),
        fetch('/api/study-sessions/')
      ]);
      const analyticsResult = await analyticsRes.json();
      const sessionsResult = await sessionsRes.json();
      if (analyticsRes.ok && sessionsRes.ok) {
        setData(analyticsResult);
        setSessions(sessionsResult.study_sessions || []);
      } else {
        setError(analyticsResult.error || sessionsResult.error || 'Failed to load data.');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!data) return <div>No data available.</div>;

  // Find max minutes to scale bars
  const maxWeeklyMinutes = Math.max(...data.weekly_activity.map(d => d.minutes), 1); // min 1 to avoid div by 0

  const formatStudyTime = (minutes) => {
    if (!minutes) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
  };

  const groupSessionsByDate = () => {
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    sessions.forEach(session => {
      const d = new Date(session.studied_at);
      const sessionDate = new Date(d);
      sessionDate.setHours(0, 0, 0, 0);
      
      let label = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
      if (sessionDate.getTime() === today.getTime()) {
        label = 'Today';
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        label = 'Yesterday';
      }

      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(session);
    });

    return grouped;
  };

  return (
    <div className="dashboard-wrapper">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Study Time</h4>
          <div className="stat-value">{formatStudyTime(data.total_study_minutes)}</div>
        </div>
        <div className="stat-card">
          <h4>Current Streak</h4>
          <div className="stat-value">{data.current_streak} {data.current_streak === 1 ? 'day' : 'days'}</div>
        </div>
        <div className="stat-card">
          <h4>Best Study Times</h4>
          <div style={{ marginTop: '15px', fontSize: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Day:</span>
              <strong>{data.best_study_day}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Time:</span>
              <strong>{data.best_study_time}</strong>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <h4>Completion</h4>
          <div className="stat-value">{data.completion_percentage}%</div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${data.completion_percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-panel">
          <h3>Weekly Activity (Last 7 Days)</h3>
          <div className="bar-chart">
            {data.weekly_activity.map((day, idx) => {
              const heightPercent = (day.minutes / maxWeeklyMinutes) * 100;
              const dateObj = new Date(day.date);
              const label = dateObj.toLocaleDateString(undefined, { weekday: 'short' });

              return (
                <div key={idx} className="bar-column">
                  <div className="bar-value">{day.minutes}m</div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ height: `${heightPercent}%` }}></div>
                  </div>
                  <div className="bar-label">{label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-panel">
          <h3>Monthly Activity</h3>
          <div className="calendar-heatmap">
            {data.monthly_activity.map((day, idx) => {
              // Simple intensity logic
              let intensity = 0;
              if (day.minutes > 0 && day.minutes < 30) intensity = 1;
              else if (day.minutes >= 30 && day.minutes < 60) intensity = 2;
              else if (day.minutes >= 60) intensity = 3;

              const dateObj = new Date(day.date);
              return (
                <div
                  key={idx}
                  className={`heatmap-cell intensity-${intensity}`}
                  title={`${dateObj.toLocaleDateString()}: ${day.minutes} mins`}
                >
                  {dateObj.getDate()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="chart-panel" style={{ marginTop: '20px' }}>
        <h3>Retention / Review</h3>
        {(!data.retention || data.retention.length === 0) ? (
          <p>No retention data available.</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '15px' }}>
            {data.retention.map((r, idx) => (
              <div key={idx} className="stat-card" style={{ margin: 0 }}>
                <h4>{r.topic}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 0' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{r.score}%</span>
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>
                    {r.days_since_study === 0 ? 'Studied today' : `Studied ${r.days_since_study} day${r.days_since_study === 1 ? '' : 's'} ago`}
                  </span>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${r.score}%`,
                      backgroundColor: r.score >= 80 ? '#4CAF50' : r.score >= 50 ? '#FFC107' : '#F44336'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chart-panel" style={{ marginTop: '20px' }}>
        <h3>Study Timeline</h3>
        {sessions.length === 0 ? (
          <p>No study sessions yet.</p>
        ) : (
          <div className="timeline-container" style={{ marginTop: '15px' }}>
            {Object.entries(groupSessionsByDate()).map(([dateLabel, dateSessions]) => (
              <div key={dateLabel} className="timeline-group" style={{ marginBottom: '20px' }}>
                <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px', marginBottom: '10px' }}>{dateLabel}</h4>
                <div style={{ paddingLeft: '15px', borderLeft: '2px solid #ddd' }}>
                  {dateSessions.map(session => {
                    const timeLabel = new Date(session.studied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={session.id} className="timeline-item" style={{ position: 'relative', marginBottom: '15px' }}>
                        <div style={{
                          position: 'absolute',
                          left: '-21px',
                          top: '5px',
                          width: '10px',
                          height: '10px',
                          backgroundColor: '#4CAF50',
                          borderRadius: '50%'
                        }}></div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
                          <h5 style={{ margin: '0 0 5px 0' }}>{session.topic}</h5>
                          <div style={{ fontSize: '0.9rem', color: '#555' }}>
                            <div><strong>Subject:</strong> {session.subject}</div>
                            <div><strong>Duration:</strong> {session.duration} min</div>
                            <div><strong>Time:</strong> {timeLabel}</div>
                            {session.notes && <div><strong>Notes:</strong> {session.notes}</div>}
                            {session.habit_id && <div style={{ color: '#4CAF50', marginTop: '5px' }}>✓ Linked to habit</div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
