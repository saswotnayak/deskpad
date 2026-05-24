-- DeskPad Initial Schema
-- Settings key-value store for user preferences

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('clock_mode', 'analog');
INSERT OR IGNORE INTO settings (key, value) VALUES ('time_format', '24h');
INSERT OR IGNORE INTO settings (key, value) VALUES ('week_starts_on', '1');
INSERT OR IGNORE INTO settings (key, value) VALUES ('show_week_numbers', 'false');
