import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  Phone,
  LayoutDashboard,
  Camera,
  Brain,
  Languages,
  Siren,
  HeartPulse,
  Search,
  Shield,
  ArrowRight,
  Zap,
  Users,
  Globe,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ParticleBackground from "@/components/landing/ParticleBackground";
import AnimatedCounter from "@/components/landing/AnimatedCounter";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Camera,
    title: "Panic Snap",
    description:
      "Instant photo and audio capture in emergency situations. One tap to document and transmit critical evidence.",
    gradient: "from-red-500/20 to-orange-500/20",
  },
  {
    icon: Brain,
    title: "AI Triage",
    description:
      "Multimodal threat assessment powered by Gemini AI. Automatically classifies severity and prioritizes response.",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: Languages,
    title: "Language Translation",
    description:
      "Real-time audio translation across 50+ languages. No language barrier stands between you and help.",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Siren,
    title: "Auto Dispatch",
    description:
      "AI-triggered emergency unit deployment. The right resources dispatched to the right location, instantly.",
    gradient: "from-amber-500/20 to-yellow-500/20",
  },
  {
    icon: HeartPulse,
    title: "Zero-Minute First Aid",
    description:
      "Instant safety instructions tailored to your emergency. Step-by-step guidance while help is on the way.",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: Search,
    title: "Missing Persons",
    description:
      "AI entity extraction from photos and reports. Cross-referencing data to reunite families faster.",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
] as const;

const stats: { value: number; prefix?: string; suffix: string; label: string }[] = [
  { value: 24, suffix: "/7", label: "AI Analysis" },
  { value: 30, prefix: "< ", suffix: "s", label: "Response Time" },
  { value: 50, suffix: "+", label: "Languages Supported" },
  { value: 99, suffix: "%", label: "Uptime Guaranteed" },
];

