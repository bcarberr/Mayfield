export type CopilotMessageBlock =
  | { type: "text"; text: string }
  | { type: "code"; language: "fsql"; text: string }
  | { type: "list"; items: string[] }
  | { type: "link"; label: string; href: string };

export type CopilotAssistantResponse = {
  blocks: CopilotMessageBlock[];
};

const FSQL_DOCS_URL = "https://docs.query.ai/docs/fsql";

type KnowledgeTopic = {
  id: string;
  keywords: string[];
  response: CopilotAssistantResponse;
};

const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: "what-is-fsql",
    keywords: ["what is fsql", "federated search query language", "introduction", "overview", "about fsql"],
    response: {
      blocks: [
        {
          type: "text",
          text: "FSQL (Federated Search Query Language) is Query's unified language for searching across multiple security data sources through a single interface. Every record is represented as a standardized OCSF event, so you can filter and analyze data without learning a different query language for each platform.",
        },
        {
          type: "list",
          items: [
            "Unified access across all connected sources",
            "OCSF-based data model for consistent schema",
            "Attribute selectors: wildcards, categories, entities, and set operations",
            "Entity shortcuts (%ip, %hostname, %hash, and more)",
            "Flexible time controls and rich filtering",
          ],
        },
        { type: "link", label: "FSQL documentation", href: FSQL_DOCS_URL },
      ],
    },
  },
  {
    id: "query-structure",
    keywords: ["syntax", "structure", "clause", "query command", "how do i write", "format"],
    response: {
      blocks: [
        {
          type: "text",
          text: "Every FSQL search starts with QUERY. Other clauses are optional and can appear in any order after QUERY:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
[SHOW <fields to return>]
[WITH <filter conditions>]
[SINCE <start time>]
[UNTIL <end time>]
[FROM <connector list>]
[ORDER BY <attribute> [ASC|DESC] [, ...]]
[LIMIT <record limit>]`,
        },
        {
          type: "list",
          items: [
            "SHOW — fields to return (optional; defaults to WITH fields)",
            "WITH — filter predicates (like WHERE)",
            "SINCE / UNTIL — time window (defaults to last 30 minutes)",
            "FROM — limit to specific connectors or tags",
            "ORDER BY — sort results",
            "LIMIT — cap result count",
          ],
        },
        { type: "link", label: "Query Syntax Reference", href: "https://docs.query.ai/docs/query-syntax" },
      ],
    },
  },
  {
    id: "quick-start",
    keywords: ["quick start", "first query", "example", "get started", "failed login", "authentication"],
    response: {
      blocks: [
        {
          type: "text",
          text: "Here is a common starter query for failed login attempts from the last 24–48 hours across Active Directory and Okta:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW authentication.user.username, authentication.src_endpoint.ip
WITH authentication.status_id = FAILURE
SINCE 48hrs UNTIL 24hrs
FROM 'Active Directory', 'Okta'
LIMIT 1000`,
        },
        {
          type: "text",
          text: "Omit FROM to search all enabled connectors. Omit SINCE and UNTIL to use the default 30-minute window.",
        },
        { type: "link", label: "Quick Start guide", href: "https://docs.query.ai/docs/quick-start" },
      ],
    },
  },
  {
    id: "entities",
    keywords: ["entity", "observable", "%ip", "%hostname", "%hash", "%username", "shortcut", "indicator"],
    response: {
      blocks: [
        {
          type: "text",
          text: "Entity shortcuts use % to search across all OCSF fields mapped to that observable type — no need to know exact field paths:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
WITH %ip = '10.0.0.1'`,
        },
        {
          type: "list",
          items: [
            "%ip / %ip_address — all IP address fields",
            "%hostname — all hostname fields",
            "%username / %user_name — all username fields",
            "%email / %email_address — all email fields",
            "%hash / %file_hash — all file hash fields",
            "%filename / %file_name — all file name fields",
            "%processname / %process_name — all process name fields",
            "%command_line — all command line fields",
            "%url / %url_string — all URL fields",
          ],
        },
        { type: "link", label: "Entities reference", href: "https://docs.query.ai/docs/entities" },
      ],
    },
  },
  {
    id: "filters",
    keywords: ["filter", "operator", "with clause", "predicate", "contains", "cidr", "regex", "matches"],
    response: {
      blocks: [
        {
          type: "text",
          text: "Filters in WITH are predicates: attribute, operator, and value. Combine them with AND, OR, NOT, and parentheses.",
        },
        {
          type: "list",
          items: [
            "= / == — equals (== is case-insensitive)",
            "~ / CONTAINS — substring match",
            "^= / STARTSWITH — starts with",
            "$= / ENDSWITH — ends with",
            "IN / IIN — match any value in a list",
            "MATCHES / IMATCHES — regular expression",
            "CIDR — IP within a CIDR range",
            "EMPTY — field is null or empty",
          ],
        },
        {
          type: "code",
          language: "fsql",
          text: `WITH (process_activity.process.name IN 'powershell.exe', 'cmd.exe')
AND (process_activity.process.cmd_line CONTAINS 'hidden'
     OR process_activity.process.cmd_line CONTAINS 'encode')`,
        },
        {
          type: "text",
          text: "For array fields, use ANY or ALL quantifiers: WITH ANY field.list CONTAINS 'value'",
        },
        { type: "link", label: "Search Filter Operators", href: "https://docs.query.ai/docs/search-filter-operators" },
      ],
    },
  },
  {
    id: "time",
    keywords: ["time", "since", "until", "time range", "last 24", "hours", "days", "timestamp"],
    response: {
      blocks: [
        {
          type: "text",
          text: "SINCE sets how far back to search; UNTIL sets where to stop. Relative times read naturally:",
        },
        {
          type: "code",
          language: "fsql",
          text: `SINCE 48hrs UNTIL 24hrs
SINCE 7d
UNTIL '2025-04-01 17:30:00'
UNTIL 1746109163`,
        },
        {
          type: "text",
          text: "Units include m/min, h/hr/hrs, d/day, w/wk/weeks, and mo/month. If you omit both clauses, FSQL defaults to the last 30 minutes.",
        },
        { type: "link", label: "Dates and Times", href: "https://docs.query.ai/docs/dates-and-times" },
      ],
    },
  },
  {
    id: "connectors",
    keywords: ["connector", "from clause", "data source", "tag", "alias", "active directory", "okta"],
    response: {
      blocks: [
        {
          type: "text",
          text: "Use FROM to scope a search to specific connectors. You can mix display names, numeric IDs, aliases, and tags:",
        },
        {
          type: "code",
          language: "fsql",
          text: `FROM 'Active Directory', 'Okta'
FROM okta-logins, #aws, #env/prod
FROM 1940, 2015`,
        },
        {
          type: "list",
          items: [
            "Quoted strings — connector display names",
            "Unquoted tokens — aliases (recommended for saved queries)",
            "Numeric IDs or UUIDs — exact connector references",
            "#tag — expands to all connectors with that tag",
          ],
        },
        {
          type: "text",
          text: "Run EXPLAIN CONNECTORS to list available connectors, aliases, and tags.",
        },
        { type: "link", label: "Query Syntax — FROM", href: "https://docs.query.ai/docs/query-syntax" },
      ],
    },
  },
  {
    id: "selectors",
    keywords: ["show", "wildcard", "selector", "attribute", "field", "category", "#network", "**", "ocsf"],
    response: {
      blocks: [
        {
          type: "text",
          text: "SHOW controls which fields are returned. Wildcards and category selectors help you target the OCSF schema:",
        },
        {
          type: "list",
          items: [
            "authentication.* — all top-level fields for one event class",
            "authentication.** — full depth expansion",
            "#network.** — all fields from every network-category event",
            "(authentication + process_activity).user.name — union across event types",
            "authentication.(* - (start_time + end_time)) — exclude fields",
          ],
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW authentication.**
WITH authentication.status_id = FAILURE`,
        },
        { type: "link", label: "Attribute Selectors", href: "https://docs.query.ai/docs/attribute-selectors" },
      ],
    },
  },
  {
    id: "summarize",
    keywords: ["summarize", "stats", "count", "aggregate", "group by", "analytics"],
    response: {
      blocks: [
        {
          type: "text",
          text: "SUMMARIZE (alias STATS) runs analytics across federated data:",
        },
        {
          type: "code",
          language: "fsql",
          text: `SUMMARIZE COUNT authentication
WITH authentication.status_id = FAILURE
GROUP BY authentication.user.username
SINCE 24hrs`,
        },
        {
          type: "list",
          items: ["COUNT", "COUNT DISTINCT", "MIN", "MAX", "AVG", "SUM"],
        },
        { type: "link", label: "Analytics Functions", href: "https://docs.query.ai/docs/analytics-functions" },
      ],
    },
  },
  {
    id: "explain",
    keywords: ["explain", "validate", "schema", "connectors list", "debug query"],
    response: {
      blocks: [
        {
          type: "text",
          text: "EXPLAIN commands help you explore the data model and validate queries before running them:",
        },
        {
          type: "code",
          language: "fsql",
          text: `EXPLAIN VERSION
EXPLAIN ATTRIBUTES <selector>
EXPLAIN SCHEMA <selector>
EXPLAIN CONNECTORS
EXPLAIN QUERY <query>
VALIDATE QUERY <query>`,
        },
        { type: "link", label: "Other Commands", href: "https://docs.query.ai/docs/other-commands" },
      ],
    },
  },
  {
    id: "event-classes",
    keywords: ["event class", "event type", "authentication", "network_activity", "process_activity", "dns"],
    response: {
      blocks: [
        {
          type: "text",
          text: "Common OCSF event classes you can query in FSQL:",
        },
        {
          type: "list",
          items: [
            "authentication — logins, MFA, SSO",
            "process_activity — process creation and termination",
            "network_activity — connections and flows",
            "dns_activity — DNS queries and responses",
            "http_activity — HTTP requests and responses",
            "file_activity — file CRUD operations",
            "detection_finding — security alerts and detections",
            "api_activity — cloud and SaaS API calls",
          ],
        },
        {
          type: "text",
          text: "Categories like #network, #iam, #findings, and #application group related event classes.",
        },
        { type: "link", label: "Data Model Primer", href: "https://docs.query.ai/docs/data-model-primer" },
      ],
    },
  },
  {
    id: "spl",
    keywords: ["splunk", "spl", "migrate from splunk"],
    response: {
      blocks: [
        {
          type: "text",
          text: "If you are coming from Splunk SPL, Query provides a side-by-side comparison of common patterns and how they map to FSQL.",
        },
        { type: "link", label: "FSQL for SPL Users", href: "https://docs.query.ai/docs/fsql-for-spl-users" },
      ],
    },
  },
  {
    id: "kql",
    keywords: ["kql", "sentinel", "defender", "microsoft"],
    response: {
      blocks: [
        {
          type: "text",
          text: "If you are coming from Microsoft Sentinel or Defender KQL, see the dedicated migration guide for equivalent FSQL patterns.",
        },
        { type: "link", label: "FSQL for KQL Users", href: "https://docs.query.ai/docs/fsql-for-kql-users" },
      ],
    },
  },
  {
    id: "cheat-sheet",
    keywords: ["cheat sheet", "reference", "quick reference"],
    response: {
      blocks: [
        {
          type: "text",
          text: "The FSQL cheat sheet is a single-page quick reference for query structure, selectors, operators, entities, time syntax, and SUMMARIZE.",
        },
        { type: "link", label: "FSQL Cheat Sheet", href: "https://docs.query.ai/docs/cheat-sheet" },
      ],
    },
  },
];

