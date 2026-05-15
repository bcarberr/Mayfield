import { useTheme } from "../design-system/useTheme";
import { Button } from "./ui/Button";

export type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className = "" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  return (
    <Button
      variant="secondary"
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      onClick={toggleTheme}
      className={[
        "!min-h-0 !gap-px rounded-full !p-[3px] !pr-[5px] text-[11px] font-semibold leading-none tracking-[0.35px] ring-offset-surface-container",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden className="text-xs leading-none">
        {isLight ? "☀" : "☾"}
      </span>
      <span>{isLight ? "Light" : "Dark"}</span>
    </Button>
  );
}
