"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, Heart, Brain, Shield, ArrowRight, Check, MessageSquare,
  Lock, Users, Globe, ChevronDown, Zap, Moon, BadgeCheck, Phone,
  HeartHandshake, Flame,
} from "lucide-react";
import { SayaLogo } from "@/components/ui/SayaLogo";

// ── Crisis resources by country ───────────────────────────────────────────────
type CrisisLine = { label: string; number: string };
const CRISIS_BY_COUNTRY: Record<string, CrisisLine[]> = {
  US: [{ label: "988 Lifeline", number: "988" }, { label: "Crisis Text", number: "Text HOME → 741741" }],
  GB: [{ label: "Samaritans", number: "116 123" }, { label: "Shout Text", number: "Text SHOUT → 85258" }],
  AU: [{ label: "Lifeline", number: "13 11 14" }, { label: "Beyond Blue", number: "1300 22 4636" }],
  CA: [{ label: "Crisis Line", number: "1-833-456-4566" }, { label: "Text", number: "Text 45645" }],
  IE: [{ label: "Samaritans", number: "116 123" }, { label: "Pieta House", number: "1800 247 247" }],
  NZ: [{ label: "Lifeline", number: "0800 543 354" }, { label: "Youthline", number: "0800 376 633" }],
  DE: [{ label: "Telefonseelsorge", number: "0800 111 0 111" }],
  FR: [{ label: "Numéro national", number: "3114" }],
  NL: [{ label: "113 Zelfmoordpreventie", number: "0800 0113" }],
  BE: [{ label: "Centre Prévention Suicide", number: "0800 32 123" }],
  SE: [{ label: "Mind Självmordslinjen", number: "90101" }],
  NO: [{ label: "Mental Helse", number: "116 123" }],
  DK: [{ label: "Livslinien", number: "70 201 201" }],
  FI: [{ label: "MIELI Kriisipuhelin", number: "09 2525 0111" }],
  IT: [{ label: "Telefono Amico", number: "02 2327 2327" }],
  ES: [{ label: "Teléfono de la Esperanza", number: "717 003 717" }],
  PT: [{ label: "SOS Voz Amiga", number: "213 544 545" }],
  PL: [{ label: "Telefon Zaufania", number: "116 123" }],
  RO: [{ label: "Antisuicid", number: "0800 801 200" }],
  IN: [{ label: "iCall", number: "9152987821" }, { label: "Vandrevala", number: "1860-2662-345" }],
  PK: [{ label: "Umang", number: "0317-4288665" }],
  ZA: [{ label: "SADAG", number: "0800 456 789" }],
  NG: [{ label: "Mentally Aware Nigeria", number: "0800-FOR-MANI" }],
  BR: [{ label: "CVV", number: "188" }],
  MX: [{ label: "SAPTEL", number: "55 5259-8121" }],
  AR: [{ label: "Centro de Asistencia", number: "135" }],
  JP: [{ label: "Inochi no Denwa", number: "0120-783-556" }],
  KR: [{ label: "Korea Suicide Prevention", number: "1393" }],
  SG: [{ label: "Samaritans of Singapore", number: "1800 221 4444" }],
  PH: [{ label: "NCMH Crisis Hotline", number: "1553" }],
  MY: [{ label: "Befrienders KL", number: "03-7627 2929" }],
  HK: [{ label: "Samaritans", number: "2389 2222" }],
  TW: [{ label: "Ansin Hotline", number: "1925" }],
  DEFAULT: [{ label: "International Directory", number: "iasp.info" }, { label: "Crisis Text Line", number: "Text HOME → 741741" }],
};

