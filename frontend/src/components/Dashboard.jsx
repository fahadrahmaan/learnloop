import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/');
      const result = await res.json();
      if (res.ok) {
        setData(result);
      } else {
        setError(result.error || 'Failed to load analytics.');
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
    </div>
  );
}

export default Dashboard;
