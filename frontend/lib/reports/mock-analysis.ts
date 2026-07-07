import type {
  ListeningFeedbackDetail,
  ReadingFeedbackDetail,
  SavedReport,
  SpeakingFeedbackDetail,
  WritingFeedbackDetail,
} from "@/types/report";

const ANALYSIS_DELAY_MS = 3500;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomScore(min: number, max: number) {
  const steps = (max - min) * 2 + 1;
  const step = Math.floor(Math.random() * steps);
  return min + step * 0.5;
}

function cefrFromScore(score: number) {
  if (score >= 7) return "B2+";
  if (score >= 6) return "B2";
  return "B1";
}

function buildWritingCriteria(overall: number) {
  return [
    {
      id: "task-achievement",
      label: "Task Achievement",
      score: randomScore(5.5, 7),
      color: "bg-violet-500",
      summary:
        "You addressed the main features of the task but the overview could be clearer. Some data points lack precise support.",
    },
    {
      id: "coherence",
      label: "Coherence & Cohesion",
      score: randomScore(6, 7.5),
      color: "bg-emerald-500",
      summary:
        "Paragraphing is logical and ideas flow well. Use more cohesive devices to link comparisons.",
    },
    {
      id: "lexical",
      label: "Lexical Resource",
      score: randomScore(5.5, 7),
      color: "bg-amber-500",
      summary:
        "Adequate vocabulary for the task with some good academic word choices. Avoid repetition of basic terms.",
    },
    {
      id: "grammar",
      label: "Grammatical Range & Accuracy",
      score: randomScore(6, 7.5),
      color: "bg-rose-500",
      summary:
        "A mix of simple and complex structures with occasional errors that rarely impede communication.",
    },
  ];
}

function buildSpeakingCriteria() {
  return [
    {
      id: "fluency",
      label: "Fluency & Coherence",
      score: randomScore(5.5, 7.5),
      color: "bg-violet-500",
      summary:
        "You speak at a reasonable pace with occasional hesitation. Ideas are mostly connected; use more linking phrases in Part 3.",
    },
    {
      id: "lexical",
      label: "Lexical Resource",
      score: randomScore(5.5, 7),
      color: "bg-emerald-500",
      summary:
        "Adequate vocabulary for familiar topics. Try using less common words and collocations for abstract discussion questions.",
    },
    {
      id: "grammar",
      label: "Grammar",
      score: randomScore(6, 7.5),
      color: "bg-amber-500",
      summary:
        "A mix of simple and complex structures. Watch subject-verb agreement and article use in longer turns.",
    },
    {
      id: "pronunciation",
      label: "Pronunciation",
      score: randomScore(5.5, 7),
      color: "bg-rose-500",
      summary:
        "Generally intelligible with clear stress on key words. Work on word endings and sentence stress for higher bands.",
    },
  ];
}

function buildReadingSections(band: number) {
  return [
    { label: "Section 1", score: band, correct: 11, total: 13 },
    { label: "Section 2", score: band - 0.5, correct: 10, total: 13 },
    { label: "Section 3", score: band - 0.5, correct: 9, total: 14 },
  ];
}

function buildListeningParts(band: number) {
  return [
    { label: "Part 1", score: band, correct: 8, total: 10 },
    { label: "Part 2", score: band - 0.5, correct: 7, total: 10 },
    { label: "Part 3", score: band - 0.5, correct: 7, total: 10 },
    { label: "Part 4", score: band - 1, correct: 6, total: 10 },
  ];
}

