import {
  createContext,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { NewDetectionPayload } from "../components/federated-detection-hub/CreateDetectionSlideOver";
import { DETECTION_ROWS } from "../components/federated-detection-hub/detectionHubData";
import type { DetectionRow } from "../components/federated-detection-hub/detectionHubTypes";
import {
  buildInitialEnabledByName,
  detectionEnabledKey,
} from "../components/federated-detection-hub/detectionEnabledState";
import { LIBRARY_DETECTION_ROWS } from "../components/federated-detection-hub/DetectionLibraryContent";
import { INITIAL_QUEUED_DETECTION_ROWS } from "../components/federated-detection-hub/detectionQueue";

type DetectionHubContextValue = {
  detectionRows: DetectionRow[];
  setDetectionRows: Dispatch<SetStateAction<DetectionRow[]>>;
  enabledByName: Record<string, boolean>;
  setEnabledByName: Dispatch<SetStateAction<Record<string, boolean>>>;
  newDetectionRow: DetectionRow | null;
  setNewDetectionRow: Dispatch<SetStateAction<DetectionRow | null>>;
  updatedDetectionRow: DetectionRow | null;
  setUpdatedDetectionRow: Dispatch<SetStateAction<DetectionRow | null>>;
  registerCreatedDetection: (payload: NewDetectionPayload) => DetectionRow;
};

const DetectionHubContext = createContext<DetectionHubContextValue | null>(null);

function createDetectionRowFromPayload(payload: NewDetectionPayload): DetectionRow {
  const savedName = payload.name.trim() || "Untitled Detection";
  return {
    id: String(Date.now()),
    name: savedName,
    description: payload.description,
    enabled: payload.enabled,
    severity: payload.severity,
    lastRun: "—",
    recurrence: payload.recurrence,
    findings: "none",
  };
}

export function DetectionHubProvider({ children }: { children: ReactNode }) {
  const [detectionRows, setDetectionRows] = useState<DetectionRow[]>(() => [...DETECTION_ROWS]);
  const [newDetectionRow, setNewDetectionRow] = useState<DetectionRow | null>(null);
  const [updatedDetectionRow, setUpdatedDetectionRow] = useState<DetectionRow | null>(null);
  const [enabledByName, setEnabledByName] = useState<Record<string, boolean>>(() =>
    buildInitialEnabledByName([
      ...DETECTION_ROWS,
      ...LIBRARY_DETECTION_ROWS,
      ...INITIAL_QUEUED_DETECTION_ROWS,
    ]),
  );

  const registerCreatedDetection = useCallback((payload: NewDetectionPayload) => {
    const savedName = payload.name.trim() || "Untitled Detection";
    setEnabledByName((prev) => ({
      ...prev,
      [detectionEnabledKey(savedName)]: payload.enabled,
    }));
    const createdRow = createDetectionRowFromPayload(payload);
    setDetectionRows((rows) => {
      if (rows.some((row) => row.id === createdRow.id)) return rows;
      return [createdRow, ...rows];
    });
    setNewDetectionRow(createdRow);
    return createdRow;
  }, []);

  return (
    <DetectionHubContext.Provider
      value={{
        detectionRows,
        setDetectionRows,
        enabledByName,
        setEnabledByName,
        newDetectionRow,
        setNewDetectionRow,
        updatedDetectionRow,
        setUpdatedDetectionRow,
        registerCreatedDetection,
      }}
    >
      {children}
    </DetectionHubContext.Provider>
  );
}

export function useDetectionHub() {
  const context = useContext(DetectionHubContext);
  if (!context) {
    throw new Error("useDetectionHub must be used within DetectionHubProvider");
  }
  return context;
}
