import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../design-system";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { Separator } from "@/components/shadcn/separator";
import { cn } from "@/lib/utils";
import { ROUTES } from "../app/routes";
import { useSearch } from "../context/SearchContext";
import { createRelativeTimeframeRange, useTimeframe } from "../context/TimeframeContext";

const HEADER_FILTER_TRIGGER_CLASS =
  "h-auto max-w-full gap-1.5 rounded px-0 py-0.5 font-semibold text-interactive-active hover:bg-transparent hover:text-[var(--color-primary-hover)] active:text-[var(--color-primary-pressed)] lg:inline-flex lg:w-auto";

const PAGE_SIZE = 9;

const MS_24H = 24 * 60 * 60 * 1000;
const MS_30D = 30 * 24 * 60 * 60 * 1000;

type SavedSearch = {
  id: string;
  name: string;
  date: string;
  /** First entity or event class in the saved query. */
  firstEntity: string;
  connectors: string;
  timeframe: string;
  timeframeDurationMs: number;
  /** The FSQL query to execute. */
  query: string;
};

type RecentSearch = {
  id: string;
  /** Unix ms — used to sort newest-first. */
  timestamp: number;
  /** Formatted display date. */
  date: string;
  /** First entity or event class in the executed query. */
  firstEntity: string;
  connectors: string;
  timeframe: string;
  timeframeDurationMs: number;
  /** The FSQL query to re-execute. */
  query: string;
};

const ALL_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: "1", name: "Flaming Smoke", date: "2024-03-15  09:22:12 PM", firstEntity: "Device",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY network_activity.** WITH network_activity.severity_id IN HIGH, CRITICAL LIMIT 100",
  },
  {
    id: "2", name: "Knuckles Stickazora Hash", date: "2024-03-13  09:22:12 PM", firstEntity: "Device",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY file_activity.** WITH %hash IS NOT NULL AND %hostname = 'knuckles' LIMIT 100",
  },
  {
    id: "3", name: "Bad known usernames", date: "2024-03-13  09:22:12 PM", firstEntity: "User Name",
    connectors: "19 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY authentication.** WITH %username IN 'admin', 'root', 'guest', 'administrator' LIMIT 100",
  },
  {
    id: "4", name: "Hostnames to watch out for", date: "2024-03-12  09:22:12 PM", firstEntity: "Hostname",
    connectors: "19 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY network_activity.** WITH %hostname IN 'fin-ws-014', 'ops-jump-03', 'hr-laptop-22' LIMIT 100",
  },
  {
    id: "5", name: "Get the dodge outta town", date: "2024-03-11  09:22:12 PM", firstEntity: "Device",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY network_activity.** WITH network_activity.traffic.bytes_out > 50000 ORDER BY network_activity.traffic.bytes_out DESC LIMIT 100",
  },
  {
    id: "6", name: "Bratskellah and Vida Cantina", date: "2024-03-10  09:22:12 PM", firstEntity: "API Activity",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY api_activity.** WITH api_activity.http_response.code >= 400 ORDER BY api_activity.time DESC LIMIT 100",
  },
  {
    id: "7", name: "Bonnie's Hostnames to watch", date: "2023-03-09  09:22:12 PM", firstEntity: "Hostname",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY network_activity.** WITH %hostname CONTAINS 'corp-' AND network_activity.severity_id = CRITICAL LIMIT 100",
  },
  {
    id: "8", name: "Bitsa Galangadng", date: "2023-03-08  09:22:12 PM", firstEntity: "HTTP Activity",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY http_activity.** WITH http_activity.http_response.code >= 500 OR http_activity.http_request.http_method = 'DELETE' LIMIT 100",
  },
  {
    id: "9", name: "Knuckles Stickazora Hash", date: "2024-03-07  09:22:12 PM", firstEntity: "File Hash",
    connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY file_activity.** WITH %hash IN '9f2ca11bfce9806b503e86e3534a0d5a', 'aad3b435b51404eeaad3b435b51404ee' LIMIT 100",
  },
];

