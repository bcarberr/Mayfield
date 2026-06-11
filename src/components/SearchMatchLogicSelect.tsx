import { SearchCriteriaSelect } from "./SearchCriteriaSelect";

export type SearchMatchLogic = "or" | "and";

const MATCH_LOGIC_OPTIONS = [
  { id: "or", label: "OR (match any)" },
  { id: "and", label: "AND (match all)" },
] as const satisfies readonly { id: SearchMatchLogic; label: string }[];

export function SearchMatchLogicSelect({
  value = "or",
  onChange,
  className,
}: {
  value?: SearchMatchLogic;
  onChange?: (next: SearchMatchLogic) => void;
  className?: string;
}) {
  return (
    <SearchCriteriaSelect
      value={value}
      onChange={(next) => onChange?.(next)}
      options={MATCH_LOGIC_OPTIONS}
      className={className ?? "w-[168px] shrink-0"}
      aria-label="Match logic"
    />
  );
}
