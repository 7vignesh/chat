import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

// Validate that :id is a valid MongoDB ObjectId format
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }
  next();
};

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, validateObjectId, getMessages);

router.post("/send/:id", protectRoute, validateObjectId, sendMessage);

export default router;