const ALL_RECENT_SEARCHES: RecentSearch[] = [
  {
    id: "r1", timestamp: new Date("2024-03-15T08:22:12").getTime(), date: "2024-03-15  08:22:12 AM",
    firstEntity: "IP Address", connectors: "19 of 24", timeframe: "Last 30 days", timeframeDurationMs: MS_30D,
    query: "QUERY network_activity.** WITH %ip = '203.0.113.5' ORDER BY network_activity.time DESC LIMIT 100",
  },
  {
    id: "r2", timestamp: new Date("2024-03-13T06:19:32").getTime(), date: "2024-03-13  06:19:32 AM",
    firstEntity: "Compliance Finding", connectors: "19 of 24", timeframe: "Last 30 days", timeframeDurationMs: MS_30D,
    query: "QUERY compliance_finding.** WITH compliance_finding.severity_id = HIGH LIMIT 100",
  },
  {
    id: "r3", timestamp: new Date("2024-03-13T05:19:24").getTime(), date: "2024-03-13  05:19:24 AM",
    firstEntity: "Device", connectors: "18 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY network_activity.** WITH network_activity.severity_id = CRITICAL ORDER BY network_activity.time DESC LIMIT 100",
  },
  {
    id: "r4", timestamp: new Date("2023-03-10T08:19:35").getTime(), date: "2023-03-10  08:19:35 AM",
    firstEntity: "File Hash", connectors: "19 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY file_activity.** WITH %hash = '9f2ca11bfce9806b503e86e3534a0d5a' LIMIT 100",
  },
  {
    id: "r5", timestamp: new Date("2023-03-10T08:19:35").getTime(), date: "2023-03-10  08:19:35 AM",
    firstEntity: "File Hash", connectors: "19 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY file_activity.** WITH %hash = 'aad3b435b51404eeaad3b435b51404ee' LIMIT 100",
  },
  {
    id: "r6", timestamp: new Date("2023-03-09T08:19:35").getTime(), date: "2023-03-09  08:19:35 AM",
    firstEntity: "HTTP Activity", connectors: "19 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY http_activity.** WITH http_activity.http_request.url.hostname CONTAINS '.onion' LIMIT 100",
  },
  {
    id: "r7", timestamp: new Date("2023-03-09T08:19:35").getTime(), date: "2023-03-09  08:19:35 AM",
    firstEntity: "Compliance Finding", connectors: "24 of 24", timeframe: "Last 24 hours", timeframeDurationMs: MS_24H,
    query: "QUERY compliance_finding.** WITH compliance_finding.status_id = FAILED LIMIT 100",
  },
];

const SORTED_RECENT_SEARCHES = [...ALL_RECENT_SEARCHES].sort((a, b) => b.timestamp - a.timestamp);

const ROW_CLASS =
  "w-full cursor-pointer rounded px-3 py-2.5 text-left transition-colors hover:bg-overlay-subtle focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-interactive-active";

function SavedSearchRow({ item, onSelect }: { item: SavedSearch; onSelect: (item: SavedSearch) => void }) {
  return (
    <button type="button" className={ROW_CLASS} onClick={() => onSelect(item)}>
      <p className="truncate text-sm leading-[18px]">
        <span className="font-semibold text-interactive-active">{item.name}</span>
        <span className="text-text-tertiary">{` | ${item.date} | `}</span>
        <span className="text-text-primary">{item.firstEntity}</span>
      </p>
      <p className="text-xs leading-[18px] text-text-tertiary">Connectors: {item.connectors}</p>
      <p className="text-xs leading-[18px] text-text-tertiary">Time: {item.timeframe}</p>
    </button>
  );
}

