import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import speak from "speakeasy";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" }); 
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const setupTwoFactor = async (req, res) => {
  try {
    const userId = req.userId;
   
    const secret = speakeasy.generateSecret({
      name: `Chat App (${req.user.email})`,
      issuer: "chat app"
    })
    
    const qrCode = await qrCode.toDataURL(secret.otauth_url);
    
    res.status(200).json({
      secret: secret.base32,
      qrCode: qrCode,
      message: "Scan the QR code to enable two-factor authentication"
    });
    
  } catch (error) {
    console.log("Error in setupTwoFactor controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyTwoFactor = async (req, res) => {
  try {
    const userId = req.userId;
    const { secret, code } = req.body;
    
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: code,
      window: 2,
    });
    
    if (!verified) {
      return res.status(401).json({ message: "Invalid code" });
    }
    
    const user = await User.findByIdUpdate(
      userId, {
      isTwoFactorSecret: secret,
      isTwoFactorEnabled: true,
    },
      {
        new: true,
      }
    );
    res.status(200).json({ message: "Two-factor authentication enabled" });
  } catch (error) {
    console.log("Error in verifyTwoFactor controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const disableTwoFactor = async (req, res) => {
  
};

export const loginWithTwoFactor = async (req, res) => {
  
};