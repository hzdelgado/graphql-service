const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userResolvers = {
  Query: {
    users: () => {
      return new Promise((resolve, reject) => {
        db.all("SELECT * FROM User WHERE active = 1", (err, rows) => {
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

      // Validar si el usuario ya existe
      const existingUser = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM User WHERE email = ?", [email], (err, row) => {
          if (err) {
            return reject(err); // Manejar error en la consulta
          }
          resolve(row); // Devuelve el usuario encontrado o null si no existe
        });
      });

      if (existingUser) {
        throw new Error("El usuario ya existe");
      }

      return new Promise((resolve, reject) => {
        const stmt = db.prepare(
          "INSERT INTO User (name, email, password, createdAt, profile, active) VALUES (?, ?, ?, ?, ?, ?)"
        );
        stmt.run(
          [
            name,
            email,
            hashedPassword,
            new Date().toISOString(),
            "OPERATOR",
            1,
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              const token = jwt.sign(
                { userId: this.lastID },
                "your_secret_key",
                { expiresIn: "1h" }
              );

              resolve({
                userId: this.lastID,
                userName: name,
                email,
                token,
              });
            }
          }
        );
      });
    },
    login: async (_, { email, password }) => {
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM User WHERE email = ? AND active = ?",
          [email, 1],
          async (err, user) => {
            if (err) {
              reject(err);
            }
            if (!user) {
              reject(new Error("User not found"));
            } else {
              // Compara la contraseña proporcionada con la almacenada en la base de datos
              const match = await bcrypt.compare(password, user.password);
              if (!match) {
                reject(new Error("Wrong credentials"));
              } else {
                // Token JWT
                const token = jwt.sign({ userId: user.id }, "your_secret_key", {
                  expiresIn: "1h",
                });
                resolve({
                  email,
                  token,
                  userId: user.id,
                  userName: user.name,
                });
              }
            }
          }
        );
      });
    },
  },
};

module.exports = userResolvers;
