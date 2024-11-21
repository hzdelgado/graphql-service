const Database = require('better-sqlite3');
const path = require('path')
const dbPath = path.join(__dirname, 'db.sqlite3');

// Intenta abrir la base de datos
let db;
try {
  db = new Database(dbPath, { verbose: console.log });
  console.log('Conectado a la base de datos SQLite');
} catch (error) {
  console.error('Error al conectar a la base de datos:', error);
  process.exit(1);  // Finaliza el proceso si hay un error
}

// Crear la tabla si no existe
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      profile TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      active BOOLEAN NOT NULL,
      failedAttempts INTEGER DEFAULT 0,
      lastFailedAttempt DATETIME
    )
  `).run();
  console.log('Tabla de usuario creada o ya existe.');
} catch (error) {
  console.error('Error al crear la tabla:', error);
  process.exit(1);  // Finaliza el proceso si hay un error
}

module.exports = db;