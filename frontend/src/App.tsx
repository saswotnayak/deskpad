import { useState } from 'react';
import { Layout } from './components/Layout/Layout';
import { ClockContainer } from './components/Clock/ClockContainer';
import { DateDisplay } from './components/DateDisplay/DateDisplay';
import { CalendarContainer } from './components/Calendar/CalendarContainer';
import { TabSlider } from './components/Layout/TabSlider';
import { TodoPage } from './components/Todo/TodoPage';
import { GithubPage } from './components/Github/GithubPage';
import { SettingsDrawer } from './components/Settings/SettingsDrawer';
import { useTime } from './hooks/useTime';
import { useWakeLock } from './hooks/useWakeLock';
import { useFullscreen } from './hooks/useFullscreen';
import { useSettings } from './hooks/useSettings';
import { useUser } from './hooks/useUser';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './components/Auth/LoginScreen';
import { ProfileSelectScreen } from './components/Auth/ProfileSelectScreen';

/**
 * DeskPad — Root application component.
 * Composes the clock and calendar widgets and Todoist agenda in a swipeable layout.
 */
export default function App() {
  const time = useTime();
  const { settings } = useSettings();
  const { activeUser, loading: userLoading } = useUser();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Prevent tablet from sleeping
  useWakeLock();

  // Auto-enter fullscreen on first touch
  useFullscreen();

  if (authLoading || userLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-spinner" style={{ margin: '0 auto 16px auto', width: '32px', height: '32px' }} />
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>Loading DeskPad...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!activeUser) {
    return <ProfileSelectScreen />;
  }

  return (
    <div className={`theme-${settings.theme} app-theme-wrapper`}>
      {/* Dedicated Top Bar Header */}
      <header className="app-header">
        <div className="app-header__left">
          <span className="app-header__logo">DeskPad</span>
          <span className="app-header__version">v1.0</span>
        </div>
        <div className="app-header__right">
          <button
            className="settings-trigger"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open menu"
            style={{ transform: 'none' }}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Swipeable page views */}
      <TabSlider
        pages={[
          <Layout
            key="dashboard"
            clockPanel={
              <>
                <ClockContainer time={time} />
                <DateDisplay date={time.date} />
              </>
            }
            calendarPanel={
              <CalendarContainer />
            }
          />,
          <TodoPage key="todo" onOpenSettings={() => setIsSettingsOpen(true)} />,
          <GithubPage key="github" onOpenSettings={() => setIsSettingsOpen(true)} />
        ]}
      />

      {/* Settings Panel Drawer */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
