import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  require2FA: false,
  temp2FAUserId: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      if (error.response?.data?.requiresTwoFactor) {
        set({
          require2FA: true,
          temp2FAUserId: error.response.data.userId,
        });
        toast.success("Please enter your 2FA code");
        return;
      }
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  loginWith2FA: async (userId, code) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login-2fa", {
        userId,
        code,
      });
      set({ authUser: res.data, require2FA: false, temp2FAUserId: null });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  setup2FA: async () => {
    try {
      const res = await axiosInstance.post("/auth/2fa/setup");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  verify2FA: async (secret, code) => {
    try {
      await axiosInstance.post("/auth/2fa/verify", {
        secret,
        code,
      });
      set({ authUser: { ...get().authUser, isTwoFactorEnabled: true } });
      toast.success("Two-factor authentication enabled");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  disable2FA: async () => {
    try {
      await axiosInstance.post("/auth/2fa/disable");
      set({ authUser: { ...get().authUser, isTwoFactorEnabled: false } });
      toast.success("Two-factor authentication disabled");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
