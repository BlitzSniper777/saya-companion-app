"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ArrowRight, Loader2, Eye, EyeOff, Mail, Lock, User,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QuestionCard } from "@/components/onboarding/QuestionCard";
import { register } from "@/lib/api";
import toast from "react-hot-toast";

// ── Question definitions (7 steps after credentials) ────────────────────────
const QUESTIONS = [
  {
    id: "q1",
    question: "What brings you to Saya?",
    options: [
      { value: "need_someone",       label: "I need someone to talk to" },
      { value: "going_through_hard", label: "I'm going through something hard" },
      { value: "work_on_myself",     label: "I want to work on myself" },
      { value: "just_curious",       label: "I'm just curious" },
      { value: "something_else",     label: "Something else" },
    ],
    key: "why_came",
  },
  {
    id: "q2",
    question: "How would you describe your communication style?",
    options: [
      { value: "direct",       label: "Direct and to the point" },
      { value: "slow_deep",    label: "I open up slowly but deeply" },
      { value: "love_talk",    label: "I love to talk everything through" },
      { value: "depends_mood", label: "It depends on my mood" },
    ],
    key: "communication_style",
  },
  {
    id: "q3",
    question: "What matters most to you in a friendship?",
    options: [
      { value: "honesty",     label: "Honesty, even when it's hard" },
      { value: "understood",  label: "Feeling truly understood" },
      { value: "humor",       label: "Lightheartedness and humor" },
      { value: "consistency", label: "Consistency and reliability" },
    ],
    key: "friendship_values",
  },
  {
    id: "q4",
    question: "Is faith or spirituality a part of your life?",
    options: [
      { value: "very_important", label: "Yes, it's very important to me" },
      { value: "somewhat",       label: "Somewhat — it comes up sometimes" },
      { value: "not_really",     label: "Not really" },
      { value: "rather_not_say", label: "I'd rather not say" },
    ],
    key: "faith_spirituality",
  },
  {
    id: "q5",
    question: "What's your gender?",
    subtitle: "This helps us personalise your experience.",
    options: [
      { value: "male",           label: "Male" },
      { value: "female",         label: "Female" },
      { value: "nonbinary",      label: "Non-binary" },
      { value: "prefer_not_say", label: "Prefer not to say" },
    ],
    key: "user_gender",
  },
  {
    id: "q6",
    question: "Would you prefer a male or female companion?",
    subtitle: "Your companion will be matched to you automatically.",
    options: [
      { value: "female",        label: "Female companion" },
      { value: "male",          label: "Male companion" },
      { value: "no_preference", label: "No preference" },
    ],
    key: "companion_gender_preference",
  },
  {
    id: "q7",
    question: "What would you like your companion to call you?",
    options: [],
    key: "user_name",
    showInput: true,
    inputPlaceholder: "Your name or nickname",
  },
];

const TOTAL_STEPS = 1 + QUESTIONS.length; // 1 credentials + 7 questions

// ── Password strength helper ─────────────────────────────────────────────────
function passwordStrength(p: string) {
  let s = 0;
  if (p.length >= 8)  s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[a-z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 5);
}
const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];

