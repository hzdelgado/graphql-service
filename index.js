const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const userSchema = require("./schemas/userSchema");
const userResolvers = require("./resolvers/userResolvers");

async function startServer() {
  const app = express();
  const server = new ApolloServer({
    typeDefs: [userSchema],
    resolvers: [userResolvers],
  });

  await server.start();
  server.applyMiddleware({ app });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();