import { useState } from "react";
import { Icon } from "../../design-system";
import entitiesTopByTypeChart from "../../assets/entities-top-by-type-chart.png?url";
import { Button } from "../ui/Button";
import { TruncatedText } from "../ui/TruncatedText";
import { Checkbox } from "../uiCheckbox";
import { DatavisGridlineRule, InsightCard } from "./datavisCard";

const ENTITY_BAR_FILL = "#6dc6a1";
const ENTITY_BAR_TRACK = "rgba(158, 158, 158, 0.2)";

type EntityListItem = {
  label: string;
  value: number;
};

type TopEntityRow = {
  rank: number;
  entityType: string;
  name: string;
  value: number;
};

type EntityCategoryCardData = {
  title: string;
  total: string;
  items: EntityListItem[];
  totalCount: number;
};

const TOP_10_ENTITIES: TopEntityRow[] = [
  { rank: 1, entityType: "Username", name: "bcarberr", value: 2654 },
  { rank: 2, entityType: "Username", name: "carberry", value: 1400 },
  { rank: 3, entityType: "Username", name: "bonwoncar", value: 1200 },
  { rank: 4, entityType: "Username", name: "BCarberry", value: 894 },
  { rank: 5, entityType: "IP Address", name: "207.23.24.11", value: 762 },
  { rank: 6, entityType: "IP Address", name: "198.23.24.14", value: 698 },
  { rank: 7, entityType: "IP Address", name: "168.222.24.13", value: 650 },
  { rank: 8, entityType: "IP Address", name: "167.111.22.01", value: 598 },
  { rank: 9, entityType: "Hostname", name: "norma-laptop", value: 543 },
  { rank: 10, entityType: "Hostname", name: "https://thisandthat.com", value: 300 },
];

const ENTITY_CATEGORY_CARDS: EntityCategoryCardData[] = [
  {
    title: "Top IP Addresses",
    total: "5.6K",
    totalCount: 25,
    items: [
      { label: "207.32.75.34", value: 1240 },
      { label: "145.27.84.12", value: 985 },
      { label: "168.33.72.10", value: 605 },
      { label: "168.12.89.11", value: 435 },
      { label: "2001:0D88:AC10:FE01", value: 175 },
    ],
  },
  {
    title: "Top Usernames",
    total: "7.6K",
    totalCount: 25,
    items: [
      { label: "bcarberr", value: 2654 },
      { label: "carberry", value: 1400 },
      { label: "bonwoncar", value: 1200 },
      { label: "BCarberry", value: 894 },
      { label: "Slingercar", value: 762 },
    ],
  },
  {
    title: "Top Hostnames",
    total: "2.6K",
    totalCount: 25,
    items: [
      { label: "norma-laptop", value: 1240 },
      { label: "https://thisandthat.com", value: 985 },
      { label: "slingerdingerdoodle-pc", value: 605 },
      { label: "https://leaveittobeaver.com", value: 435 },
      { label: "www.facebooksucks.com", value: 175 },
    ],
  },
  {
    title: "Top CVEs",
    total: "2.4K",
    totalCount: 25,
    items: [
      { label: "www.normansrestaurant.com", value: 1240 },
      { label: "http://thisandthat.com", value: 985 },
      { label: "slingerdingerdoodles.com", value: 605 },
      { label: "https://leaveittobeaver.com", value: 435 },
      { label: "www.facebooksucks.com", value: 175 },
    ],
  },
  {
    title: "MAC Addresses",
    total: "2.1K",
    totalCount: 25,
    items: [
      { label: "www.normansrestaurant.com", value: 1240 },
      { label: "http://thisandthat.com", value: 985 },
      { label: "slingerdingerdoodles.com", value: 605 },
      { label: "https://leaveittobeaver.com", value: 435 },
      { label: "www.facebooksucks.com", value: 175 },
    ],
  },
  {
    title: "Top URLs",
    total: "1.9K",
    totalCount: 25,
    items: [
      { label: "207.32.75.34", value: 1240 },
      { label: "145.27.84.12", value: 985 },
      { label: "168.33.72.10", value: 605 },
      { label: "168.12.89.11", value: 435 },
      { label: "2001:0D88:AC10:FE01", value: 175 },
    ],
  },
];

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

function EntityCardHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" className="size-6 p-0 text-text-tertiary hover:text-text-primary" aria-label="Pivot search">
        <Icon name="action-search" size={16} />
      </Button>
      <Button variant="ghost" className="size-6 p-0 text-text-tertiary hover:text-text-primary" aria-label="Expand widget">
        <Icon name="nav-expand" size={16} />
      </Button>
      <Button variant="ghost" className="size-6 p-0 text-text-tertiary hover:text-text-primary" aria-label="Widget options">
        <Icon name="navi-more-vert" size={16} />
      </Button>
    </div>
  );
}

function EntityAmountBar({ value, maxValue }: { value: number; maxValue: number }) {
  const pct = maxValue > 0 ? Math.max((value / maxValue) * 100, value > 0 ? 8 : 0) : 0;

  return (
    <div className="relative h-1.5 min-w-[6.5rem] flex-1 max-w-[6.625rem]">
      <div className="absolute inset-0 rounded-sm" style={{ backgroundColor: ENTITY_BAR_TRACK }} aria-hidden />
      <div
        className="absolute inset-y-0 left-0 rounded-sm"
        style={{ width: `${pct}%`, backgroundColor: ENTITY_BAR_FILL }}
        aria-hidden
      />
    </div>
  );
}

/** Figma `1595:50003`–`1595:50006` positions relative to chart `1595:49098` (1339×374). */
const ENTITY_TYPE_LABELS = [
  { label: "Usernames", left: "13.7%", top: "31.6%", className: "text-[clamp(1.375rem,2.8vw,3rem)] leading-[0.92]" },
  { label: "IP Addresses", left: "44.4%", top: "5.6%", className: "text-[clamp(1.25rem,2.5vw,2.5rem)] leading-[0.95]" },
  { label: "Hostnames", left: "67.5%", top: "55.6%", className: "text-[clamp(1.125rem,2.2vw,2.125rem)] leading-[0.95]" },
  { label: "MAC Addresses", left: "43.5%", bottom: "2.5%", className: "text-[clamp(1rem,1.8vw,1.75rem)] leading-none" },
] as const;

/** Figma `1595:49098` / `1595:49099` — packed teal bubble clusters by entity type. */
function EntitiesBubbleChart() {
  return (
    <div className="relative w-full shrink-0 overflow-hidden">
      <div className="relative aspect-[1339/374] w-full">
        <img
          src={entitiesTopByTypeChart}
          alt=""
          className="absolute inset-0 size-full object-cover object-center"
          aria-hidden
        />
        {ENTITY_TYPE_LABELS.map((item) => (
          <p
            key={item.label}
            className={`pointer-events-none absolute z-10 max-w-[32%] font-black text-text-primary ${item.className}`}
            style={{
              left: item.left,
              top: "top" in item ? item.top : undefined,
              bottom: "bottom" in item ? item.bottom : undefined,
            }}
          >
            {item.label}
          </p>
        ))}
      </div>
      <p className="sr-only">Top entities by type: Usernames, IP Addresses, Hostnames, and MAC Addresses</p>
    </div>
  );
}

const TOP_10_ENTITIES_GRID =
  "grid-cols-[1.125rem_1.5rem_minmax(5.5rem,8.5rem)_minmax(6rem,12rem)_1fr] sm:grid-cols-[1.125rem_1.75rem_minmax(6.5rem,10rem)_minmax(8rem,16rem)_1fr]";