// ── Component ────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = credentials, 1-7 = questions
  const [creds, setCreds] = useState({ email: "", password: "", confirmPassword: "" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const isCredStep = step === 0;
  const qIndex = step - 1;
  const currentQ = QUESTIONS[qIndex];
  const isLastStep = step === TOTAL_STEPS - 1;

  // ── Credentials validation ─────────────────────────────────────────────────
  const validateCreds = () => {
    const e: Record<string, string> = {};
    if (!creds.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(creds.email)) e.email = "Invalid email";
    if (!creds.password) e.password = "Password is required";
    else if (creds.password.length < 8) e.password = "At least 8 characters";
    if (creds.password !== creds.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (isCredStep) {
      if (!validateCreds()) return;
      setStep(1);
      return;
    }
    if (currentQ.showInput && !answers[currentQ.key]) {
      toast.error("Please enter your name");
      return;
    }
    if (isLastStep) { handleSubmit(); return; }
    setStep((s) => s + 1);
  };

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQ.key]: value }));
    if (!currentQ.showInput && !isLastStep) {
      setTimeout(() => setStep((s) => s + 1), 300);
    }
  };

  // ── Final submit ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = await register({
        email:                      creds.email,
        password:                   creds.password,
        user_name:                  answers.user_name          || "Friend",
        why_came:                   answers.why_came           || "just_curious",
        communication_style:        answers.communication_style || "depends_mood",
        friendship_values:          answers.friendship_values   || "understood",
        faith_spirituality:         answers.faith_spirituality  || "rather_not_say",
        user_gender:                answers.user_gender         || "prefer_not_say",
        companion_gender_preference: answers.companion_gender_preference || "no_preference",
      });
      localStorage.setItem("saya_token", data.access_token);
      localStorage.setItem("saya_user", JSON.stringify(data.user));
      const companionName = (data.user as any)?.user_preferences?.companion_name || "your companion";
      toast.success(`Meet ${companionName}! Ready to chat. ✨`);
      router.push("/chat");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(creds.password);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 25 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: Math.random() * 0.25 + 0.05, scale: 1 }}
            transition={{ delay: Math.random() * 3, duration: 15 + Math.random() * 20, repeat: Infinity }}
            style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              background: "white",
              borderRadius: "50%",
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* Progress bar */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="progress-bar mb-1.5">
            <motion.div
              className="progress-fill"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-dim text-center">Step {step + 1} of {TOTAL_STEPS}</p>
        </motion.div>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 0: Credentials ─────────────────────────────────────── */}
          {isCredStep && (
            <motion.div
              key="creds"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-8"
            >
              <div className="text-center mb-7">
                <h1 className="text-2xl font-extrabold text-gradient-brand mb-1">Create your account</h1>
                <p className="text-dim text-sm">Start your 7-day free trial — no card needed</p>
              </div>

              <div className="space-y-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={creds.email}
                  onChange={(e) => { setCreds((p) => ({ ...p, email: e.target.value })); setErrors((p) => ({ ...p, email: "" })); }}
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
                    value={creds.password}
                    onChange={(e) => { setCreds((p) => ({ ...p, password: e.target.value })); setErrors((p) => ({ ...p, password: "" })); }}
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {creds.password && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-card2 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${STRENGTH_COLORS[strength - 1] || "bg-card2"}`}
                        animate={{ width: `${(strength / 5) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-dim">
                      Strength: <span className="font-medium text-text">{STRENGTH_LABELS[strength - 1] || "Very weak"}</span>
                    </p>
                  </div>
                )}

                <Input
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={creds.confirmPassword}
                  onChange={(e) => { setCreds((p) => ({ ...p, confirmPassword: e.target.value })); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  disabled={loading}
                  autoComplete="new-password"
                  icon={<Lock className="w-5 h-5" />}
                />

                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="w-4 h-4 mt-0.5 rounded border-border bg-card text-purple focus:ring-purple"
                  />
                  <label htmlFor="terms" className="text-sm text-dim">
                    I agree to the{" "}
                    <Link href="#" className="text-purple hover:underline">Terms of Service</Link>{" "}
                    and{" "}
                    <Link href="#" className="text-purple hover:underline">Privacy Policy</Link>
                  </label>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full mt-6 py-3">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>

              <div className="mt-5 pt-5 border-t border-border text-center">
                <p className="text-dim text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-gradient-brand hover:underline font-medium">Sign in</Link>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Steps 1–7: Questions ────────────────────────────────────── */}
          {!isCredStep && currentQ && (
            <motion.div
              key={currentQ.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-8"
            >
              {currentQ.subtitle && (
                <p className="text-dim text-sm text-center mb-2">{currentQ.subtitle}</p>
              )}
              <QuestionCard
                question={currentQ.question}
                options={currentQ.options}
                selectedValue={answers[currentQ.key] || ""}
                onSelect={handleSelect}
                showInput={currentQ.showInput}
                inputPlaceholder={(currentQ as any).inputPlaceholder}
                inputValue={answers[currentQ.key]}
                onInputChange={(v) => setAnswers((prev) => ({ ...prev, [currentQ.key]: v }))}
              />

              {isLastStep && (
                <p className="text-center text-xs text-dim mt-5">
                  Your companion will be matched based on your answers ✨
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation (question steps only) */}
        {!isCredStep && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mt-6"
          >
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="min-w-[90px]">
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading || (currentQ.showInput && !answers[currentQ.key])}
              className="min-w-[140px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isLastStep ? "Matching..." : "Next"}
                </span>
              ) : isLastStep ? (
                <span className="flex items-center gap-1">Meet My Companion <Sparkles className="w-4 h-4" /></span>
              ) : (
                <span className="flex items-center gap-1">Next <ArrowRight className="w-4 h-4" /></span>
              )}
            </Button>
          </motion.div>
        )}

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted mt-5">
          {isCredStep
            ? "7-day free trial · No credit card required · Cancel anytime"
            : "Your answers help match you with the right companion. All data is encrypted."}
        </motion.p>
      </div>
    </div>
  );
}
