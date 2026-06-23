import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Shield,
  Camera,
  UserSearch,
  Search,
  LayoutDashboard,
  Users,
  LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLink {
  to: string;
  label: string;
  icon: typeof Camera;
  highlight?: boolean;
}

const navGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "Emergency",
    links: [
      { to: "/victim", label: "Report Emergency", icon: Camera, highlight: true },
    ],
  },
  {
    title: "Missing Persons",
    links: [
      { to: "/missing", label: "Report Missing Person", icon: UserSearch },
      { to: "/missing-dashboard", label: "View Missing Persons", icon: Search },
    ],
  },
  {
    title: "Staff",
    links: [
      { to: "/dispatcher", label: "Dispatcher Dashboard", icon: LayoutDashboard },
      { to: "/volunteer", label: "Volunteer Portal", icon: Users },
      { to: "/login", label: "Sign In", icon: LogIn },
    ],
  },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={close}
          >
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-gradient text-lg font-bold">Crisis Copilot</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              "border border-border bg-card text-foreground",
              "hover:bg-secondary transition-colors"
            )}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "fixed top-0 right-0 z-50 flex h-full w-[min(320px,85vw)] flex-col",
                "glass border-l border-border shadow-2xl",
                "pb-[max(1rem,env(safe-area-inset-bottom))]"
              )}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button
                  type="button"
                  onClick={close}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    "text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  )}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-4">
                {navGroups.map((group) => (
                  <div key={group.title} className="mb-6">
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.title}
                    </p>
                    <ul className="space-y-1">
                      {group.links.map((link) => (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            onClick={close}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                              link.highlight
                                ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                                : "text-foreground hover:bg-secondary"
                            )}
                          >
                            <link.icon className="h-4 w-4 shrink-0" />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
