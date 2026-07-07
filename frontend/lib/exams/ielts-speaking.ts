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
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}

/** Question count metadata for the mock's part breakdown. */
export const MOCK_BREAKDOWN = {
  part1Count: PART1_TOPICS[0].questions.length,
  followUpCount: TOPIC_SETS[0].followUpQuestions.length,
  part3Count: TOPIC_SETS[0].discussionQuestions.length,
  topic: TOPIC_SETS[0],
} as const;
