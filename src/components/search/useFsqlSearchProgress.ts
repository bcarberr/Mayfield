import { useEffect, useState } from "react";

const QUERIES_MIN_MS = 5_000;
const QUERIES_MAX_MS = 7_000;
const RETURNING_EXTRA_MIN_MS = 400;
const RETURNING_EXTRA_MAX_MS = 900;

function randomDuration(minMs: number, maxMs: number): number {
  return minMs + Math.random() * (maxMs - minMs);
}

export type FsqlSearchProgressState = {
  displayedTotalResults: number;
  queriesCompleted: boolean;
  returningResultsComplete: boolean;
  queriesCompletedCount: number;
  returningResultsCount: number;
  isProgressActive: boolean;
};

export function useFsqlSearchProgress({
  searchKey,
  finalTotalResults,
  selectedConnectorCount,
}: {
  searchKey: string | null;
  finalTotalResults: number;
  selectedConnectorCount: number;
}): FsqlSearchProgressState {
  // syncedKey tracks which searchKey we last applied a synchronous reset for.
  const [syncedKey, setSyncedKey] = useState<string | null>(null);
  const [displayedTotalResults, setDisplayedTotalResults] = useState(0);
  const [queriesCompleted, setQueriesCompleted] = useState(false);
  const [returningResultsComplete, setReturningResultsComplete] = useState(false);

  // Derived state: reset progress synchronously when a new search key arrives.
  // This fires before any effects so the FsqlSearchResultsView effect that calls
  // markSearchSessionComplete can't see a stale returningResultsComplete=true from
  // the previous search and immediately short-circuit the new one.
  if (searchKey !== null && syncedKey !== searchKey) {
    setSyncedKey(searchKey);
    setDisplayedTotalResults(0);
    setQueriesCompleted(false);
    setReturningResultsComplete(false);
  }

  useEffect(() => {
    if (!searchKey) {
      setDisplayedTotalResults(finalTotalResults);
      setQueriesCompleted(true);
      setReturningResultsComplete(true);
      return;
    }

    const queriesDuration = randomDuration(QUERIES_MIN_MS, QUERIES_MAX_MS);
    const returningDuration = queriesDuration + randomDuration(RETURNING_EXTRA_MIN_MS, RETURNING_EXTRA_MAX_MS);

    const queriesTimer = window.setTimeout(() => setQueriesCompleted(true), queriesDuration);
    const returningTimer = window.setTimeout(() => {
      setReturningResultsComplete(true);
      setDisplayedTotalResults(finalTotalResults);
    }, returningDuration);

    const tickMs = Math.max(40, Math.round(returningDuration / Math.max(finalTotalResults, 24)));
    const countTimer = window.setInterval(() => {
      setDisplayedTotalResults((current) => {
        if (current >= finalTotalResults) return current;
        const step = Math.max(1, Math.ceil(finalTotalResults / 35));
        return Math.min(finalTotalResults, current + step);
      });
    }, tickMs);

    return () => {
      window.clearTimeout(queriesTimer);
      window.clearTimeout(returningTimer);
      window.clearInterval(countTimer);
    };
  }, [searchKey, finalTotalResults, selectedConnectorCount]);

  const returningResultsCount = Math.max(
    1,
    Math.min(selectedConnectorCount, Math.round(selectedConnectorCount * 0.89)),
  );

  return {
    displayedTotalResults,
    queriesCompleted,
    returningResultsComplete,
    queriesCompletedCount: selectedConnectorCount,
    returningResultsCount,
    isProgressActive: Boolean(searchKey) && !returningResultsComplete,
  };
}
