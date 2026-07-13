import type { ReadingMockTest, ReadingPassage } from "@/types/reading";

const PART_MINUTES = 20;

const PASSAGE_1_SAMPLE = `The history of chocolate begins in Mesoamerica. Fermented beverages made from chocolate date back to 1900 BC. The Aztecs believed that cacao seeds were the gift of Quetzalcoatl, the god of wisdom, and the seeds had so much value they were used as a form of currency.

Originally prepared only as a drink, chocolate was served as a bitter liquid, mixed with spices or corn puree. It was believed to be an aphrodisiac and to give the drinker strength. After its arrival in Europe in the sixteenth century, sugar was added to it and it became popular throughout society, first among the ruling classes and then among the common people.

In the 20th century, chocolate was considered essential in the rations of United States soldiers during war. Today, chocolate is used in a wide variety of foods and is one of the most popular flavours in the world.`;

const PASSAGE_2_SAMPLE = `Urban farming is the practice of cultivating, processing, and distributing food in or around urban areas. It has gained popularity as cities look for sustainable ways to feed growing populations. Rooftop gardens, community plots, and vertical farms are among the most common forms.

Studies suggest that urban agriculture can reduce food miles, improve access to fresh produce, and strengthen community ties. However, challenges remain, including limited space, soil contamination, and higher production costs compared with rural farming.

Several cities have introduced policies to support urban farmers, such as tax incentives and simplified licensing. Experts argue that while urban farming cannot replace conventional agriculture, it plays a valuable role in making cities more resilient and environmentally friendly.`;

const PASSAGE_3_SAMPLE = `Sleep plays a critical role in memory consolidation. During slow-wave sleep, the brain replays experiences from the day, strengthening neural connections that form long-term memories. Research using brain imaging has shown that people who sleep after learning a new task perform significantly better when tested later.

Lack of sleep, by contrast, impairs attention, decision-making, and emotional regulation. Chronic sleep deprivation has been linked to increased risk of cardiovascular disease, obesity, and mental health disorders. Despite this, many adults routinely get fewer than the recommended seven to nine hours per night.

Scientists continue to investigate why sleep is so restorative. Some theories focus on the clearance of metabolic waste from the brain during sleep, while others emphasise the role of sleep in resetting synaptic connections. What is clear is that prioritising sleep is one of the most effective ways to support cognitive and physical health.`;

