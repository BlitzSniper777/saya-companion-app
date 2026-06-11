"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Companion, Subscription } from "@/types";

const API = () => process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

interface AuthContextType {
  user: User | null;
  companion: Companion | null;
  subscription: Subscription | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  affectionLevel: number;
  coinBalance: number;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshAffection: () => Promise<void>;
  refreshCoins: () => Promise<void>;
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
  const [affectionLevel, setAffectionLevel] = useState(1);
  const [coinBalance, setCoinBalance] = useState(0);

  const isAuthenticated = !!token && !!user;

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("saya_token");
    const storedUser = localStorage.getItem("saya_user");
    const storedCompanion = localStorage.getItem("saya_companion");
    const storedSubscription = localStorage.getItem("saya_subscription");
    const storedLevel = localStorage.getItem("saya_affection_level");
    const storedCoins = localStorage.getItem("saya_coin_balance");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedCompanion) setCompanion(JSON.parse(storedCompanion));
      if (storedSubscription) setSubscription(JSON.parse(storedSubscription));
      if (storedLevel) setAffectionLevel(parseInt(storedLevel, 10));
      if (storedCoins) setCoinBalance(parseInt(storedCoins, 10));
    }
    setIsLoading(false);
  }, []);

  // Fetch affection + coins whenever token is set
  useEffect(() => {
    if (token) {
      fetchAffection(token);
      fetchCoins(token);
    }
  }, [token]);

  const fetchAffection = async (t: string) => {
    try {
      const res = await fetch(`${API()}/affection`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        const lvl = data.level ?? 1;
        setAffectionLevel(lvl);
        localStorage.setItem("saya_affection_level", String(lvl));
      }
    } catch {
      // silent — affection is non-critical
    }
  };

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
    localStorage.removeItem("saya_affection_level");
    localStorage.removeItem("saya_coin_balance");
    setToken(null);
    setUser(null);
    setCompanion(null);
    setSubscription(null);
    setAffectionLevel(1);
    setCoinBalance(0);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API()}/user/profile`, {
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

  const fetchCoins = async (t: string) => {
    try {
      const res = await fetch(`${API()}/coins`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        const bal = data.balance ?? 0;
        setCoinBalance(bal);
        localStorage.setItem("saya_coin_balance", String(bal));
      }
    } catch {
      // silent
    }
  };

  const refreshAffection = async () => {
    if (token) await fetchAffection(token);
  };

  const refreshCoins = async () => {
    if (token) await fetchCoins(token);
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
        affectionLevel,
        coinBalance,
        login,
        logout,
        refreshUser,
        refreshAffection,
        refreshCoins,
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
