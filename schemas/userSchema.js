const { gql } = require("apollo-server-express");

const userSchema = gql`

  type User {
    id: ID!
    name: String!
    email: String!,
    password: String,
    createdAt: String,
    profile: String,
    active: Boolean
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type AuthResponse {
    token: String!
    email: String!,
    userId: String!,
    userName: String!,
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): AuthResponse
    deleteUser(id: ID!): User
    login(email: String!, password: String!): AuthResponse 
  }
`;

module.exports = userSchema;