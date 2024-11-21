require('dotenv').config();
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const userSchema = require("./schemas/userSchema");
const userResolvers = require("./resolvers/userResolvers");
const { getAuthenticatedUser } = require("./services/authService");

async function startServer() {
  const app = express();
  const server = new ApolloServer({
    typeDefs: [userSchema],
    resolvers: [userResolvers],
    context: async ({ req }) => {
      try {
        const token = req.headers.authorization || ""; // Extrae el token de los headers
        if (token) {
          const user = getAuthenticatedUser(token.replace('Bearer ', ''));
          return { user }; // Pasa el usuario decodificado al contexto
        }
        return {}; // Si no hay token, no pasa ningún usuario
      } catch (error) {
        throw new Error("Autenticación fallida: " + error.message);
      }
    },
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();