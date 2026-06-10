"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { register } from "@/lib/api";
import toast from "react-hot-toast";

const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 5);
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "", full_name: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await register({ email: formData.email, password: formData.password, full_name: formData.full_name });
      localStorage.setItem("saya_token", data.access_token);
      localStorage.setItem("saya_user", JSON.stringify(data.user));
      toast.success("Account created! Welcome to Saya.");
      router.push("/onboarding");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(formData.password);
  const strengthLabels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

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
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <motion.div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card p-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-gradient-brand mb-2">Create your account</h1>
            <p className="text-dim">Start your journey with Saya today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name (optional)"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Your name"
              disabled={loading}
              autoComplete="name"
              icon={<User className="w-5 h-5" />}
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              disabled={loading}
              autoComplete="email"
              icon={<Mail className="w-5 h-5" />}
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.password}
                disabled={loading}
                autoComplete="new-password"
                icon={<Lock className="w-5 h-5" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[38px] text-dim hover:text-text transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength */}
            {formData.password && (
              <div className="space-y-1.5">
                <div className="h-1.5 rounded-full bg-card2 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full transition-all duration-300", strengthColors[strength - 1] || "bg-card2")}
                    initial={{ width: 0 }}
                    animate={{ width: `${(strength / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-dim">
                  Password strength: <span className="font-medium text-text">{strengthLabels[strength - 1] || "Very weak"}</span>
                </p>
              </div>
            )}

            <div className="relative">
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                error={errors.confirmPassword}
                disabled={loading}
                autoComplete="new-password"
                icon={<Lock className="w-5 h-5" />}
              />
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                className="w-4 h-4 mt-0.5 rounded border-border bg-card text-purple focus:ring-purple"
              />
              <label htmlFor="terms" className="text-sm text-dim">
                I agree to the{' '}
                <Link href="#" className="text-purple hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="#" className="text-purple hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <Button type="submit" className="w-full py-3" loading={loading}>
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </div>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-dim text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gradient-brand hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}