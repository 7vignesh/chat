import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";

import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const requireAuth = (user) => {
  if (!user) {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
};

export const resolvers = {
  Query: {
    me: async (_, __, { user }) => user,

    usersForSidebar: async (_, __, { user }) => {
      requireAuth(user);

      return User.find({ _id: { $ne: user._id } })
        .select("-password")
        .sort({ fullName: 1 });
    },

    messages: async (_, { userId }, { user }) => {
      requireAuth(user);

      return Message.find({
        $or: [
          { senderId: user._id, receiverId: userId },
          { senderId: userId, receiverId: user._id },
        ],
      }).sort({ createdAt: 1 });
    },
  },

  Mutation: {
    signup: async (_, { fullName, email, password }, { res }) => {
      if (!fullName || !email || !password) {
        throw new GraphQLError("All fields are required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (password.length < 6) {
        throw new GraphQLError("Password must be at least 6 characters", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new GraphQLError("Email already exists", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        fullName,
        email,
        password: hashedPassword,
      });

      generateToken(newUser._id, res);

      return {
        user: newUser,
        requiresTwoFactor: false,
        userId: null,
        message: "Signup successful",
      };
    },

    login: async (_, { email, password }, { res }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        throw new GraphQLError("Invalid credentials", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      if (user.isTwoFactorEnabled) {
        return {
          user: null,
          requiresTwoFactor: true,
          userId: user._id,
          message: "Two-factor authentication required",
        };
      }

      generateToken(user._id, res);

      return {
        user,
        requiresTwoFactor: false,
        userId: null,
        message: "Login successful",
      };
    },

    logout: async (_, __, { res }) => {
      res.cookie("jwt", "", { maxAge: 0 });
      return true;
    },

    updateProfile: async (_, { profilePic }, { user }) => {
      requireAuth(user);

      if (!profilePic) {
        throw new GraphQLError("Profile pic is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const uploadResponse = await cloudinary.uploader.upload(profilePic);

      return User.findByIdAndUpdate(
        user._id,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      ).select("-password");
    },

    sendMessage: async (_, { receiverId, text, image }, { user }) => {
      requireAuth(user);

      if (!text && !image) {
        throw new GraphQLError("Message text or image is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      let imageUrl;
      if (image) {
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }

      const newMessage = await Message.create({
        senderId: user._id,
        receiverId,
        text,
        image: imageUrl,
      });

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      return newMessage;
    },
  },
};
