const { gql } = require("apollo-server-express");

const userSchema = gql`
  type User {
    id: ID!
    name: String!
    email: String!,
    password: String,
    createdAt: String
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): User
    deleteUser(id: ID!): User
    login(email: String!, password: String!): String 
  }
`;

module.exports = userSchema;