export type ResultsDetailAttributeField = {
  type: "field";
  id: string;
  attribute: string;
  value: string;
  /** Connector field outside QDM — teal label with asterisk tooltip. */
  customMapped?: boolean;
  /** Nesting depth for hierarchical OCSF groups. */
  depth?: number;
};

export type ResultsDetailAttributeGroup = {
  type: "group";
  id: string;
  label: string;
  defaultOpen?: boolean;
  depth?: number;
  children: ResultsDetailAttributeNode[];
};

export type ResultsDetailAttributeNode = ResultsDetailAttributeField | ResultsDetailAttributeGroup;

export type ResultsDetailRecord = {
  id: string;
  /** Primary header label — typically event time. */
  headerTitle: string;
  title: string;
  connector: string;
  connectionAlias?: string;
  owner?: string;
  eventType: string;
  description?: string;
  severity?: string;
  activity?: string;
  status?: string;
  attributes: ResultsDetailAttributeNode[];
  qdmJson: string;
  relatedFindings?: readonly { id: string; label: string }[];
};

export type ResultsDetailSourceRow = {
  id: string;
  title: string;
  time: string;
  connector: string;
  description?: string;
  eventClass?: string;
  category?: string;
  activity?: string;
  status?: string;
  severity?: string;
};