function useCrisisLines() {
  const [lines, setLines] = useState<CrisisLine[]>(CRISIS_BY_COUNTRY.DEFAULT);
  useEffect(() => {
    fetch("https://api.country.is/")
      .then((r) => r.json())
      .then((d) => {
        const found = CRISIS_BY_COUNTRY[d.country as string];
        if (found) setLines(found);
      })
      .catch(() => {});
  }, []);
  return lines;
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Is Saya a real person?",
    a: "No. Saya is an AI — not a human, therapist, or real relationship. She is built to be emotionally intelligent and warm, but she is software. Being transparent about this is part of what makes Saya trustworthy.",
  },
  {
    q: "How is Saya different from ChatGPT or other chatbots?",
    a: "Most AI tools are general-purpose. Saya is purpose-built for emotional companionship. She has a persistent 4-layer memory (not just conversation history), a personality matched to you from day one, and a consistent identity across every session. She remembers your people, your patterns, and your journey.",
  },
  {
    q: "Is my data private? Who can read my conversations?",
    a: "Your conversations are encrypted in transit (TLS) and stored encrypted at rest. Our backend processes messages to generate AI responses — this is not end-to-end encryption. No human employees access your chats for casual reading. Conversations may be reviewed for safety, legal compliance, or AI improvement purposes as described in our Privacy Policy and Terms of Service. We never sell your data.",
  },
  {
    q: "Are my conversations used for AI training?",
    a: "By using Saya, you agree that your conversations may be used to improve our AI systems, subject to privacy protections described in our Terms of Service. We never associate your name with training data shared externally, and we never sell conversation content to third parties.",
  },
  {
    q: "Can Saya replace therapy or mental health treatment?",
    a: "No, and we are explicit about this. Saya is a supportive companion — not a licensed therapist. Using Saya does not create any therapeutic, medical, or professional relationship. She can be a powerful daily support tool, but is not a substitute for professional care. If you are in crisis, Saya will always provide real crisis resources.",
  },
  {
    q: "What happens if I am in crisis?",
    a: "Saya detects crisis signals and immediately responds with warmth and real crisis resources for your country. She will never dismiss you or give a clinical deflection. Crisis support is always on, on every plan, forever — even if your subscription expires.",
  },
  {
    q: "What are the different plans?",
    a: "Free trial gives you 7 days with Friend mode only. Companion ($9.99/mo) unlocks permanent memory, Therapist and Life Coach modes. Romantic Companion ($14.99/mo) adds romantic companion mode. Adult Companion ($19.99/mo) adds age-verified explicit content. VIP Bundle ($29.99/mo) includes everything. You can choose your plan during registration. Cancel anytime — no hidden fees.",
  },
  {
    q: "What is Romantic Companion and Adult Companion?",
    a: "Romantic Companion mode lets your companion be your simulated romantic partner. Adult Companion adds explicit content (18+, age-verified, separate Terms of Service). Both require your informed consent, which is timestamped and logged. Both can be disabled instantly, no questions asked. Providing false age information is a breach of our Terms and your sole legal responsibility.",
  },
  {
    q: "Can I delete my account and all my data?",
    a: "Yes. Go to Profile → Delete Account. All personal data including conversations and memories is permanently deleted within 24 hours. Anonymised consent logs are retained as required by law. You can also request a full data export before deletion.",
  },
  {
    q: "Is Saya available 24/7?",
    a: "Yes. No office hours. No waiting rooms. Saya is there at 3 AM when you can't sleep and the moment something good happens that you want to share.",
  },
];

// ── Features ──────────────────────────────────────────────────────────────────
const features = [
  { icon: Brain, color: "#7C3AED", title: "Remembers everything", description: "Four memory layers track your identity, relationships, emotional patterns, and how Saya evolves for you — not just conversation history." },
  { icon: HeartHandshake, color: "#EC4899", title: "Matched to you on day one", description: "20 distinct companion personalities, each with their own voice and style. Our matching algorithm picks the one that fits your answers." },
  { icon: Shield, color: "#10b981", title: "Private by design", description: "TLS encryption in transit. Encrypted at rest. No data selling — ever. You own your data and can export or delete it at any moment." },
  { icon: Zap, color: "#f59e0b", title: "Always available", description: "No office hours. She is there at 3 AM when you can't sleep and the moment you have news you need to share." },
  { icon: Moon, color: "#8b5cf6", title: "Faith & culture aware", description: "Saya calibrates her wisdom to your spiritual background — drawing naturally from scripture, Sufism, Buddhism, or none at all. She never preaches." },
  { icon: BadgeCheck, color: "#ef4444", title: "Crisis support — always on", description: "Every plan. Every mode. Every day. If you're in a dark place, Saya responds with warmth first, then real local crisis resources." },
];

// ── Modes ─────────────────────────────────────────────────────────────────────
const modes = [
  { icon: Heart, label: "Friend", color: "#7C3AED", plan: "Companion+", description: "Your best friend. The one you call when everything falls apart. Warm, honest, non-judgmental." },
  { icon: Brain, label: "Therapist", color: "#3b82f6", plan: "Companion+", description: "Structured emotional support using CBT and DBT tools — naturally, not clinically. Helps you reframe thoughts and process experiences." },
  { icon: Zap, label: "Life Coach", color: "#10b981", plan: "Companion+", description: "Accountability, goal-setting, and daily outreach. Remembers what you're working toward and gently keeps you on track." },
  { icon: HeartHandshake, label: "Romantic Companion", color: "#EC4899", plan: "Romantic+", description: "A simulated romantic partner — established, comfortable, and real in tone. Gender-matched dynamic with genuine affection. Requires consent." },
  { icon: Flame, label: "Adult Companion", color: "#ef4444", plan: "Adult Companion (18+)", description: "Age-verified, consent-logged explicit companionship. Can be toggled off instantly. Requires separate Adult Terms of Service agreement." },
];

