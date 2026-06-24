import type { WritingMockTest, WritingTask } from "@/types/writing";

/**
 * Standard IELTS Academic Writing structure:
 *  - Task 1: describe visual info in at least 150 words (~20 min)
 *  - Task 2: argumentative essay in at least 250 words (~40 min)
 */

const TASK_1_BASE: Omit<
  WritingTask,
  "id" | "prompt" | "title" | "imageUrl" | "imageAlt" | "typeLabel" | "task1Type"
> = {
  taskNumber: 1,
  label: "Task 1",
  minWords: 150,
  recommendedMinutes: 20,
};

const TASK_2_BASE: Omit<WritingTask, "id" | "prompt" | "title" | "typeLabel"> = {
  taskNumber: 2,
  label: "Task 2",
  minWords: 250,
  recommendedMinutes: 40,
};

const TASK_1_PROMPT_SUFFIX =
  "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.";

const TASK_2_PROMPT_SUFFIX =
  "Give reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.";

/** Standalone practice tasks shown on the writing task board. */
export const WRITING_PRACTICE_TASKS: WritingTask[] = [
  {
    ...TASK_1_BASE,
    id: "energy-consumption-fuel",
    title: "Energy Consumption by Fuel Type",
    task1Type: "graph",
    typeLabel: "Line Graph",
    prompt: `The line graph below shows energy consumption by fuel type in a European country from 1980 to 2020.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Line graph of energy consumption by fuel type 1980–2020",
  },
  {
    ...TASK_1_BASE,
    id: "airport-redevelopment",
    title: "Airport Redevelopment",
    task1Type: "map",
    typeLabel: "Maps",
    prompt: `The maps below show an airport before and after redevelopment.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Maps showing airport before and after redevelopment",
  },
  {
    ...TASK_1_BASE,
    id: "butter-margarine-consumption",
    title: "Butter and Margarine Consumption",
    task1Type: "chart",
    typeLabel: "Multiple Graph",
    prompt: `The charts below show the consumption of butter and margarine in a country between 1980 and 2010.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Multiple charts of butter and margarine consumption",
  },
  {
    ...TASK_1_BASE,
    id: "household-accommodation",
    title: "Household Accommodation",
    task1Type: "chart",
    typeLabel: "Bar Chart",
    prompt: `The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Bar chart of owned vs rented households 1918–2011",
  },
  {
    ...TASK_1_BASE,
    id: "rainwater-collection",
    title: "Rainwater Collection Process",
    task1Type: "process",
    typeLabel: "Process Diagram",
    prompt: `The diagram below shows how rainwater is collected and treated for drinking in an Australian town.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Process diagram of rainwater collection and treatment",
  },
  {
    ...TASK_1_BASE,
    id: "library-membership",
    title: "Library Membership",
    task1Type: "pie",
    typeLabel: "Pie Chart",
    prompt: `The pie charts below show library membership by age group in 2000 and 2020.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Pie charts of library membership by age group",
  },
  {
    ...TASK_1_BASE,
    id: "urban-population-growth",
    title: "Urban Population Growth",
    task1Type: "graph",
    typeLabel: "Line Graph",
    prompt: `The graph below shows the growth of urban population in three cities between 1970 and 2020.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Line graph of urban population growth in three cities",
  },
  {
    ...TASK_1_BASE,
    id: "factory-layout",
    title: "Factory Layout Changes",
    task1Type: "diagram",
    typeLabel: "Diagram",
    prompt: `The diagrams below show the layout of a factory before and after renovation.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Diagrams showing factory layout before and after renovation",
  },
  {
    ...TASK_1_BASE,
    id: "international-students",
    title: "International Students by Country",
    task1Type: "table",
    typeLabel: "Table",
    prompt: `The table below shows the number of international students studying in four countries in 2015 and 2025.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Table of international students by country",
  },
  {
    ...TASK_1_BASE,
    id: "coastal-town-development",
    title: "Coastal Town Development",
    task1Type: "map",
    typeLabel: "Maps",
    prompt: `The maps below show the development of a coastal town between 1990 and 2020.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Maps showing coastal town development over time",
  },
  {
    ...TASK_1_BASE,
    id: "renewable-energy-sources",
    title: "Renewable Energy Sources",
    task1Type: "chart",
    typeLabel: "Bar Chart",
    prompt: `The bar chart below shows the proportion of electricity generated from renewable sources in five countries in 2022.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Bar chart of renewable energy by country",
  },
  {
    ...TASK_1_BASE,
    id: "coffee-production",
    title: "Coffee Production Process",
    task1Type: "process",
    typeLabel: "Process Diagram",
    prompt: `The diagram below shows the process of producing coffee for export.\n\n${TASK_1_PROMPT_SUFFIX}`,
    imageAlt: "Process diagram of coffee production",
  },
  {
    ...TASK_2_BASE,
    id: "unpaid-community-service",
    title: "Unpaid Community Service",
    typeLabel: "Opinion Essay",
    prompt: `Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children).\n\nTo what extent do you agree or disagree?\n\n${TASK_2_PROMPT_SUFFIX}`,
  },
  {
    ...TASK_2_BASE,
    id: "ageing-population",
    title: "Ageing Population",
    typeLabel: "Discussion Essay",
    prompt: `In many countries, the proportion of older people is steadily increasing.\n\nDoes this trend have more positive or negative effects on society?\n\n${TASK_2_PROMPT_SUFFIX}`,
  },
  {
    ...TASK_2_BASE,
    id: "technology-and-relationships",
    title: "Technology and Relationships",
    typeLabel: "Opinion Essay",
    prompt: `Some people think that modern technology is making people more isolated, while others believe it helps people stay connected.\n\nDiscuss both views and give your own opinion.\n\n${TASK_2_PROMPT_SUFFIX}`,
  },
  {
    ...TASK_2_BASE,
    id: "public-transport-investment",
    title: "Public Transport Investment",
    typeLabel: "Problem-Solution",
    prompt: `In many cities, traffic congestion is a serious problem.\n\nWhat are the causes of this problem and what measures could be taken to solve it?\n\n${TASK_2_PROMPT_SUFFIX}`,
  },
  {
    ...TASK_2_BASE,
    id: "work-life-balance",
    title: "Work-Life Balance",
    typeLabel: "Opinion Essay",
    prompt: `Some people believe that employees should have the right to work from home, while others think everyone should work in an office.\n\nDiscuss both views and give your own opinion.\n\n${TASK_2_PROMPT_SUFFIX}`,
  },
  {
    ...TASK_2_BASE,
    id: "environmental-protection",
    title: "Environmental Protection",
    typeLabel: "Discussion Essay",
    prompt: `Some people think that environmental problems are too big for individuals to solve, while others believe individuals can make a difference.\n\nDiscuss both views and give your own opinion.\n\n${TASK_2_PROMPT_SUFFIX}`,
  },
];

export const WRITING_MOCK_TESTS: WritingMockTest[] = [
  {
    id: "writing-mock-1",
    title: "Academic Writing — Mock Test 1",
    totalMinutes: 60,
    tasks: [
      {
        ...TASK_1_BASE,
        id: "wm1-task-1",
        title: "Household Accommodation",
        task1Type: "chart",
        typeLabel: "Bar Chart",
        prompt: `The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\n${TASK_1_PROMPT_SUFFIX}`,
        imageAlt: "Bar chart of owned vs rented households 1918–2011",
      },
      {
        ...TASK_2_BASE,
        id: "wm1-task-2",
        title: "Unpaid Community Service",
        typeLabel: "Opinion Essay",
        prompt: `Some people believe that unpaid community service should be a compulsory part of high school programmes (for example working for a charity, improving the neighbourhood or teaching sports to younger children).\n\nTo what extent do you agree or disagree?\n\n${TASK_2_PROMPT_SUFFIX}`,
      },
    ],
  },
  {
    id: "writing-mock-2",
    title: "Academic Writing — Mock Test 2",
    totalMinutes: 60,
    tasks: [
      {
        ...TASK_1_BASE,
        id: "wm2-task-1",
        title: "Rainwater Collection Process",
        task1Type: "process",
        typeLabel: "Process Diagram",
        prompt: `The diagram below shows how rainwater is collected and treated for drinking in an Australian town.\n\n${TASK_1_PROMPT_SUFFIX}`,
        imageAlt: "Process diagram of rainwater collection and treatment",
      },
      {
        ...TASK_2_BASE,
        id: "wm2-task-2",
        title: "Ageing Population",
        typeLabel: "Discussion Essay",
        prompt: `In many countries, the proportion of older people is steadily increasing.\n\nDoes this trend have more positive or negative effects on society?\n\n${TASK_2_PROMPT_SUFFIX}`,
      },
    ],
  },
];

export type WritingBoardMode = "mock" | "task-1" | "task-2";

export function getWritingMockTest(id?: string): WritingMockTest {
  if (!id) return WRITING_MOCK_TESTS[0];
  return WRITING_MOCK_TESTS.find((test) => test.id === id) ?? WRITING_MOCK_TESTS[0];
}

export function getWritingPracticeTask(id: string): WritingTask | undefined {
  return WRITING_PRACTICE_TASKS.find((task) => task.id === id);
}

export function getWritingTasksForMode(mode: WritingBoardMode): WritingTask[] {
  if (mode === "task-1") {
    return WRITING_PRACTICE_TASKS.filter((task) => task.taskNumber === 1);
  }
  if (mode === "task-2") {
    return WRITING_PRACTICE_TASKS.filter((task) => task.taskNumber === 2);
  }
  return [];
}

export function getWritingTaskHref(
  mode: WritingBoardMode,
  id: string,
  backHref?: string
): string {
  const base = `/test/ielts/writing/${mode}/${id}`;
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
