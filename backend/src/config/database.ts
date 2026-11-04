import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys and WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize the records table matching your CSV columns (postId, id, name, email, body)
export const initDatabase = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY,
      postId INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      body TEXT NOT NULL
    );
  `;
  db.exec(createTableQuery);
  console.log('Database initialized and "records" table ready.');
};

export default db;