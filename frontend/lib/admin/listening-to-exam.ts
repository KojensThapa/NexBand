import type { AdminListeningMockTest, AdminListeningPart, AdminListeningQuestion } from "@/types/admin";
import type { ListeningMockTest, ListeningPart, ListeningTableRow } from "@/types/listening";

function formatQuestionCellText(question: AdminListeningQuestion): string {
  if (question.type === "multiple-choice" && question.options?.length) {
    const optionsText = question.options
      .map((option, index) => `${String.fromCharCode(65 + index)}. ${option}`)
      .join("\n");
    return `${question.questionText}\n${optionsText}`;
  }

  if (question.type === "matching" && question.options?.length) {
    const optionsText = question.options.map((option) => `• ${option}`).join("\n");
    return `${question.questionText}\n${optionsText}`;
  }

  return question.questionText;
}

function buildTableFromPart(part: AdminListeningPart): {
  tableHeaders: string[];
  tableRows: ListeningTableRow[];
} {
  const sortedQuestions = [...part.questions].sort(
    (a, b) => a.questionNumber - b.questionNumber
  );

  const isTableType = sortedQuestions.some((q) => q.type === "table-completion");

  if (isTableType) {
    return {
      tableHeaders: ["Item", "Detail", "Notes"],
      tableRows: sortedQuestions.map((question) => ({
        cells: [
          `Q${question.questionNumber}`,
          formatQuestionCellText(question),
          [{ questionNumber: question.questionNumber }],
        ],
      })),
    };
  }

  return {
    tableHeaders: ["Question", "Your answer"],
    tableRows: sortedQuestions.map((question) => ({
      cells: [
        formatQuestionCellText(question),
        [{ questionNumber: question.questionNumber }],
      ],
    })),
  };
}

function adminPartToListeningPart(
  part: AdminListeningPart,
  testId: string
): ListeningPart {
  const { tableHeaders, tableRows } = buildTableFromPart(part);

  return {
    id: `${testId}-part-${part.partNumber}`,
    partNumber: part.partNumber,
    label: `Part ${part.partNumber}`,
    title: part.title,
    instruction: part.instruction,
    audioUrl: part.audioUrl,
    audioDurationSeconds: part.audioDurationSeconds,
    transcript: part.transcript,
    mapImageUrl: part.mapImageUrl,
    mapImageAlt: part.mapImageAlt,
    tableHeaders,
    tableRows,
  };
}

export function adminListeningTestToExam(test: AdminListeningMockTest): ListeningMockTest {
  return {
    id: test.id,
    title: test.title,
    typeLabel: test.published ? "Full Mock Test" : "Draft",
    iconStyle: test.iconStyle,
    totalMinutes: 32,
    bufferSeconds: 30,
    parts: test.parts
      .sort((a, b) => a.partNumber - b.partNumber)
      .map((part) => adminPartToListeningPart(part, test.id)),
  };
}

export function buildAdminListeningMockTests(
  tests: AdminListeningMockTest[],
  options?: { publishedOnly?: boolean }
): ListeningMockTest[] {
  const filtered = options?.publishedOnly
    ? tests.filter((test) => test.published)
    : tests;

  return filtered.map(adminListeningTestToExam);
}

export function getPartQuestionOffset(
  mockTest: ListeningMockTest,
  partNumber: number
): number {
  let offset = 0;
  for (const part of mockTest.parts.sort((a, b) => a.partNumber - b.partNumber)) {
    if (part.partNumber >= partNumber) break;
    offset += countPartQuestions(part);
  }
  return offset;
}

export function countPartQuestions(part: ListeningPart): number {
  let count = 0;
  for (const row of part.tableRows) {
    for (const cell of row.cells) {
      if (typeof cell === "string") continue;
      for (const segment of cell) {
        if (segment.questionNumber) count += 1;
      }
    }
  }
  return count;
}

export function countMockTestQuestions(mockTest: ListeningMockTest): number {
  return mockTest.parts.reduce((total, part) => total + countPartQuestions(part), 0);
}
