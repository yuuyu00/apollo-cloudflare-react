-- Migration: Add ImageArticle table for article images
CREATE TABLE IF NOT EXISTS ImageArticle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articleId INTEGER NOT NULL,
    key TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (articleId) REFERENCES Article(id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX idx_image_article_article_id ON ImageArticle(articleId);