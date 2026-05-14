import type { HTMLAttributes } from "react";

import {
  MISC_TECHNOLOGY_ICON_COMPONENTS,
  MISC_TECHNOLOGY_ICON_NAMES,
  type MiscTechnologyIconName,
} from "../assets/icons/icons";
import {
  OBSERVABLE_ENTITY_ICON_NAMES,
  OBSERVABLE_ENTITY_RAW_BY_NAME,
  type ObservableEntityIconName,
} from "../assets/icons/observable-icons";
import {
  QUERY_DS_ICON_NAMES,
  QUERY_DS_RAW_BY_NAME,
  type QueryDsIconName,
} from "../assets/icons/query-ds-icons";
import {
  OCSF_EVENT_ICON_NAMES,
  OCSF_EVENT_RAW_BY_NAME,
  type OcsfEventIconName,
} from "../assets/icons/ocsf-icons";
import {
  SEVERITY_SHAPE_ICON_NAMES,
  SEVERITY_SHAPE_RAW_BY_NAME,
  type SeverityShapeIconName,
} from "../assets/icons/severity-icons";
import {
  NAV_ELEMENT_ICON_NAMES,
  NAV_ELEMENT_RAW_BY_NAME,
  type NavElementIconName,
} from "../assets/icons/nav-elements-icons";
import { NAVI_ICON_NAMES, NAVI_RAW_BY_NAME, type NaviIconName } from "../assets/icons/navi-icons";
import { EXTRA_ICON_NAMES, EXTRA_RAW_BY_NAME, type ExtraIconName } from "../assets/icons/extra-icons";
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

const LEGACY_ICON_NAMES = [
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

export const ICON_NAMES = [
  ...LEGACY_ICON_NAMES,
  ...MISC_TECHNOLOGY_ICON_NAMES,
  ...OBSERVABLE_ENTITY_ICON_NAMES,
  ...QUERY_DS_ICON_NAMES,
  ...OCSF_EVENT_ICON_NAMES,
  ...SEVERITY_SHAPE_ICON_NAMES,
  ...NAV_ELEMENT_ICON_NAMES,
  ...NAVI_ICON_NAMES,
  ...EXTRA_ICON_NAMES,
] as const;

export type IconName = (typeof ICON_NAMES)[number];

type LegacyIconName = (typeof LEGACY_ICON_NAMES)[number];

const RAW_BY_NAME: Record<LegacyIconName, string> = {
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

function isMiscTechnologyIcon(name: IconName): name is MiscTechnologyIconName {
  return (MISC_TECHNOLOGY_ICON_NAMES as readonly string[]).includes(name);
}

function isObservableEntityIcon(name: IconName): name is ObservableEntityIconName {
  return (OBSERVABLE_ENTITY_ICON_NAMES as readonly string[]).includes(name);
}

function isQueryDsIcon(name: IconName): name is QueryDsIconName {
  return (QUERY_DS_ICON_NAMES as readonly string[]).includes(name);
}

function isOcsfEventIcon(name: IconName): name is OcsfEventIconName {
  return (OCSF_EVENT_ICON_NAMES as readonly string[]).includes(name);
}

function isSeverityShapeIcon(name: IconName): name is SeverityShapeIconName {
  return (SEVERITY_SHAPE_ICON_NAMES as readonly string[]).includes(name);
}

function isNavElementIcon(name: IconName): name is NavElementIconName {
  return (NAV_ELEMENT_ICON_NAMES as readonly string[]).includes(name);
}

function isNaviIcon(name: IconName): name is NaviIconName {
  return (NAVI_ICON_NAMES as readonly string[]).includes(name);
}

function isExtraIcon(name: IconName): name is ExtraIconName {
  return (EXTRA_ICON_NAMES as readonly string[]).includes(name);
}

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
  const spanClass = ["inline-flex shrink-0 items-center justify-center", className].filter(Boolean).join(" ");

  if (isMiscTechnologyIcon(name)) {
    const Svg = MISC_TECHNOLOGY_ICON_COMPONENTS[name];
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      >
        <Svg width={size} height={size} className="block shrink-0" />
      </span>
    );
  }

  if (isObservableEntityIcon(name)) {
    const markup = withDisplaySize(OBSERVABLE_ENTITY_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  if (isQueryDsIcon(name)) {
    const markup = withDisplaySize(QUERY_DS_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  if (isOcsfEventIcon(name)) {
    const markup = withDisplaySize(OCSF_EVENT_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  if (isSeverityShapeIcon(name)) {
    const markup = withDisplaySize(SEVERITY_SHAPE_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  if (isNavElementIcon(name)) {
    const markup = withDisplaySize(NAV_ELEMENT_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  if (isNaviIcon(name)) {
    const markup = withDisplaySize(NAVI_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  if (isExtraIcon(name)) {
    const markup = withDisplaySize(EXTRA_RAW_BY_NAME[name], size);
    return (
      <span
        {...rest}
        className={spanClass}
        style={{ lineHeight: 0, ...style }}
        dangerouslySetInnerHTML={{ __html: markup }}
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
      />
    );
  }

  const markup = withDisplaySize(RAW_BY_NAME[name], size);
  return (
    <span
      {...rest}
      className={spanClass}
      style={{ lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: markup }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    />
  );
}
