<<<<<<< HEAD
import type { SpeakingQuestion, SpeakingTest, SpeakingTopicSet } from "@/types/speaking";

/** Standard IELTS Speaking timings (in seconds). */
export const SPEAKING_TIMINGS = {
  part1Seconds: 5 * 60, // 4–5 minutes
  part2PrepSeconds: 60, // 1 minute preparation
  part2SpeakSeconds: 2 * 60, // 2–3 minutes
  part2SpeakMaxSeconds: 3 * 60,
  part3Seconds: 5 * 60, // 4–5 minutes
  mockTotalSeconds: 14 * 60, // 11–14 minutes overall
} as const;

/** Build a Part 1 topic bundle. */
function part1Topic(
  id: string,
  label: string,
  questions: string[]
): { id: string; label: string; questions: SpeakingQuestion[] } {
  return {
    id,
    label,
    questions: questions.map((text, index) => ({
      id: `${id}-q${index + 1}`,
      text,
    })),
  };
}

const PART1_TOPICS = [
  part1Topic("hometown", "Hometown", [
    "Let's talk about your hometown. Where is your hometown?",
    "What is your hometown famous for?",
    "Would you say it's a good place to live? Why?",
    "Has your hometown changed much since you were a child?",
    "What do you like most about the place where you live?",
    "Would you like to live there in the future?",
    "Do you think your hometown is a good place for young people?",
    "What kind of jobs do people in your hometown usually do?",
    "How could your hometown be improved?",
    "Would you recommend your hometown to a tourist?",
  ]),
  part1Topic("reading-hobbies", "Reading & Hobbies", [
    "Do you enjoy reading?",
    "What kind of books do you like to read?",
    "Do you prefer reading books or watching films? Why?",
    "What kind of music do you like?",
    "Do you play any musical instruments?",
    "What do you usually do in your free time?",
    "Has your taste in music changed over the years?",
    "Do you think hobbies are important? Why?",
    "Is there a hobby you'd like to try in the future?",
    "Do you prefer spending your free time alone or with others?",
  ]),
  part1Topic("work-study", "Work & Study", [
    "What is your full name?",
    "Where do you live?",
    "Are you a student or do you work?",
    "What do you like most about your studies or job?",
    "Is there anything you dislike about your studies or job?",
    "Why did you choose this field of study or work?",
    "What are your future plans regarding your work or studies?",
    "Do you prefer studying alone or with others?",
    "How do you usually travel to work or school?",
    "Would you like to change your job or course in the future?",
  ]),
];

const TOPIC_SETS: SpeakingTopicSet[] = [
  {
    id: "travel",
    label: "Travel & Tourism",
    cueCard: {
      id: "memorable-trip",
      prompt: "Describe a memorable trip you have taken.",
      topicLabel: "Travel",
      points: [
        "where you went",
        "who you went with",
        "what you did during the trip",
        "why it was memorable",
      ],
    },
    followUpQuestions: [
      { id: "travel-fu1", text: "Would you like to visit that place again? Why?" },
      { id: "travel-fu2", text: "What did you learn from the trip?" },
      { id: "travel-fu3", text: "Would you recommend this destination to others?" },
    ],
    discussionQuestions: [
      { id: "travel-d1", text: "Why do people enjoy travelling?" },
      { id: "travel-d2", text: "How has tourism changed in your country in recent years?" },
      { id: "travel-d3", text: "Is travelling important for young people? Why?" },
      { id: "travel-d4", text: "What are the advantages and disadvantages of international tourism?" },
      { id: "travel-d5", text: "How might travel change in the next 20 years?" },
      { id: "travel-d6", text: "Do you think tourism can damage the environment?" },
      { id: "travel-d7", text: "Should governments encourage tourism? Why or why not?" },
    ],
  },
  {
    id: "technology",
    label: "Technology",
    cueCard: {
      id: "useful-device",
      prompt: "Describe a piece of technology you use often.",
      topicLabel: "Technology",
      points: [
        "what the device is",
        "how long you have had it",
        "what you use it for",
        "why it is useful to you",
      ],
    },
    followUpQuestions: [
      { id: "tech-fu1", text: "Could you live without this device? Why?" },
      { id: "tech-fu2", text: "Has it changed the way you work or study?" },
      { id: "tech-fu3", text: "Would you recommend it to a friend?" },
    ],
    discussionQuestions: [
      { id: "tech-d1", text: "How has technology changed the way people communicate?" },
      { id: "tech-d2", text: "Do you think technology makes people more or less sociable?" },
      { id: "tech-d3", text: "Is technology making our lives easier or more stressful?" },
      { id: "tech-d4", text: "Should children be allowed to use devices from a young age?" },
      { id: "tech-d5", text: "What technology do you think will be common in the future?" },
      { id: "tech-d6", text: "Are older people comfortable with modern technology?" },
    ],
  },
  {
    id: "education",
    label: "Education",
    cueCard: {
      id: "favourite-teacher",
      prompt: "Describe a teacher who has influenced you.",
      topicLabel: "Education",
      points: [
        "who the teacher was",
        "what subject they taught",
        "how they taught",
        "why they influenced you",
      ],
    },
    followUpQuestions: [
      { id: "edu-fu1", text: "Do you still keep in touch with this teacher?" },
      { id: "edu-fu2", text: "What makes a good teacher, in your opinion?" },
    ],
    discussionQuestions: [
      { id: "edu-d1", text: "What is the purpose of education?" },
      { id: "edu-d2", text: "How has education changed compared to the past?" },
      { id: "edu-d3", text: "Are exams the best way to assess students?" },
      { id: "edu-d4", text: "Should university education be free for everyone?" },
      { id: "edu-d5", text: "Is practical knowledge more important than academic knowledge?" },
      { id: "edu-d6", text: "How might technology change education in the future?" },
    ],
  },
];

