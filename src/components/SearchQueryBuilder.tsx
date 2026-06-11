import { useEffect, useRef, useState } from "react";
import { Checkbox, Icon } from "../design-system";
import {
  selectionLabel,
  type SearchScopeSelection,
} from "../data/searchEntityOptions";
import { SearchCriteriaSelect } from "./SearchCriteriaSelect";
import { SearchEntityEventSelect } from "./SearchEntityEventSelect";
import { SearchMatchLogicSelect, type SearchMatchLogic } from "./SearchMatchLogicSelect";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

type ConditionOperator =
  | "equals"
  | "not-equals"
  | "contains"
  | "not-contains"
  | "starts-with"
  | "ends-with";

type QueryCondition = {
  id: string;
  selection: SearchScopeSelection | null;
  operator: ConditionOperator;
  value: string;
  caseSensitive: boolean;
};

const CONDITION_OPERATOR_OPTIONS: readonly { id: ConditionOperator; label: string }[] = [
  { id: "equals", label: "equals" },
  { id: "not-equals", label: "not equals" },
  { id: "contains", label: "contains" },
  { id: "not-contains", label: "does not contain" },
  { id: "starts-with", label: "starts with" },
  { id: "ends-with", label: "ends with" },
];

function createEmptyCondition(id: string): QueryCondition {
  return {
    id,
    selection: null,
    operator: "equals",
    value: "",
    caseSensitive: false,
  };
}

function QueryBuilderConditionRow({
  condition,
  showMatchLogic,
  matchLogic,
  onMatchLogicChange,
  onChange,
}: {
  condition: QueryCondition;
  showMatchLogic: boolean;
  matchLogic: SearchMatchLogic;
  onMatchLogicChange: (next: SearchMatchLogic) => void;
  onChange: (next: QueryCondition) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {showMatchLogic ? (
        <SearchMatchLogicSelect value={matchLogic} onChange={onMatchLogicChange} />
      ) : null}

      <div className="flex flex-wrap items-start gap-3">
        <SearchEntityEventSelect
          className="w-[240px] shrink-0"
          placeholder="Select an Entity"
          aria-label="Select an Entity"
          value={condition.selection}
          onChange={(selection) => onChange({ ...condition, selection })}
        />

        <SearchCriteriaSelect
          value={condition.operator}
          onChange={(operator) => onChange({ ...condition, operator })}
          options={CONDITION_OPERATOR_OPTIONS}
          className="w-[120px] shrink-0"
          aria-label="Condition operator"
          valueClassName="text-datavis-data-peanut-orange"
          selectedOptionClassName="text-datavis-data-peanut-orange"
        />

        <div className="min-w-[200px] flex-1">
          <Input
            value={condition.value}
            onChange={(event) => onChange({ ...condition, value: event.target.value })}
            placeholder="Value"
            aria-label="Condition value"
            className="h-8 min-h-8 bg-surface-container [&_input]:placeholder:font-normal [&_input]:placeholder:italic [&_input]:placeholder:text-text-tertiary"
          />
          <Checkbox
            checked={condition.caseSensitive}
            onCheckedChange={(caseSensitive) => onChange({ ...condition, caseSensitive })}
            label="Case-sensitive"
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}

function conditionToFsqlFragment(condition: QueryCondition): string | null {
  const label = selectionLabel(condition.selection)?.trim();
  const value = condition.value.trim();
  if (!label || !value) return null;

  const operatorToken: Record<ConditionOperator, string> = {
    equals: "=",
    "not-equals": "!=",
    contains: "CONTAINS",
    "not-contains": "NOT CONTAINS",
    "starts-with": "STARTS WITH",
    "ends-with": "ENDS WITH",
  };

  const quotedValue = `"${value.replace(/"/g, '\\"')}"`;
  const sensitivity = condition.caseSensitive ? " CASE_SENSITIVE" : "";
  return `${label} ${operatorToken[condition.operator]} ${quotedValue}${sensitivity}`;
}

export function buildFsqlFromQueryBuilder(
  matchLogic: SearchMatchLogic,
  conditions: QueryCondition[],
): string {
  const fragments = conditions
    .map(conditionToFsqlFragment)
    .filter((fragment): fragment is string => Boolean(fragment));

  if (fragments.length === 0) return "";
  if (fragments.length === 1) return fragments[0]!;

  const joiner = matchLogic === "or" ? " OR " : " AND ";
  return fragments.map((fragment) => `(${fragment})`).join(joiner);
}

function isQueryBuilderValid(conditions: QueryCondition[]): boolean {
  return conditions.some((condition) => {
    const label = selectionLabel(condition.selection)?.trim();
    return Boolean(label && condition.value.trim());
  });
}

function useConditionIdCounter(start = 0) {
  const ref = useRef(start);
  return {
    next() {
      ref.current += 1;
      return `condition-${ref.current}`;
    },
  };
}

export function SearchQueryBuilder({
  onValidityChange,
  onConvertToFsql,
}: {
  onValidityChange?: (valid: boolean) => void;
  onConvertToFsql?: (query: string) => void;
}) {
  const conditionIdRef = useConditionIdCounter();
  const [matchLogic, setMatchLogic] = useState<SearchMatchLogic>("or");
  const [conditions, setConditions] = useState<QueryCondition[]>(() => [
    createEmptyCondition(conditionIdRef.next()),
  ]);

  const valid = isQueryBuilderValid(conditions);

  useEffect(() => {
    onValidityChange?.(valid);
  }, [valid, onValidityChange]);

  const updateCondition = (id: string, next: QueryCondition) => {
    setConditions((current) => current.map((condition) => (condition.id === id ? next : condition)));
  };

  const addCondition = () => {
    setConditions((current) => [...current, createEmptyCondition(conditionIdRef.next())]);
  };

  const handleConvertToFsql = () => {
    const query = buildFsqlFromQueryBuilder(matchLogic, conditions);
    if (!query) return;
    onConvertToFsql?.(query);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {conditions.map((condition, index) => (
          <QueryBuilderConditionRow
            key={condition.id}
            condition={condition}
            showMatchLogic={index === 0}
            matchLogic={matchLogic}
            onMatchLogicChange={setMatchLogic}
            onChange={(next) => updateCondition(condition.id, next)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="small" onClick={addCondition}>
          <Icon name="action-add" size={12} className="size-3 shrink-0 text-current [&>svg]:!size-[12px]" aria-hidden />
          Add Condition
        </Button>
        <Button type="button" variant="secondary" size="small" disabled={!valid} onClick={handleConvertToFsql}>
          Convert to FSQL
        </Button>
      </div>
    </div>
  );
}
