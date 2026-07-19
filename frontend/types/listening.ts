export type ListeningPartNumber = 1 | 2 | 3 | 4;

export interface ListeningTableCell {
  textBefore?: string;
  questionNumber?: number;
  /** Database ID used when a published test is served by the API. */
  questionId?: string;
  textAfter?: string;
}

export interface ListeningTableRow {
  cells: (string | ListeningTableCell[])[];
}

export interface ListeningPart {
  id: string;
  partNumber: ListeningPartNumber;
  label: string;
  title: string;
  instruction: string;
  /** Key for an audio Blob stored locally in the browser. */
  audioStorageKey?: string;
  audioUrl?: string;
  audioDurationSeconds: number;
  transcript?: string;
  mapImageUrl?: string;
  mapImageAlt?: string;
  tableHeaders: string[];
  tableRows: ListeningTableRow[];
  /** Present for API-backed tests; static fixtures may still use tableRows only. */
  questions?: ListeningQuestion[];
}

export interface ListeningQuestion {
  id: string;
  number: number;
  type:
    | "multiple-choice"
    | "form-completion"
    | "note-completion"
    | "table-completion"
    | "summary-completion"
    | "sentence-completion"
    | "matching"
    | "map-labelling"
    | "short-answer";
  prompt: string;
  options: string[];
  marks: number;
}

export interface ListeningMockTest {
  id: string;
  title: string;
  typeLabel: string;
  iconStyle: "headphones" | "broadcast" | "microphone";
  totalMinutes: number;
  bufferSeconds: number;
  parts: ListeningPart[];
  /** Marks data loaded from the persisted learner API rather than a fixture. */
  isBackendTest?: boolean;
}

export interface ListeningAnswer {
  questionId: string;
  value: string;
}
