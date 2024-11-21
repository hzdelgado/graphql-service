const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 minutos
const SECRET_KEY = process.env.JWT_SECRET_KEY;

const userResolvers = {
  Query: {
    users: (_, __, { user }) => {
      if (!user) {
        throw new Error("No estás autorizado");
      }
      // Consulta sincrónica con better-sqlite3
      try {
        return db.prepare("SELECT * FROM User WHERE id != ?").all(user.userId);
      } catch (err) {
        throw new Error("Error al obtener usuarios: " + err.message);
      }
    },
    user: (_, { id }, { user }) => {
      if (!user) {
        throw new Error("No estás autorizado");
      }
      try {
        const userFound = db.prepare("SELECT * FROM User WHERE id = ? AND active = 1").get(id);
        if (!userFound) {
          throw new Error("Usuario no encontrado");
        }
        return userFound;
      } catch (err) {
        throw new Error("Error al obtener usuario: " + err.message);
      }
    },
  },
  Mutation: {
    addUser: async (_, { name, email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Validar si el usuario ya existe
      const existingUser = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
      if (existingUser) {
        throw new Error("El usuario ya existe");
      }

      const adminExist = db.prepare("SELECT * FROM User WHERE profile = ?").get('ADMIN');

      const profile =  adminExist? 'OPERATOR': 'ADMIN';

      try {
        const stmt = db.prepare("INSERT INTO User (name, email, password, createdAt, profile, active) VALUES (?, ?, ?, ?, ?, ?)");
        const info = stmt.run(name, email, hashedPassword, new Date().toISOString(), profile, 1);

        const token = jwt.sign({ userId: info.lastInsertRowid }, SECRET_KEY, { expiresIn: "1h" });

        return {
          userId: info.lastInsertRowid,
          userName: name,
          email,
          token,
          profile: profile
        };
      } catch (err) {
        throw new Error("Error al agregar usuario: " + err.message);
      }
    },
    updateUser: (_, { input }, { user }) => {
      if (!user) {
        throw new Error("No estás autorizado");
      }

      const { id, active } = input;

      try {
        const stmt = db.prepare("UPDATE User SET active = ? WHERE id = ?");
        const result = stmt.run(active, id);

        if (result.changes === 0) {
          throw new Error("Usuario no encontrado o no activo");
        }

        return "Success";
      } catch (err) {
        throw new Error("Error al actualizar el usuario: " + err.message);
      }
    },
    login: async (_, { email, password }) => {
      try {
        const user = db.prepare("SELECT * FROM User WHERE email = ?").get(email);
        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        if (!user.active) {
          if (user.profile === 'OPERATOR') {
            throw new Error("Permiso denegado");
          }
          throw new Error("Usuario no encontrado");
        }

        const currentTime = new Date().getTime();

        // Verifica si el usuario está bloqueado
        if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          const timeSinceLastAttempt = currentTime - new Date(user.lastFailedAttempt).getTime();
          if (timeSinceLastAttempt < LOCK_TIME) {
            const timeLeft = LOCK_TIME - timeSinceLastAttempt;
            throw new Error(`La cuenta esta bloqueada. Intenta de nuevo en ${Math.ceil(timeLeft / 60000)} minuto(s).`);
          } else {
            // Si el tiempo de bloqueo ha pasado, restablece los intentos
            db.prepare("UPDATE User SET failedAttempts = 0 WHERE email = ?").run(email);
          }
        }

        // Compara la contraseña proporcionada con la almacenada en la base de datos
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          // Incrementa el contador de intentos fallidos
          db.prepare("UPDATE User SET failedAttempts = failedAttempts + 1, lastFailedAttempt = ? WHERE email = ?").run(new Date().toISOString(), email);
          throw new Error("Credenciales incorrectas");
        } else {
          // Resetea el contador de intentos fallidos
          db.prepare("UPDATE User SET failedAttempts = 0 WHERE email = ?").run(email);

          // Token JWT
          const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "1h" });

          return {
            email,
            token,
            userId: user.id,
            userName: user.name,
            profile: user.profile
          };
        }
      } catch (err) {
        throw new Error("Error al procesar el login: " + err.message);
      }
    },
  },
};

module.exports = userResolvers;
