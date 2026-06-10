"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Eye, EyeOff, Shield, Mail, Lock, User, ArrowLeft, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8007";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email || !formData.email.includes("@")) {
      newErrors.email = "Valid email required";
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = "At least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      login(data.access_token, data.user);
      toast.success("Welcome to Saya! Let's set up your companion.");
      router.push("/onboarding");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: Math.random() * 0.3 + 0.05, scale: 1 }}
            transition={{ delay: Math.random() * 3, duration: 15 + Math.random() * 20, repeat: Infinity }}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              background: 'white',
              borderRadius: '50%',
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-dim hover:text-text transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Saya
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </motion.div>
            <span className="nav-brand text-2xl">Saya</span>
          </div>
        </div>

        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-8">
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
            >
              <Heart className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-gradient-brand mb-2">Create Your Account</h1>
            <p className="text-dim">Start your journey with a companion who truly knows you</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-dim mb-2">
                Name (optional)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field pl-12"
                  placeholder="What should I call you?"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dim mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`input-field pl-12 ${errors.email ? "border-red-500" : ""}`}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dim mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`input-field pl-12 pr-12 ${errors.password ? "border-red-500" : ""}`}
                  placeholder="At least 8 characters"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dim hover:text-text transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-dim mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`input-field pl-12 ${errors.confirmPassword ? "border-red-500" : ""}`}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="space-y-2 text-xs text-dim">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" required className="w-4 h-4 mt-0.5 rounded border-border bg-card text-purple-500 focus:ring-purple-500" />
                <span>I agree to the <a href="#" className="text-purple-500 hover:underline">Terms of Service</a> and <a href="#" className="text-purple-500 hover:underline">Privacy Policy</a></span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-border bg-card text-purple-500 focus:ring-purple-500" />
                <span>I want to receive occasional updates about Saya</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </div>
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-dim text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-gradient-brand hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Benefits reminder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-muted text-sm mb-4">Your free account includes:</p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="badge badge-purple">15 messages/day</span>
            <span className="badge badge-teal">7-day memory</span>
            <span className="badge badge-green">Crisis support</span>
            <span className="badge badge-amber">Friend mode</span>
            <span className="badge badge-dim">Symbolic gifts</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}