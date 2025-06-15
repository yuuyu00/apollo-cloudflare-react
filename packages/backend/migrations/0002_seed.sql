-- シードデータの投入
-- 注意: 既存のデータがある場合はエラーになる可能性があります

-- カテゴリーの挿入
INSERT INTO Category (id, name) VALUES
  (1, 'Technology'),
  (2, 'Science'),
  (3, 'Business');

-- ユーザーの挿入
INSERT INTO User (id, name, email) VALUES
  (1, 'Test User 1', 'test1@example.com'),
  (2, 'Test User 2', 'test2@example.com');

-- 記事の挿入
INSERT INTO Article (id, title, content, userId) VALUES
  (1, 'Getting Started with Cloudflare Workers', 'Cloudflare Workers provide a serverless execution environment that allows you to create entirely new applications or augment existing ones without configuring or maintaining infrastructure.', 1),
  (2, 'GraphQL Best Practices', 'When building GraphQL APIs, consider these best practices: Use a consistent naming convention, implement proper error handling, optimize your resolvers, and leverage DataLoader for N+1 query prevention.', 1),
  (3, 'The Future of Edge Computing', 'Edge computing is revolutionizing how we think about application architecture. By bringing computation closer to users, we can achieve lower latency and better performance.', 2);

-- 記事とカテゴリーの関連付け
INSERT INTO _ArticleToCategory (A, B) VALUES
  (1, 1), -- Article 1 -> Technology
  (2, 1), -- Article 2 -> Technology  
  (2, 3), -- Article 2 -> Business
  (3, 2), -- Article 3 -> Science
  (3, 1); -- Article 3 -> Technology