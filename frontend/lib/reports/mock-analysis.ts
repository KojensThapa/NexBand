import type {
  ListeningFeedbackDetail,
  ReadingFeedbackDetail,
  SavedReport,
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

export async function analyzeWritingSubmission(input: {
  taskTitle: string;
  taskPrompt: string;
  responseText: string;
  wordCount: number;
}): Promise<WritingFeedbackDetail> {
  await wait(ANALYSIS_DELAY_MS);

  const overall = randomScore(5.5, 7.5);

  return {
    taskTitle: input.taskTitle,
    taskPrompt: input.taskPrompt,
    responseText: input.responseText,
    wordCount: input.wordCount,
    overallScore: overall,
    cefrLevel: overall >= 7 ? "B2+" : overall >= 6 ? "B2" : "B1",
    criteria: [
      {
        id: "task-achievement",
        label: "Task Achievement",
        score: randomScore(5.5, 7),
        color: "bg-violet-500",
        summary:
          "You addressed the main features of the task but the overview could be clearer. Some data points lack precise support.",
        subScores: [
          { label: "Overview", score: 6.0 },
          { label: "Key features", score: 6.0 },
          { label: "Data support", score: 6.0 },
        ],
      },
      {
        id: "coherence",
        label: "Coherence",
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
        label: "Grammatical Range and Accuracy",
        score: randomScore(6, 7.5),
        color: "bg-rose-500",
        summary:
          "A mix of simple and complex structures with occasional errors that rarely impede communication.",
      },
    ],
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

  return {
    taskTitle: input.taskTitle,
    overallScore: band,
    correctCount: correctEstimate,
    totalQuestions: input.totalQuestions,
    summary: `You answered ${input.answeredCount} of ${input.totalQuestions} questions. Estimated ${correctEstimate} correct based on AI analysis. Focus on skimming for main ideas and scanning for specific details.`,
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

  return {
    taskTitle: input.taskTitle,
    overallScore: band,
    correctCount: correctEstimate,
    totalQuestions: input.totalQuestions,
    summary: `You completed ${input.answeredCount} of ${input.totalQuestions} answers. Estimated ${correctEstimate} correct. Practice note-taking and spelling of common IELTS vocabulary.`,
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
  taskTitle: "Academic Writing Task 1",
  taskPrompt:
    "The chart below shows the amount of milk consumed per person per year in different countries. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
  responseText:
    "The bar chart compares milk consumption per person in four countries over a twenty-year period. Overall, Country A had the highest consumption throughout, while Country D remained the lowest. In 1990, people in Country A drank approximately 20 gallons per year, but this figure drop 20 liters in 1990 before rising again. Country B showed a steady increase, whereas Country C fluctuated slightly. By 2010, Country A still led, followed by Country B.",
  wordCount: 226,
  overallScore: 6.5,
  cefrLevel: "B2",
  criteria: [
    {
      id: "task-achievement",
      label: "Task Achievement",
      score: 6.0,
      color: "bg-violet-500",
      summary:
        "You identified key trends but the overview lacks clarity. Some figures are inaccurate or unsupported.",
      subScores: [
        { label: "Overview", score: 6.0 },
        { label: "Key features", score: 6.0 },
        { label: "Data support", score: 6.0 },
      ],
    },
    {
      id: "coherence",
      label: "Coherence",
      score: 7.0,
      color: "bg-emerald-500",
      summary: "Well-organised response with clear progression and appropriate paragraphing.",
    },
    {
      id: "lexical",
      label: "Lexical Resource",
      score: 6.0,
      color: "bg-amber-500",
      summary: "Adequate range with some precise word choices; minor repetition present.",
    },
    {
      id: "grammar",
      label: "Grammatical Range and Accuracy",
      score: 7.0,
      color: "bg-rose-500",
      summary: "Good variety of structures with occasional errors that do not reduce clarity.",
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
    {
      id: 3,
      title: "Unsupported Calculation",
      category: "Task Achievement",
      original: "drop 20 liters in 1990 before rising again",
      corrected: "fell slightly before rising again after 2000",
      explanation: "Do not invent precise numbers that are not shown in the visual.",
    },
  ],
};
