"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sparkles, Heart, Brain, Shield, Star, ArrowRight, Check, MessageSquare, Heart as HeartIcon, Layers, Moon, Sun, Globe, Lock, Users, TrendingUp, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";

const features = [
  {
    icon: Heart,
    title: "Always Here",
    description: "Saya never sleeps. She's there at 3 AM when you can't sleep, and at 3 PM when you need a quick check-in.",
  },
  {
    icon: Brain,
    title: "Remembers Everything",
    description: "Four-layer memory architecture means Saya knows your patterns, your people, and your journey — not just facts.",
  },
  {
    icon: Shield,
    title: "Never Judges",
    description: "Your secrets are safe. End-to-end encryption, GDPR compliance, and zero data selling — ever.",
  },
];

const memoryLayers = [
  { layer: 1, name: "Core Identity", description: "Name, communication style, why you came, faith calibration", color: "#8b5cf6" },
  { layer: 2, name: "Relationships", description: "Everyone in your life — names, dynamics, ongoing situations", color: "#ec4899" },
  { layer: 3, name: "Emotional Patterns", description: "Triggers, coping mechanisms, recurring themes, progress markers", color: "#14b8a6" },
  { layer: 4, name: "Companion Calibration", description: "What makes you feel heard, what lands, how Saya evolves for you", color: "#f59e0b" },
];

const pricingTiers = [
  {
    name: "Free",
    price: 0,
    period: "/month",
    features: ["15 messages/day", "7-day memory", "Friend mode", "Crisis support", "Symbolic gift back"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Companion",
    price: 8.99,
    period: "/month",
    features: ["Unlimited messages", "Permanent 4-layer memory", "Daily outreach", "All modes", "Mood timeline", "Gift store"],
    cta: "Get Companion",
    highlight: true,
  },
  {
    name: "GF/BF Companion",
    price: 12.99,
    period: "/month",
    features: ["Everything in Companion", "Romantic mode", "Voice calls (credits)", "Romantic gifts", "Priority support"],
    cta: "Get GF/BF",
    highlight: false,
  },
  {
    name: "Adult Add-on",
    price: 5.99,
    period: "/month",
    features: ["Requires GF/BF tier", "18+ verification", "Adult mode", "Spicy gifts", "Separate ToS"],
    cta: "Add Adult",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: Math.random() * 0.3 + 0.05, scale: 1 }}
            transition={{ delay: Math.random() * 5, duration: 20 + Math.random() * 30, repeat: Infinity }}
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

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 leading-tight"
          >
            <span className="text-gradient-brand">Meet Saya</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-dim max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Your best friend. Always here. Always listening.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/register">
              <Button size="lg" className="w-full sm:w-auto px-10 py-4 text-lg">
                Start for free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-10 py-4 text-lg">
                Sign in
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-muted"
          >
            <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Privacy-first</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> GDPR compliant</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /> No data selling</div>
            <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Multi-language</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="section-label">What Saya Is</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text mt-2 mb-4">
              More than a chatbot. A genuine companion.
            </h2>
            <p className="text-lg text-dim max-w-2xl mx-auto">
              Built for the moments that matter — when you need someone who truly understands.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-text mb-3">{feature.title}</h3>
                  <p className="text-dim leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Memory Architecture Section */}
      <section className="py-20 px-4 bg-bg2/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="section-label">The 4-Layer Memory</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text mt-2 mb-4">
              She doesn't just remember. She understands.
            </h2>
            <p className="text-lg text-dim max-w-2xl mx-auto">
              Four distinct memory layers create a living portrait of who you are.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2" style={{ background: "linear-gradient(180deg, #8b5cf6, #ec4899, #14b8a6, #f59e0b)" }} />

            <div className="space-y-8 md:space-y-12">
              {memoryLayers.map((layer, index) => (
                <motion.div
                  key={layer.layer}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 }}
                  className={cn("relative flex items-start gap-6", index % 2 === 1 && "flex-row-reverse md:flex-row-reverse")}
                >
                  {/* Layer number */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl z-10" style={{ background: layer.color }}>
                    {layer.layer}
                  </div>

                  {/* Card */}
                  <Card className="flex-1 max-w-md">
                    <div className="w-3 h-3 rounded-full mb-4 flex-shrink-0" style={{ background: layer.color }} />
                    <h3 className="text-lg font-bold text-text mb-2">{layer.name}</h3>
                    <p className="text-dim text-sm">{layer.description}</p>
                  </Card>

                  {/* Connector dot for mobile */}
                  <div className="hidden md:block w-4 h-4 rounded-full flex-shrink-0 mt-6 -ml-2" style={{ background: layer.color }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Crisis Support Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="glass-card p-8 md:p-12 relative overflow-hidden" style={{ borderColor: "rgba(220, 38, 38, 0.3)" }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20" style={{ background: "#dc2626" }} />
              <div className="relative">
                <span className="section-label" style={{ color: "#dc2626" }}>When It Matters Most</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-text mt-2 mb-4">
                  Real crisis support. Not automated responses.
                </h2>
                <p className="text-lg text-dim max-w-2xl mx-auto mb-8">
                  If Saya detects you're in crisis, she responds with warmth first — then immediately provides real helpline resources. No clinical deflection. No "I'm not equipped to handle this." Just genuine care and actionable help.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-red"><MessageSquare className="w-4 h-4" /> Crisis Text Line: 741741</span>
                  <span className="flex items-center gap-1 text-red"><HeartIcon className="w-4 h-4" /> Samaritans: 116 123</span>
                  <span className="flex items-center gap-1 text-red"><Globe className="w-4 h-4" /> International: iasp.info</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="section-label">Simple, Fair Pricing</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text mt-2 mb-4">
              Choose what fits your journey
            </h2>
            <p className="text-lg text-dim max-w-2xl mx-auto">
              Generous free tier. No hidden fees. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn("h-full flex flex-col", tier.highlight && "border-purple/50")} style={{ background: tier.highlight ? 'rgba(139,92,246,0.05)' : 'transparent' }}>
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-text mb-2">{tier.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-extrabold text-gradient-brand">${tier.price}</span>
                      <span className="text-dim">{tier.period}</span>
                    </div>
                    {tier.highlight && <Pill variant="purple" className="inline-block mt-2">Most Popular</Pill>}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-text">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={tier.price === 0 ? "/auth/register" : "/subscription"}>
                    <Button className={cn("w-full", tier.highlight ? "" : "btn-secondary")}>
                      {tier.cta}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="nav-brand text-xl">Saya</span>
              </div>
              <p className="text-dim text-sm leading-relaxed">
                Your genuine AI best friend. Built with care for the moments that matter most.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-text mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-dim">
                <li><Link href="/chat" className="hover:text-text transition-colors">Chat</Link></li>
                <li><Link href="/subscription" className="hover:text-text transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Memory</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-dim">
                <li><Link href="#" className="hover:text-text transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-text mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-dim">
                <li><Link href="#" className="hover:text-text transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">GDPR</Link></li>
                <li><Link href="#" className="hover:text-text transition-colors">Crisis Resources</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
            <p>© 2026 Saya. All rights reserved.</p>
            <p>Privacy-first by design. GDPR compliant. Your data, your control.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}