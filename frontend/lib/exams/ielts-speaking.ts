import type {
  SpeakingBoardMode,
  SpeakingMockTest,
  SpeakingPart1Task,
  SpeakingPart2Task,
  SpeakingPart3Task,
} from "@/types/speaking";

export const SPEAKING_PART1_SECONDS = 5 * 60;
export const SPEAKING_PART2_PREP_SECONDS = 60;
export const SPEAKING_PART2_SPEAK_SECONDS = 3 * 60;
export const SPEAKING_PART3_SECONDS = 5 * 60;

export const SPEAKING_MOCK_SECONDS =
  SPEAKING_PART1_SECONDS +
  SPEAKING_PART2_PREP_SECONDS +
  SPEAKING_PART2_SPEAK_SECONDS +
  SPEAKING_PART3_SECONDS;

const PART1_QUESTIONS_HOME = [
  { id: "p1-q1", text: "What is your full name?" },
  { id: "p1-q2", text: "Where are you from?" },
  { id: "p1-q3", text: "Do you work or are you a student?" },
  { id: "p1-q4", text: "What do you like most about your hometown?" },
  { id: "p1-q5", text: "How often do you visit your hometown?" },
  // { id: "p1-q6", text: "Do you prefer living in a city or in the countryside?" },
  // { id: "p1-q7", text: "What kind of accommodation do you live in?" },
  // { id: "p1-q8", text: "Who do you live with?" },
  // { id: "p1-q9", text: "Is there anything you would like to change about your home?" },
];

const PART1_QUESTIONS_HOBBIES = [
  { id: "p1-q1", text: "Do you enjoy reading?" },
  { id: "p1-q2", text: "What kind of books do you prefer?" },
  { id: "p1-q3", text: "How often do you read?" },
  { id: "p1-q4", text: "Did you read much when you were a child?" },
  { id: "p1-q5", text: "Do you think reading is important for children?" },
  { id: "p1-q6", text: "Do you prefer e-books or printed books?" },
  { id: "p1-q7", text: "Have your reading habits changed over the years?" },
  { id: "p1-q8", text: "Would you like to write a book one day?" },
];

const CUE_CARD_TRAVEL = {
  topic: "Describe a memorable trip you took",
  prompt: "Describe a memorable trip you took.",
  bulletPoints: [
    "Where you went",
    "Who you went with",
    "What you did there",
    "And explain why this trip was memorable for you",
  ],
  followUpQuestions: [
    { id: "p2-fu1", text: "Would you like to go there again?" },
    { id: "p2-fu2", text: "Did you take any photos during the trip?" },
  ],
};

const CUE_CARD_PERSON = {
  topic: "Describe a person who has influenced you",
  prompt: "Describe a person who has had a positive influence on you.",
  bulletPoints: [
    "Who this person is",
    "How you know them",
    "What they have done",
    "And explain why they have influenced you",
  ],
  followUpQuestions: [
    { id: "p2-fu1", text: "Do you still keep in touch with this person?" },
    { id: "p2-fu2", text: "In what ways has this person changed your thinking?" },
  ],
};

const PART3_TRAVEL = {
  partNumber: 3 as const,
  label: "Part 3",
  durationMinutes: 5,
  topic: "Travel and tourism",
  questions: [
    { id: "p3-q1", text: "Why do you think people enjoy travelling to other countries?" },
    { id: "p3-q2", text: "How has tourism changed in your country in recent years?" },
    { id: "p3-q3", text: "What are the advantages and disadvantages of mass tourism?" },
    { id: "p3-q4", text: "Do you think international travel will become more or less popular in the future?" },
    { id: "p3-q5", text: "How can governments protect local culture from the effects of tourism?" },
  ],
};

const PART3_EDUCATION = {
  partNumber: 3 as const,
  label: "Part 3",
  durationMinutes: 5,
  topic: "Education and learning",
  questions: [
    { id: "p3-q1", text: "What qualities make a good teacher?" },
    { id: "p3-q2", text: "How has education changed compared to your parents' generation?" },
    { id: "p3-q3", text: "Do you think online learning will replace traditional classrooms?" },
    { id: "p3-q4", text: "Should university education be free for everyone?" },
    { id: "p3-q5", text: "How important is it for adults to continue learning throughout life?" },
  ],
};

