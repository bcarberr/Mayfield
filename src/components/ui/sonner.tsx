import type { CSSProperties } from "react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";
import { useTheme } from "../../design-system";

/** App-wide Sonner host — white toast in dark mode, black toast in light mode. */
export function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <SonnerToaster
      theme={isLight ? "dark" : "light"}
      position="bottom-center"
      style={
        {
          "--normal-bg": isLight ? "#000000" : "#ffffff",
          "--normal-text": isLight ? "#ffffff" : "#0a0a0a",
          "--normal-border": isLight ? "#262626" : "#e5e5e5",
          "--success-bg": isLight ? "#000000" : "#ffffff",
          "--success-text": isLight ? "#ffffff" : "#0a0a0a",
          "--success-border": isLight ? "#262626" : "#e5e5e5",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "border shadow-[0px_5px_5px_-3px_rgba(0,0,0,0.2),0px_8px_10px_1px_rgba(0,0,0,0.14),0px_3px_14px_2px_rgba(0,0,0,0.12)]",
          title: "text-sm font-semibold",
          description: isLight ? "text-sm text-neutral-300" : "text-sm text-neutral-600",
          success: "border",
        },
      }}
      {...props}
    />
  );
}