/** Figma `1595:48984` — ranked top-10 entity overview above the six category widgets. */
function Top10EntitiesPanel() {
  const maxValue = TOP_10_ENTITIES[0]?.value ?? 1;
  const [selectedRanks, setSelectedRanks] = useState<Set<number>>(() => new Set());

  const toggleRow = (rank: number, checked: boolean) => {
    setSelectedRanks((prev) => {
      const next = new Set(prev);
      if (checked) next.add(rank);
      else next.delete(rank);
      return next;
    });
  };

  return (
    <InsightCard title="Top 10 Entities">
      <div className="flex shrink-0 flex-col">
        <div
          className={`grid ${TOP_10_ENTITIES_GRID} items-end gap-x-3 px-1 pb-2 sm:gap-x-4 sm:px-2`}
        >
          <span aria-hidden />
          <span aria-hidden />
          <span className="text-xs font-bold uppercase tracking-[0.4px] text-text-primary">Type of entity</span>
          <span className="text-xs font-bold uppercase tracking-[0.4px] text-text-primary">Name</span>
          <span className="text-xs font-bold uppercase tracking-[0.4px] text-text-primary">Total amount</span>
        </div>
        <DatavisGridlineRule inset={false} />
        <ol className="min-h-0 flex-1">
          {TOP_10_ENTITIES.map((row) => {
            const pct = Math.max((row.value / maxValue) * 100, row.value > 0 ? 4 : 0);

            return (
              <li key={row.rank} className="border-b border-datavis-gridlines last:border-b-0">
                <div
                  className={`grid ${TOP_10_ENTITIES_GRID} items-center gap-x-3 px-1 py-[11px] sm:gap-x-4 sm:px-2`}
                >
                  <Checkbox
                    checked={selectedRanks.has(row.rank)}
                    onCheckedChange={(checked) => toggleRow(row.rank, checked)}
                    aria-label={`Select ${row.name}`}
                  />
                  <span className="text-base-semibold tabular-nums text-text-tertiary">
                    {String(row.rank).padStart(2, "0")}
                  </span>
                  <TruncatedText className="text-base-semibold text-text-secondary">{row.entityType}</TruncatedText>
                  <TruncatedText className="text-base-semibold text-text-secondary">{row.name}</TruncatedText>
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-1.5 min-w-0 flex-1">
                      <div
                        className="absolute inset-0 rounded-sm bg-text-tertiary opacity-20"
                        aria-hidden
                      />
                      <div
                        className="absolute inset-y-0 left-0 rounded-sm bg-datavis-data-smalt-green-40"
                        style={{ width: `${pct}%` }}
                        aria-hidden
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-base-small tabular-nums tracking-[0.4px] text-text-secondary">
                      {formatCount(row.value)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </InsightCard>
  );
}

function EntityCategoryCard({ data }: { data: EntityCategoryCardData }) {
  const maxItemValue = data.items[0]?.value ?? 1;

  return (
    <InsightCard title={data.title} headerActions={<EntityCardHeaderActions />}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-1 flex h-[7.875rem] items-center justify-center rounded bg-surface-modal sm:mx-0">
          <p className="text-[3rem] font-black leading-[2.75rem] text-text-primary">{data.total}</p>
        </div>
        <ol className="mt-3 min-h-0 flex-1 divide-y divide-datavis-gridlines">
          {data.items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2 py-2.5 sm:gap-3">
              <Checkbox checked={false} onCheckedChange={() => {}} aria-label={`Select ${item.label}`} />
              <span className="w-5 shrink-0 text-base-semibold tabular-nums text-text-tertiary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <TruncatedText
                className="text-base-semibold text-text-secondary"
                wrapperClassName="min-w-0 flex-1"
              >
                {item.label}
              </TruncatedText>
              <EntityAmountBar value={item.value} maxValue={maxItemValue} />
              <span className="w-10 shrink-0 text-right text-base-small tabular-nums text-text-secondary">
                {formatCount(item.value)}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-center justify-end gap-2 text-base-small text-text-primary">
          <Button variant="ghost" className="size-6 p-0 text-text-tertiary hover:text-text-primary" aria-label="Previous page">
            <Icon name="navi-chevron-left" size={12} />
          </Button>
          <span className="tabular-nums tracking-[0.4px]">1-5 of {data.totalCount}</span>
          <Button variant="ghost" className="size-6 p-0 text-text-tertiary hover:text-text-primary" aria-label="Next page">
            <Icon name="navi-chevron-right" size={12} />
          </Button>
        </div>
      </div>
    </InsightCard>
  );
}

/** Figma `1595:48982` — Entities Overview body for Federated Analytics. */
export function EntitiesOverviewContent() {
  return (
    <div className="flex shrink-0 flex-col gap-4 p-4 sm:p-5">
      <InsightCard title="Top Entities by type">
        <div className="-mx-3 -mt-3 -mb-4 sm:-mx-4">
          <EntitiesBubbleChart />
        </div>
      </InsightCard>

      <Top10EntitiesPanel />

      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-3">
        {ENTITY_CATEGORY_CARDS.map((card) => (
          <EntityCategoryCard key={card.title} data={card} />
        ))}
      </div>
    </div>
  );
}