function RecentSearchRow({ item, onSelect }: { item: RecentSearch; onSelect: (item: RecentSearch) => void }) {
  return (
    <button type="button" className={ROW_CLASS} onClick={() => onSelect(item)}>
      <p className="truncate text-sm leading-[18px]">
        <span className="font-semibold text-interactive-active">{item.date}</span>
        <span className="text-text-tertiary">{" | "}</span>
        <span className="text-text-primary">{item.firstEntity}</span>
      </p>
      <p className="text-xs leading-[18px] text-text-tertiary">Connectors: {item.connectors}</p>
      <p className="text-xs leading-[18px] text-text-tertiary">Time: {item.timeframe}</p>
    </button>
  );
}

export function SavedRecentSearchesDropdown() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { commitAnalyticsTimeframe } = useTimeframe();
  const {
    setFsqlQuery,
    setLastExecutedFsqlQuery,
    setCriteriaMode,
    setCriteriaOpen,
    setSkipTimeframeFsqlSyncOnce,
    beginFsqlSearch,
  } = useSearch();

  const hasMore = ALL_SAVED_SEARCHES.length > PAGE_SIZE;
  const visibleSaved = expanded ? ALL_SAVED_SEARCHES : ALL_SAVED_SEARCHES.slice(0, PAGE_SIZE);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setExpanded(false);
  };

  const launchSearch = (query: string, timeframeDurationMs: number) => {
    const newRange = createRelativeTimeframeRange(timeframeDurationMs);
    setFsqlQuery(query);
    setLastExecutedFsqlQuery(query.trim());
    setCriteriaMode("fsql");
    setCriteriaOpen(true);
    setSkipTimeframeFsqlSyncOnce(true);
    commitAnalyticsTimeframe(newRange);
    beginFsqlSearch(query, newRange);
    setOpen(false);
    if (location.pathname !== ROUTES.search) {
      navigate(ROUTES.search);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(HEADER_FILTER_TRIGGER_CLASS, "w-full justify-start text-left lg:w-auto")}
          aria-label="Saved and recent searches"
        >
          <Icon
            name="nav-star"
            size={16}
            className="size-4 shrink-0 text-current [&_svg]:!size-4"
            aria-hidden
          />
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
            Saved/Recent Searches
          </span>
          <ChevronDown size={14} className="shrink-0 text-current" aria-hidden />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        className={cn(
          "w-[min(900px,90vw)] border-border-container bg-surface-modal p-0 shadow-[0_5px_5px_-3px_rgba(0,0,0,0.2),0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12)]",
          expanded && "max-h-[calc(100vh-4rem)] overflow-hidden",
        )}
      >
        <div className={cn("flex min-h-0", expanded && "h-[calc(100vh-4rem)]")}>
          {/* Saved Searches column */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center px-3 pb-2 pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.4px] text-text-tertiary">
                Saved Searches
              </span>
            </div>
            <div className={cn("flex flex-col pb-2", expanded && "flex-1 overflow-y-auto")}>
              {visibleSaved.map((item) => (
                <SavedSearchRow
                  key={item.id}
                  item={item}
                  onSelect={(s) => launchSearch(s.query, s.timeframeDurationMs)}
                />
              ))}
            </div>
            {hasMore && !expanded && (
              <div className="shrink-0 border-t border-border-container px-3 py-2">
                <button
                  type="button"
                  className="text-sm font-semibold text-interactive-active hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-interactive-active"
                  onClick={() => setExpanded(true)}
                >
                  View more
                </button>
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="bg-border-container" />

          {/* Recent Searches column — sorted newest first */}
          <div className="flex w-[320px] shrink-0 flex-col overflow-hidden">
            <div className="shrink-0 px-3 pb-2 pt-3">
              <span className="text-xs font-bold uppercase tracking-[0.4px] text-text-tertiary">
                Recent Searches
              </span>
            </div>
            <div className={cn("flex flex-col pb-2", expanded && "flex-1 overflow-y-auto")}>
              {SORTED_RECENT_SEARCHES.map((item) => (
                <RecentSearchRow
                  key={item.id}
                  item={item}
                  onSelect={(r) => launchSearch(r.query, r.timeframeDurationMs)}
                />
              ))}
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
