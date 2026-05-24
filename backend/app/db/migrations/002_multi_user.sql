-- Migration to support Multi-User Setup
-- Create users profile table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    avatar_color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create user-specific settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, key),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed first default user profile
INSERT OR IGNORE INTO users (id, name, avatar_color) 
VALUES (1, 'Default Profile', '#4f46e5');

-- Migrate any existing settings from legacy settings table to the default profile
INSERT OR IGNORE INTO user_settings (user_id, key, value, updated_at)
SELECT 1, key, value, updated_at FROM settings;