export const SPEAKING_MOCK_TESTS: SpeakingMockTest[] = [
  {
    id: "speaking-mock-1",
    title: "IELTS Speaking — Mock Test 1",
    typeLabel: "Full Mock Test",
    totalMinutes: 14,
    part1: {
      partNumber: 1,
      label: "Part 1 — Introduction",
      durationMinutes: 5,
      questions: PART1_QUESTIONS_HOME,
    },
    part2: {
      partNumber: 2,
      label: "Part 2 — Long Turn",
      prepMinutes: 1,
      speakMinutes: 3,
      cueCard: CUE_CARD_TRAVEL,
    },
    part3: PART3_TRAVEL,
  },
  {
    id: "speaking-mock-2",
    title: "IELTS Speaking — Mock Test 2",
    typeLabel: "Full Mock Test",
    totalMinutes: 14,
    part1: {
      partNumber: 1,
      label: "Part 1 — Introduction",
      durationMinutes: 5,
      questions: PART1_QUESTIONS_HOBBIES,
    },
    part2: {
      partNumber: 2,
      label: "Part 2 — Long Turn",
      prepMinutes: 1,
      speakMinutes: 3,
      cueCard: CUE_CARD_PERSON,
    },
    part3: PART3_EDUCATION,
  },
];

export const SPEAKING_PART1_TASKS: SpeakingPart1Task[] = [
  {
    id: "sp1-home-town",
    title: "Hometown & Accommodation",
    typeLabel: "Part 1 · ~5 min",
    part1: {
      partNumber: 1,
      label: "Part 1 — Introduction",
      durationMinutes: 5,
      questions: PART1_QUESTIONS_HOME,
    },
  },
  {
    id: "sp1-reading",
    title: "Reading & Books",
    typeLabel: "Part 1 · ~5 min",
    part1: {
      partNumber: 1,
      label: "Part 1 — Introduction",
      durationMinutes: 5,
      questions: PART1_QUESTIONS_HOBBIES,
    },
  },
];

export const SPEAKING_PART2_TASKS: SpeakingPart2Task[] = [
  {
    id: "sp2-memorable-trip",
    title: "Memorable Trip",
    typeLabel: "Cue Card · 1 min prep + 2–3 min",
    part2: {
      partNumber: 2,
      label: "Part 2 — Long Turn",
      prepMinutes: 1,
      speakMinutes: 3,
      cueCard: CUE_CARD_TRAVEL,
    },
  },
  {
    id: "sp2-influential-person",
    title: "Influential Person",
    typeLabel: "Cue Card · 1 min prep + 2–3 min",
    part2: {
      partNumber: 2,
      label: "Part 2 — Long Turn",
      prepMinutes: 1,
      speakMinutes: 3,
      cueCard: CUE_CARD_PERSON,
    },
  },
];

export const SPEAKING_PART3_TASKS: SpeakingPart3Task[] = [
  {
    id: "sp3-travel",
    title: "Travel & Tourism",
    typeLabel: "Part 3 · ~5 min",
    part3: PART3_TRAVEL,
  },
  {
    id: "sp3-education",
    title: "Education & Learning",
    typeLabel: "Part 3 · ~5 min",
    part3: PART3_EDUCATION,
  },
];

export function getSpeakingMockTest(id?: string): SpeakingMockTest {
  if (!id) return SPEAKING_MOCK_TESTS[0];
  return SPEAKING_MOCK_TESTS.find((test) => test.id === id) ?? SPEAKING_MOCK_TESTS[0];
}

export function getSpeakingPart1Task(id: string): SpeakingPart1Task | undefined {
  return SPEAKING_PART1_TASKS.find((task) => task.id === id);
}

export function getSpeakingPart2Task(id: string): SpeakingPart2Task | undefined {
  return SPEAKING_PART2_TASKS.find((task) => task.id === id);
}

export function getSpeakingPart3Task(id: string): SpeakingPart3Task | undefined {
  return SPEAKING_PART3_TASKS.find((task) => task.id === id);
}

export function getSpeakingTaskHref(
  mode: SpeakingBoardMode,
  id: string,
  backHref?: string
): string {
  const base = `/test/ielts/speaking/${mode}/${id}`;
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}

export function countSpeakingQuestions(mockTest: SpeakingMockTest): number {
  return (
    mockTest.part1.questions.length +
    1 +
    mockTest.part2.cueCard.followUpQuestions.length +
    mockTest.part3.questions.length
  );
}
