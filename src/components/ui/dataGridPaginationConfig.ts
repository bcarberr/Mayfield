/** Smallest selectable page size. */
export const DATA_GRID_MIN_PAGE_SIZE = 10;

/** Default rows per page for federated detection datagrids. */
export const DATA_GRID_DEFAULT_PAGE_SIZE = 15;

/** Step between page-size options after the initial 10. */
export const DATA_GRID_PAGE_SIZE_STEP = 5;

/** Largest page-size option offered in the footer selector. */
export const DATA_GRID_MAX_PAGE_SIZE = 50;

export const DATA_GRID_PAGE_SIZE_OPTIONS = [
  DATA_GRID_MIN_PAGE_SIZE,
  ...Array.from(
    { length: (DATA_GRID_MAX_PAGE_SIZE - DATA_GRID_MIN_PAGE_SIZE) / DATA_GRID_PAGE_SIZE_STEP },
    (_, index) => DATA_GRID_MIN_PAGE_SIZE + DATA_GRID_PAGE_SIZE_STEP * (index + 1),
  ),
] as const;

export function isDataGridPageSize(
  value: number,
  options: readonly number[] = DATA_GRID_PAGE_SIZE_OPTIONS,
): boolean {
  return options.includes(value);
}
