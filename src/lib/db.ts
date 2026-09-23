import Database from 'better-sqlite3';
import path from 'path';

/**
 * NEXUS ENGINE SQLITE ADAPTER
 * Consolidates all application data into a server-side SQLite database.
 */

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'portal.db');
const db = new Database(dbPath);

// Initialize Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT,
    role TEXT,
    department TEXT,
    profilePic TEXT,
    isApproved INTEGER DEFAULT 0,
    isBanned INTEGER DEFAULT 0,
    lastSeen TEXT
  );

  CREATE TABLE IF NOT EXISTS labs (
    id TEXT PRIMARY KEY,
    name TEXT,
    capacity INTEGER
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT,
    capacity INTEGER
  );

  CREATE TABLE IF NOT EXISTS pcs (
    id TEXT PRIMARY KEY,
    pcNumber TEXT,
    labId TEXT,
    status TEXT DEFAULT 'available'
  );

  CREATE TABLE IF NOT EXISTS labrequests (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    studentName TEXT,
    subjectId TEXT,
    labId TEXT,
    pcId TEXT,
    startTime TEXT,
    endTime TEXT,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    requestType TEXT DEFAULT 'use'
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    studentId TEXT,
    studentName TEXT,
    subjectId TEXT,
    date TEXT,
    status TEXT,
    timeIn TEXT,
    timeOut TEXT,
    locationId TEXT,
    locationType TEXT,
    pcId TEXT,
    sessionId TEXT
  );

  CREATE TABLE IF NOT EXISTS auditlog (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    action TEXT,
    details TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

export default db;