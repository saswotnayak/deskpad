import { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import type { ThemeMode, ClockNumbersMode, TickDensityMode } from '../../types';
import './SettingsDrawer.css';
import '../Layout/ProfileSwitcher.css'; // Reuse profile list and item styling

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
];

export function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const { settings, updateSetting } = useSettings();
  const { users, activeUser, switchUser, createUser, deleteUser } = useUser();
  const { logout, account } = useAuth();

  const [activeTab, setActiveTab] = useState<'settings' | 'profiles'>('settings');

  // New profile creation state
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileColor, setNewProfileColor] = useState(PRESET_COLORS[0]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (!isOpen) return null;

  const themes: { name: ThemeMode; label: string }[] = [
    { name: 'deep-space', label: 'Ocean' },
    { name: 'amoled-black', label: 'AMOLED' },
    { name: 'cyberpunk', label: 'Cyberpunk' },
    { name: 'forest-canopy', label: 'Aurora' },
    { name: 'warm-amber', label: 'Sunset' },
  ];

  const isAnalog = settings.clockStyle.includes('analog') || settings.clockStyle === 'chronograph';

  const getInitial = (name: string) => {
    return name.trim().charAt(0) || '?';
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    const strippedName = newProfileName.trim();
    if (!strippedName) {
      setProfileError('Name is required');
      return;
    }

    try {
      const newUser = await createUser(strippedName, newProfileColor);
      switchUser(newUser.id);
      setNewProfileName('');
      setIsAddingProfile(false);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to create profile');
    }
  };

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
      <div className="settings-drawer" role="dialog" aria-modal="true" aria-label="Menu Drawer">
        {/* Main Title Bar */}
        <div className="settings-drawer__header">
          <h2 className="settings-drawer__title">DeskPad Menu</h2>
          <button className="settings-drawer__close" onClick={onClose} aria-label="Close menu">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Signed In Profile Header */}
        {activeUser && (
          <div className="active-profile-header">
            <div 
              className="active-profile-avatar" 
              style={{ backgroundColor: activeUser.avatarColor }}
              title={`Profile: ${activeUser.name}`}
            >
              {getInitial(activeUser.name)}
            </div>
            <div className="active-profile-info">
              <span className="active-profile-label">Signed in as</span>
              <span className="active-profile-name">{account?.email || 'user@example.com'}</span>
            </div>
          </div>
        )}

        <div className="settings-drawer__content">
          {/* Live Preview Mockup (Fixed at top) */}
          <div className="settings-drawer__preview-wrap">
            {renderPreview()}
          </div>

          <div className="settings-drawer__scroll-container">
            {/* Segmented Tab controls */}
            <div className="drawer-tabs">
              <button 
                className={`drawer-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('settings');
                  setConfirmDeleteId(null);
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Style
              </button>
              <button 
                className={`drawer-tab-btn ${activeTab === 'profiles' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('profiles');
                  setIsAddingProfile(false);
                  setConfirmDeleteId(null);
                  setProfileError(null);
                }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Profiles
              </button>
            </div>

            {/* TAB: STYLE SETTINGS */}
            {activeTab === 'settings' && (
              <>
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
              </>
            )}

            {/* TAB: PROFILE MANAGEMENT */}
            {activeTab === 'profiles' && (
              <div className="settings-drawer__section">
                <h3 className="settings-drawer__section-title">Profiles</h3>

                {/* Profile list */}
                <div className="profile-dropdown__list" style={{ background: 'transparent', padding: 0 }}>
                  {users.map((user) => {
                    const isConfirming = user.id === confirmDeleteId;

                    if (isConfirming) {
                      return (
                        <div
                          key={user.id}
                          className="profile-item profile-item--confirm-delete"
                          onClick={(e) => e.stopPropagation()}
                          style={{ margin: 'var(--space-1) 0' }}
                        >
                          <span className="profile-item__confirm-text">Delete profile?</span>
                          <div className="profile-item__confirm-actions">
                            <button
                              className="profile-confirm-btn profile-confirm-btn--yes"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deleteUser(user.id);
                                  setConfirmDeleteId(null);
                                } catch (err: any) {
                                  setProfileError(err.message || 'Failed to delete');
                                }
                              }}
                            >
                              Yes
                            </button>
                            <button
                              className="profile-confirm-btn profile-confirm-btn--no"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={user.id}
                        className={`profile-item ${activeUser && user.id === activeUser.id ? 'profile-item--active' : ''}`}
                        onClick={() => {
                          switchUser(user.id);
                        }}
                        style={{ margin: 'var(--space-1) 0' }}
                      >
                        <div className="profile-item__left">
                          <div
                            className="profile-avatar"
                            style={{ backgroundColor: user.avatarColor }}
                          >
                            {getInitial(user.name)}
                          </div>
                          <span className="profile-item__name">{user.name}</span>
                        </div>

                        {users.length > 1 && (
                          <button
                            className="profile-item__delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(user.id);
                            }}
                            aria-label={`Delete ${user.name}`}
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Profile Section */}
                {!isAddingProfile ? (
                  <button
                    className="profile-dropdown__add-trigger"
                    onClick={() => {
                      setIsAddingProfile(true);
                      setProfileError(null);
                    }}
                    style={{ width: '100%', padding: 'var(--space-3)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M5 1v4H1v2h4v4h2V7h4V5H7V1H5z" />
                    </svg>
                    Add Profile
                  </button>
                ) : (
                  <form className="profile-create-form" onSubmit={handleCreateProfile} style={{ padding: 'var(--space-4)' }}>
                    <input
                      type="text"
                      className="profile-create-form__input"
                      placeholder="Profile Name"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      maxLength={20}
                      required
                      autoFocus
                      style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--text-sm)' }}
                    />

                    {/* Color picker */}
                    <div className="profile-create-form__colors" style={{ margin: 'var(--space-2) 0' }}>
                      {PRESET_COLORS.map((presetColor) => (
                        <button
                          key={presetColor}
                          type="button"
                          className={`profile-color-picker-dot ${presetColor === newProfileColor ? 'profile-color-picker-dot--selected' : ''}`}
                          style={{ backgroundColor: presetColor, width: '28px', height: '28px' }}
                          onClick={() => setNewProfileColor(presetColor)}
                          aria-label={`Select color ${presetColor}`}
                        />
                      ))}
                    </div>

                    {profileError && (
                      <div style={{ color: 'var(--color-weekend-text)', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>
                        {profileError}
                      </div>
                    )}

                    {/* Form buttons */}
                    <div className="profile-create-form__actions" style={{ marginTop: 'var(--space-2)' }}>
                      <button type="submit" className="profile-create-btn" style={{ padding: 'var(--space-2)' }}>
                        Create
                      </button>
                      <button
                        type="button"
                        className="profile-cancel-btn"
                        onClick={() => {
                          setIsAddingProfile(false);
                          setProfileError(null);
                        }}
                        style={{ padding: 'var(--space-2)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Integrations Section */}
                <div className="settings-drawer__section" style={{ marginTop: 'var(--space-6)' }}>
                  <h3 className="settings-drawer__section-title">Integrations</h3>
                  
                  <div className="settings-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                    <span className="settings-label">Todoist API Token</span>
                    <input
                      type="password"
                      placeholder="Paste your personal Todoist API token"
                      value={settings.todoistApiToken || ''}
                      onChange={(e) => updateSetting('todoistApiToken', e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-glass)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                      This token is stored securely in this profile's configuration to display your agenda items.
                    </span>
                  </div>

                  <div className="settings-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 'var(--space-2)' }}>
                    <span className="settings-label">GitHub Username</span>
                    <input
                      type="text"
                      placeholder="Enter your GitHub username"
                      value={settings.githubUsername || ''}
                      onChange={(e) => updateSetting('githubUsername', e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-medium)',
                        background: 'var(--bg-glass)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', lineHeight: '1.4' }}>
                      Your username is used to fetch your public contribution calendar grid.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Combined Footer: Sign Out */}
        <div className="settings-drawer__footer">
          <button className="drawer-signout-btn" onClick={() => logout()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
