const { gql } = require("apollo-server-express");

const userSchema = gql`

  type User {
    id: ID!
    name: String!
    email: String!,
    password: String,
    createdAt: String,
    profile: String,
    active: Boolean,
    failedAttempts: Int,
    lastFailedAttempt: String
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
  }

  type AuthResponse {
    token: String!,
    email: String!,
    userId: String!,
    userName: String!,
    profile: String!
  }
  input UpdateUserInput {
    id: ID!
    active: Boolean
    profile: String
  }

  type Mutation {
    addUser(name: String!, email: String!, password: String!): AuthResponse
    updateUser(input: UpdateUserInput!): String
    login(email: String!, password: String!): AuthResponse 
  }
`;

module.exports = userSchema;