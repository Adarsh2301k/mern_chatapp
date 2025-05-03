import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      console.log("Checking authentication...");
      const res = await axiosInstance.get("/auth/check");

      console.log("Auth user after checkAuth:", res.data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data)); // Persist authUser
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
      localStorage.removeItem("authUser"); // Clear persisted authUser on error
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      console.log("Signing up user with data:", data);
      const res = await axiosInstance.post("/auth/signup", data);
      console.log("Auth user after signup:", res.data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data)); // Persist authUser
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      console.log("Error in signup:", error);
      toast.error(error.response?.data?.message || "Error signing up");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log("Logging in user with data:", data);
      const res = await axiosInstance.post("/auth/login", data);
      console.log("Auth user after login:", res.data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data)); // Persist authUser
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      console.log("Error in login:", error);
      toast.error(error.response?.data?.message || "Error logging in");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      console.log("Logging out user...");
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      localStorage.removeItem("authUser"); // Clear persisted authUser
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      console.log("Error in logout:", error);
      toast.error(error.response?.data?.message || "Error logging out");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      console.log("Updating profile with data:", data);
      const res = await axiosInstance.put("/auth/update-profile", data);
      console.log("Auth user after profile update:", res.data);
      set({ authUser: res.data });
      localStorage.setItem("authUser", JSON.stringify(res.data)); // Persist updated authUser
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error in updateProfile:", error);
      toast.error(error.response?.data?.message || "Error updating profile");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) {
      console.warn("Cannot connect socket: authUser is not loaded");
      return;
    }
    if (get().socket?.connected) {
      console.warn("Socket is already connected");
      return;
    }

    console.log("Connecting socket for user:", authUser);
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("getOnlineUsers", (userIds) => {
      console.log("Online users received:", userIds);
      set({ onlineUsers: userIds });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      console.log("Disconnecting socket...");
      socket.disconnect();
    } else {
      console.warn("Socket is not connected");
    }
  },

  initializeAuth: () => {
    const savedAuthUser = localStorage.getItem("authUser");
    if (savedAuthUser) {
      console.log("Initializing authUser from localStorage:", JSON.parse(savedAuthUser));
      set({ authUser: JSON.parse(savedAuthUser) });
      get().connectSocket();
    }
  },
}));

// Call `initializeAuth` on app startup
useAuthStore.getState().initializeAuth();