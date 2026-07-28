import type { RelevanceDatasetProvider, TextNormalizer, TopicProfileProvider } from "./interfaces";
import type { KeywordEntry, RelevanceTarget, SampleEntry, TopicProfile } from "./types";

/** Same rationale as KeywordMatcher's list: function words are never useful as derived topic keywords. */
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "so", "because",
  "of", "in", "on", "at", "to", "for", "with", "as", "by", "from",
  "is", "are", "was", "were", "be", "been", "being", "am",
  "i", "you", "he", "she", "it", "we", "they", "this", "that", "these", "those",
  "my", "your", "his", "her", "its", "our", "their",
  "do", "does", "did", "have", "has", "had", "not", "no", "what", "when", "where", "why", "how",
  "can", "could", "would", "should", "will", "shall", "may", "might", "must",
]);

const MIN_DERIVED_KEYWORD_LENGTH = 3;
/** Weight given to a keyword derived from the question/prompt text itself, lower than a curated dataset row's own weight. */
const DERIVED_KEYWORD_WEIGHT = 1;
const DEFAULT_KEYWORD_WEIGHT = 1;

/**
 * Resolves a question_id/topic_id into a TopicProfile: the expected
 * keywords and sample answers to judge a response against. This is the
 * only class in the module that talks to DatasetService (through the
 * narrow RelevanceDatasetProvider interface) or knows about the CSV row
 * shapes — every other class works with the plain KeywordEntry/SampleEntry
 * types this class produces.
 *
 * When a question/topic has no curated keywords in the dataset (or the
 * dataset row itself can't be found), it falls back to deriving keywords
 * from the question/prompt text — e.g. "What is your name?" yields "name"
 * — so relevance can still be judged even before the keyword datasets are
 * populated.
 */
export class TopicAnalyzer implements TopicProfileProvider {
  constructor(
    private readonly datasetProvider: RelevanceDatasetProvider,
    private readonly normalizer: TextNormalizer
  ) {}

  async getProfile(target: RelevanceTarget, id: string): Promise<TopicProfile> {
    return target === "speaking" ? this.getSpeakingProfile(id) : this.getWritingProfile(id);
  }

  private async getSpeakingProfile(id: string): Promise<TopicProfile> {
    const [questions, keywordRows, sampleRows] = await Promise.all([
      this.datasetProvider.getSpeakingQuestions(),
      this.datasetProvider.getSpeakingKeywords(),
      this.datasetProvider.getSpeakingSamples(),
    ]);

    const question = questions.find((row) => row.question_id === id);
    const explicitKeywords = keywordRows
      .filter((row) => row.question_id === id)
      .map((row) => this.toKeywordEntry(row.keyword, row.weight));
    const samples = sampleRows
      .filter((row) => row.question_id === id)
      .map((row) => this.toBandLabeledSampleEntry(row.sample_answer, row.sample_level));

    return this.buildProfile(question !== undefined, question?.question ?? "", explicitKeywords, samples);
  }

  private async getWritingProfile(id: string): Promise<TopicProfile> {
    const [topics, keywordRows, sampleRows] = await Promise.all([
      this.datasetProvider.getWritingTopics(),
      this.datasetProvider.getWritingKeywords(),
      this.datasetProvider.getWritingSamples(),
    ]);

    const topic = topics.find((row) => row.topic_id === id);
    const sourceText = topic ? `${topic.title} ${topic.prompt}` : "";
    const explicitKeywords = keywordRows
      .filter((row) => row.topic_id === id)
      .map((row) => this.toKeywordEntry(row.keyword, row.weight));
    const samples = sampleRows
      .filter((row) => row.topic_id === id)
      .map((row) => this.toBandLabeledSampleEntry(row.sample_answer, row.sample_level));

    return this.buildProfile(topic !== undefined, sourceText, explicitKeywords, samples);
  }

  private buildProfile(
    found: boolean,
    sourceText: string,
    explicitKeywords: KeywordEntry[],
    samples: SampleEntry[]
  ): TopicProfile {
    // Curated dataset keywords are trusted as-is. Falling back to keywords
    // derived from the question/prompt text only makes sense when the
    // dataset has nothing curated for this id — otherwise generic prompt
    // scaffolding ("discuss both views", "some people believe") would
    // dilute a carefully weighted curated list with noise.
    const expectedKeywords =
      explicitKeywords.length > 0 ? explicitKeywords : this.deriveKeywordsFromText(sourceText);

    return {
      found,
      sourceText,
      expectedKeywords,
      samples,
    };
  }

  private deriveKeywordsFromText(text: string): KeywordEntry[] {
    const tokens = this.normalizer.tokenize(text);
    const unique = Array.from(new Set(tokens)).filter(
      (token) => token.length >= MIN_DERIVED_KEYWORD_LENGTH && !STOP_WORDS.has(token)
    );

    return unique.map((keyword) => ({ keyword, weight: DERIVED_KEYWORD_WEIGHT }));
  }

  private toKeywordEntry(rawKeyword: string, rawWeight: string): KeywordEntry {
    const keyword = this.normalizer.normalize(rawKeyword);
    const weight = Number(rawWeight);
    return { keyword, weight: Number.isFinite(weight) && weight > 0 ? weight : DEFAULT_KEYWORD_WEIGHT };
  }

  /** speaking_samples.csv and writing_samples.csv both report their band as a label like "Band9" rather than a bare number. */
  private toBandLabeledSampleEntry(rawText: string, rawSampleLevel: string): SampleEntry {
    const tokens = this.normalizer.tokenize(rawText);
    const match = /(\d+(?:\.\d+)?)/.exec(rawSampleLevel);
    const bandScore = match ? Number(match[1]) : undefined;
    return { tokens, bandScore: bandScore !== undefined && Number.isFinite(bandScore) ? bandScore : undefined };
  }
}
