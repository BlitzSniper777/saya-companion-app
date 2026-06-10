"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Companion, Subscription } from "@/types";

interface AuthContextType {
  user: User | null;
  companion: Companion | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setCompanion: (companion: Companion) => void;
  setSubscription: (subscription: Subscription) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("saya_token");
    const storedUser = localStorage.getItem("saya_user");
    const storedCompanion = localStorage.getItem("saya_companion");
    const storedSubscription = localStorage.getItem("saya_subscription");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedCompanion) setCompanion(JSON.parse(storedCompanion));
      if (storedSubscription) setSubscription(JSON.parse(storedSubscription));
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("saya_token", newToken);
    localStorage.setItem("saya_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("saya_token");
    localStorage.removeItem("saya_user");
    localStorage.removeItem("saya_companion");
    localStorage.removeItem("saya_subscription");
    setToken(null);
    setUser(null);
    setCompanion(null);
    setSubscription(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007"}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem("saya_user", JSON.stringify(userData));
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        companion,
        subscription,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        setCompanion,
        setSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}