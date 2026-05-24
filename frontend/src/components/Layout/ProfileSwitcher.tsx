import { useState, useEffect, useRef } from 'react';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import './ProfileSwitcher.css';

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
];

export function ProfileSwitcher() {
  const { users, activeUser, switchUser, createUser, deleteUser, setActiveUser } = useUser();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setConfirmDeleteId(null);
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!activeUser) return null;

  const getInitial = (name: string) => {
    return name.trim().charAt(0) || '?';
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const strippedName = name.trim();
    if (!strippedName) {
      setError('Name is required');
      return;
    }

    try {
      const newUser = await createUser(strippedName, color);
      switchUser(newUser.id);
      setName('');
      setIsAdding(false);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    }
  };

  return (
    <div className="profile-switcher" ref={switcherRef}>
      {/* Floating Active Profile Button */}
      <button
        className="profile-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch profile"
        style={{ backgroundColor: activeUser.avatarColor }}
      >
        {getInitial(activeUser.name)}
      </button>

      {/* Profile Swapper Dropdown */}
      {isOpen && (
        <div className="profile-dropdown">
          <div className="profile-dropdown__header">Profiles</div>
          
          {/* User profile list */}
          <div className="profile-dropdown__list">
            {users.map((user) => {
              const isConfirming = user.id === confirmDeleteId;
              
              if (isConfirming) {
                return (
                  <div
                    key={user.id}
                    className="profile-item profile-item--confirm-delete"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="profile-item__confirm-text">Delete?</span>
                    <div className="profile-item__confirm-actions">
                      <button
                        className="profile-confirm-btn profile-confirm-btn--yes"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await deleteUser(user.id);
                            setConfirmDeleteId(null);
                          } catch (err: any) {
                            setError(err.message || 'Failed to delete');
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
                  className={`profile-item ${user.id === activeUser.id ? 'profile-item--active' : ''}`}
                  onClick={() => {
                    switchUser(user.id);
                    setIsOpen(false);
                  }}
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

                  {/* Don't allow deleting the only profile */}
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

          {/* Trigger Add Profile Form */}
          {!isAdding ? (
            <>
              <button
                className="profile-dropdown__add-trigger"
                onClick={() => setIsAdding(true)}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M5 1v4H1v2h4v4h2V7h4V5H7V1H5z" />
                </svg>
                Add Profile
              </button>
              
              <div className="profile-dropdown__divider" />
              
              <button
                className="profile-dropdown__action-btn"
                onClick={() => {
                  setActiveUser(null);
                  setIsOpen(false);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Switch Profile
              </button>
              
              <button
                className="profile-dropdown__action-btn"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                style={{ color: 'var(--color-weekend-text)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </>
          ) : (
            <form className="profile-create-form" onSubmit={handleCreateProfile}>
              <input
                type="text"
                className="profile-create-form__input"
                placeholder="Profile Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                required
                autoFocus
              />

              {/* Color picker */}
              <div className="profile-create-form__colors">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    className={`profile-color-picker-dot ${presetColor === color ? 'profile-color-picker-dot--selected' : ''}`}
                    style={{ backgroundColor: presetColor }}
                    onClick={() => setColor(presetColor)}
                    aria-label={`Select color ${presetColor}`}
                  />
                ))}
              </div>

              {error && <div style={{ color: 'var(--color-weekend-text)', fontSize: '10px' }}>{error}</div>}

              {/* Form buttons */}
              <div className="profile-create-form__actions">
                <button type="submit" className="profile-create-btn">
                  Create
                </button>
                <button
                  type="button"
                  className="profile-cancel-btn"
                  onClick={() => {
                    setIsAdding(false);
                    setError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
