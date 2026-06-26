import type { ListeningMockTest, ListeningPart, ListeningTableRow } from "@/types/listening";

export const LISTENING_MOCK_SECONDS = 32 * 60 + 30;
export const LISTENING_PART_SECONDS = 8 * 60 + 30;

function restaurantTableRows(): ListeningTableRow[] {
  return [
    {
      cells: [
        "The Junction",
        "Greyson Street, near the cinema",
        [
          { textBefore: "Good for people who are especially keen on " },
          { questionNumber: 1 },
        ],
        [
          { textBefore: "The " },
          { questionNumber: 2 },
          { textAfter: " is a good place for a drink" },
        ],
      ],
    },
    {
      cells: [
        "Paloma",
        "In Bow Street next to the library",
        [
          { textBefore: "People who are " },
          { questionNumber: 3 },
          { textAfter: " should book in advance" },
        ],
        "Only uses organic ingredients",
      ],
    },
    {
      cells: [
        [
          { textBefore: "The " },
          { questionNumber: 4 },
        ],
        "At the top of a hill",
        [
          { textBefore: "A limited selection of " },
          { questionNumber: 5 },
          { textAfter: " food on the menu" },
        ],
        "A famous chef used to work there",
      ],
    },
    {
      cells: [
        [
          { textBefore: "The " },
          { questionNumber: 6 },
        ],
        "Near the station",
        [
          { textBefore: "Every day has a different " },
          { questionNumber: 7 },
        ],
        [
          { textBefore: "Need to pay £50 deposit and a " },
          { questionNumber: 8 },
          { textAfter: " fee" },
        ],
      ],
    },
    {
      cells: [
        [
          { textBefore: "The " },
          { questionNumber: 9 },
        ],
        "On George Street",
        "Only opens in the evening",
        [
          { textBefore: "The " },
          { questionNumber: 10 },
          { textAfter: " is a good place for a drink" },
        ],
      ],
    },
  ];
}

function buildPart(
  partNumber: 1 | 2 | 3 | 4,
  testId: string,
  title: string,
  instruction: string,
  tableHeaders: string[],
  tableRows: ListeningTableRow[]
): ListeningPart {
  return {
    id: `${testId}-part-${partNumber}`,
    partNumber,
    label: `Part ${partNumber}`,
    title,
    instruction,
    audioDurationSeconds: partNumber === 1 ? 501 : 480,
    tableHeaders,
    tableRows,
  };
}

function createMockTest(
  id: string,
  title: string,
  iconStyle: ListeningMockTest["iconStyle"]
): ListeningMockTest {
  const part1 = buildPart(
    1,
    id,
    "Restaurant Recommendations",
    "Complete the table below.\nWrite ONE WORD AND/OR A NUMBER for each answer.",
    [
      "Name of restaurant",
      "Location",
      "Reason for recommendation",
      "Other comments",
    ],
    restaurantTableRows()
  );

  const part2 = buildPart(
    2,
    id,
    "Library Membership",
    "Complete the notes below.\nWrite ONE WORD ONLY for each answer.",
    ["Topic", "Detail", "Notes", "Extra"],
    [
      {
        cells: [
          "Membership type",
          [{ textBefore: "Valid for " }, { questionNumber: 1 }, { textAfter: " months" }],
          "Standard access",
          [{ textBefore: "Cost: £" }, { questionNumber: 2 }],
        ],
      },
      {
        cells: [
          "Opening hours",
          "Weekdays 9–8",
          [{ textBefore: "Closed on " }, { questionNumber: 3 }],
          "Free Wi-Fi",
        ],
      },
    ]
  );

  const part3 = buildPart(
    3,
    id,
    "Research Project Discussion",
    "Choose the correct letter, A, B or C.",
    ["Question", "Speaker A", "Speaker B", "Answer"],
    [
      {
        cells: [
          "Main focus",
          [{ textBefore: "Topic: " }, { questionNumber: 1 }],
          "Methodology review",
          "See question booklet",
        ],
      },
    ]
  );

  const part4 = buildPart(
    4,
    id,
    "Urban Wildlife Lecture",
    "Complete the summary below.\nWrite NO MORE THAN TWO WORDS for each answer.",
    ["Section", "Key point", "Example", "Note"],
    [
      {
        cells: [
          "Introduction",
          [{ textBefore: "Urban " }, { questionNumber: 1 }, { textAfter: " are increasing" }],
          "Foxes and birds",
          "Study from 2020",
        ],
      },
    ]
  );

  return {
    id,
    title,
    typeLabel: "Full Mock Test",
    iconStyle,
    totalMinutes: 32,
    bufferSeconds: 30,
    parts: [part1, part2, part3, part4],
  };
}

export const LISTENING_MOCK_TESTS: ListeningMockTest[] = [
  createMockTest("cambridge-20-test-1", "Cambridge IELTS 20 Listening Test 1", "headphones"),
  createMockTest("actual-ielts-test-2", "Actual IELTS Listening Test 2", "broadcast"),
  createMockTest("cambridge-19-test-3", "Cambridge IELTS 19 Listening Test 3", "microphone"),
];

export function getListeningMockTest(id?: string): ListeningMockTest {
  if (!id) return LISTENING_MOCK_TESTS[0];
  return LISTENING_MOCK_TESTS.find((test) => test.id === id) ?? LISTENING_MOCK_TESTS[0];
}

export function getListeningTaskHref(
  testId: string,
  options?: { part?: number; backHref?: string }
): string {
  const partPath = options?.part
    ? `/test/ielts/listening/mock/${testId}/part/${options.part}`
    : `/test/ielts/listening/mock/${testId}`;
  if (!options?.backHref) return partPath;
  return `${partPath}?back=${encodeURIComponent(options.backHref)}`;
}

export function getListeningQuestionIds(test: ListeningMockTest): string[] {
  const ids: string[] = [];
  for (const part of test.parts) {
    let qNum = (part.partNumber - 1) * 10 + 1;
    for (const row of part.tableRows) {
      for (const cell of row.cells) {
        if (typeof cell === "string") continue;
        for (const segment of cell) {
          if (segment.questionNumber) {
            ids.push(`${part.id}-q${segment.questionNumber}`);
            qNum++;
          }
        }
      }
    }
    while (ids.filter((id) => id.startsWith(part.id)).length < 10) {
      const n = ids.filter((id) => id.startsWith(part.id)).length + 1;
      ids.push(`${part.id}-q${n}`);
    }
  }
  return ids;
}

export function countListeningQuestions(part: ListeningPart): number {
  let count = 0;
  for (const row of part.tableRows) {
    for (const cell of row.cells) {
      if (typeof cell === "string") {
        if (cell.includes("__")) count += 1;
        continue;
      }
      for (const segment of cell) {
        if (segment.questionNumber) count += 1;
      }
    }
  }
  return Math.max(count, 10);
}
