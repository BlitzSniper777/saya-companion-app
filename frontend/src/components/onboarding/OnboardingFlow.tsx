"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { QuestionCard } from "./QuestionCard";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/api";
import toast from "react-hot-toast";

const questions = [
  {
    id: "q1",
    question: "What brings you to Saya?",
    options: [
      { value: "need_someone",      label: "I need someone to talk to" },
      { value: "going_through_hard", label: "I'm going through something hard" },
      { value: "work_on_myself",    label: "I want to work on myself" },
      { value: "just_curious",      label: "I'm just curious" },
      { value: "something_else",    label: "Something else" },
    ],
    key: "q1_what_brings_you",
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
    key: "q2_communication_style",
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
    key: "q3_friendship_values",
  },
  {
    id: "q4",
    question: "Is faith or spirituality a part of your life?",
    options: [
      { value: "very_important",  label: "Yes, it's very important to me" },
      { value: "somewhat",        label: "Somewhat — it comes up sometimes" },
      { value: "not_really",      label: "Not really" },
      { value: "rather_not_say",  label: "I'd rather not say" },
    ],
    key: "q4_faith_spirituality",
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
    key: "q5_user_name",
    showInput: true,
    inputPlaceholder: "Your name or nickname",
  },
];

export function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
    if (!currentQuestion.showInput && !isLastStep) {
      setTimeout(() => setCurrentStep((s) => s + 1), 300);
    }
  };

  const handleInputChange = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
  };

  const handleNext = () => {
    if (currentQuestion.showInput && !answers[currentQuestion.key]) {
      toast.error("Please enter your name");
      return;
    }
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await completeOnboarding({
        q1_what_brings_you:         answers.q1_what_brings_you   || "just_curious",
        q2_communication_style:     answers.q2_communication_style || "depends_mood",
        q3_friendship_values:       answers.q3_friendship_values  || "understood",
        q4_faith_spirituality:      answers.q4_faith_spirituality || "rather_not_say",
        q5_user_name:               answers.q5_user_name          || "Friend",
        user_gender:                answers.user_gender            || "prefer_not_say",
        companion_gender_preference: answers.companion_gender_preference || "no_preference",
      });
      const companionName = (res as any)?.companion?.name || "your companion";
      toast.success(`Meet ${companionName}! Ready to chat.`);
      router.push("/chat");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-bg flex relative overflow-hidden">
      {/* Background particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: Math.random() * 0.2 + 0.05, scale: 1 }}
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

      <div className="w-full max-w-2xl mx-auto px-4 py-12 flex flex-col">
        {/* Progress */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="progress-bar mb-2">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-dim text-center">Step {currentStep + 1} of {questions.length}</p>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-8"
          >
            {(currentQuestion as any).subtitle && (
              <p className="text-dim text-sm text-center mb-2">{(currentQuestion as any).subtitle}</p>
            )}
            <QuestionCard
              question={currentQuestion.question}
              options={currentQuestion.options}
              selectedValue={answers[currentQuestion.key] || ""}
              onSelect={handleSelect}
              showInput={currentQuestion.showInput}
              inputPlaceholder={(currentQuestion as any).inputPlaceholder}
              inputValue={answers[currentQuestion.key]}
              onInputChange={handleInputChange}
            />

            {/* Final step: show that companion will be revealed */}
            {isLastStep && (
              <p className="text-center text-xs text-dim mt-6">
                Your companion will be matched to you based on your answers ✨
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mt-8"
        >
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="min-w-[100px]">
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading || (currentQuestion.showInput && !answers[currentQuestion.key])}
            className="min-w-[140px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLastStep ? "Matching..." : "Next"}
              </div>
            ) : isLastStep ? (
              <>Meet My Companion <Sparkles className="w-4 h-4" /></>
            ) : (
              <>Next <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-muted mt-6">
          Your answers help match you with the right companion. All data is encrypted and private.
        </motion.p>
      </div>
    </div>
  );
}
