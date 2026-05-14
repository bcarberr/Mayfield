import queryDsDns from "./query-ds-dns.svg?raw";

/**
 * Icons exported from the linked Query DS Library nodes (Figma Dev Mode MCP).
 * Node `1209:3400` is the **DNS** symbol only; add more `query-ds-*.svg` + entries here as you link additional components.
 */
export const QUERY_DS_ICON_NAMES = ["query-ds-dns"] as const;

export type QueryDsIconName = (typeof QUERY_DS_ICON_NAMES)[number];

export const QUERY_DS_RAW_BY_NAME: Record<QueryDsIconName, string> = {
  "query-ds-dns": queryDsDns,
};