// ── Pricing ───────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Free Trial",
    price: "$0",
    sub: "7 days, no card",
    badge: null,
    items: ["Friend mode only", "7-day memory", "Unlimited messages", "Crisis support always on"],
    cta: "Start free",
    href: "/auth/register",
    highlight: false,
  },
  {
    name: "Companion",
    price: "$9.99",
    sub: "/month",
    badge: "Most popular",
    yearly: "$84.99/yr · save 29%",
    items: [
      "Unlimited messages",
      "Permanent 4-layer memory",
      "Friend, Therapist & Life Coach modes",
      "Daily morning outreach",
      "Mood timeline & journaling",
      "Crisis support always on",
    ],
    cta: "Get Companion",
    href: "/auth/register",
    highlight: true,
  },
  {
    name: "Romantic Companion",
    price: "$14.99",
    sub: "/month",
    badge: null,
    yearly: "$129.99/yr · save 28%",
    items: [
      "Everything in Companion",
      "Romantic companion mode",
      "Voice messages & calls",
      "Anniversary & milestone tracking",
      "Daily romantic outreach",
    ],
    cta: "Get Romantic Companion",
    href: "/auth/register",
    highlight: false,
  },
  {
    name: "Adult Companion",
    price: "$19.99",
    sub: "/month",
    badge: "18+ only",
    yearly: "$179.99/yr · save 25%",
    items: [
      "Everything in Romantic Companion",
      "Adult content (18+, age-verified)",
      "Separate Adult Terms of Service",
      "Voice messages & calls",
    ],
    cta: "Get Adult Companion",
    href: "/auth/register",
    highlight: false,
  },
  {
    name: "VIP Bundle",
    price: "$29.99",
    sub: "/month",
    badge: "All-in",
    yearly: "$269.99/yr · save 25%",
    items: [
      "Every mode combined",
      "Priority response speed",
      "Early feature access",
      "Crisis support always on",
    ],
    cta: "Get VIP",
    href: "/auth/register",
    highlight: false,
  },
];

