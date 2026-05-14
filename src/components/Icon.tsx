import type { HTMLAttributes } from "react";

import checkCircle from "../assets/icons/check-circle.svg?raw";
import checkCircleOutline from "../assets/icons/check-circle-outline.svg?raw";
import chevronDown from "../assets/icons/chevron-down.svg?raw";
import circle from "../assets/icons/circle.svg?raw";
import close from "../assets/icons/close.svg?raw";
import connectors from "../assets/icons/connectors.svg?raw";
import awsAthena from "../assets/icons/aws-athena.svg?raw";
import error from "../assets/icons/error.svg?raw";
import errorOutline from "../assets/icons/error-outline.svg?raw";
import external from "../assets/icons/external.svg?raw";
import feedbackInfo from "../assets/icons/feedback-info.svg?raw";
import feedbackInfoOutline from "../assets/icons/feedback-info-outline.svg?raw";
import inProgress from "../assets/icons/in-progress.svg?raw";
import noData from "../assets/icons/no-data.svg?raw";
import noDataBlocked from "../assets/icons/no-data-blocked.svg?raw";
import networkActivity from "../assets/icons/network-activity.svg?raw";
import search from "../assets/icons/search.svg?raw";
import sparkle from "../assets/icons/sparkle.svg?raw";
import visibility from "../assets/icons/visibility.svg?raw";
import warning from "../assets/icons/warning.svg?raw";
import warningOutline from "../assets/icons/warning-outline.svg?raw";

export const ICON_NAMES = [
  "check-circle",
  "check-circle-outline",
  "chevron-down",
  "circle",
  "close",
  "connectors",
  "aws-athena",
  "error",
  "error-outline",
  "external",
  "feedback-info",
  "feedback-info-outline",
  "in-progress",
  "no-data",
  "no-data-blocked",
  "network-activity",
  "partial-results",
  "results",
  "search",
  "sparkle",
  "visibility",
  "warning",
  "warning-outline",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

const RAW_BY_NAME: Record<IconName, string> = {
  "check-circle": checkCircle,
  "check-circle-outline": checkCircleOutline,
  "chevron-down": chevronDown,
  circle,
  close,
  connectors,
  "aws-athena": awsAthena,
  error,
  "error-outline": errorOutline,
  external,
  "feedback-info": feedbackInfo,
  "feedback-info-outline": feedbackInfoOutline,
  "in-progress": inProgress,
  "no-data": noData,
  "no-data-blocked": noDataBlocked,
  "network-activity": networkActivity,
  "partial-results": checkCircleOutline,
  results: checkCircle,
  search,
  sparkle,
  visibility,
  warning,
  "warning-outline": warningOutline,
};

function withDisplaySize(svg: string, size: number): string {
  return svg.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    let next = attrs;
    if (!/\bwidth=/.test(next)) next += ` width="${size}"`;
    if (!/\bheight=/.test(next)) next += ` height="${size}"`;
    return `<svg${next}>`;
  });
}

export type IconProps = {
  name: IconName;
  /** Display size in CSS pixels. Artwork matches the Figma 24px component slot. */
  size?: number;
  title?: string;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "dangerouslySetInnerHTML">;

export function Icon({ name, size = 24, title, className, style, ...rest }: IconProps) {
  const markup = withDisplaySize(RAW_BY_NAME[name], size);
  return (
    <span
      {...rest}
      className={["inline-flex shrink-0 items-center justify-center", className].filter(Boolean).join(" ")}
      style={{ lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: markup }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  );
}
