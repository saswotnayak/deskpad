-- Migration to relax the UNIQUE constraint on the users.name column,
-- making it unique per account (UNIQUE (account_id, name)) instead of globally unique.

PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar_color TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE (account_id, name)
);

-- Copy existing profiles to the new table
INSERT INTO users_new (id, name, avatar_color, created_at, account_id)
SELECT id, name, avatar_color, created_at, account_id FROM users;

-- Drop the old users table
DROP TABLE users;

-- Rename users_new to users
ALTER TABLE users_new RENAME TO users;

PRAGMA foreign_keys = ON;
