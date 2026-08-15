import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DomTreeBackground } from "../design/DomTreeBackground";
import { Logo } from "../design/Logo";
import { useProfileStore, rankForRating } from "../state/profile-store";

interface MenuItem {
  label: string;
  description: string;
  path: string;
  primary?: boolean;
}

const ITEMS: MenuItem[] = [
  { label: "PLAY 1V1", description: "Host or join a LAN duel", path: "/duel", primary: true },
  { label: "PRACTICE", description: "Chapters, drills, boss DOMs", path: "/practice" },
  { label: "HOW TO PLAY", description: "Learn the arena in 2 minutes", path: "/how-to-play" },
  { label: "STATS", description: "Rating, mastery, achievements", path: "/stats" },
  { label: "SETTINGS", description: "Audio, difficulty, accessibility", path: "/settings" },
];

export function MainMenu() {
  const navigate = useNavigate();
  const reducedMotion = useProfileStore((s) => s.settings.reducedMotion);
  const rating = useProfileStore((s) => s.stats.rating);
  const name = useProfileStore((s) => s.name);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      <DomTreeBackground reducedMotion={reducedMotion} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-void/20 via-transparent to-void" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-3"
        >
          <Logo size="lg" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12 font-mono text-sm tracking-widest text-text-secondary"
        >
          FIND IT. LOCK IT. SHIP IT.
        </motion.p>

        <motion.nav
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="flex w-full max-w-md flex-col gap-2.5"
        >
          {ITEMS.map((item) => (
            <motion.button
              key={item.path}
              variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
              whileHover={{ x: 4 }}
              onClick={() => navigate(item.path)}
              className={`group flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors duration-150 ${
                item.primary
                  ? "border-cyan/30 bg-cyan/[0.06] hover:border-cyan/50 hover:bg-cyan/[0.1]"
                  : "border-border-subtle bg-surface-2/60 hover:border-border-strong hover:bg-elevated"
              }`}
            >
              <div>
                <div
                  className={`font-mono text-sm font-semibold tracking-wider ${item.primary ? "text-cyan" : "text-text-primary"}`}
                >
                  {item.label}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">{item.description}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className={`shrink-0 transition-transform duration-150 group-hover:translate-x-1 ${item.primary ? "text-cyan" : "text-text-tertiary"}`}
              >
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          ))}
        </motion.nav>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex items-center gap-3 font-mono text-xs text-text-tertiary"
        >
          <span>{name}</span>
          <span className="h-1 w-1 rounded-full bg-text-tertiary" />
          <span>{rankForRating(rating).toUpperCase()}</span>
          <span className="h-1 w-1 rounded-full bg-text-tertiary" />
          <span>{rating} RATING</span>
        </motion.div>
      </div>
    </div>
  );
}
