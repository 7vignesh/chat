import express from "express";
import rateLimit from "express-rate-limit";
import { checkAuth, login, logout, signup, updateProfile,loginWithTwoFactor, setupTwoFactor, verifyTwoFactor, disableTwoFactor} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Throttle authentication attempts to mitigate brute-force / credential stuffing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later" },
});

router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/logout", logout);
router.post("/2fa/setup", protectRoute, setupTwoFactor);
router.post("/2fa/verify", protectRoute, verifyTwoFactor);
router.post("/2fa/disable", protectRoute, disableTwoFactor);
router.post("/login-2fa", authLimiter, loginWithTwoFactor);
router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
