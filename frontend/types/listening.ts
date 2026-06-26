export type ListeningPartNumber = 1 | 2 | 3 | 4;

export interface ListeningTableCell {
  textBefore?: string;
  questionNumber?: number;
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
  audioUrl?: string;
  audioDurationSeconds: number;
  tableHeaders: string[];
  tableRows: ListeningTableRow[];
}

export interface ListeningMockTest {
  id: string;
  title: string;
  typeLabel: string;
  iconStyle: "headphones" | "broadcast" | "microphone";
  totalMinutes: number;
  bufferSeconds: number;
  parts: ListeningPart[];
}

export interface ListeningAnswer {
  questionId: string;
  value: string;
}
