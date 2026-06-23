import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  Shield,
  Users,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function LandingHero() {
  return (
    <section className="relative flex min-h-[calc(100dvh-57px)] flex-col items-center justify-center px-6 py-16 text-center">
      {/* radial accent behind heading */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
        style={{
          background: "radial-gradient(circle, #6366f1 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute right-0 bottom-1/4 -z-10 h-[400px] w-[400px] rounded-full opacity-10 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #ec4899 0%, transparent 70%)",
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

      {/* Emergency-first CTA */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-10 w-full max-w-md"
      >
        <motion.div variants={fadeUp}>
          <Link to="/victim" className="block">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={cn(
                "flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5",
                "bg-destructive text-destructive-foreground font-bold text-lg",
                "glow-red cursor-pointer select-none",
                "active:scale-[0.98] transition-transform"
              )}
            >
              <Camera className="h-6 w-6" />
              Report Emergency
            </motion.div>
          </Link>
        </motion.div>

        {/* Safety line */}
        <motion.p
          variants={fadeUp}
          className="mt-4 flex items-start justify-center gap-2 text-xs text-muted-foreground leading-relaxed"
        >
          <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/80" />
          <span>
            If you're in immediate danger, call your local emergency number
            first.
          </span>
        </motion.p>

        {/* Secondary links */}
        <motion.div
          variants={fadeUp}
          className="mt-6 flex flex-col items-center gap-3"
        >
          <Link
            to="/missing"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-amber-400 transition-colors group"
          >
            <Users className="h-4 w-4" />
            Report a Missing Person
            <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>

        {/* De-emphasized staff paths */}
        <motion.div
          variants={fadeUp}
          className="mt-8 flex items-center justify-center gap-4 text-xs text-muted-foreground/70"
        >
          <Link
            to="/dispatcher"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dispatcher
          </Link>
          <span className="text-border">|</span>
          <Link
            to="/login"
            className="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </Link>
        </motion.div>
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
  );
}