function buildQuestions(
  partNumber: 1 | 2 | 3,
  prefix: string,
  type: "true-false-not-given" | "yes-no-not-given" | "multiple-choice" | "fill-blank"
) {
  const tfngOptions = ["TRUE", "FALSE", "NOT GIVEN"];
  const ynnOptions = ["YES", "NO", "NOT GIVEN"];

  if (type === "true-false-not-given") {
    return [
      {
        id: `${prefix}-q1`,
        number: 1,
        type: "true-false-not-given" as const,
        prompt: "Chocolate was first consumed as a sweet drink in Mesoamerica.",
        options: tfngOptions,
      },
      {
        id: `${prefix}-q2`,
        number: 2,
        type: "true-false-not-given" as const,
        prompt: "Cacao seeds were used as money by the Aztecs.",
        options: tfngOptions,
      },
      {
        id: `${prefix}-q3`,
        number: 3,
        type: "true-false-not-given" as const,
        prompt: "Sugar was added to chocolate before it reached Europe.",
        options: tfngOptions,
      },
      {
        id: `${prefix}-q4`,
        number: 4,
        type: "true-false-not-given" as const,
        prompt: "Chocolate became popular among ordinary people after sugar was added.",
        options: tfngOptions,
      },
      {
        id: `${prefix}-q5`,
        number: 5,
        type: "true-false-not-given" as const,
        prompt: "American soldiers were given chocolate during wartime in the 1900s.",
        options: tfngOptions,
      },
    ];
  }

  if (type === "yes-no-not-given") {
    return [
      {
        id: `${prefix}-q1`,
        number: 1,
        type: "yes-no-not-given" as const,
        prompt: "The writer believes urban farming can fully replace rural agriculture.",
        options: ynnOptions,
      },
      {
        id: `${prefix}-q2`,
        number: 2,
        type: "yes-no-not-given" as const,
        prompt: "Rooftop gardens are mentioned as a form of urban farming.",
        options: ynnOptions,
      },
      {
        id: `${prefix}-q3`,
        number: 3,
        type: "yes-no-not-given" as const,
        prompt: "Urban farming always costs less than conventional farming.",
        options: ynnOptions,
      },
      {
        id: `${prefix}-q4`,
        number: 4,
        type: "yes-no-not-given" as const,
        prompt: "Some governments offer financial support to urban farmers.",
        options: ynnOptions,
      },
      {
        id: `${prefix}-q5`,
        number: 5,
        type: "yes-no-not-given" as const,
        prompt: "Urban farming can help communities become more sustainable.",
        options: ynnOptions,
      },
    ];
  }

  if (type === "multiple-choice") {
    return [
      {
        id: `${prefix}-q1`,
        number: 1,
        type: "multiple-choice" as const,
        prompt: "What happens during slow-wave sleep according to the passage?",
        options: [
          "A. The brain clears all memories",
          "B. The brain strengthens learning connections",
          "C. The body produces more energy",
          "D. Heart rate increases significantly",
        ],
      },
      {
        id: `${prefix}-q2`,
        number: 2,
        type: "multiple-choice" as const,
        prompt: "People who sleep after learning tend to:",
        options: [
          "A. Forget information faster",
          "B. Perform worse on later tests",
          "C. Retain information more effectively",
          "D. Need less practice overall",
        ],
      },
      {
        id: `${prefix}-q3`,
        number: 3,
        type: "multiple-choice" as const,
        prompt: "Which is NOT mentioned as a consequence of poor sleep?",
        options: [
          "A. Obesity",
          "B. Heart disease",
          "C. Improved creativity",
          "D. Mood changes",
        ],
      },
      {
        id: `${prefix}-q4`,
        number: 4,
        type: "multiple-choice" as const,
        prompt: "The recommended sleep duration for adults is:",
        options: [
          "A. Four to five hours",
          "B. Five to six hours",
          "C. Seven to nine hours",
          "D. Ten to twelve hours",
        ],
      },
      {
        id: `${prefix}-q5`,
        number: 5,
        type: "multiple-choice" as const,
        prompt: "What is the main purpose of the passage?",
        options: [
          "A. To criticise modern sleeping habits",
          "B. To explain why sleep matters for health and memory",
          "C. To compare different sleep disorders",
          "D. To advertise sleep-tracking technology",
        ],
      },
    ];
  }

  return [
    {
      id: `${prefix}-q1`,
      number: 1,
      type: "fill-blank" as const,
      prompt: `Complete the summary. Write NO MORE THAN TWO WORDS for each answer.\n\nPart ${partNumber} summary gap 1.`,
    },
    {
      id: `${prefix}-q2`,
      number: 2,
      type: "fill-blank" as const,
      prompt: "Summary gap 2.",
    },
    {
      id: `${prefix}-q3`,
      number: 3,
      type: "fill-blank" as const,
      prompt: "Summary gap 3.",
    },
  ];
}