const HELP_ITEM_PROMPTS: Record<string, string> = {
  "Write FSQL search queries": "How do I write an FSQL search query?",
  "Optimize search filters": "How do I optimize FSQL search filters?",
  "Cross-source federated queries": "How do I run a cross-source federated FSQL query?",
  "Generate search templates": "Show me FSQL search templates and examples",
  "Give me a summary of these results": "How do I summarize FSQL search results?",
};

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase().replace(/\s+/g, " ");
}

function scoreTopic(topic: KnowledgeTopic, prompt: string): number {
  let score = 0;
  for (const keyword of topic.keywords) {
    if (prompt.includes(keyword)) {
      score += keyword.split(" ").length >= 2 ? 3 : 1;
    }
  }
  return score;
}

function buildQuerySuggestion(prompt: string): CopilotAssistantResponse | null {
  const normalized = normalizePrompt(prompt);

  if (/\b(ip|address|host)\b/.test(normalized)) {
    const ipMatch = prompt.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/);
    const ip = ipMatch?.[0] ?? "10.0.0.1";
    return {
      blocks: [
        {
          type: "text",
          text: "Use an entity shortcut to hunt an IP across every mapped field in your federated sources:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW #network.**
WITH %ip = '${ip}'
SINCE 24hrs
LIMIT 500`,
        },
        {
          type: "text",
          text: "For a CIDR range on a specific field, use the CIDR operator instead: WITH network_activity.src_endpoint.ip CIDR '10.0.0.0/8'",
        },
      ],
    };
  }

  if (/\b(powershell|cmd\.exe|process)\b/.test(normalized)) {
    return {
      blocks: [
        {
          type: "text",
          text: "This template finds suspicious process execution across federated endpoint telemetry:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW process_activity.**
WITH process_activity.process.name IN 'powershell.exe', 'cmd.exe'
AND process_activity.process.cmd_line CONTAINS 'hidden'
SINCE 7d
LIMIT 1000`,
        },
      ],
    };
  }

  if (/\b(dns|domain)\b/.test(normalized)) {
    return {
      blocks: [
        {
          type: "text",
          text: "Search DNS activity across connectors with an OCSF-aligned filter:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW dns_activity.**
WITH dns_activity.query.hostname CONTAINS 'example.com'
SINCE 24hrs
LIMIT 500`,
        },
      ],
    };
  }

  if (/\b(hash|malware|file)\b/.test(normalized)) {
    return {
      blocks: [
        {
          type: "text",
          text: "Track a file hash across all mapped hash fields with the %hash entity shortcut:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW file_activity.**
WITH %hash = '44d88612fea8a8f36de82e1278abb02f'
SINCE 7d`,
        },
      ],
    };
  }

  if (/\b(failed login|login fail|brute|authentication)\b/.test(normalized)) {
    return {
      blocks: [
        {
          type: "text",
          text: "Here is the documented pattern for failed authentication events:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW authentication.user.username, authentication.src_endpoint.ip
WITH authentication.status_id = FAILURE
SINCE 48hrs UNTIL 24hrs
FROM 'Active Directory', 'Okta'
LIMIT 1000`,
        },
      ],
    };
  }

  return null;
}

function explainCurrentQuery(query: string): CopilotAssistantResponse {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      blocks: [
        {
          type: "text",
          text: "Your FSQL editor is empty. Start with QUERY, add optional SHOW and WITH clauses, then scope time with SINCE and UNTIL.",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW authentication.**
WITH authentication.status_id = FAILURE
SINCE 24hrs`,
        },
      ],
    };
  }

  const blocks: CopilotMessageBlock[] = [
    {
      type: "text",
      text: "Here is how your current FSQL query maps to the documented syntax:",
    },
    { type: "code", language: "fsql", text: trimmed },
  ];

  const hints: string[] = [];
  if (!/\bQUERY\b/i.test(trimmed)) hints.push("FSQL searches must start with QUERY.");
  if (!/\bSINCE\b/i.test(trimmed) && !/\bUNTIL\b/i.test(trimmed)) {
    hints.push("No time range set — FSQL defaults to the last 30 minutes.");
  }
  if (/\bFROM\b/i.test(trimmed)) hints.push("FROM limits the search to the listed connectors, aliases, or #tags.");
  if (/%[a-z_]+/i.test(trimmed)) hints.push("Entity shortcuts (%) search across all mapped observable fields.");
  if (/\bSUMMARIZE\b|\bSTATS\b/i.test(trimmed)) hints.push("SUMMARIZE runs analytics; use GROUP BY to bucket results.");

  if (hints.length > 0) {
    blocks.push({ type: "list", items: hints });
  }

  blocks.push({
    type: "text",
    text: "Run VALIDATE QUERY or EXPLAIN QUERY in FSQL to check interpretation before searching.",
  });
  blocks.push({ type: "link", label: "Query Syntax Reference", href: "https://docs.query.ai/docs/query-syntax" });

  return { blocks };
}