export async function analyzeWritingSubmission(input: {
  taskTitle: string;
  taskPrompt: string;
  responseText: string;
  wordCount: number;
}): Promise<WritingFeedbackDetail> {
  await wait(ANALYSIS_DELAY_MS);

  const overall = randomScore(5.5, 7.5);
  const wordCountStatus =
    input.wordCount >= 150 ? "Within target range" : "Below recommended minimum";

  return {
    taskTitle: input.taskTitle,
    taskPrompt: input.taskPrompt,
    responseText: input.responseText,
    wordCount: input.wordCount,
    wordCountStatus,
    overallScore: overall,
    cefrLevel: cefrFromScore(overall),
    criteria: buildWritingCriteria(overall),
    errors: [
      {
        id: 1,
        title: "Missing Overview",
        category: "Task Achievement",
        original:
          "The chart shows owned and rented accommodation from 1918 to 2011.",
        corrected:
          "Overall, the proportion of owned households rose steadily over the period while rented accommodation declined, with owned becoming the dominant type by 2011.",
        explanation:
          "Task 1 requires a clear overview of the main trends, not only a description of what the chart shows.",
      },
      {
        id: 2,
        title: "Wrong Unit",
        category: "Task Achievement",
        original: "consumption drop 20 liters in 1990",
        corrected: "consumption dropped by 20% in 1990",
        explanation:
          "Ensure units and figures match the data in the visual. Avoid unsupported calculations.",
      },
      {
        id: 3,
        title: "Repetitive vocabulary",
        category: "Vocabulary",
        original: "increased increased significantly",
        corrected: "rose significantly / grew markedly",
        explanation: "Vary your vocabulary to demonstrate lexical resource.",
      },
    ],
    vocabularyAnalysis: {
      uniqueWords: Math.max(80, Math.round(input.wordCount * 0.55)),
      repeatedWords: [
        { word: "increase", count: 4 },
        { word: "country", count: 3 },
        { word: "show", count: 3 },
      ],
    },
    grammarAnalysis: {
      grammarErrors: 3,
      spellingErrors: 1,
      punctuationErrors: 2,
    },
    strengths: [
      "Clear paragraph structure with logical progression",
      "Good use of comparison language",
      "Attempts complex sentence structures",
    ],
    improvements: [
      "Write a clearer overview in the introduction",
      "Check data accuracy against the visual",
      "Reduce repetition of basic vocabulary",
    ],
    aiSummary: `Your writing demonstrates a solid ${cefrFromScore(overall)} level with effective organisation. Focus on a stronger overview and more precise data reporting to reach the next band.`,
    suggestedImprovements: [
      "Open with a one-sentence overview of the main trend",
      "Use varied verbs instead of repeating 'increase' and 'show'",
      "Proofread for subject-verb agreement and article use",
    ],
    correctedEssay: input.responseText.replace(
      "drop 20 liters",
      "dropped slightly before rising again"
    ),
  };
}

export async function analyzeReadingSubmission(input: {
  taskTitle: string;
  answeredCount: number;
  totalQuestions: number;
}): Promise<ReadingFeedbackDetail> {
  await wait(ANALYSIS_DELAY_MS);

  const ratio = input.totalQuestions
    ? input.answeredCount / input.totalQuestions
    : 0.7;
  const correctEstimate = Math.max(1, Math.round(ratio * input.totalQuestions * 0.72));
  const band = randomScore(5, 8);
  const accuracy = Math.round((correctEstimate / input.totalQuestions) * 100);

  return {
    taskTitle: input.taskTitle,
    overallScore: band,
    correctCount: correctEstimate,
    totalQuestions: input.totalQuestions,
    accuracyPercentage: accuracy,
    timeTaken: "58 minutes",
    sectionScores: buildReadingSections(band),
    questionTypePerformance: [
      { type: "True / False / Not Given", score: band, correct: 8, total: 10 },
      { type: "Multiple Choice", score: band - 0.5, correct: 6, total: 8 },
      { type: "Matching Headings", score: band - 1, correct: 5, total: 8 },
      { type: "Sentence Completion", score: band, correct: 7, total: 9 },
    ],
    strengths: [
      "Strong performance on factual detail questions",
      "Good time management in Section 1",
      "Effective skimming for main ideas",
    ],
    weakAreas: [
      "Matching headings in Section 3",
      "Distinguishing False from Not Given",
      "Spelling in gap-fill answers",
    ],
    aiSummary: `You answered ${input.answeredCount} of ${input.totalQuestions} questions with an estimated ${correctEstimate} correct (${accuracy}% accuracy). Focus on skimming for main ideas and scanning for specific details in longer passages.`,
    recommendedTopics: [
      "Matching headings strategies",
      "True / False / Not Given decision-making",
      "Academic vocabulary for science passages",
    ],
  };
}