const howItWorks = [
  {
    step: "01",
    title: "Report Emergency",
    description: "Tap the Panic Snap button to instantly capture photos and audio from the scene.",
    icon: Camera,
    color: "text-red-400",
    bgColor: "bg-red-500/15",
  },
  {
    step: "02",
    title: "AI Analyzes",
    description: "Gemini AI processes the data — assessing threats, translating languages, and categorizing severity.",
    icon: Brain,
    color: "text-violet-400",
    bgColor: "bg-violet-500/15",
  },
  {
    step: "03",
    title: "Units Dispatched",
    description: "For critical situations, emergency services are automatically deployed to your location.",
    icon: Siren,
    color: "text-amber-400",
    bgColor: "bg-amber-500/15",
  },
  {
    step: "04",
    title: "Get First Aid",
    description: "Receive immediate, AI-tailored safety instructions while help is on the way.",
    icon: HeartPulse,
    color: "text-green-400",
    bgColor: "bg-green-500/15",
  },
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: (typeof features)[number] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
      className={cn(
        "glass group relative rounded-2xl p-6 overflow-hidden",
        "transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)]"
      )}
    >
      {/* Gradient overlay on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          gradient
        )}
      />
      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="relative py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="glass grid grid-cols-2 gap-8 rounded-3xl p-8 md:grid-cols-4 md:gap-4 md:p-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                <AnimatedCounter
                  end={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                />
              </p>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <section ref={ref} className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-foreground md:text-4xl"
          >
            How it <span className="text-gradient">works</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-4 max-w-lg text-muted-foreground"
          >
            From emergency to resolution in four seamless steps, powered by AI.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="relative group"
            >
              {/* Connector line */}
              {i < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-border to-transparent z-0" />
              )}
              <div className="glass rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.bgColor, item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/50 tracking-widest">
                    STEP {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStackSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const techs = [
    { name: "React", icon: Zap, desc: "Frontend Framework" },
    { name: "Node.js", icon: Globe, desc: "Backend Runtime" },
    { name: "Gemini AI", icon: Brain, desc: "Multimodal Engine" },
    { name: "Supabase", icon: Shield, desc: "Database & Auth" },
  ];

  return (
    <section ref={ref} className="relative py-16 md:py-20">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-foreground md:text-3xl">
            Built with <span className="text-gradient">cutting-edge</span> technology
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="glass rounded-xl p-5 text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <tech.icon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{tech.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */

export default function Landing() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <ParticleBackground />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 py-24 text-center">
        {/* radial accent behind heading */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #6366f1 0%, transparent 70%)",
          }}
        />
        {/* Second accent */}
        <div
          className="pointer-events-none absolute right-0 bottom-1/4 -z-10 h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
          style={{
            background:
              "radial-gradient(circle, #ec4899 0%, transparent 70%)",
          }}
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex max-w-3xl flex-col items-center gap-6"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium tracking-wide text-primary">
              AI-Powered Emergency Platform
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-gradient text-5xl font-extrabold leading-tight tracking-tight md:text-7xl"
          >
            Crisis Copilot
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            AI-Powered Emergency Response — Bridging communication gaps when
            every second counts.
          </motion.p>
        </motion.div>

        {/* ── CTA Cards ─────────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-6 md:grid-cols-2"
        >
          {/* I Need Help */}
          <motion.div variants={fadeUp}>
            <Link to="/victim" className="block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "glass group relative flex flex-col items-center gap-4 rounded-2xl p-8",
                  "border border-red-500/20 hover:border-red-500/40",
                  "cursor-pointer transition-shadow duration-300 hover:glow-red"
                )}
              >
                {/* pulsing glow ring */}
                <span className="absolute inset-0 -z-10 animate-pulse rounded-2xl opacity-30 blur-xl" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.35), transparent 70%)" }} />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-400 transition-all group-hover:bg-red-500/25 group-hover:scale-110">
                  <Phone className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">
                    I Need Help
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Report an emergency now
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-red-400/70 group-hover:text-red-400 transition-colors">
                  <span>Open Victim App</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* Dispatcher Login */}
          <motion.div variants={fadeUp}>
            <Link to="/login" className="block">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={cn(
                  "glass group relative flex flex-col items-center gap-4 rounded-2xl p-8",
                  "border border-primary/20 hover:border-primary/40",
                  "cursor-pointer transition-shadow duration-300 hover:glow-blue"
                )}
              >
                <span className="absolute inset-0 -z-10 animate-pulse rounded-2xl opacity-20 blur-xl" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.35), transparent 70%)" }} />
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary transition-all group-hover:bg-primary/25 group-hover:scale-110">
                  <LayoutDashboard className="h-7 w-7" />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-foreground">
                    Dispatcher Login
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Access the command center
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary/70 group-hover:text-primary transition-colors">
                  <span>Open Dashboard</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Quick access links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4 sm:gap-8"
        >
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
          >
            <Users className="h-4 w-4" />
            <span>Join as a Volunteer Responder</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            to="/missing"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-amber-400 transition-colors group"
          >
            <Search className="h-4 w-4" />
            <span>Report a Missing Person</span>
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-10 w-6 rounded-full border-2 border-muted-foreground/30 p-1"
          >
            <div className="mx-auto h-2 w-1 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold text-foreground md:text-4xl"
            >
              Everything you need in a{" "}
              <span className="text-gradient">crisis</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mx-auto mt-4 max-w-lg text-muted-foreground"
            >
              Six AI-powered tools working together to save lives, reduce
              response times, and bridge communication gaps.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <HowItWorksSection />

      {/* ── Stats ────────────────────────────────────────────── */}
      <StatsSection />

      {/* ── Tech Stack ───────────────────────────────────────── */}
      <TechStackSection />

      {/* ── CTA Section ──────────────────────────────────────── */}
      <section className="relative py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="glass rounded-3xl p-10 md:p-14"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4 md:text-4xl">
              Ready to make a <span className="text-gradient">difference</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8">
              Whether you're in danger or managing emergencies, Crisis Copilot is here to help. Start using our AI-powered platform now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/victim"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg shadow-red-500/25"
              >
                <Phone className="h-5 w-5" />
                Report Emergency
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold hover:from-indigo-600 hover:to-violet-600 transition-all shadow-lg shadow-indigo-500/25"
              >
                <LayoutDashboard className="h-5 w-5" />
                Dispatcher Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-gradient font-bold text-lg">Crisis Copilot</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/victim" className="hover:text-foreground transition-colors">Victim App</Link>
              <Link to="/dispatcher" className="hover:text-foreground transition-colors">Dashboard</Link>
              <Link to="/missing" className="hover:text-foreground transition-colors">Missing Persons</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Built for emergencies. Powered by AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
