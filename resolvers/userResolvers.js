const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userResolvers = {
  Query: {
    users: () => {
      return new Promise((resolve, reject) => {
        db.all("SELECT * FROM User", (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
  },
  Mutation: {
    addUser: async (_, { name, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);

      return new Promise((resolve, reject) => {
        const stmt = db.prepare(
          "INSERT INTO User (name, email, password) VALUES (?, ?, ?)"
        );
        stmt.run([name, email, hashedPassword], function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              name,
              email,
              hashedPassword,
              createdAt: new Date().toISOString(),
            });
          }
        });
      });
    },
    login: async (_, { email, password }) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM User WHERE email = ?",
          [email],
          async (err, user) => {
            if (err) {
              reject(err);
            }
            if (!user) {
              reject(new Error("Usuario no encontrado"));
            } else {
              // Compara la contraseña proporcionada con la almacenada en la base de datos
              const match = await bcrypt.compare(password, user.password);
              if (!match) {
                reject(new Error("Contraseña incorrecta"));
              } else {
                 // Token JWT
                const token = jwt.sign({ userId: user.id }, 'your_secret_key', { expiresIn: '1h' });
                resolve(token);
              }
            }
          }
        );
      });
    },
  },
};

module.exports = userResolvers;