/**
 * The speaking options shown on the board. Part 1/2/3 are single-part
 * practices; the mock combines all three parts automatically.
 */
export const SPEAKING_TESTS: SpeakingTest[] = [
  {
    id: "speaking-part-1",
    part: "part-1",
    title: "Part 1 — Introduction & Interview",
    description:
      "Warm-up questions about familiar topics. Answer one question at a time and record your response.",
    durationLabel: "4–5 min",
    questionCount: PART1_TOPICS[0].questions.length,
    topics: PART1_TOPICS.map((topic) => ({
      id: topic.id,
      label: topic.label,
      cueCard: TOPIC_SETS[0].cueCard,
      followUpQuestions: [],
      discussionQuestions: topic.questions,
    })),
  },
  {
    id: "speaking-part-2",
    part: "part-2",
    title: "Part 2 — Cue Card (Long Turn)",
    description:
      "Prepare for 1 minute, then speak for 2–3 minutes on the cue card before answering follow-up questions.",
    durationLabel: "3–4 min",
    questionCount: TOPIC_SETS[0].followUpQuestions.length + 1,
    topics: TOPIC_SETS.map((set) => ({
      ...set,
      discussionQuestions: [],
    })),
  },
  {
    id: "speaking-part-3",
    part: "part-3",
    title: "Part 3 — Discussion",
    description:
      "Deeper, abstract questions linked to the Part 2 topic. Discuss your ideas in detail.",
    durationLabel: "4–5 min",
    questionCount: TOPIC_SETS[0].discussionQuestions.length,
    topics: TOPIC_SETS.map((set) => ({
      id: set.id,
      label: set.label,
      cueCard: set.cueCard,
      followUpQuestions: [],
      discussionQuestions: set.discussionQuestions,
    })),
  },
  {
    id: "speaking-mock",
    part: "mock",
    title: "Full Speaking Mock Test",
    description:
      "A complete simulated IELTS Speaking exam: Part 1 → Part 2 (1 min prep, 2–3 min speak, follow-ups) → Part 3. Runs automatically end to end.",
    durationLabel: "11–14 min",
    questionCount:
      PART1_TOPICS[0].questions.length +
      1 +
      TOPIC_SETS[0].followUpQuestions.length +
      TOPIC_SETS[0].discussionQuestions.length,
    topics: [
      {
        id: "mock-full",
        label: TOPIC_SETS[0].label,
        cueCard: TOPIC_SETS[0].cueCard,
        // Part 1 questions are stored as "discussionQuestions" of the first
        // part-1 topic for reuse; for the mock we re-assemble from the sources.
        followUpQuestions: TOPIC_SETS[0].followUpQuestions,
        discussionQuestions: TOPIC_SETS[0].discussionQuestions,
      },
    ],
  },
];

/** Part 1 source questions, reused by the mock test intro. */
export const SPEAKING_PART1_QUESTIONS: SpeakingQuestion[] = PART1_TOPICS[0].questions;

export function getSpeakingTest(id?: string): SpeakingTest {
  if (!id) return SPEAKING_TESTS[0];
  return SPEAKING_TESTS.find((test) => test.id === id) ?? SPEAKING_TESTS[0];
}

export function getSpeakingTestByPart(part: string): SpeakingTest | undefined {
  return SPEAKING_TESTS.find((test) => test.part === part);
}

export function getSpeakingTaskHref(
  part: SpeakingTest["part"],
  testId: string,
  backHref?: string
): string {
  const base = `/test/ielts/speaking/${part}/${testId}`;
=======
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
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}

<<<<<<< HEAD
/** Question count metadata for the mock's part breakdown. */
export const MOCK_BREAKDOWN = {
  part1Count: PART1_TOPICS[0].questions.length,
  followUpCount: TOPIC_SETS[0].followUpQuestions.length,
  part3Count: TOPIC_SETS[0].discussionQuestions.length,
  topic: TOPIC_SETS[0],
} as const;
=======
export function countSpeakingQuestions(mockTest: SpeakingMockTest): number {
  return (
    mockTest.part1.questions.length +
    1 +
    mockTest.part2.cueCard.followUpQuestions.length +
    mockTest.part3.questions.length
  );
}
>>>>>>> dd93bf638b3a9424786982ca72ef20d8ee1d2be5
