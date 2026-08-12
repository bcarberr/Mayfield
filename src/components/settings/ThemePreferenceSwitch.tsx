import { useId } from "react";
import { Switch } from "../../design-system";
import { useTheme, type Theme } from "../../design-system/useTheme";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function ThemeOptionButton({
  option,
  selected,
  onSelect,
}: {
  option: Theme;
  selected: boolean;
  onSelect: (theme: Theme) => void;
}) {
  const label = option === "light" ? "Light" : "Dark";

  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cx(
        "rounded-sm text-sm font-semibold transition-colors",
        selected ? "text-text-primary" : "text-text-tertiary hover:text-text-secondary",
      )}
      onClick={() => onSelect(option)}
    >
      {label}
    </button>
  );
}

/** Light / Dark labels flanking the DS toggle switch; defaults to dark via `useTheme`. */
export function ThemePreferenceSwitch() {
  const switchId = useId();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div role="group" aria-label="Theme preference" className="inline-flex items-center gap-3">
      <ThemeOptionButton option="light" selected={!isDark} onSelect={setTheme} />
      <Switch
        id={switchId}
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label={`Theme: ${isDark ? "Dark" : "Light"}`}
      />
      <ThemeOptionButton option="dark" selected={isDark} onSelect={setTheme} />
    </div>
  );
}
