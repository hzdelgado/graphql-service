const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite3', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});
db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profile TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        active BOOLEAN NOT NULL
      )
    `);
  });

module.exports = db;