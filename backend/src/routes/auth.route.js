import express from "express";
import { checkAuth, login, logout, signup, updateProfile,loginWithTwoFactor, setupTwoFactor, verifyTwoFactor, disableTwoFactor} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/2fa/setup", protectRoute, setupTwoFactor);
router.post("/2fa/verify", protectRoute, verifyTwoFactor);
router.post("/2fa/disable", protectRoute, disableTwoFactor);
router.post("/login-2fa", loginWithTwoFactor);
router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

export default router;
