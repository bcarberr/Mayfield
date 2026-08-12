import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Icon, type ConnectorLargeIconName } from "../design-system";
import { ConnectorSampleDataGrid, ConnectorSampleDataJson } from "../components/connectors/ConnectorSampleDataGrid";
import {
  connectorDemoDataTableName,
  connectorSampleRowsAsJson,
  DEMO_CONNECTOR_SAMPLE_DATA,
} from "../components/connectors/connectorDemoSchema";
import { Button } from "@/components/shadcn/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import {
  SLIDE_OVER_FLOATING_FOOTER_PANEL_CLASS,
  SLIDE_OVER_FLOATING_FOOTER_WRAPPER_CLASS,
  SLIDE_OVER_FOOTER_BUTTON_CLASS,
  SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS,
  SlideOverHeaderBackButton,
} from "../components/ui/SlideOver";
import { JsonSyntaxHighlight } from "../components/ui/JsonSyntaxHighlight";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Switch } from "../components/ui/Switch";
import type { ConnectorSetupTarget } from "../components/connectors/connectorPlatformTypes";
import { isDynamicSchemaCategory } from "../components/connectors/connectorPlatformTypes";
import {
  getConnectorInstanceById,
  hasConnectorMappings,
  hasConnectorSchemaPreview,
  markConnectorSchemaPreviewFetched,
} from "../components/connectors/connectorEnabledState";
import type { SchemaMappingPreviewPayload } from "../components/connectors/AmazonAthenaMapReviewStep";
import { SHOW_ATHENA_CONNECTOR_STEP_3 } from "./navRailConfig";

const AmazonAthenaMapReviewStep = lazy(() =>
  import("../components/connectors/AmazonAthenaMapReviewStep").then((module) => ({
    default: module.AmazonAthenaMapReviewStep,
  })),
);

type StepIndex = 1 | 2 | 3;

const SETUP_STEP_TABS: ReadonlyArray<{ step: StepIndex; label: string }> = [
  { step: 1, label: "Connector Info" },
  { step: 2, label: "Preview/Import Fields" },
  { step: 3, label: "Map and Review Data" },
];

const SETUP_LINE_TAB_TRIGGER_CLASS =
  "h-auto flex-none rounded-none border-0 px-0 pb-3 text-sm font-semibold text-text-tertiary transition-colors hover:text-text-secondary [&::after]:hidden before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:bg-transparent before:transition-colors data-active:!bg-transparent data-active:before:bg-interactive-active data-active:text-text-primary data-active:shadow-none";

function initialDynamicSetupStep(connectorId: string, maxStep: StepIndex): StepIndex {
  if (maxStep >= 3 && getConnectorInstanceById(connectorId) != null) return 3;
  return 1;
}

