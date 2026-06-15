import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Icon, type ConnectorLargeIconName } from "../design-system";
import { ConnectorSampleDataGrid, ConnectorSampleDataJson } from "../components/connectors/ConnectorSampleDataGrid";
import {
  connectorDemoDataTableName,
  connectorSampleRowsAsJson,
  DEMO_CONNECTOR_SAMPLE_DATA,
} from "../components/connectors/connectorDemoSchema";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Switch } from "../components/ui/Switch";
import type { ConnectorSetupTarget } from "../components/connectors/connectorPlatformTypes";
import { isDynamicSchemaCategory } from "../components/connectors/connectorPlatformTypes";
import { SHOW_ATHENA_CONNECTOR_STEP_3 } from "./navRailConfig";

const AmazonAthenaMapReviewStep = lazy(() =>
  import("../components/connectors/AmazonAthenaMapReviewStep").then((module) => ({
    default: module.AmazonAthenaMapReviewStep,
  })),
);

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type StepIndex = 1 | 2 | 3;

function StepIndicator({ status }: { status: "complete" | "current" | "upcoming" }) {
  if (status === "complete") {
    return (
      <div
        className="box-border flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-interactive-active bg-transparent text-interactive-active"
        aria-hidden
      >
        <svg width="12" height="9" viewBox="0 0 14 10" fill="none" aria-hidden className="shrink-0">
          <path
            d="M1 5L5 9L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  if (status === "current") {
    return <div className="size-6 shrink-0 rounded-full bg-interactive-active" aria-hidden />;
  }
  return (
    <div
      className="box-border size-6 shrink-0 rounded-full border-2 border-border-rule bg-transparent"
      aria-hidden
    />
  );
}

function stepStatus(step: StepIndex, currentStep: StepIndex): "complete" | "current" | "upcoming" {
  if (step < currentStep) return "complete";
  if (step === currentStep) return "current";
  return "upcoming";
}

function ProgressStepper({ currentStep }: { currentStep: StepIndex }) {
  const seg1Teal = currentStep >= 2;
  const seg2Teal = currentStep >= 3;

  return (
    <nav
      className="flex w-full max-w-[632px] shrink-0 flex-col justify-end px-0 py-0"
      aria-label="Connector setup progress"
    >
      <div className="flex w-full flex-col">
        <div className="flex w-full items-center gap-0">
          <div
            className="relative z-[1] flex w-[110px] shrink-0 flex-col items-center"
            aria-current={currentStep === 1 ? "step" : undefined}
          >
            <div className="flex h-6 w-full items-center justify-center">
              <StepIndicator status={stepStatus(1, currentStep)} />
            </div>
          </div>
          <div className="relative z-0 flex h-6 min-h-6 min-w-0 flex-1 items-center self-center ml-[calc((24px-110px)/2)] mr-[calc((24px-130px)/2)]">
            <div
              className={cx("h-0.5 w-full rounded-full", seg1Teal ? "bg-interactive-active" : "bg-border-rule")}
              aria-hidden
            />
          </div>
          <div
            className="relative z-[1] flex w-[130px] shrink-0 flex-col items-center"
            aria-current={currentStep === 2 ? "step" : undefined}
          >
            <div className="flex h-6 w-full items-center justify-center">
              <StepIndicator status={stepStatus(2, currentStep)} />
            </div>
          </div>
          <div className="relative z-0 flex h-6 min-h-6 min-w-0 flex-1 items-center self-center mx-[calc((24px-130px)/2)]">
            <div
              className={cx("h-0.5 w-full rounded-full", seg2Teal ? "bg-interactive-active" : "bg-border-rule")}
              aria-hidden
            />
          </div>
          <div
            className="relative z-[1] flex w-[130px] shrink-0 flex-col items-center"
            aria-current={currentStep === 3 ? "step" : undefined}
          >
            <div className="flex h-6 w-full items-center justify-center">
              <StepIndicator status={stepStatus(3, currentStep)} />
            </div>
          </div>
        </div>
        <div className="mt-1 flex w-full items-start">
          <p className="w-[110px] shrink-0 text-center text-sm leading-[18px] text-text-primary">1. Connector Info</p>
          <div className="min-w-0 flex-1" aria-hidden />
          <p className="w-[130px] shrink-0 text-center text-sm leading-[18px] text-text-primary">2. Preview/Import Fields</p>
          <div className="min-w-0 flex-1" aria-hidden />
          <p className="w-[130px] shrink-0 text-center text-sm leading-[18px] text-text-primary">3. Map & Review Data</p>
        </div>
      </div>
    </nav>
  );
}

function ConnectionTitleLink({ connectorName }: { connectorName: string }) {
  const isAthena = connectorName === "Amazon Athena";

  return (
    <div className="flex min-w-0 max-w-md flex-1 flex-col items-end justify-end pb-0.5 text-right">
      <a
        href={isAthena ? "https://docs.aws.amazon.com/athena/" : "#"}
        target="_blank"
        rel="noreferrer"
        className="inline-flex flex-wrap items-center justify-end gap-1 text-sm leading-[18px] text-text-tertiary hover:text-text-secondary"
        onClick={isAthena ? undefined : (event) => event.preventDefault()}
      >
        <span>
          {isAthena
            ? "Search and manage Amazon Athena Data Base."
            : `Configure your ${connectorName} connector.`}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-normal whitespace-nowrap text-interactive-active">
          Learn more
          <Icon name="external" size={14} className="text-interactive-active" />
        </span>
      </a>
    </div>
  );
}

function StaticConnectorForm({ connectorName }: { connectorName: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 py-6">
      <div>
        <p className="text-base-semibold text-text-primary">Connection Settings</p>
        <p className="mt-1 text-sm text-text-secondary">
          Enter connection details for your {connectorName} connector.
        </p>
      </div>
      <div className="grid max-w-xl gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Connector Name</span>
          <Input defaultValue={connectorName} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Host / Endpoint</span>
          <Input placeholder="https://api.example.com" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">API Key</span>
          <Input type="password" placeholder="Enter API key or token" />
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

function ConnectorInfoStep({ connectorName }: { connectorName: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 py-6">
      <div>
        <p className="text-base-semibold text-text-primary">Connector Info</p>
        <p className="mt-1 text-sm text-text-secondary">
          Enter connection details for your {connectorName} data source.
        </p>
      </div>
      <div className="grid max-w-xl gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Connector Name</span>
          <Input defaultValue={connectorName} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">AWS Region</span>
          <Input defaultValue="us-east-1" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Database</span>
          <Input defaultValue="security_lake" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">Workgroup</span>
          <Input defaultValue="primary" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-secondary">S3 Output Location</span>
          <Input defaultValue="s3://my-bucket/athena-results/" />
        </label>
      </div>
    </div>
  );
}

const PREVIEW_SAMPLE_INSTRUCTION =
  "Fetch a sample preview of the data you wish to map to a Connector. Then select Import. Importing these data table fields will allow you to map to Query's Data Model, allowing quick searchable access to all your data.";

function PreviewImportFieldsStep({
  connectorName,
  onPreviewLoadedChange,
}: {
  connectorName: string;
  onPreviewLoadedChange?: (loaded: boolean) => void;
}) {
  const [schemaPreviewLoaded, setSchemaPreviewLoaded] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [fetchGeneration, setFetchGeneration] = useState(0);

  const dataTableName = useMemo(() => connectorDemoDataTableName(connectorName), [connectorName]);

  const loadPreview = () => {
    setSchemaPreviewLoaded(true);
    onPreviewLoadedChange?.(true);
  };

  const refetchSample = () => {
    setFetchGeneration((generation) => generation + 1);
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

  if (!schemaPreviewLoaded) {
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
          <Button variant="secondary" className="mt-4" onClick={loadPreview}>
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
          <Button variant="secondary" className="h-8 shrink-0 ring-offset-surface-modal" onClick={refetchSample}>
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

function FloatingActions({
  onCancel,
  onBack,
  onNext,
  showBack,
  showPreviewJson,
  nextLabel,
  nextDisabled = false,
}: {
  onCancel: () => void;
  onBack: () => void;
  onNext: () => void;
  showBack: boolean;
  showPreviewJson: boolean;
  nextLabel: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="pointer-events-none absolute bottom-0 right-0 z-20 flex justify-end p-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-tl-lg rounded-bl-lg bg-surface-container/80 px-3 py-2.5 shadow-lg ring-1 ring-border-container backdrop-blur-sm">
        <Button type="button" variant="tertiary" className="text-text-secondary hover:text-text-primary" onClick={onCancel}>
          Cancel
        </Button>
        {showPreviewJson ? (
          <Button variant="tertiary" className="text-text-secondary hover:text-text-primary">
            Preview JSON
          </Button>
        ) : null}
        {showBack ? (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        ) : null}
        <Button variant="primary" onClick={onNext} disabled={nextDisabled}>
          {nextLabel}
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
  const [currentStep, setCurrentStep] = useState<StepIndex>(1);
  const [connectorEnabled, setConnectorEnabled] = useState(true);
  const [schemaPreviewLoaded, setSchemaPreviewLoaded] = useState(false);
  const [hasMappedFields, setHasMappedFields] = useState(false);

  useEffect(() => {
    if (currentStep < 2) setSchemaPreviewLoaded(false);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 3) setHasMappedFields(false);
  }, [currentStep]);

  const connectorSwitchDisabled = isDynamicSchema && !hasMappedFields;

  const goToPreviousStep = () => {
    setCurrentStep((step) => (step > 1 ? ((step - 1) as StepIndex) : step));
  };

  const goToNextStep = () => {
    setCurrentStep((step) => (step < maxStep ? ((step + 1) as StepIndex) : step));
  };

  const canAdvanceFromCurrentStep =
    currentStep !== 2 || schemaPreviewLoaded;

  const handlePrimaryAction = () => {
    if (!canAdvanceFromCurrentStep) return;
    if (isLastStep) {
      onSave?.(connector, connectorEnabled);
      onClose();
      return;
    }
    goToNextStep();
  };

  const isLastStep = !isDynamicSchema || currentStep === maxStep;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface-modal px-5 text-text-primary">
      <header className="relative shrink-0 bg-surface-modal">
        <div className="border-b border-border-rule px-0 pt-5 pb-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3 pr-52 sm:pr-72">
            <Button variant="ghost" className="shrink-0 p-1" aria-label="Back" onClick={onClose}>
              <Icon name="chevron-down" size={20} className="rotate-90 text-text-primary" />
            </Button>
            <ConnectorSetupHeaderIcon icon={connector.icon} title={connector.name} />
            <h1 className="truncate text-page-title text-text-primary">{connector.name}</h1>
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
                disabled={isLastStep || !canAdvanceFromCurrentStep}
                onClick={goToNextStep}
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
          <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border-rule px-0 py-4">
            <ProgressStepper currentStep={currentStep} />
            <ConnectionTitleLink connectorName={connector.name} />
          </div>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isDynamicSchema ? (
          <>
            {currentStep === 1 ? <ConnectorInfoStep connectorName={connector.name} /> : null}
            {currentStep === 2 ? (
              <PreviewImportFieldsStep
                connectorName={connector.name}
                onPreviewLoadedChange={setSchemaPreviewLoaded}
              />
            ) : null}
            {currentStep === 3 && SHOW_ATHENA_CONNECTOR_STEP_3 ? (
              <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-text-secondary">Loading…</div>}>
                <AmazonAthenaMapReviewStep onHasMappedFieldsChange={setHasMappedFields} />
              </Suspense>
            ) : null}
          </>
        ) : (
          <StaticConnectorForm connectorName={connector.name} />
        )}
      </div>

      <FloatingActions
        onCancel={onClose}
        onBack={goToPreviousStep}
        onNext={handlePrimaryAction}
        showBack={isDynamicSchema && currentStep > 1}
        showPreviewJson={isDynamicSchema && currentStep === 3 && SHOW_ATHENA_CONNECTOR_STEP_3}
        nextDisabled={!canAdvanceFromCurrentStep}
        nextLabel={
          currentStep === 2 && schemaPreviewLoaded
            ? "Import Fields"
            : isLastStep
              ? isDynamicSchema
                ? "Finish"
                : "Save"
              : "Next"
        }
      />
    </div>
  );
}
