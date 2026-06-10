import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type TruncatedTextBaseProps = {
  children: string;
  className?: string;
  /** Applied to the outer wrapper (use `min-w-0 flex-1` inside flex rows with leading icons). */
  wrapperClassName?: string;
};

type TruncatedTextSpanProps = TruncatedTextBaseProps & {
  as?: "span";
} & ComponentPropsWithoutRef<"span">;

type TruncatedTextButtonProps = TruncatedTextBaseProps & {
  as: "button";
} & ComponentPropsWithoutRef<"button">;

export type TruncatedTextProps = TruncatedTextSpanProps | TruncatedTextButtonProps;

/** Truncated single-line text with a hover popover when content overflows. */
export function TruncatedText(props: TruncatedTextProps) {
  const { children, className = "", wrapperClassName = "", as = "span", ...rest } = props;
  const textRef = useRef<HTMLSpanElement | HTMLButtonElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<{ top: number; left: number } | null>(null);

  const measureTruncation = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    setIsTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    measureTruncation();
    const el = textRef.current;
    if (!el) return;

    const observer = new ResizeObserver(measureTruncation);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, measureTruncation]);

  useEffect(() => {
    if (!isHovered || !isTruncated || !textRef.current) {
      setPopoverStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = textRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverStyle({
        top: rect.top - 8,
        left: rect.left,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isHovered, isTruncated]);

  const sharedClassName = `block min-w-0 max-w-full truncate ${className}`.trim();

  let textNode: ReactNode;
  if (as === "button") {
    const buttonProps = rest as ComponentPropsWithoutRef<"button">;
    textNode = (
      <button ref={textRef as RefObject<HTMLButtonElement>} type="button" className={sharedClassName} {...buttonProps}>
        {children}
      </button>
    );
  } else {
    const spanProps = rest as ComponentPropsWithoutRef<"span">;
    textNode = (
      <span ref={textRef as RefObject<HTMLSpanElement>} className={sharedClassName} {...spanProps}>
        {children}
      </span>
    );
  }

  const showPopover = isTruncated && isHovered && popoverStyle;

  return (
    <>
      <span
        className={`block min-w-0 max-w-full ${wrapperClassName}`.trim()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        {textNode}
      </span>
      {showPopover
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[100] max-w-xs -translate-y-full rounded bg-[#424242] px-2 py-1.5 text-xs font-semibold leading-snug text-[#f5f5f5] shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
              style={{ top: popoverStyle.top, left: popoverStyle.left }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