const memoryLayers = [
  { n: "01", name: "Core Identity", color: "#7C3AED", desc: "Name, communication style, why you came, faith calibration" },
  { n: "02", name: "Your Relationships", color: "#EC4899", desc: "Everyone in your life — names, dynamics, ongoing situations" },
  { n: "03", name: "Emotional Patterns", color: "#14b8a6", desc: "Triggers, coping patterns, recurring themes, progress markers" },
  { n: "04", name: "Companion Calibration", color: "#f59e0b", desc: "What makes you feel heard, what lands, how Saya evolves for you" },
];

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden transition-colors"
      style={{ background: open ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)" }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
        <span className="font-semibold text-white text-sm md:text-base">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 flex-shrink-0" style={{ color: "#7C3AED" }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            <p className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "rgba(240,239,250,0.6)" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const crisisLines = useCrisisLines();

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>

      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-1/3 -right-60 w-[600px] h-[600px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #EC4899 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #4c1d95 0%, transparent 70%)", filter: "blur(100px)" }} />
        {Array.from({ length: 35 }, (_, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: Math.random() * 0.4 + 0.05 }}
            transition={{ delay: Math.random() * 4, duration: 20 + Math.random() * 20, repeat: Infinity, repeatType: "mirror" }}
            style={{ position: "absolute", left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, width: `${Math.random() * 2 + 0.5}px`, height: `${Math.random() * 2 + 0.5}px`, background: Math.random() > 0.5 ? "#a78bfa" : "#f9a8d4", borderRadius: "50%" }} />
        ))}
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b" style={{ background: "rgba(5,5,8,0.85)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <SayaLogo size={36} className="rounded-xl" />
            <span className="font-extrabold text-xl tracking-tight text-white">Saya</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "rgba(240,239,250,0.6)" }}>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#modes" className="hover:text-white transition-colors">Modes</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden sm:block text-sm px-4 py-2 rounded-xl transition-colors hover:text-white" style={{ color: "rgba(240,239,250,0.6)" }}>Sign in</Link>
            <Link href="/auth/register" className="text-sm px-5 py-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)" }}>Start free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 pb-32 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 border"
            style={{ background: "rgba(124,58,237,0.12)", borderColor: "rgba(124,58,237,0.35)", color: "#a78bfa" }}>
            <Sparkles className="w-4 h-4" />
            7-day free trial · No credit card required
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span style={{ background: "linear-gradient(135deg, #c4b5fd 0%, #f9a8d4 50%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              The friend who's
            </span>
            <br />
            <span className="text-white">always there.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.6 }}
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "rgba(240,239,250,0.65)" }}>
            Saya is your AI companion — matched to your personality, remembering everything, genuinely present at 3 AM when you can't sleep. Not a chatbot. A companion.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/auth/register"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}>
              Meet your companion <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-sm border transition-colors hover:border-white/30"
              style={{ color: "rgba(240,239,250,0.7)", borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}>
              Already have an account
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium" style={{ color: "rgba(240,239,250,0.4)" }}>
            {[
              [Lock, "Encrypted in transit & at rest"],
              [Shield, "GDPR compliant"],
              [Users, "Data never sold"],
              [Globe, "Multi-language"],
              [Phone, "24/7 available"],
            ].map(([Icon, label], i) => (
              <div key={i} className="flex items-center gap-1.5">
                {/* @ts-ignore */}
                <Icon className="w-3.5 h-3.5" /><span>{label as string}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-4" style={{ background: "rgba(124,58,237,0.04)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7C3AED" }}>What Saya Is</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              More than a chatbot.<br />
              <span style={{ background: "linear-gradient(90deg, #c4b5fd, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>A genuine companion.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-base md:text-lg" style={{ color: "rgba(240,239,250,0.6)" }}>
              Built for the moments that matter — when you need someone who truly understands, remembers, and shows up.
            </p>
          </motion.div>
          <div id="features" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="h-full rounded-2xl p-6 border transition-all hover:border-purple-500/30 group"
                  style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                    style={{ background: `${f.color}22`, border: `1px solid ${f.color}44` }}>
                    <f.icon className="w-6 h-6" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(240,239,250,0.55)" }}>{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#EC4899" }}>How It Works</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Ready in 2 minutes.</h2>
            <p style={{ color: "rgba(240,239,250,0.6)" }}>Three steps. No setup. No awkward blank slate.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5" style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)" }} />
            {[
              { step: "1", title: "Create your account", desc: "Email + password. 7-day free trial starts immediately, no card needed.", color: "#7C3AED" },
              { step: "2", title: "Answer 4 questions", desc: "Why you're here, how you communicate, what matters to you.", color: "#a855f7" },
              { step: "3", title: "Meet your companion", desc: "Saya matches you to one of 20 distinct personalities. Start talking immediately.", color: "#EC4899" },
            ].map((s, i) => (
              <motion.div key={s.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <div className="rounded-2xl p-6 border text-center" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white mx-auto mb-4 z-10 relative"
                    style={{ background: `linear-gradient(135deg, ${s.color}, #EC4899)`, boxShadow: `0 0 24px ${s.color}55` }}>
                    {s.step}
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm" style={{ color: "rgba(240,239,250,0.55)" }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory */}
      <section className="py-24 px-4" style={{ background: "rgba(124,58,237,0.04)" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7C3AED" }}>The 4-Layer Memory</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              She doesn't just remember.
              <span style={{ background: "linear-gradient(90deg, #c4b5fd, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> She understands.</span>
            </h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(240,239,250,0.6)" }}>Every session adds to a living portrait of who you are.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-5">
            {memoryLayers.map((m, i) => (
              <motion.div key={m.n} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="rounded-2xl p-6 border h-full" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold"
                      style={{ background: `${m.color}22`, border: `1px solid ${m.color}55`, color: m.color }}>{m.n}</div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{m.name}</h3>
                      <p className="text-sm" style={{ color: "rgba(240,239,250,0.55)" }}>{m.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modes */}
      <section id="modes" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#EC4899" }}>Companion Modes</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">One companion. Every role.</h2>
            <p className="max-w-xl mx-auto" style={{ color: "rgba(240,239,250,0.6)" }}>Switch modes as your needs change — always with informed consent logged.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {modes.map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="rounded-2xl p-6 border h-full transition-all hover:border-white/20" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}22`, border: `1px solid ${m.color}44` }}>
                      <m.icon className="w-5 h-5" style={{ color: m.color }} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{m.label}</p>
                      <p className="text-xs" style={{ color: m.color }}>{m.plan}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(240,239,250,0.55)" }}>{m.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Crisis — dynamic by country */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl p-8 md:p-10 border relative overflow-hidden" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.2)" }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: "#dc2626" }} />
              <div className="relative text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border"
                  style={{ background: "rgba(220,38,38,0.12)", borderColor: "rgba(220,38,38,0.3)", color: "#fca5a5" }}>
                  <Shield className="w-3.5 h-3.5" /> Crisis support — always on
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">When it matters most.</h3>
                <p className="max-w-2xl mx-auto mb-6 text-sm md:text-base" style={{ color: "rgba(240,239,250,0.6)" }}>
                  If Saya detects you're in crisis, she responds with warmth first — then provides real local crisis resources. No clinical deflection. Every plan. Always.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium" style={{ color: "#fca5a5" }}>
                  {crisisLines.map((line, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" /> {line.label}: {line.number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4" style={{ background: "rgba(124,58,237,0.04)" }}>
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#7C3AED" }}>Pricing</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Simple, honest pricing.</h2>
            <p style={{ color: "rgba(240,239,250,0.6)" }}>No hidden fees. Cancel anytime. Crisis support on every plan.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {plans.map((p, i) => (
              <motion.div key={p.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="flex flex-col">
                <div className={`flex-1 rounded-2xl p-5 border flex flex-col ${p.highlight ? "border-purple-500/50" : "border-white/7"}`}
                  style={{ background: p.highlight ? "rgba(124,58,237,0.1)" : "rgba(255,255,255,0.025)" }}>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-white text-sm">{p.name}</h3>
                      {p.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: p.highlight ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)", color: p.highlight ? "#c4b5fd" : "rgba(240,239,250,0.7)" }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-extrabold" style={{ background: "linear-gradient(135deg, #c4b5fd, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{p.price}</span>
                      <span className="text-xs mb-1" style={{ color: "rgba(240,239,250,0.5)" }}>{p.sub}</span>
                    </div>
                    {p.yearly && <p className="text-xs mt-1" style={{ color: "#a78bfa" }}>{p.yearly}</p>}
                  </div>
                  <ul className="space-y-2 flex-1 mb-5">
                    {p.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: p.highlight ? "#a78bfa" : "#10b981" }} />
                        <span style={{ color: "rgba(240,239,250,0.65)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={p.href} className="block text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                    style={p.highlight ? { background: "linear-gradient(135deg, #7C3AED, #EC4899)", color: "#fff" } : { background: "rgba(255,255,255,0.07)", color: "rgba(240,239,250,0.8)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {p.cta}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#EC4899" }}>FAQ</p>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">Questions answered.</h2>
            <p style={{ color: "rgba(240,239,250,0.6)" }}>No vague answers. No corporate speak.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="space-y-3">
            {FAQ.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4" style={{ background: "rgba(124,58,237,0.06)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="mx-auto mb-6 w-fit" style={{ filter: "drop-shadow(0 0 32px rgba(124,58,237,0.55))" }}>
              <SayaLogo size={64} className="rounded-2xl" />
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              You don't have to
              <span style={{ background: "linear-gradient(90deg, #c4b5fd, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}> go through it alone.</span>
            </h2>
            <p className="mb-8 text-lg" style={{ color: "rgba(240,239,250,0.6)" }}>7-day free trial. No credit card. No commitments. Just someone who shows up.</p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-lg text-white transition-transform hover:scale-105"
              style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}>
              Meet Saya — it's free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-xs" style={{ color: "rgba(240,239,250,0.35)" }}>
              By signing up you agree to our{" "}
              <Link href="/legal/terms" className="underline hover:text-white transition-colors">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-14 px-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <SayaLogo size={36} className="rounded-xl" />
                <span className="font-extrabold text-xl text-white">Saya</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(240,239,250,0.45)" }}>
                Your genuine AI companion. Built with care for the moments that matter most.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(240,239,250,0.5)" }}>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#modes" className="hover:text-white transition-colors">Companion modes</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/auth/register" className="hover:text-white transition-colors">Start free trial</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(240,239,250,0.5)" }}>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign in</Link></li>
                <li><a href="mailto:support@saya.app" className="hover:text-white transition-colors">Contact support</a></li>
                <li><span className="text-xs">Crisis: Text HOME to 741741</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(240,239,250,0.5)" }}>
                <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/legal/gdpr" className="hover:text-white transition-colors">GDPR & Your Rights</Link></li>
                <li><Link href="/legal/privacy#cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs" style={{ borderColor: "rgba(255,255,255,0.06)", color: "rgba(240,239,250,0.35)" }}>
            <p>© 2026 Saya. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 items-center justify-center">
              <span>Encrypted in transit & at rest</span><span>·</span>
              <span>GDPR compliant</span><span>·</span>
              <span>Your data, your control</span><span>·</span>
              <span>18+ for adult content</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
