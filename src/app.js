import uuid from 'uuid/v1';
import { PubSub } from 'graphql-subscriptions';
import { ApolloServer, gql } from 'apollo-server';

const pubsub = new PubSub();
const MESSAGE_ADDED = 'message_added';
const users = [];
const messages = [];

// Type definitions define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
  }

  type Message {
    id: ID!
    text: String!
    author: User!
  }

  type Query {
    messages: [Message!]!
  }

  type Mutation {
    addMessage(userId: ID!, text: String!): Message!
    addUser(name: String!): User!
  }

  type Subscription {
    messageAdded: Message
  }
`;

// Resolvers define the technique for fetching the types in the
// schema.  We'll retrieve books from the "books" array above.
const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    addMessage: (_, {userId, text}) => {
      if(!users.some(user => user.id === userId)) {
        throw new Error("Can't add message. userId not found. Please add user before");
      }

      const newMessage = {
        id: uuid(),
        userId,
        text
      };
      
      messages.push(newMessage);
      pubsub.publish(MESSAGE_ADDED, {
        messageAdded: newMessage
      });
      return newMessage;
    },
    addUser: (_, {name}) => {
      const newUser = {
        id: uuid(),
        name
      };

      users.push(newUser); 
      return newUser;
    }
  },
  Subscription: {
    messageAdded: {
      subscribe: () => pubsub.asyncIterator(MESSAGE_ADDED)
    }
  },
  Message: {
    author: ({userId}) => users.find(user => user.id === userId)
  }
};

// In the most basic sense, the ApolloServer can be started
// by passing type definitions (typeDefs) and the resolvers
// responsible for fetching the data for those types.
export default new ApolloServer({ typeDefs, resolvers });

