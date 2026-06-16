import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border/60 bg-surface-elevated/70 text-muted-foreground shadow-sm transition-all duration-300 hover:text-foreground hover:border-primary/40 hover:bg-primary/5",
        className
      )}
    >
      <Sun className={cn("h-4 w-4 absolute transition-all duration-300", isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
      <Moon className={cn("h-4 w-4 absolute transition-all duration-300", isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
    </button>
  );
}