export async function analyzeSpeakingSubmission(input: {
  taskTitle: string;
  recordingCount: number;
  totalQuestions: number;
}): Promise<SpeakingFeedbackDetail> {
  await wait(ANALYSIS_DELAY_MS);

  const overall = randomScore(5.5, 7.5);

  return {
    taskTitle: input.taskTitle,
    overallScore: overall,
    cefrLevel: cefrFromScore(overall),
    recordingCount: input.recordingCount,
    totalQuestions: input.totalQuestions,
    criteria: buildSpeakingCriteria(),
    recordingStats: {
      duration: "12m 34s",
      wordsPerMinute: 128,
    },
    fillerWords: [
      { word: "um", count: 12 },
      { word: "like", count: 8 },
      { word: "you know", count: 5 },
    ],
    mispronouncedWords: [
      { word: "environment", suggestion: "en-VY-ron-ment" },
      { word: "particularly", suggestion: "par-TIC-u-lar-ly" },
      { word: "comfortable", suggestion: "COMF-tuh-bul" },
    ],
    strengths: [
      "Natural pace in Part 1 short answers",
      "Good use of examples in the Part 2 long turn",
      "Willingness to develop ideas in Part 3",
    ],
    improvements: [
      "Reduce filler words during preparation-heavy answers",
      "Extend Part 3 responses with reasons and examples",
      "Practice intonation on question tags and contrast phrases",
    ],
    aiSummary: `Your ${input.recordingCount} recording${input.recordingCount !== 1 ? "s were" : " was"} analyzed across all speaking parts. Fluency is generally good with room to expand answers in Part 3. Focus on varied vocabulary and clearer pronunciation of multi-syllable words.`,
    practiceRecommendations: [
      "Record 2-minute Part 2 responses daily and review filler word usage",
      "Practice shadowing native speaker podcasts for intonation",
      "Prepare topic vocabulary lists for common Part 3 themes",
    ],
  };
}

export async function analyzeListeningSubmission(input: {
  taskTitle: string;
  answeredCount: number;
  totalQuestions: number;
}): Promise<ListeningFeedbackDetail> {
  await wait(ANALYSIS_DELAY_MS);

  const ratio = input.totalQuestions
    ? input.answeredCount / input.totalQuestions
    : 0.65;
  const correctEstimate = Math.max(1, Math.round(ratio * input.totalQuestions * 0.68));
  const band = randomScore(5, 8);
  const accuracy = Math.round((correctEstimate / input.totalQuestions) * 100);

  return {
    taskTitle: input.taskTitle,
    overallScore: band,
    correctCount: correctEstimate,
    totalQuestions: input.totalQuestions,
    accuracyPercentage: accuracy,
    timeTaken: "32 minutes",
    partScores: buildListeningParts(band),
    questionTypePerformance: [
      { type: "Form Completion", score: band, correct: 8, total: 10 },
      { type: "Multiple Choice", score: band - 0.5, correct: 6, total: 8 },
      { type: "Map Labelling", score: band - 1, correct: 4, total: 6 },
      { type: "Sentence Completion", score: band, correct: 7, total: 9 },
    ],
    strengths: [
      "Strong note-taking in Part 1 conversations",
      "Good spelling accuracy on common words",
      "Effective previewing of questions before each section",
    ],
    weakAreas: [
      "Map labelling directions in Part 2",
      "Following fast academic lectures in Part 4",
      "Distractors in multiple-choice questions",
    ],
    aiSummary: `You completed ${input.answeredCount} of ${input.totalQuestions} answers with an estimated ${correctEstimate} correct (${accuracy}% accuracy). Practice note-taking and spelling of common IELTS vocabulary.`,
    recommendedTopics: [
      "Direction and location vocabulary for map tasks",
      "Academic lecture note-taking",
      "Recognising paraphrase in multiple-choice options",
    ],
  };
}

/**
 * Placeholder AI analysis for a speaking submission. Mirrors the data a future
 * backend (speech-to-text + band scoring) would return so the UI can be wired
 * in later without changes.
 */
