import { useSettings } from '../../hooks/useSettings';
import type { ThemeMode, ClockNumbersMode, TickDensityMode } from '../../types';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSetting } = useSettings();

  if (!isOpen) return null;

  const themes: { name: ThemeMode; label: string }[] = [
    { name: 'deep-space', label: 'Ocean' },
    { name: 'amoled-black', label: 'AMOLED' },
    { name: 'cyberpunk', label: 'Cyberpunk' },
    { name: 'forest-canopy', label: 'Aurora' },
    { name: 'warm-amber', label: 'Sunset' },
  ];

  const isAnalog = settings.clockStyle.includes('analog') || settings.clockStyle === 'chronograph';

  const renderPreview = () => {
    return (
      <div className={`settings-preview-card theme-${settings.theme}`}>
        <div className="preview-layout">
          {/* Mini Clock Panel */}
          <div className="preview-panel preview-panel--clock">
            {isAnalog ? (
              <div className={`preview-clock preview-clock--analog ${settings.clockStyle}`}>
                <div className="preview-clock-face">
                  <div className="preview-clock-hand hour-hand" />
                  <div className="preview-clock-hand minute-hand" />
                  {settings.showSecondsHand && <div className="preview-clock-hand second-hand" />}
                  {settings.clockStyle === 'chronograph' && (
                    <>
                      <div className="preview-subdial top" />
                      <div className="preview-subdial bottom" />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={`preview-clock preview-clock--digital ${settings.clockStyle}`}>
                {settings.clockStyle === 'stacked-digital' ? (
                  <div className="stacked-digits">
                    <div className="digit">10</div>
                    <div className="digit">45</div>
                  </div>
                ) : (
                  <div className="retro-digits">
                    <div className="grid-cell">10:45</div>
                  </div>
                )}
              </div>
            )}
            <div className="preview-date">SAT, MAY 23</div>
          </div>
          {/* Mini Calendar Panel */}
          <div className="preview-panel preview-panel--calendar">
            <div className="preview-calendar-header">
              <div className="preview-line-title" />
              <div className="preview-line-subtitle" />
            </div>
            {settings.calendarStyle === 'month-grid' && (
              <div className="preview-calendar-grid">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className={`preview-grid-cell ${i === 17 ? 'active' : ''}`} />
                ))}
              </div>
            )}
            {settings.calendarStyle === 'weekly-agenda' && (
              <div className="preview-weekly-grid">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`preview-weekly-card ${i === 6 ? 'active' : ''}`} />
                ))}
              </div>
            )}
            {settings.calendarStyle === 'year-overview' && (
              <div className="preview-year-grid">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="preview-year-month" />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="preview-badge">Preview</div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="settings-drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="settings-drawer" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="settings-drawer__header">
          <h2 className="settings-drawer__title">Wallpaper & style</h2>
          <button className="settings-drawer__close" onClick={onClose} aria-label="Close settings">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="settings-drawer__content">
          {/* Section: Live Preview Mockup (Fixed at top) */}
          <div className="settings-drawer__preview-wrap">
            {renderPreview()}
          </div>

          {/* Section: Scrollable Preferences */}
          <div className="settings-drawer__scroll-container">
            {/* Section: Appearance */}
            <div className="settings-drawer__section">
              <h3 className="settings-drawer__section-title">Color Palette</h3>
              
              <div className="settings-group">
                <span className="settings-label">System Colors</span>
                <div className="theme-picker">
                  {themes.map((t) => (
                    <button
                      key={t.name}
                      className={`theme-option ${settings.theme === t.name ? 'theme-option--active' : ''}`}
                      data-theme={t.name}
                      title={t.label}
                      onClick={() => updateSetting('theme', t.name)}
                      aria-label={`Select ${t.label} theme`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Section: Clock Preferences */}
            <div className="settings-drawer__section">
              <h3 className="settings-drawer__section-title">Clock Preferences</h3>

              {/* Time Format (12h/24h) */}
              <div className="settings-group">
                <span className="settings-label">Time Format</span>
                <div className="segmented-control">
                  <button
                    className={`segmented-control__btn ${settings.timeFormat === '12h' ? 'segmented-control__btn--active' : ''}`}
                    onClick={() => updateSetting('timeFormat', '12h')}
                  >
                    12-Hour
                  </button>
                  <button
                    className={`segmented-control__btn ${settings.timeFormat === '24h' ? 'segmented-control__btn--active' : ''}`}
                    onClick={() => updateSetting('timeFormat', '24h')}
                  >
                    24-Hour
                  </button>
                </div>
              </div>

              {isAnalog && (
                <>
                  {/* Clock Numbers */}
                  <div className="settings-group">
                    <span className="settings-label">Face Numbers</span>
                    <div className="segmented-control">
                      {(['none', 'accents', 'all'] as ClockNumbersMode[]).map((numMode) => (
                        <button
                          key={numMode}
                          className={`segmented-control__btn ${settings.clockNumbers === numMode ? 'segmented-control__btn--active' : ''}`}
                          onClick={() => updateSetting('clockNumbers', numMode)}
                        >
                          {numMode === 'none' ? 'None' : numMode === 'accents' ? '12/3/6/9' : 'All'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ticks density */}
                  <div className="settings-group">
                    <span className="settings-label">Tick Marks</span>
                    <div className="segmented-control">
                      {(['all', 'major', 'none'] as TickDensityMode[]).map((tMode) => (
                        <button
                          key={tMode}
                          className={`segmented-control__btn ${settings.tickDensity === tMode ? 'segmented-control__btn--active' : ''}`}
                          onClick={() => updateSetting('tickDensity', tMode)}
                        >
                          {tMode === 'all' ? 'All' : tMode === 'major' ? 'Major' : 'None'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seconds Hand */}
                  <div className="toggle-row">
                    <span className="settings-label">Seconds Hand</span>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.showSecondsHand}
                        onChange={(e) => updateSetting('showSecondsHand', e.target.checked)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </>
              )}
            </div>

            {/* Section: Calendar Preferences */}
            <div className="settings-drawer__section">
              <h3 className="settings-drawer__section-title">Calendar Preferences</h3>

              {/* Week Starts On */}
              <div className="settings-group">
                <span className="settings-label">First Day of Week</span>
                <div className="segmented-control">
                  <button
                    className={`segmented-control__btn ${settings.weekStartsOn === 0 ? 'segmented-control__btn--active' : ''}`}
                    onClick={() => updateSetting('weekStartsOn', 0)}
                  >
                    Sunday
                  </button>
                  <button
                    className={`segmented-control__btn ${settings.weekStartsOn === 1 ? 'segmented-control__btn--active' : ''}`}
                    onClick={() => updateSetting('weekStartsOn', 1)}
                  >
                    Monday
                  </button>
                </div>
              </div>

              {/* Week numbers */}
              <div className="toggle-row">
                <span className="settings-label">Show Week Numbers</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={settings.showWeekNumbers}
                    onChange={(e) => updateSetting('showWeekNumbers', e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
