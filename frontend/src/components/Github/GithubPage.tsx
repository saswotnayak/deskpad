import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../hooks/useSettings';
import './GithubPage.css';

interface ContributionDay {
  date: string;
  level: number;
  count: number;
}

interface GithubData {
  username: string;
  total: number;
  max_count: number;
  longest_streak: number;
  current_streak: number;
  days: ContributionDay[];
}

interface GithubPageProps {
  onOpenSettings: () => void;
}

export function GithubPage({ onOpenSettings }: GithubPageProps) {
  const { settings } = useSettings();
  const username = settings.githubUsername?.trim();

  const [data, setData] = useState<GithubData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);

  const fetchContributions = useCallback(async (user: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/github/contributions/${user}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`GitHub user "${user}" not found. Check spelling in Settings.`);
        }
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to fetch contribution data');
      }
      const result = await response.json();
      setData(result);
      
      // Select the last day by default if available
      if (result.days && result.days.length > 0) {
        setSelectedDay(result.days[result.days.length - 1]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading contributions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (username) {
      fetchContributions(username);
    } else {
      setData(null);
      setError(null);
    }
  }, [username, fetchContributions]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 1. ONBOARDING VIEW (No username set)
  if (!username) {
    // Generate a mock grid to display in low-opacity background for onboarding aesthetic
    const mockCells = Array.from({ length: 140 }).map((_, i) => ({
      id: i,
      level: Math.floor(Math.random() * 5)
    }));

    return (
      <div className="github-page onboarding">
        <div className="github-onboarding-bg">
          {mockCells.map(c => (
            <div 
              key={c.id} 
              className={`mock-cell level-${c.level}`} 
              style={{ opacity: 0.15 }}
            />
          ))}
        </div>
        <div className="github-card onboarding-card fade-in">
          <div className="github-icon-glow">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.5">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </div>
          <h2>GitHub Contributions</h2>
          <p>Display your daily contribution matrix and commit streaks directly on your DeskPad smart display.</p>
          <button className="github-btn" onClick={onOpenSettings}>
            Configure Username
          </button>
        </div>
      </div>
    );
  }

  // 2. LOADING STATE
  if (loading) {
    return (
      <div className="github-page loading">
        <div className="github-header-skeleton">
          <div className="skeleton title-skeleton" />
          <div className="skeleton subtitle-skeleton" />
        </div>
        <div className="github-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="github-card stats-card skeleton-card">
              <div className="skeleton label-skeleton" />
              <div className="skeleton val-skeleton" />
            </div>
          ))}
        </div>
        <div className="github-card grid-card skeleton-grid-card">
          <div className="skeleton grid-skeleton" />
        </div>
      </div>
    );
  }

  // 3. ERROR STATE
  if (error) {
    return (
      <div className="github-page error">
        <div className="github-card error-card fade-in">
          <div className="error-icon">⚠️</div>
          <h2>Unable to load contributions</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button className="github-btn" onClick={() => fetchContributions(username)}>
              Retry
            </button>
            <button className="github-btn secondary" onClick={onOpenSettings}>
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. MAIN DASHBOARD VIEW
  if (!data) return null;

  // Process data for rendering the grid
  const days = data.days;
  const firstDate = days.length > 0 ? new Date(days[0].date) : new Date();
  
  // GitHub grid has 7 rows representing days of the week.
  // Prepend empty cells to align the first day to its actual day of the week.
  // getDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
  const firstDayOfWeek = firstDate.getDay();
  
  const cells: (ContributionDay | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(null);
  }
  days.forEach(d => cells.push(d));

  // Slice into columns of 7 to calculate month headers placement
  const columns: (ContributionDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  // Extract month labels and their column index
  const rawMonthLabels: { label: string; colIndex: number }[] = [];
  let lastMonth = '';
  columns.forEach((col, c) => {
    const day = col.find(d => d !== null);
    if (day) {
      const dateObj = new Date(day.date);
      const monthName = dateObj.toLocaleDateString(undefined, { month: 'short' });
      if (monthName !== lastMonth) {
        rawMonthLabels.push({ label: monthName, colIndex: c });
        lastMonth = monthName;
      }
    }
  });

  // Filter month labels to avoid overlaps when columns are close together (e.g. at the start of the year)
  const monthLabels: { label: string; colIndex: number }[] = [];
  for (let i = 0; i < rawMonthLabels.length; i++) {
    const current = rawMonthLabels[i];
    if (i < rawMonthLabels.length - 1) {
      const next = rawMonthLabels[i + 1];
      if (next.colIndex - current.colIndex < 3) {
        // Skip current label because it's too close to the next one
        continue;
      }
    }
    monthLabels.push(current);
  }

  return (
    <div className="github-page fade-in">
      {/* Profile Header */}
      <div className="github-header">
        <h2 className="github-title">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
          {data.username}
        </h2>
        <p className="github-subtitle">GitHub contributions over the past year</p>
      </div>

      {/* Stats Cards */}
      <div className="github-stats-grid">
        <div className="github-card stats-card">
          <span className="stats-label">Total Contributions</span>
          <span className="stats-value">{data.total.toLocaleString()}</span>
        </div>
        <div className="github-card stats-card highlight">
          <span className="stats-label">Current Streak</span>
          <span className="stats-value">{data.current_streak} {data.current_streak === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="github-card stats-card">
          <span className="stats-label">Longest Streak</span>
          <span className="stats-value">{data.longest_streak} {data.longest_streak === 1 ? 'day' : 'days'}</span>
        </div>
        <div className="github-card stats-card">
          <span className="stats-label">Daily Peak</span>
          <span className="stats-value">{data.max_count} {data.max_count === 1 ? 'commit' : 'commits'}</span>
        </div>
      </div>

      {/* Contribution Calendar Grid Card */}
      <div className="github-card grid-card">
        <div className="github-grid-scroll-wrapper">
          <div className="github-grid-container">
            <div 
              className="github-board-grid"
              style={{
                gridTemplateColumns: `var(--github-label-col-width, 26px) repeat(${columns.length}, var(--github-cell-size, 10px))`,
                gridTemplateRows: `var(--github-header-row-height, 18px) repeat(7, var(--github-cell-size, 10px))`,
                gap: 'var(--github-cell-gap, 3px)'
              }}
            >
              {/* Month Labels row */}
              {monthLabels.map((m, idx) => (
                <span 
                  key={idx} 
                  className="github-month-label"
                  style={{ 
                    gridRow: 1,
                    gridColumn: `${m.colIndex + 2} / span 4` // Offset by 2 (labels are col 1)
                  }}
                >
                  {m.label}
                </span>
              ))}

              {/* Day labels on the Left */}
              <div 
                className="github-day-labels"
                style={{
                  gridColumn: 1,
                  gridRow: '2 / span 7',
                  display: 'grid',
                  gridTemplateRows: 'repeat(7, 1fr)',
                  alignItems: 'center',
                  rowGap: 'var(--github-cell-gap, 3px)'
                }}
              >
                <span></span>
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
              </div>
              
              {/* Contribution cells */}
              {cells.map((cell, idx) => {
                const col = Math.floor(idx / 7) + 2;
                const row = (idx % 7) + 2;

                if (cell === null) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="github-cell empty-placeholder" 
                      style={{ 
                        gridColumn: col, 
                        gridRow: row,
                        width: 'var(--github-cell-size, 10px)',
                        height: 'var(--github-cell-size, 10px)'
                      }}
                    />
                  );
                }
                
                const isSelected = selectedDay && selectedDay.date === cell.date;
                
                return (
                  <button
                    key={cell.date}
                    className={`github-cell level-${cell.level} ${isSelected ? 'selected' : ''}`}
                    style={{ 
                      backgroundColor: `var(--contrib-l${cell.level})`,
                      gridColumn: col,
                      gridRow: row,
                      width: 'var(--github-cell-size, 10px)',
                      height: 'var(--github-cell-size, 10px)'
                    }}
                    onClick={() => setSelectedDay(cell)}
                    onMouseEnter={() => setSelectedDay(cell)}
                    aria-label={`${cell.count} contributions on ${cell.date}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day Status Bar */}
        <div className="github-grid-status">
          {selectedDay ? (
            <span className="status-text fade-in" key={selectedDay.date}>
              <strong>{selectedDay.count} {selectedDay.count === 1 ? 'contribution' : 'contributions'}</strong> on {formatDate(selectedDay.date)}
            </span>
          ) : (
            <span className="status-text placeholder">Tap or hover a cell to view details</span>
          )}
          
          {/* Legend indicator */}
          <div className="github-legend">
            <span>Less</span>
            <div className="legend-cell level-0" style={{ backgroundColor: 'var(--contrib-l0)' }} />
            <div className="legend-cell level-1" style={{ backgroundColor: 'var(--contrib-l1)' }} />
            <div className="legend-cell level-2" style={{ backgroundColor: 'var(--contrib-l2)' }} />
            <div className="legend-cell level-3" style={{ backgroundColor: 'var(--contrib-l3)' }} />
            <div className="legend-cell level-4" style={{ backgroundColor: 'var(--contrib-l4)' }} />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