export async function analyzeSpeakingSubmission(input: {
  taskTitle: string;
  questionCount: number;
  recordedCount: number;
  totalSeconds: number;
}): Promise<SpeakingFeedbackDetail> {
  await wait(ANALYSIS_DELAY_MS);

  const overall = randomScore(5.5, 7.5);
  const coverage = input.questionCount
    ? Math.min(1, input.recordedCount / input.questionCount)
    : 0.8;

  return {
    taskTitle: input.taskTitle,
    overallScore: overall,
    cefrLevel: overall >= 7 ? "C1" : overall >= 6 ? "B2" : "B1",
    speakingSpeedWpm: 110 + Math.round(Math.random() * 40),
    pauses: Math.round((1 - coverage) * 12 + Math.random() * 4),
    confidence: Math.round(55 + coverage * 35 + Math.random() * 5),
    naturalness: Math.round(60 + coverage * 30 + Math.random() * 5),
    criteria: [
      {
        id: "pronunciation",
        label: "Pronunciation",
        score: randomScore(5.5, 7.5),
        color: "bg-sky-500",
        summary:
          "Generally clear and intelligible. A few sounds and word stress patterns could be more consistent.",
      },
      {
        id: "fluency",
        label: "Fluency & Coherence",
        score: randomScore(6, 7.5),
        color: "bg-emerald-500",
        summary:
          "Speech flows well most of the time with some self-correction. Link your ideas with more cohesive devices.",
      },
      {
        id: "lexical",
        label: "Lexical Resource (Vocabulary)",
        score: randomScore(5.5, 7),
        color: "bg-amber-500",
        summary:
          "Adequate range with some precise collocations. Use more topic-specific vocabulary and paraphrasing.",
      },
      {
        id: "grammar",
        label: "Grammar",
        score: randomScore(6, 7.5),
        color: "bg-rose-500",
        summary:
          "A mix of simple and complex structures with occasional tense slips that rarely block meaning.",
      },
    ],
    strengths: [
      "Clear, easy-to-follow pronunciation of most words.",
      "Logical organisation of ideas within longer answers.",
      "Confident use of present tense for habitual questions.",
    ],
    improvements: [
      "Reduce filler words such as 'um' and 'you know'.",
      "Vary sentence structures — include more conditionals and relatives.",
      "Expand answers with reasons and examples in Part 1.",
    ],
    suggestions: [
      "Record yourself daily and listen back for hesitation markers.",
      "Learn 5–8 topic-specific collocations for common IELTS themes.",
      "Practise 2-minute monologues with a timer to build stamina.",
      "Shadow native speakers to improve intonation and linking.",
    ],
    commonMistakes: [
      {
        mistake: "I am agree with you.",
        correction: "I agree with you.",
      },
      {
        mistake: "I went to there last year.",
        correction: "I went there last year.",
      },
      {
        mistake: "It's depend on the situation.",
        correction: "It depends on the situation.",
      },
    ],
    summary: `You recorded ${input.recordedCount} of ${input.questionCount} responses over about ${Math.round(
      input.totalSeconds / 60
    )} minutes. Estimated band ${overall.toFixed(
      1
    )}. Focus on fluency and vocabulary range to move to the next band.`,
  };
}

export function createSavedReport(
  skill: SavedReport["skill"],
  taskTitle: string,
  taskDescription: string,
  score: number,
  detail: SavedReport["detail"]
): SavedReport {
  return {
    id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    skill,
    taskTitle,
    taskDescription,
    status: "Completed",
    score,
    createdAt: new Date().toISOString(),
    detail,
  };
}