function SetupStepTabs({
  currentStep,
  maxStep,
  schemaPreviewLoaded,
  onStepChange,
}: {
  currentStep: StepIndex;
  maxStep: StepIndex;
  schemaPreviewLoaded: boolean;
  onStepChange: (step: StepIndex) => void;
}) {
  const tabs = SETUP_STEP_TABS.filter((tab) => tab.step <= maxStep);

  return (
    <Tabs
      value={String(currentStep)}
      onValueChange={(value) => onStepChange(Number(value) as StepIndex)}
      className="min-w-0 flex-1 gap-0"
    >
      <TabsList
        variant="line"
        aria-label="Connector setup sections"
        className="h-auto w-full flex-wrap justify-start gap-6 rounded-none bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.step}
            value={String(tab.step)}
            disabled={tab.step === 3 && !schemaPreviewLoaded}
            className={SETUP_LINE_TAB_TRIGGER_CLASS}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function ConnectionTitleLink({ connectorName }: { connectorName: string }) {
  const isAthena = connectorName === "Amazon Athena";

  return (
    <div className="flex min-w-0 max-w-md flex-1 flex-col items-end justify-end pb-0.5 text-right">
      <p className="inline-flex flex-wrap items-center justify-end gap-1 text-sm leading-[18px] text-text-tertiary">
        <span>
          {isAthena
            ? "Search and manage Amazon Athena Data Base."
            : `Configure your ${connectorName} connector.`}
        </span>
        <a
          href={isAthena ? "https://docs.aws.amazon.com/athena/" : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-normal whitespace-nowrap text-interactive-active hover:underline"
          onClick={isAthena ? undefined : (event) => event.preventDefault()}
        >
          Learn more
          <Icon name="external" size={14} className="text-interactive-active" />
        </a>
      </p>
    </div>
  );
}

type StaticConnectionFields = {
  host: string;
  apiKey: string;
};

const DEFAULT_STATIC_CONNECTION_FIELDS: StaticConnectionFields = {
  host: "",
  apiKey: "",
};

function StaticConnectorForm({
  connectorName,
  onConnectorNameChange,
  fields,
  onFieldsChange,
}: {
  connectorName: string;
  onConnectorNameChange: (name: string) => void;
  fields: StaticConnectionFields;
  onFieldsChange: (next: StaticConnectionFields) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 py-6">
      <div>
        <p className="text-base-semibold text-text-primary">Connection Settings</p>
        <p className="mt-1 text-sm text-text-secondary">
          Enter connection details for your connector.
        </p>
      </div>
      <div className="grid max-w-xl gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Connector Name</span>
          <Input value={connectorName} onChange={(event) => onConnectorNameChange(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Host / Endpoint</span>
          <Input
            placeholder="https://api.example.com"
            value={fields.host}
            onChange={(event) => onFieldsChange({ ...fields, host: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">API Key</span>
          <Input
            type="password"
            placeholder="Enter API key or token"
            autoComplete="off"
            value={fields.apiKey}
            onChange={(event) => onFieldsChange({ ...fields, apiKey: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

function SchemaTypeBadge({ dynamic }: { dynamic: boolean }) {
  if (dynamic) {
    return (
      <span className="shrink-0 rounded bg-badge-muted px-2 py-1.5 text-xs font-semibold leading-4 tracking-[0.4px] text-white [html[data-theme=light]_&]:text-text-on-primary">
        DYNAMIC SCHEMA
      </span>
    );
  }

  return (
    <span className="shrink-0 rounded bg-border-rule px-2 py-1.5 text-xs font-semibold uppercase leading-4 tracking-[0.4px] text-white">
      STATIC SCHEMA
    </span>
  );
}

type DynamicConnectionFields = {
  awsRegion: string;
  database: string;
  workgroup: string;
  s3OutputLocation: string;
};

const DEFAULT_DYNAMIC_CONNECTION_FIELDS: DynamicConnectionFields = {
  awsRegion: "us-east-1",
  database: "security_lake",
  workgroup: "primary",
  s3OutputLocation: "s3://my-bucket/athena-results/",
};

function connectionFieldsEqual<T extends Record<string, string>>(a: T, b: T) {
  return (Object.keys(a) as Array<keyof T>).every((key) => a[key] === b[key]);
}

function ConnectorInfoStep({
  connectorName,
  onConnectorNameChange,
  fields,
  onFieldsChange,
}: {
  connectorName: string;
  onConnectorNameChange: (name: string) => void;
  fields: DynamicConnectionFields;
  onFieldsChange: (next: DynamicConnectionFields) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 py-6">
      <div>
        <p className="text-base-semibold text-text-primary">Connector Info</p>
        <p className="mt-1 text-sm text-text-secondary">
          Enter connection details for your data source.
        </p>
      </div>
      <div className="grid max-w-xl gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Connector Name</span>
          <Input value={connectorName} onChange={(event) => onConnectorNameChange(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">AWS Region</span>
          <Input
            value={fields.awsRegion}
            onChange={(event) => onFieldsChange({ ...fields, awsRegion: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Database</span>
          <Input
            value={fields.database}
            onChange={(event) => onFieldsChange({ ...fields, database: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Workgroup</span>
          <Input
            value={fields.workgroup}
            onChange={(event) => onFieldsChange({ ...fields, workgroup: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">S3 Output Location</span>
          <Input
            value={fields.s3OutputLocation}
            onChange={(event) => onFieldsChange({ ...fields, s3OutputLocation: event.target.value })}
          />
        </label>
      </div>
    </div>
  );
}

const PREVIEW_SAMPLE_INSTRUCTION =
  "Fetch a sample preview of the data you wish to map to a Connector. Then select Import. Importing these data table fields will allow you to map to Query's Data Model, allowing quick searchable access to all your data.";

function PreviewImportFieldsStep({
  connectorName,
  previewLoaded,
  onPreviewLoadedChange,
  onSchemaRefetch,
}: {
  connectorName: string;
  previewLoaded: boolean;
  onPreviewLoadedChange?: (loaded: boolean) => void;
  onSchemaRefetch?: () => void;
}) {
  const [showJson, setShowJson] = useState(false);
  const [fetchGeneration, setFetchGeneration] = useState(0);

  const dataTableName = useMemo(() => connectorDemoDataTableName(connectorName), [connectorName]);

  const loadPreview = () => {
    onPreviewLoadedChange?.(true);
  };

  const refetchSample = () => {
    setFetchGeneration((generation) => generation + 1);
    onSchemaRefetch?.();
  };

  const sampleRows = useMemo(
    () =>
      DEMO_CONNECTOR_SAMPLE_DATA.rows.map((row, index) => ({
        ...row,
        previewRowId: `${fetchGeneration}-${index}`,
      })),
    [fetchGeneration],
  );

  const sampleJson = useMemo(
    () => connectorSampleRowsAsJson(DEMO_CONNECTOR_SAMPLE_DATA.rows),
    [fetchGeneration],
  );

  if (!previewLoaded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-6 py-6">
        <p className="max-w-4xl text-sm leading-[18px] text-text-secondary">{PREVIEW_SAMPLE_INSTRUCTION}</p>
        <div>
          <p className="text-base-semibold text-text-primary">Preview / Import Fields</p>
          <p className="mt-1 text-sm text-text-secondary">
            Fetch sample rows from your connected data table before importing fields.
          </p>
        </div>
        <div className="rounded border border-border-rule bg-surface-container px-4 py-8 text-center">
          <Icon name="action-file-upload" size={32} className="mx-auto text-text-tertiary" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-text-primary">Preview Sample Data</p>
          <p className="mt-1 text-sm text-text-secondary">
            Load a sample preview from{" "}
            <span className="font-semibold text-text-primary">{dataTableName}</span>.
          </p>
          <Button variant="secondary-outline" className="mt-4" onClick={loadPreview}>
            Preview Schema
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden py-6">
      <p className="shrink-0 max-w-4xl text-sm leading-[18px] text-text-secondary">{PREVIEW_SAMPLE_INSTRUCTION}</p>

      <div className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="text-base-semibold text-text-primary">Preview Sample Data</h2>
          <p className="text-sm font-semibold text-text-secondary">
            Data Table: <span className="text-text-primary">{dataTableName}</span>
          </p>
          <Button variant="secondary-outline" className="h-8 shrink-0 ring-offset-surface-modal" onClick={refetchSample}>
            Re-fetch schema
          </Button>
        </div>
        <Switch checked={showJson} onCheckedChange={setShowJson} label="Show JSON" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded border border-border-rule bg-surface-container">
        <p className="shrink-0 border-b border-border-rule px-4 py-2.5 text-sm font-semibold text-text-primary">
          {DEMO_CONNECTOR_SAMPLE_DATA.previewCount} of {DEMO_CONNECTOR_SAMPLE_DATA.totalResults} Results
        </p>
        <div className="min-h-0 flex-1">
          {showJson ? <ConnectorSampleDataJson json={sampleJson} /> : <ConnectorSampleDataGrid rows={sampleRows} />}
        </div>
      </div>
    </div>
  );
}

function MappingPreviewJsonPanel({
  preview,
  onClose,
}: {
  preview: SchemaMappingPreviewPayload;
  onClose: () => void;
}) {
  const json = useMemo(() => JSON.stringify(preview, null, 2), [preview]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-modal text-text-primary">
      <header className="flex shrink-0 items-center gap-2 border-b border-border-rule px-4 py-4">
        <SlideOverHeaderBackButton onClose={onClose} className="ring-offset-surface-modal" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-page-title text-text-primary">Preview JSON</h2>
          <p className="mt-0.5 truncate text-sm text-text-secondary">
            {preview.eventClass.label}
            {preview.mappedFieldCount > 0
              ? ` · ${preview.mappedFieldCount} mapped field${preview.mappedFieldCount === 1 ? "" : "s"}`
              : " · No fields mapped yet"}
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <JsonSyntaxHighlight
          json={json}
          className="rounded border border-border-rule bg-surface-container p-4"
        />
      </div>
    </div>
  );
}

function FloatingActions({
  onCancel,
  onBack,
  onNext,
  onPreviewJson,
  onSave,
  showBack,
  showPreviewJson,
  showSave = false,
  nextLabel,
  nextDisabled = false,
  saveDisabled = true,
  isSaving = false,
}: {
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  onPreviewJson?: () => void;
  onSave?: () => void;
  showBack: boolean;
  showPreviewJson: boolean;
  showSave?: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
  saveDisabled?: boolean;
  isSaving?: boolean;
}) {
  return (
    <div className={SLIDE_OVER_FLOATING_FOOTER_WRAPPER_CLASS}>
      <div className={SLIDE_OVER_FLOATING_FOOTER_PANEL_CLASS}>
        <Button
          type="button"
          variant="ghost"
          className={SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS}
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        {showPreviewJson ? (
          <Button
            type="button"
            variant="ghost"
            className={SLIDE_OVER_FOOTER_GHOST_BUTTON_CLASS}
            onClick={onPreviewJson}
            disabled={isSaving}
          >
            Preview JSON
          </Button>
        ) : null}
        {showSave ? (
          <Button
            type="button"
            variant="secondary-outline"
            className={SLIDE_OVER_FOOTER_BUTTON_CLASS}
            onClick={onSave}
            disabled={saveDisabled || isSaving}
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                Saving…
              </span>
            ) : (
              "Save"
            )}
          </Button>
        ) : null}
        {showBack ? (
          <Button
            variant="secondary-outline"
            className={SLIDE_OVER_FOOTER_BUTTON_CLASS}
            onClick={onBack}
            disabled={isSaving}
          >
            Back
          </Button>
        ) : null}
        <Button
          variant="default"
          className={SLIDE_OVER_FOOTER_BUTTON_CLASS}
          onClick={onNext}
          disabled={nextDisabled || isSaving}
        >
          {!showSave && isSaving ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
              Saving…
            </span>
          ) : (
            nextLabel
          )}
        </Button>
      </div>
    </div>
  );
}

export type ConnectorSetupPanelProps = {
  onClose: () => void;
  onSave?: (connector: ConnectorSetupTarget, enabled: boolean) => void;
  connector: ConnectorSetupTarget;
};

function ConnectorSetupHeaderIcon({ icon, title }: { icon: ConnectorLargeIconName; title: string }) {
  return (
    <Icon
      name={icon}
      size={24}
      className="size-6 shrink-0 [&_svg]:!size-6"
      title={title}
      aria-hidden
    />
  );
}

/** Connector setup — dynamic schema wizard or static single-form, from `ConnectorsPage`. */
export function ConnectorSetupPanel({ onClose, onSave, connector }: ConnectorSetupPanelProps) {
  const isDynamicSchema = isDynamicSchemaCategory(connector.categoryId);
  const maxStep: StepIndex = SHOW_ATHENA_CONNECTOR_STEP_3 ? 3 : 2;
  const initialEnabled = getConnectorInstanceById(connector.id)?.enabled ?? true;
  const [currentStep, setCurrentStep] = useState<StepIndex>(() =>
    isDynamicSchema ? initialDynamicSetupStep(connector.id, maxStep) : 1,
  );
  const [pendingStep, setPendingStep] = useState<StepIndex | null>(null);
  const [connectorEnabled, setConnectorEnabled] = useState(initialEnabled);
  const [connectorName, setConnectorName] = useState(connector.name);
  const [savedName, setSavedName] = useState(connector.name);
  const [savedEnabled, setSavedEnabled] = useState(initialEnabled);
  const [dynamicFields, setDynamicFields] = useState<DynamicConnectionFields>(
    DEFAULT_DYNAMIC_CONNECTION_FIELDS,
  );
  const [savedDynamicFields, setSavedDynamicFields] = useState<DynamicConnectionFields>(
    DEFAULT_DYNAMIC_CONNECTION_FIELDS,
  );
  const [staticFields, setStaticFields] = useState<StaticConnectionFields>(
    DEFAULT_STATIC_CONNECTION_FIELDS,
  );
  const [savedStaticFields, setSavedStaticFields] = useState<StaticConnectionFields>(
    DEFAULT_STATIC_CONNECTION_FIELDS,
  );
  const [schemaPreviewLoaded, setSchemaPreviewLoaded] = useState(() =>
    hasConnectorSchemaPreview(connector.id),
  );
  const [schemaImportReady, setSchemaImportReady] = useState(false);
  const [hasMappedFields, setHasMappedFields] = useState(() => hasConnectorMappings(connector.id));
  const [mappingPreview, setMappingPreview] = useState<SchemaMappingPreviewPayload | null>(null);
  const [previewJsonOpen, setPreviewJsonOpen] = useState(false);
  const [unsavedChangesOpen, setUnsavedChangesOpen] = useState(false);
  const [allowAutosave, setAllowAutosave] = useState(true);
  const [savedAllowAutosave, setSavedAllowAutosave] = useState(true);
  const [mappingDirty, setMappingDirty] = useState(false);
  const [mappingCleanToken, setMappingCleanToken] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const enabled = getConnectorInstanceById(connector.id)?.enabled ?? true;
    setConnectorName(connector.name);
    setSavedName(connector.name);
    setConnectorEnabled(enabled);
    setSavedEnabled(enabled);
    setDynamicFields(DEFAULT_DYNAMIC_CONNECTION_FIELDS);
    setSavedDynamicFields(DEFAULT_DYNAMIC_CONNECTION_FIELDS);
    setStaticFields(DEFAULT_STATIC_CONNECTION_FIELDS);
    setSavedStaticFields(DEFAULT_STATIC_CONNECTION_FIELDS);
    setSchemaPreviewLoaded(hasConnectorSchemaPreview(connector.id));
    setSchemaImportReady(false);
    setAllowAutosave(true);
    setSavedAllowAutosave(true);
    setMappingDirty(false);
    setHasMappedFields(hasConnectorMappings(connector.id));
    setCurrentStep(isDynamicSchema ? initialDynamicSetupStep(connector.id, maxStep) : 1);
    setPendingStep(null);
  }, [connector.id, connector.name, isDynamicSchema, maxStep]);

  useEffect(() => {
    if (currentStep !== 3) {
      setMappingPreview(null);
      setPreviewJsonOpen(false);
      setMappingDirty(false);
      if (!hasConnectorMappings(connector.id)) {
        setHasMappedFields(false);
      }
    }
  }, [connector.id, currentStep]);

  useEffect(() => {
    if (!previewJsonOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setPreviewJsonOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [previewJsonOpen]);

  const connectorSwitchDisabled = isDynamicSchema && !hasMappedFields;
  const displayName = connectorName.trim() || connector.name;
  const hasEdits =
    displayName !== savedName.trim() ||
    connectorEnabled !== savedEnabled ||
    (isDynamicSchema
      ? !connectionFieldsEqual(dynamicFields, savedDynamicFields)
      : !connectionFieldsEqual(staticFields, savedStaticFields));

  const goToPreviousStep = () => {
    if (isSaving) return;
    requestStepChange((currentStep > 1 ? (currentStep - 1) : currentStep) as StepIndex);
  };

  const goToNextStep = () => {
    setCurrentStep((step) => (step < maxStep ? ((step + 1) as StepIndex) : step));
  };

  const advanceAfterUnsavedPrompt = () => {
    if (pendingStep != null) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
      return;
    }
    goToNextStep();
  };

  const requestStepChange = (nextStep: StepIndex) => {
    if (nextStep === currentStep || isSaving) return;
    if (nextStep === 3 && !schemaPreviewLoaded) return;
    if (hasEdits) {
      setPendingStep(nextStep);
      setUnsavedChangesOpen(true);
      return;
    }
    setCurrentStep(nextStep);
  };

  const canAdvanceFromCurrentStep =
    currentStep !== 2 || schemaImportReady;

  const isLastStep = !isDynamicSchema || currentStep === maxStep;
  const autosaveDirty = allowAutosave !== savedAllowAutosave;
  const canManualSaveOnMapStep =
    isDynamicSchema &&
    currentStep === 3 &&
    SHOW_ATHENA_CONNECTOR_STEP_3 &&
    (autosaveDirty || (!allowAutosave && mappingDirty));
  const canSave = hasEdits || canManualSaveOnMapStep;

  const discardEdits = () => {
    setConnectorName(savedName);
    setConnectorEnabled(savedEnabled);
    setDynamicFields(savedDynamicFields);
    setStaticFields(savedStaticFields);
  };

  const handleSave = (afterSave?: () => void) => {
    if (!canSave || isSaving) return;

    setIsSaving(true);
    const nextName = displayName;
    const nextEnabled = connectorEnabled;
    const nextDynamicFields = dynamicFields;
    const nextStaticFields = staticFields;
    const shouldPersistConnectionFields = hasEdits;
    const shouldClearMapStepDirty = canManualSaveOnMapStep;
    const nextAllowAutosave = allowAutosave;
    window.setTimeout(() => {
      if (shouldPersistConnectionFields) {
        onSave?.({ ...connector, name: nextName }, nextEnabled);
        setSavedName(nextName);
        setSavedEnabled(nextEnabled);
        setSavedDynamicFields(nextDynamicFields);
        setSavedStaticFields(nextStaticFields);
      }
      if (shouldClearMapStepDirty) {
        setSavedAllowAutosave(nextAllowAutosave);
        setMappingCleanToken((token) => token + 1);
        setMappingDirty(false);
      }
      setIsSaving(false);
      toast.success("Connector saved successfully", {
        description: `"${nextName}" has been updated.`,
      });
      afterSave?.();
    }, 900);
  };

  const tryGoToNextStep = () => {
    if (!canAdvanceFromCurrentStep || isSaving || isLastStep) return;
    const nextStep = (currentStep + 1) as StepIndex;
    requestStepChange(nextStep);
  };

  const handleDisregardAndContinue = () => {
    discardEdits();
    setUnsavedChangesOpen(false);
    advanceAfterUnsavedPrompt();
  };

  const handleSaveAndContinue = () => {
    handleSave(() => {
      setUnsavedChangesOpen(false);
      advanceAfterUnsavedPrompt();
    });
  };

  const handlePrimaryAction = () => {
    if (!canAdvanceFromCurrentStep || isSaving) return;
    if (!isLastStep) {
      tryGoToNextStep();
      return;
    }
    // Dynamic Finish / static Save on last step
    if (isDynamicSchema) {
      if (canSave) return;
      onClose();
      return;
    }
    handleSave();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface-modal px-5 text-text-primary">
      <header className="relative shrink-0 bg-surface-modal">
        <div className="border-b border-border-rule px-0 pt-5 pb-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3 pr-52 sm:pr-72">
            <Button
              variant="ghost"
              className="shrink-0 p-1"
              aria-label="Back"
              onClick={onClose}
              disabled={isSaving}
            >
              <Icon name="chevron-down" size={20} className="rotate-90 text-text-primary" />
            </Button>
            <ConnectorSetupHeaderIcon icon={connector.icon} title={displayName} />
            <h1 className="truncate text-page-title text-text-primary">{displayName}</h1>
            <Switch
              checked={isDynamicSchema ? (connectorSwitchDisabled ? true : connectorEnabled) : connectorEnabled}
              disabled={connectorSwitchDisabled}
              onCheckedChange={connectorSwitchDisabled ? undefined : setConnectorEnabled}
              label="Connector Enabled"
            />
            <SchemaTypeBadge dynamic={isDynamicSchema} />
          </div>
        </div>

        <div className="absolute right-0 top-5 z-10 flex items-center gap-2">
          {isDynamicSchema ? (
            <div className="mr-2 flex items-center gap-1 text-base leading-6 tracking-[0.5px] text-text-primary">
              <Button
                variant="ghost"
                className="p-1"
                aria-label="Previous step"
                disabled={currentStep <= 1}
                onClick={goToPreviousStep}
              >
                <Icon name="chevron-down" size={20} className="rotate-90 text-text-primary" />
              </Button>
              <span className="min-w-[96px] text-center text-base font-normal leading-6">
                Step {currentStep} of {maxStep}
              </span>
              <Button
                variant="ghost"
                className="p-1"
                aria-label="Next step"
                disabled={isLastStep || !canAdvanceFromCurrentStep || isSaving}
                onClick={tryGoToNextStep}
              >
                <Icon name="chevron-down" size={20} className="-rotate-90 text-text-primary" />
              </Button>
            </div>
          ) : null}
          <Button
            variant="ghost"
            className="rounded-2xl p-1"
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <Icon name="close" size={24} />
          </Button>
        </div>

        {isDynamicSchema ? (
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border-rule px-0 pt-4">
            <SetupStepTabs
              currentStep={currentStep}
              maxStep={maxStep}
              schemaPreviewLoaded={schemaPreviewLoaded}
              onStepChange={requestStepChange}
            />
            <ConnectionTitleLink connectorName={connector.platformName} />
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isDynamicSchema ? (
          <>
            {currentStep === 1 ? (
              <ConnectorInfoStep
                connectorName={connectorName}
                onConnectorNameChange={setConnectorName}
                fields={dynamicFields}
                onFieldsChange={setDynamicFields}
              />
            ) : null}
            {currentStep === 2 ? (
              <PreviewImportFieldsStep
                connectorName={connector.platformName}
                previewLoaded={schemaPreviewLoaded}
                onPreviewLoadedChange={(loaded) => {
                  setSchemaPreviewLoaded(loaded);
                  if (loaded) {
                    markConnectorSchemaPreviewFetched(connector.id);
                    setSchemaImportReady(true);
                  }
                }}
                onSchemaRefetch={() => setSchemaImportReady(true)}
              />
            ) : null}
            {currentStep === 3 && SHOW_ATHENA_CONNECTOR_STEP_3 ? (
              <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-text-secondary">Loading…</div>}>
                <AmazonAthenaMapReviewStep
                  connectorId={connector.id}
                  onHasMappedFieldsChange={setHasMappedFields}
                  onMappingPreviewChange={setMappingPreview}
                  allowAutosave={allowAutosave}
                  onAllowAutosaveChange={setAllowAutosave}
                  onMappingDirtyChange={setMappingDirty}
                  mappingCleanToken={mappingCleanToken}
                />
              </Suspense>
            ) : null}
          </>
        ) : (
          <StaticConnectorForm
            connectorName={connectorName}
            onConnectorNameChange={setConnectorName}
            fields={staticFields}
            onFieldsChange={setStaticFields}
          />
        )}
      </div>

      <FloatingActions
        onCancel={onClose}
        onBack={goToPreviousStep}
        onNext={handlePrimaryAction}
        onPreviewJson={() => setPreviewJsonOpen(true)}
        onSave={() => handleSave()}
        showBack={isDynamicSchema && currentStep > 1}
        showPreviewJson={isDynamicSchema && currentStep === 3 && SHOW_ATHENA_CONNECTOR_STEP_3}
        showSave={isDynamicSchema && currentStep !== 2}
        nextDisabled={
          isDynamicSchema
            ? isLastStep
              ? canSave
              : !canAdvanceFromCurrentStep
            : !canAdvanceFromCurrentStep || !hasEdits
        }
        saveDisabled={!canSave}
        isSaving={isSaving}
        nextLabel={
          currentStep === 2
            ? "Import Fields"
            : isLastStep
              ? isDynamicSchema
                ? "Finish"
                : "Save"
              : "Next"
        }
      />

      {previewJsonOpen && mappingPreview ? (
        <div className="absolute inset-0 z-40 flex overflow-hidden">
          <button
            type="button"
            className="absolute inset-0 animate-overlay-scrim-in bg-overlay-scrim"
            aria-label="Close preview JSON"
            onClick={() => setPreviewJsonOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Preview mapping JSON"
            className="relative z-10 ml-auto flex h-full w-[min(100%,calc(42rem+48px))] min-w-0 animate-slide-over-in flex-col overflow-hidden border-l border-border-rule bg-surface-modal shadow-[-4px_0_24px_rgba(0,0,0,0.25)]"
          >
            <MappingPreviewJsonPanel preview={mappingPreview} onClose={() => setPreviewJsonOpen(false)} />
          </aside>
        </div>
      ) : null}

      <Modal
        open={unsavedChangesOpen}
        title="Unsaved changes"
        onClose={() => {
          if (isSaving) return;
          setUnsavedChangesOpen(false);
          setPendingStep(null);
        }}
        footer={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSaving}
              onClick={handleDisregardAndContinue}
            >
              Disregard
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={isSaving}
              onClick={handleSaveAndContinue}
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                  Saving…
                </span>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        }
      >
        You have unsaved changes. Do you want to save them before moving on, or disregard them?
      </Modal>
    </div>
  );
}
