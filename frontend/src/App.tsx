import { useState } from 'react';
import { Layout } from './components/Layout/Layout';
import { ClockContainer } from './components/Clock/ClockContainer';
import { DateDisplay } from './components/DateDisplay/DateDisplay';
import { CalendarContainer } from './components/Calendar/CalendarContainer';
import { TabSlider } from './components/Layout/TabSlider';
import { TodoPage } from './components/Todo/TodoPage';
import { SettingsDrawer } from './components/Settings/SettingsDrawer';
import { useTime } from './hooks/useTime';
import { useWakeLock } from './hooks/useWakeLock';
import { useFullscreen } from './hooks/useFullscreen';
import { useSettings } from './hooks/useSettings';

/**
 * DeskPad — Root application component.
 * Composes the clock and calendar widgets and Todoist agenda in a swipeable layout.
 */
export default function App() {
  const time = useTime();
  const { settings } = useSettings();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Prevent tablet from sleeping
  useWakeLock();

  // Auto-enter fullscreen on first touch
  useFullscreen();

  return (
    <div className={`theme-${settings.theme} app-theme-wrapper`} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Global Settings Button */}
      <button
        className="settings-trigger"
        onClick={() => setIsSettingsOpen(true)}
        aria-label="Open settings"
        style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          zIndex: 100
        }}
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Swipeable page views */}
      <TabSlider
        page1={
          <Layout
            clockPanel={
              <>
                <ClockContainer time={time} />
                <DateDisplay date={time.date} />
              </>
            }
            calendarPanel={
              <CalendarContainer />
            }
          />
        }
        page2={<TodoPage />}
      />

      {/* Settings Panel Drawer */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