export const SAMPLE_WRITING_REPORT: WritingFeedbackDetail = {
  taskTitle: "Academic Writing Task 1 — Milk Consumption",
  taskPrompt:
    "The chart below shows the amount of milk consumed per person per year in different countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  responseText:
    "The bar chart compares milk consumption per person in four countries over a twenty-year period. Overall, Country A had the highest consumption throughout, while Country D remained the lowest. In 1990, people in Country A drank approximately 20 gallons per year, but this figure drop 20 liters in 1990 before rising again. Country B showed a steady increase, whereas Country C fluctuated slightly. By 2010, Country A still led, followed by Country B.",
  wordCount: 226,
  wordCountStatus: "Within target range (150+ words)",
  overallScore: 6.5,
  cefrLevel: "B2",
  criteria: [
    {
      id: "task-achievement",
      label: "Task Achievement",
      score: 6.0,
      color: "bg-violet-500",
    },
    {
      id: "coherence",
      label: "Coherence & Cohesion",
      score: 7.0,
      color: "bg-emerald-500",
    },
    {
      id: "lexical",
      label: "Lexical Resource",
      score: 6.0,
      color: "bg-amber-500",
    },
    {
      id: "grammar",
      label: "Grammatical Range & Accuracy",
      score: 7.0,
      color: "bg-rose-500",
    },
  ],
  errors: [
    {
      id: 1,
      title: "Missing Overview",
      category: "Task Achievement",
      original: "The bar chart compares milk consumption per person in four countries.",
      corrected:
        "Overall, Country A consistently recorded the highest milk consumption, while Country D remained the lowest throughout the period.",
      explanation: "Include a clear overview summarising the main trends.",
    },
    {
      id: 2,
      title: "Wrong Unit",
      category: "Task Achievement",
      original: "this figure drop 20 liters in 1990",
      corrected: "this figure dropped to approximately 18 gallons in 2000",
      explanation: "Use consistent units that match the chart and avoid contradictory figures.",
    },
  ],
  vocabularyAnalysis: {
    uniqueWords: 124,
    repeatedWords: [
      { word: "country", count: 5 },
      { word: "consumption", count: 4 },
      { word: "increase", count: 3 },
    ],
  },
  grammarAnalysis: {
    grammarErrors: 3,
    spellingErrors: 0,
    punctuationErrors: 1,
  },
  strengths: [
    "Clear paragraph structure with logical progression",
    "Effective use of comparison language (whereas, while, followed by)",
    "Attempts to summarise trends across the full period",
  ],
  improvements: [
    "Write a clearer overview in the opening paragraph",
    "Ensure figures and units match the chart exactly",
    "Vary vocabulary to avoid repeating 'country' and 'consumption'",
  ],
  aiSummary:
    "This response demonstrates B2-level writing with good organisation and comparison language. The main weaknesses are an unclear overview and inaccurate data reporting. With more precise figures and varied vocabulary, a Band 7 is achievable.",
  suggestedImprovements: [
    "Begin with a one-sentence overview of the dominant trend",
    "Replace repeated nouns with pronouns or synonyms",
    "Proofread verb tenses and subject-verb agreement",
  ],
  correctedEssay:
    "The bar chart compares milk consumption per person in four countries over a twenty-year period. Overall, Country A consistently recorded the highest consumption throughout, while Country D remained the lowest. In 1990, people in Country A drank approximately 20 gallons per year, but this figure dropped slightly before rising again after 2000. Country B showed a steady increase, whereas Country C fluctuated slightly. By 2010, Country A still led, followed by Country B.",
};

export const SAMPLE_SPEAKING_REPORT: SpeakingFeedbackDetail = {
  taskTitle: "IELTS Speaking Full Test — Technology & Travel",
  overallScore: 6.5,
  cefrLevel: "B2",
  recordingCount: 3,
  totalQuestions: 3,
  criteria: [
    {
      id: "fluency",
      label: "Fluency & Coherence",
      score: 6.5,
      color: "bg-violet-500",
      summary: "Generally fluent with occasional hesitation when developing abstract ideas.",
    },
    {
      id: "lexical",
      label: "Lexical Resource",
      score: 6.0,
      color: "bg-emerald-500",
      summary: "Adequate vocabulary with some less common items; repetition in Part 3.",
    },
    {
      id: "grammar",
      label: "Grammar",
      score: 7.0,
      color: "bg-amber-500",
      summary: "Good range of structures with minor errors that do not impede communication.",
    },
    {
      id: "pronunciation",
      label: "Pronunciation",
      score: 6.5,
      color: "bg-rose-500",
      summary: "Clear and intelligible; work on stress in multi-syllable academic words.",
    },
  ],
  recordingStats: {
    duration: "14m 02s",
    wordsPerMinute: 132,
  },
  fillerWords: [
    { word: "um", count: 9 },
    { word: "like", count: 6 },
    { word: "you know", count: 4 },
  ],
  mispronouncedWords: [
    { word: "technology", suggestion: "tek-NOL-uh-jee" },
    { word: "particularly", suggestion: "par-TIC-u-lar-ly" },
    { word: "environment", suggestion: "en-VY-ron-ment" },
  ],
  strengths: [
    "Confident Part 1 responses with natural pace",
    "Well-structured Part 2 long turn with clear beginning, middle, and end",
    "Willingness to elaborate on abstract Part 3 questions",
  ],
  improvements: [
    "Reduce filler words when thinking of complex vocabulary",
    "Use more precise collocations instead of general words like 'good' and 'bad'",
    "Practice word stress on longer academic terms",
  ],
  aiSummary:
    "This speaking performance shows B2-level fluency with strong Part 2 organisation. Part 3 answers would benefit from deeper development and fewer filler words. Pronunciation is generally clear with room to improve stress patterns.",
  practiceRecommendations: [
    "Practice 90-second Part 2 responses without pausing for filler words",
    "Learn collocations for common Part 3 topics (technology, environment, education)",
    "Record and review pronunciation of 10 multi-syllable words daily",
  ],
};

