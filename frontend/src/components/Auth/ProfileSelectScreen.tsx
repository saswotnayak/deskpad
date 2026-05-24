import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUser } from '../../hooks/useUser';
import './AuthStyles.css';

const AVATAR_COLORS = [
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#0D9488', // Teal
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
];

export function ProfileSelectScreen() {
  const { logout, account } = useAuth();
  const { users, switchUser, createUser } = useUser();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const newProfile = await createUser(newName.trim(), selectedColor);
      setNewName('');
      setShowCreate(false);
      // Automatically switch to the newly created profile
      switchUser(newProfile.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '640px' }}>
        <div className="auth-header">
          <h1>{!showCreate ? 'Who is using DeskPad?' : 'Create Profile'}</h1>
          <p>{!showCreate ? `Logged in as ${account?.email}` : 'Create a new profile for this device'}</p>
        </div>

        {error && (
          <div className="auth-error">
            <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!showCreate ? (
          <>
            <div className="profiles-grid">
              {users.map((profile) => {
                const initial = profile.name.charAt(0).toUpperCase();
                return (
                  <div
                    key={profile.id}
                    className="profile-card"
                    onClick={() => switchUser(profile.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div
                      className="profile-avatar-circle"
                      style={{ backgroundColor: profile.avatarColor }}
                    >
                      {initial}
                    </div>
                    <span className="profile-name">{profile.name}</span>
                  </div>
                );
              })}

              <div
                className="profile-card profile-card-add"
                onClick={() => setShowCreate(true)}
                role="button"
                tabIndex={0}
              >
                <div className="profile-avatar-circle profile-avatar-add">
                  +
                </div>
                <span className="profile-name" style={{ color: 'rgba(255,255,255,0.6)' }}>Add Profile</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="auth-btn auth-btn--secondary"
              style={{ maxWidth: '200px', margin: '0 auto' }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <form onSubmit={handleCreateProfile} className="auth-profile-create-form">
            <div className="auth-form-group">
              <label htmlFor="profileName">Profile Name</label>
              <input
                id="profileName"
                type="text"
                className="auth-input"
                placeholder="e.g. Workspace, Kitchen, Family"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="auth-form-group">
              <label>Avatar Color</label>
              <div className="color-palette">
                {AVATAR_COLORS.map((color) => (
                  <div
                    key={color}
                    className={`color-option ${selectedColor === color ? 'color-option--selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="auth-btn auth-btn--secondary"
                onClick={() => {
                  setShowCreate(false);
                  setNewName('');
                  setError(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="auth-btn"
                disabled={loading || !newName.trim()}
              >
                {loading ? <div className="auth-spinner" /> : 'Create Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
