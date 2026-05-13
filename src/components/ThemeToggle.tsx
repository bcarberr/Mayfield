import { useTheme } from "../design-system/useTheme";

export type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      onClick={toggleTheme}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
        "border-border-container bg-surface-container text-text-secondary hover:text-text-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden className="text-sm leading-none">
        {isLight ? "☀" : "☾"}
      </span>
      <span>{isLight ? "Light" : "Dark"}</span>
    </button>
  );
}
