import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { buildGraphqlContext } from "./graphql/context.js";
import { resolvers } from "./graphql/resolvers.js";
import { typeDefs } from "./graphql/typeDefs.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = async () => {
  await apolloServer.start();

  app.use(
    "/api/graphql",
    expressMiddleware(apolloServer, {
      context: buildGraphqlContext,
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);

  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
  }

  server.listen(PORT, () => {
    console.log("server is running on PORT:" + PORT);
    connectDB();
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