export const SAMPLE_READING_REPORT: ReadingFeedbackDetail = {
  taskTitle: "IELTS Academic Reading — Full Test",
  overallScore: 7.0,
  correctCount: 30,
  totalQuestions: 40,
  accuracyPercentage: 75,
  timeTaken: "54 minutes",
  sectionScores: [
    { label: "Section 1", score: 7.5, correct: 12, total: 13 },
    { label: "Section 2", score: 7.0, correct: 10, total: 13 },
    { label: "Section 3", score: 6.5, correct: 8, total: 14 },
  ],
  questionTypePerformance: [
    { type: "True / False / Not Given", score: 7.5, correct: 9, total: 10 },
    { type: "Multiple Choice", score: 7.0, correct: 6, total: 8 },
    { type: "Matching Headings", score: 6.0, correct: 4, total: 7 },
    { type: "Sentence Completion", score: 7.5, correct: 8, total: 9 },
  ],
  strengths: [
    "Excellent accuracy on factual detail questions in Section 1",
    "Strong skimming skills for locating key information quickly",
    "Good time allocation across all three sections",
  ],
  weakAreas: [
    "Matching headings in longer academic passages",
    "Distinguishing 'False' from 'Not Given'",
    "Spelling in gap-fill answers under time pressure",
  ],
  aiSummary:
    "This reading performance indicates a Band 7 level with strong detail-finding skills. Section 3 heading-matching questions were the main score limiter. Focus on paragraph-main-idea identification and T/F/NG decision strategies.",
  recommendedTopics: [
    "Matching headings — identifying paragraph themes",
    "True / False / Not Given — contradiction vs. absence of information",
    "Academic vocabulary in environmental science texts",
  ],
};

export const SAMPLE_LISTENING_REPORT: ListeningFeedbackDetail = {
  taskTitle: "IELTS Listening — Full Test",
  overallScore: 6.5,
  correctCount: 28,
  totalQuestions: 40,
  accuracyPercentage: 70,
  timeTaken: "34 minutes",
  partScores: [
    { label: "Part 1", score: 7.5, correct: 9, total: 10 },
    { label: "Part 2", score: 7.0, correct: 8, total: 10 },
    { label: "Part 3", score: 6.0, correct: 6, total: 10 },
    { label: "Part 4", score: 6.0, correct: 5, total: 10 },
  ],
  questionTypePerformance: [
    { type: "Form Completion", score: 7.5, correct: 9, total: 10 },
    { type: "Multiple Choice", score: 6.5, correct: 5, total: 7 },
    { type: "Map Labelling", score: 6.0, correct: 4, total: 6 },
    { type: "Sentence Completion", score: 7.0, correct: 7, total: 9 },
  ],
  strengths: [
    "Strong performance on Part 1 form-filling tasks",
    "Accurate spelling on common IELTS vocabulary",
    "Effective use of preview time before each section",
  ],
  weakAreas: [
    "Map labelling — direction and location vocabulary",
    "Part 4 academic lecture note-taking speed",
    "Avoiding distractors in multiple-choice questions",
  ],
  aiSummary:
    "This listening performance shows solid conversational listening skills in Parts 1–2, with Part 4 lectures presenting the greatest challenge. Improve note-taking speed and direction vocabulary to reach Band 7.",
  recommendedTopics: [
    "Direction and location vocabulary for map tasks",
    "Academic lecture note-taking techniques",
    "Recognising paraphrase in multiple-choice distractors",
  ],
};
