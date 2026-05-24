-- Migration to support Account-level Authentication and OTP login

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otp_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- Update users (profiles) table to relate to accounts.
ALTER TABLE users ADD COLUMN account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL;

-- Seed default account for the default profile
INSERT OR IGNORE INTO accounts (id, email) VALUES (1, 'default@deskpad.local');
UPDATE users SET account_id = 1 WHERE id = 1;
