-- ============================================================
-- نظام إدارة السنتر التعليمي "الباشميكانيكي" — Schema SQL كامل
-- قاعدة البيانات: SQLite (data/database.sqlite) أو أي خادم SQL
-- ============================================================

-- ==================== 1. جدول المجموعات (Groups) ====================
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 2. جدول المستخدمين (Users) ====================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'student',         -- 'admin' | 'student' | 'assistant'
  group_id TEXT REFERENCES groups(id) ON DELETE SET NULL,
  group_name TEXT,                     -- اسم مجموعة الطالب
  status TEXT DEFAULT 'نشط',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 3. جدول الحضور (Attendance) ====================
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assistant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  date TEXT NOT NULL,                  -- format: YYYY-MM-DD
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, date)
);

-- ==================== 4. جدول وصولات الدفع (Payment Receipts) ====================
CREATE TABLE IF NOT EXISTS payment_receipts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,                 -- format: "YYYY-MM"
  image_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',       -- 'pending' | 'confirmed'
  confirmed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  confirmed_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, month)
);

-- ==================== 5. جدول مواعيد الحصص (Schedule) ====================
CREATE TABLE IF NOT EXISTS groups_schedule (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  day TEXT NOT NULL,                   -- 'السبت' | 'الأحد' | ...
  subject TEXT NOT NULL,
  time_from TEXT NOT NULL,             -- '10:00'
  time_to TEXT NOT NULL,               -- '12:00'
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==================== 6. حساب الأدمن الافتراضي ====================
-- رقم الهاتف: 01000000000 | كلمة السر: admin123
INSERT INTO users (id, name, phone, password, role, status)
VALUES ('admin-system-id-001', 'الباشميكانيكي', '01000000000', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Xum', 'admin', 'نشط')
ON CONFLICT (phone) DO NOTHING;
