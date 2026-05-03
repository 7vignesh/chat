export const typeDefs = `#graphql
  type User {
    _id: ID!
    email: String!
    fullName: String!
    profilePic: String
    isTwoFactorEnabled: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Message {
    _id: ID!
    senderId: ID!
    receiverId: ID!
    text: String
    image: String
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    user: User
    requiresTwoFactor: Boolean!
    userId: ID
    message: String
  }

  type Query {
    me: User
    usersForSidebar: [User!]!
    messages(userId: ID!): [Message!]!
  }

  type Mutation {
    signup(fullName: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    logout: Boolean!
    updateProfile(profilePic: String!): User!
    sendMessage(receiverId: ID!, text: String, image: String): Message!
  }
`;