function defaultResponse(): CopilotAssistantResponse {
  return {
    blocks: [
      {
        type: "text",
        text: "I can help with FSQL using Query's official documentation. Try asking about query structure, entity shortcuts, filters, time ranges, connectors, or request an example query.",
      },
      {
        type: "list",
        items: [
          "How do I write an FSQL search query?",
          "What are entity shortcuts like %ip?",
          "Show me filter operators",
          "How do I scope to specific connectors?",
        ],
      },
      { type: "link", label: "FSQL documentation", href: FSQL_DOCS_URL },
    ],
  };
}

export function getCopilotWelcomeResponse(): CopilotAssistantResponse {
  return {
    blocks: [
      {
        type: "text",
        text: "Hi! I'm your Copilot for search assistance. I can help you:",
      },
      {
        type: "list",
        items: [
          "Write FSQL search queries",
          "Optimize search filters",
          "Cross-source federated queries",
          "Generate search templates",
          "Give me a summary of these results",
        ],
      },
      {
        type: "text",
        text: "What would you like help with? Answers are based on the official FSQL docs.",
      },
      { type: "link", label: "docs.query.ai/docs/fsql", href: FSQL_DOCS_URL },
    ],
  };
}

export function resolveCopilotPrompt(prompt: string, currentFsqlQuery = ""): CopilotAssistantResponse {
  const normalized = normalizePrompt(prompt);
  if (!normalized) return defaultResponse();

  const helpPrompt = HELP_ITEM_PROMPTS[prompt.trim()];
  const effectivePrompt = helpPrompt ? normalizePrompt(helpPrompt) : normalized;

  if (
    /\b(current query|my query|this query|optimize|explain)\b/.test(effectivePrompt) &&
    currentFsqlQuery.trim()
  ) {
    return explainCurrentQuery(currentFsqlQuery);
  }

  const suggestion = buildQuerySuggestion(effectivePrompt);
  if (suggestion) return suggestion;

  let bestTopic: KnowledgeTopic | null = null;
  let bestScore = 0;
  for (const topic of KNOWLEDGE_TOPICS) {
    const score = scoreTopic(topic, effectivePrompt);
    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
    }
  }

  if (bestTopic && bestScore > 0) return bestTopic.response;

  if (/\b(write|build|create|generate|template|example|query)\b/.test(effectivePrompt)) {
    return {
      blocks: [
        {
          type: "text",
          text: "Here is a flexible starter template you can adapt. Replace the event class, filters, and connectors for your investigation:",
        },
        {
          type: "code",
          language: "fsql",
          text: `QUERY
SHOW detection_finding.**
WITH detection_finding.severity_id IN HIGH, CRITICAL
SINCE 24hrs
FROM #siem
ORDER BY detection_finding.time DESC
LIMIT 500`,
        },
        {
          type: "text",
          text: "Tell me what you are hunting — IP, username, process, DNS, hash — and I can suggest a more specific query.",
        },
        { type: "link", label: "Quick Start", href: "https://docs.query.ai/docs/quick-start" },
      ],
    };
  }

  return defaultResponse();
}

export function formatCopilotResponseForCopy(response: CopilotAssistantResponse): string {
  return response.blocks
    .map((block) => {
      switch (block.type) {
        case "text":
          return block.text;
        case "code":
          return block.text;
        case "list":
          return block.items.map((item) => `• ${item}`).join("\n");
        case "link":
          return `${block.label}: ${block.href}`;
      }
    })
    .join("\n\n");
}

/** True when a code block is a runnable FSQL query, not a syntax template. */
export function isExecutableFsqlQuery(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^QUERY\s*\n?\s*\[/i.test(trimmed)) return false;
  if (/<[^>]+>/.test(trimmed)) return false;
  return /^(QUERY|SUMMARIZE|STATS|EXPLAIN|VALIDATE)\b/i.test(trimmed);
}
