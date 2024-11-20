const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutos
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const userResolvers = {
  Query: {
    users: async (_, __, { user }) => {
      if (!user) {
        throw new Error("No estás autorizado");
      }
      return new Promise((resolve, reject) => {
        // Excluye el usuario actual (del token) con un WHERE que no incluya su userId
        db.all("SELECT * FROM User WHERE id != ?", [user.userId], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    },
    user: (_, { id }, { user }) => {
      if (!user) {
        throw new Error("No estás autorizado");
      }
      return new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM User WHERE id = ? AND active = 1",
          [id],
          (err, user) => {
            if (err) {
              reject(err);
            } else if (!user) {
              reject(new Error("Usuario no encontrado"));
            } else {
              resolve(user);
            }
          }
        );
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

      const adminExist = await new Promise((resolve, reject) => {
        db.get("SELECT * FROM User WHERE profile = ?", ['ADMIN'], (err, row) => {
          if (err) {
            return reject(err); // Manejar error en la consulta
          }
          resolve(row); // Devuelve el usuario encontrado o null si no existe
        });
      });

      const profile =  adminExist? 'OPERATOR': 'ADMIN';

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
            profile, //Se puede mejorar
            1,
          ],
          function (err) {
            if (err) {
              reject(err);
            } else {
              const token = jwt.sign(
                { userId: this.lastID },
                SECRET_KEY,
                { expiresIn: "1h" }
              );

              resolve({
                userId: this.lastID,
                userName: name,
                email,
                token,
                profile: profile
              });
            }
          }
        );
      });
    },
    updateUser: async (_, { input }, { user }) => {
      if (!user) {
        throw new Error("No estás autorizado");
      }

      const { id, active } = input;
      return new Promise((resolve, reject) => {
        db.run(
          "UPDATE User SET active = ? WHERE id = ?",
          [active, id],
          function (err) {
            if (err) {
              reject(new Error("Error actualizando el usuario: " + err.message));
            } else if (this.changes === 0) {
              reject(new Error("Usuario no encontrado o no activo"));
            } else {
              resolve("Success");
            }
          }
        );
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
              console.log('user.active', user)
              if(!user.active) {
                console.log('user.active', 'NO')

                if(user.profile === 'OPERATOR') {
                  reject(new Error("Permiso denegado"));
                } else {
                  reject(new Error("Usuario no encontrado"));
                }
              }
              const currentTime = new Date().getTime();
              
              // Verifica si el usuario está bloqueado
              if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                const timeSinceLastAttempt = currentTime - new Date(user.lastFailedAttempt).getTime();
                if (timeSinceLastAttempt < LOCK_TIME) {
                  const timeLeft = LOCK_TIME - timeSinceLastAttempt;
                  reject(new Error(`La cuenta esta bloqueada. Intenta de nuevo en ${Math.ceil(timeLeft / 60000)} minuto (s).`));
                } else {
                  // Si el tiempo de bloqueo ha pasado, restablece los intentos
                  db.run("UPDATE User SET failedAttempts = 0 WHERE email = ?", [email]);
                }
              }

              // Compara la contraseña proporcionada con la almacenada en la base de datos
              const match = await bcrypt.compare(password, user.password);
              if (!match) {
                // Incrementa el contador de intentos fallidos
                db.run(
                  "UPDATE User SET failedAttempts = failedAttempts + 1, lastFailedAttempt = ? WHERE email = ?",
                  [new Date().toISOString(), email]
                );
                reject(new Error("Credenciales incorrectas"));
              } else {
                // Resetea el contador de intentos fallidos
                db.run("UPDATE User SET failedAttempts = 0 WHERE email = ?", [email]);

                // Token JWT
                const token = jwt.sign({ userId: user.id }, SECRET_KEY, {
                  expiresIn: "1h",
                });

                resolve({
                  email,
                  token,
                  userId: user.id,
                  userName: user.name,
                  profile: user.profile
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
