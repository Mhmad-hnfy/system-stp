import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

// Ensure data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "database.sqlite");

// Singleton pattern for database connection in Next.js development & production
let db = global.__dbInstance;

if (!db) {
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  global.__dbInstance = db;
}

// Initialize tables and default seed data
export function initDB() {
  // 1. Groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
      group_name TEXT,
      status TEXT DEFAULT 'نشط',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Attendance table
  db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assistant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, date)
    );
  `);

  // 4. Payment receipts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_receipts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month TEXT NOT NULL,
      image_url TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      confirmed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      confirmed_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, month)
    );
  `);

  // 5. Schedule table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups_schedule (
      id TEXT PRIMARY KEY,
      group_name TEXT NOT NULL,
      day TEXT NOT NULL,
      subject TEXT NOT NULL,
      time_from TEXT NOT NULL,
      time_to TEXT NOT NULL,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default admin if not exists
  const adminCheck = db.prepare("SELECT id, password FROM users WHERE phone = ?").get("01000000000");
  const defaultAdminHash = bcrypt.hashSync("admin123", 10);

  if (!adminCheck) {
    db.prepare(`
      INSERT INTO users (id, name, phone, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      "admin-system-id-001",
      "الباشميكانيكي",
      "01000000000",
      defaultAdminHash,
      "admin",
      "نشط"
    );
  } else {
    // Ensure admin password is reset/sync to admin123
    db.prepare("UPDATE users SET password = ?, role = 'admin' WHERE phone = '01000000000'").run(defaultAdminHash);
  }

  // Seed some default groups if empty
  const groupsCount = db.prepare("SELECT COUNT(*) as count FROM groups").get().count;
  if (groupsCount === 0) {
    const insertGroup = db.prepare("INSERT INTO groups (id, name, notes) VALUES (?, ?, ?)");
    insertGroup.run("grp-1", "المجموعة 1 (أولى ثانوي)", "مواعيد السبت والثلاثاء");
    insertGroup.run("grp-2", "المجموعة 2 (تانية ثانوي)", "مواعيد الأحد والأربعاء");
    insertGroup.run("grp-3", "المجموعة 3 (تالتة ثانوي)", "مواعيد الإثنين والخميس");
  }
}

// Auto-run initialization only once across worker modules
if (!global.__dbInitialized) {
  initDB();
  global.__dbInitialized = true;
}

export default db;
