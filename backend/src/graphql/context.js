import jwt from "jsonwebtoken";

import User from "../models/user.model.js";

export const buildGraphqlContext = async ({ req, res }) => {
  let user = null;
  const token = req.cookies?.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.userId) {
        user = await User.findById(decoded.userId).select("-password");
      }
    } catch (error) {
      user = null;
    }
  }

  return { req, res, user };
};
