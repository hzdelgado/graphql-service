const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET_KEY;

// Función para decodificar el token y obtener el usuario
const getAuthenticatedUser = (token) => {
  try {
    // Verifica y decodifica el token
    const decodedToken = jwt.verify(token, SECRET_KEY);
    return { userId: decodedToken.userId };
  } catch (error) {
    if (error.name === "TokenExpiredError") {
        throw new Error("Token expirado");
      } else {
        throw new Error("Token inválido");
      }
  }
};

module.exports = { getAuthenticatedUser };