export const READING_PRACTICE_PASSAGES: ReadingPassage[] = [
  {
    id: "chocolate-history",
    partNumber: 1,
    label: "Part 1",
    title: "The History of Chocolate",
    typeLabel: "True / False / Not Given",
    passage: PASSAGE_1_SAMPLE,
    questions: buildQuestions(1, "chocolate", "true-false-not-given"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "ancient-olympics",
    partNumber: 1,
    label: "Part 1",
    title: "The Ancient Olympic Games",
    typeLabel: "True / False / Not Given",
    passage: `The ancient Olympic Games were religious and athletic festivals held every four years at the sanctuary of Zeus in Olympia, Greece. Competition was among representatives of several city-states and kingdoms of Ancient Greece. The most widely accepted date for the beginning of the Games is 776 BC.

During the celebration of the games, an Olympic Truce was enacted so that athletes and pilgrims could travel safely to Olympia. The games were held every four years, or Olympiad, which became a unit of time in historical chronologies.

The games gradually declined in importance as the Romans gained power in Greece. After Emperor Theodosius I banned pagan festivals, the Olympics were abolished in AD 393.`,
    questions: buildQuestions(1, "olympics", "true-false-not-given"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "bees-and-pollination",
    partNumber: 1,
    label: "Part 1",
    title: "Bees and Pollination",
    typeLabel: "True / False / Not Given",
    passage: `Bees play a vital role in pollinating crops and wild plants. As they collect nectar and pollen, they transfer pollen grains between flowers, enabling fertilisation and seed production. Roughly one-third of the food humans consume depends on pollination by bees and other insects.

In recent decades, bee populations in several regions have declined due to habitat loss, pesticide use, disease, and climate change. Farmers and conservationists are working to create bee-friendly habitats and reduce chemical use in agriculture.

Without adequate pollination, yields of fruits, vegetables, and nuts would fall sharply, affecting both food prices and biodiversity.`,
    questions: buildQuestions(1, "bees", "true-false-not-given"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "urban-farming",
    partNumber: 2,
    label: "Part 2",
    title: "Urban Farming",
    typeLabel: "Yes / No / Not Given",
    passage: PASSAGE_2_SAMPLE,
    questions: buildQuestions(2, "urban", "yes-no-not-given"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "renewable-energy",
    partNumber: 2,
    label: "Part 2",
    title: "Renewable Energy Transition",
    typeLabel: "Yes / No / Not Given",
    passage: `Countries around the world are investing heavily in renewable energy sources such as wind, solar, and hydroelectric power. The shift away from fossil fuels is driven by concerns about climate change, air pollution, and energy security.

While renewables are becoming cheaper, integrating them into existing power grids presents technical challenges. Solar and wind are intermittent, meaning storage systems and backup generation are often required.

Analysts predict that renewables could supply the majority of global electricity by 2050 if current investment trends continue. However, the pace of change varies significantly between regions.`,
    questions: buildQuestions(2, "renewable", "yes-no-not-given"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "museum-collections",
    partNumber: 2,
    label: "Part 2",
    title: "Museum Collections Online",
    typeLabel: "Yes / No / Not Given",
    passage: `Museums are increasingly digitising their collections and making high-resolution images available online. Proponents argue that digital access democratises culture, allowing people who cannot visit in person to explore artefacts and artworks.

Critics worry that screen-based viewing cannot replicate the experience of seeing objects in a physical gallery. Some institutions also face copyright and funding challenges when publishing images of works still under legal protection.

Despite these debates, online collections have expanded public engagement and supported education during periods when buildings were closed.`,
    questions: buildQuestions(2, "museum", "yes-no-not-given"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "sleep-and-memory",
    partNumber: 3,
    label: "Part 3",
    title: "Sleep and Memory",
    typeLabel: "Multiple Choice",
    passage: PASSAGE_3_SAMPLE,
    questions: buildQuestions(3, "sleep", "multiple-choice"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "artificial-intelligence",
    partNumber: 3,
    label: "Part 3",
    title: "Artificial Intelligence in Medicine",
    typeLabel: "Multiple Choice",
    passage: `Artificial intelligence is transforming medical diagnosis and treatment planning. Machine-learning systems can analyse medical images, detect patterns in patient data, and suggest possible diagnoses faster than traditional methods in some cases.

Supporters highlight improved accuracy and the potential to reduce workloads for overstretched clinicians. Critics raise concerns about data privacy, algorithmic bias, and the need for human oversight when life-changing decisions are involved.

Regulators are developing frameworks to ensure AI tools are tested rigorously before clinical use. Most experts agree that AI will augment rather than replace doctors in the foreseeable future.`,
    questions: buildQuestions(3, "ai-med", "multiple-choice"),
    recommendedMinutes: PART_MINUTES,
  },
  {
    id: "language-extinction",
    partNumber: 3,
    label: "Part 3",
    title: "Language Extinction",
    typeLabel: "Multiple Choice",
    passage: `Linguists estimate that roughly half of the world's approximately 7,000 languages may disappear by the end of this century. Languages vanish when the communities that speak them shift to dominant regional or global languages, often due to urbanisation, education policy, and economic pressure.

Language loss represents more than the disappearance of words. Each language encodes unique knowledge about local ecosystems, traditions, and ways of understanding the world. Efforts to document endangered languages have accelerated with digital recording technology.

Revitalisation projects, including bilingual education and community media, have helped some minority languages recover speakers. Success depends on sustained institutional support and pride among younger generations.`,
    questions: buildQuestions(3, "language", "multiple-choice"),
    recommendedMinutes: PART_MINUTES,
  },
];

export const READING_MOCK_TESTS: ReadingMockTest[] = [
  {
    id: "reading-mock-1",
    title: "Academic Reading — Mock Test 1",
    totalMinutes: 60,
    passages: [
      READING_PRACTICE_PASSAGES.find((p) => p.id === "chocolate-history")!,
      READING_PRACTICE_PASSAGES.find((p) => p.id === "urban-farming")!,
      READING_PRACTICE_PASSAGES.find((p) => p.id === "sleep-and-memory")!,
    ],
  },
  {
    id: "reading-mock-2",
    title: "Academic Reading — Mock Test 2",
    totalMinutes: 60,
    passages: [
      READING_PRACTICE_PASSAGES.find((p) => p.id === "bees-and-pollination")!,
      READING_PRACTICE_PASSAGES.find((p) => p.id === "renewable-energy")!,
      READING_PRACTICE_PASSAGES.find((p) => p.id === "artificial-intelligence")!,
    ],
  },
];

export function getReadingMockTest(id?: string): ReadingMockTest {
  if (!id) return READING_MOCK_TESTS[0];
  return READING_MOCK_TESTS.find((test) => test.id === id) ?? READING_MOCK_TESTS[0];
}

export function getReadingTaskHref(id: string, backHref?: string): string {
  const base = `/test/ielts/reading/mock/${id}`;
  if (!backHref) return base;
  return `${base}?back=${encodeURIComponent(backHref)}`;
}
