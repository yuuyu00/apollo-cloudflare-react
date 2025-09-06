-- Migration number: 0004
-- Add createdAt and updatedAt columns to all tables
-- D1 doesn't support ALTER TABLE ADD COLUMN, so we need to recreate tables

PRAGMA foreign_keys=off;

-- 1. Save existing data from all tables
CREATE TABLE User_backup AS SELECT * FROM User;
CREATE TABLE Article_backup AS SELECT * FROM Article;
CREATE TABLE Category_backup AS SELECT * FROM Category;
CREATE TABLE _ArticleToCategory_backup AS SELECT * FROM _ArticleToCategory;

-- 2. Drop all tables in correct order (junction table first)
DROP TABLE _ArticleToCategory;
DROP TABLE Article;
DROP TABLE Category;
DROP TABLE User;

-- 3. Recreate User table with timestamps
CREATE TABLE User (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sub TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recreate Article table with timestamps
CREATE TABLE Article (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  userId INTEGER NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- 5. Recreate Category table with timestamps
CREATE TABLE Category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Recreate junction table for many-to-many relationship
CREATE TABLE _ArticleToCategory (
  A INTEGER NOT NULL,
  B INTEGER NOT NULL,
  FOREIGN KEY (A) REFERENCES Article(id) ON DELETE CASCADE,
  FOREIGN KEY (B) REFERENCES Category(id) ON DELETE CASCADE
);

-- 7. Restore data with timestamps
-- For User
INSERT INTO User (id, sub, email, name, createdAt, updatedAt)
SELECT id, sub, email, name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM User_backup;

-- For Article
INSERT INTO Article (id, title, content, userId, createdAt, updatedAt)
SELECT id, title, content, userId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM Article_backup;

-- For Category
INSERT INTO Category (id, name, createdAt, updatedAt)
SELECT id, name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP FROM Category_backup;

-- Restore many-to-many relationships
INSERT INTO _ArticleToCategory (A, B)
SELECT A, B FROM _ArticleToCategory_backup;

-- 8. Create indexes
CREATE UNIQUE INDEX User_sub_key ON User(sub);
CREATE UNIQUE INDEX User_email_key ON User(email);
CREATE UNIQUE INDEX _ArticleToCategory_AB_unique ON _ArticleToCategory(A, B);
CREATE INDEX _ArticleToCategory_B_index ON _ArticleToCategory(B);

-- Create indexes for timestamps (for better query performance)
CREATE INDEX User_createdAt_idx ON User(createdAt);
CREATE INDEX User_updatedAt_idx ON User(updatedAt);
CREATE INDEX Article_createdAt_idx ON Article(createdAt);
CREATE INDEX Article_updatedAt_idx ON Article(updatedAt);
CREATE INDEX Category_createdAt_idx ON Category(createdAt);
CREATE INDEX Category_updatedAt_idx ON Category(updatedAt);

-- 9. Drop backup tables
DROP TABLE User_backup;
DROP TABLE Article_backup;
DROP TABLE Category_backup;
DROP TABLE _ArticleToCategory_backup;

PRAGMA foreign_keys=on;