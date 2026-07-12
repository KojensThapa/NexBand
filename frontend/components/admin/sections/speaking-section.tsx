"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminSpeakingCategory,
  AdminSpeakingMockTest,
  AdminSpeakingQuestion,
} from "@/types/admin";
import {
  MAX_BULLET_POINTS,
  MIN_BULLET_POINTS,
} from "@/lib/admin/speaking-constants";
import {
  countAdminSpeakingQuestions,
  createEmptyMockTestDraft,
  createEmptySpeakingQuestion,
  deleteAdminSpeakingTest,
  getAdminSpeakingCategoryLabel,
  saveAdminSpeakingTest,
  setAdminSpeakingTestPublished,
} from "@/lib/admin/speaking-storage";
import { useAdminSpeakingTests } from "@/hooks/useAdminSpeakingTests";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

type FormMode = "create" | "edit";
type ActivePart = 1 | 2 | 3;
type TestDraft = Omit<AdminSpeakingMockTest, "createdAt" | "updatedAt">;

const CATEGORY_OPTIONS: { id: AdminSpeakingCategory; label: string }[] = [
  { id: "mock", label: "Mock Test" },
  { id: "part-1", label: "Part 1" },
  { id: "part-2", label: "Part 2" },
  { id: "part-3", label: "Part 3" },
];

function emptyDraft(category: AdminSpeakingCategory = "mock"): TestDraft {
  return { ...createEmptyMockTestDraft(category), id: "" };
}

function loadTestIntoDraft(test: AdminSpeakingMockTest): TestDraft {
  return {
    id: test.id,
    title: test.title,
    category: test.category,
    published: test.published,
    part1: {
      questions: test.part1.questions.map((q) => ({ ...q })),
    },
    part2: {
      ...test.part2,
      bulletPoints: [...test.part2.bulletPoints],
    },
    part3: {
      topic: test.part3.topic,
      questions: test.part3.questions.map((q) => ({ ...q })),
    },
  };
}

function isPart1Valid(draft: TestDraft): boolean {
  return draft.part1.questions.some((q) => q.text.trim());
}

function isPart2Valid(draft: TestDraft): boolean {
  const { part2 } = draft;
  const filledBullets = part2.bulletPoints.filter((point) => point.trim());
  return (
    Boolean(part2.cueCardTitle.trim()) &&
    Boolean(part2.cueCardDescription.trim()) &&
    filledBullets.length >= MIN_BULLET_POINTS &&
    filledBullets.length <= MAX_BULLET_POINTS &&
    Boolean(part2.closingQuestion.trim()) &&
    part2.preparationMinutes > 0 &&
    part2.speakingMinutes > 0
  );
}

function isPart3Valid(draft: TestDraft): boolean {
  return (
    Boolean(draft.part3.topic.trim()) &&
    draft.part3.questions.some((q) => q.text.trim())
  );
}

function isDraftValid(draft: TestDraft): boolean {
  if (!draft.title.trim()) return false;
  switch (draft.category) {
    case "mock":
      return isPart1Valid(draft) && isPart2Valid(draft) && isPart3Valid(draft);
    case "part-1":
      return isPart1Valid(draft);
    case "part-2":
      return isPart2Valid(draft);
    case "part-3":
      return isPart3Valid(draft);
  }
}

function moveQuestion(
  questions: AdminSpeakingQuestion[],
  questionId: string,
  direction: "up" | "down"
): AdminSpeakingQuestion[] {
  const index = questions.findIndex((q) => q.id === questionId);
  if (index === -1) return questions;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) return questions;

  const next = [...questions];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function SpeakingSection() {
  const { tests, version } = useAdminSpeakingTests();
  const savedListRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<FormMode>("create");
  const [draft, setDraft] = useState<TestDraft>(emptyDraft);
  const [activePart, setActivePart] = useState<ActivePart>(1);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSave = useMemo(() => isDraftValid(draft), [draft]);
  const totalQuestions = useMemo(() => {
    if (draft.category === "part-1") {
      return draft.part1.questions.filter((q) => q.text.trim()).length;
    }
    if (draft.category === "part-2") {
      return draft.part2.closingQuestion.trim() ? 1 : 0;
    }
    if (draft.category === "part-3") {
      return draft.part3.questions.filter((q) => q.text.trim()).length;
    }
    const part1Count = draft.part1.questions.filter((q) => q.text.trim()).length;
    const part3Count = draft.part3.questions.filter((q) => q.text.trim()).length;
    const closingCount = draft.part2.closingQuestion.trim() ? 1 : 0;
    return part1Count + closingCount + part3Count;
  }, [draft]);

  const showPart1 =
    draft.category === "mock" ? activePart === 1 : draft.category === "part-1";
  const showPart2 =
    draft.category === "mock" ? activePart === 2 : draft.category === "part-2";
  const showPart3 =
    draft.category === "mock" ? activePart === 3 : draft.category === "part-3";

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  function updateDraft(updates: Partial<TestDraft>) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function updatePart1Questions(questions: AdminSpeakingQuestion[]) {
    setDraft((current) => ({ ...current, part1: { questions } }));
  }

  function updatePart3(updates: Partial<TestDraft["part3"]>) {
    setDraft((current) => ({
      ...current,
      part3: { ...current.part3, ...updates },
    }));
  }

  function updatePart2(updates: Partial<TestDraft["part2"]>) {
    setDraft((current) => ({
      ...current,
      part2: { ...current.part2, ...updates },
    }));
  }

  function updatePart1Question(questionId: string, text: string) {
    updatePart1Questions(
      draft.part1.questions.map((q) => (q.id === questionId ? { ...q, text } : q))
    );
  }

  function updatePart3Question(questionId: string, text: string) {
    updatePart3({
      questions: draft.part3.questions.map((q) =>
        q.id === questionId ? { ...q, text } : q
      ),
    });
  }

  function addPart1Question() {
    updatePart1Questions([...draft.part1.questions, createEmptySpeakingQuestion()]);
  }

  function removePart1Question(questionId: string) {
    if (draft.part1.questions.length <= 1) return;
    updatePart1Questions(draft.part1.questions.filter((q) => q.id !== questionId));
  }

  function addPart3Question() {
    updatePart3({
      questions: [...draft.part3.questions, createEmptySpeakingQuestion()],
    });
  }

  function removePart3Question(questionId: string) {
    if (draft.part3.questions.length <= 1) return;
    updatePart3({
      questions: draft.part3.questions.filter((q) => q.id !== questionId),
    });
  }

  function updateBulletPoint(index: number, value: string) {
    const bulletPoints = [...draft.part2.bulletPoints];
    bulletPoints[index] = value;
    updatePart2({ bulletPoints });
  }

  function setBulletPointCount(count: number) {
    const clamped = Math.max(MIN_BULLET_POINTS, Math.min(MAX_BULLET_POINTS, count));
    const current = draft.part2.bulletPoints;
    let next: string[];

    if (clamped > current.length) {
      next = [...current, ...Array.from({ length: clamped - current.length }, () => "")];
    } else {
      next = current.slice(0, clamped);
    }

    updatePart2({ bulletPoints: next });
  }

  function handleCategoryChange(category: AdminSpeakingCategory) {
    if (mode === "edit") return;
    setDraft(emptyDraft(category));
    setActivePart(category === "part-2" ? 2 : category === "part-3" ? 3 : 1);
    setError(null);
  }

  function buildSavePayload() {
    const base = {
      id: mode === "edit" ? draft.id : undefined,
      title: draft.title.trim(),
      category: draft.category,
      published: draft.published,
      part2: draft.part2,
    };

    if (draft.category === "part-1") {
      return {
        ...base,
        part1: { questions: draft.part1.questions.filter((q) => q.text.trim()) },
        part3: { topic: "", questions: [] },
      };
    }

    if (draft.category === "part-2") {
      return {
        ...base,
        part1: { questions: [] },
        part3: { topic: "", questions: [] },
      };
    }

    if (draft.category === "part-3") {
      return {
        ...base,
        part1: { questions: [] },
        part3: {
          topic: draft.part3.topic.trim(),
          questions: draft.part3.questions.filter((q) => q.text.trim()),
        },
      };
    }

    return {
      ...base,
      part1: { questions: draft.part1.questions.filter((q) => q.text.trim()) },
      part3: {
        topic: draft.part3.topic.trim(),
        questions: draft.part3.questions.filter((q) => q.text.trim()),
      },
    };
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!canSave) {
        throw new Error(
          draft.category === "mock"
            ? "Complete all 3 parts before saving the mock test."
            : "Complete all required fields for this part."
        );
      }

      saveAdminSpeakingTest(buildSavePayload());

      setDraft(emptyDraft());
      setMode("create");
      setActivePart(1);
      setSuccess(
        mode === "edit"
          ? "Speaking content updated successfully."
          : "Speaking content created successfully."
      );
      savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mock test.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(test: AdminSpeakingMockTest) {
    setDraft(loadTestIntoDraft(test));
    setMode("edit");
    setActivePart(
      test.category === "part-2" ? 2 : test.category === "part-3" ? 3 : 1
    );
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setDraft(emptyDraft());
    setMode("create");
    setActivePart(1);
    setError(null);
  }

  function handleDelete(id: string) {
    deleteAdminSpeakingTest(id);
    if (mode === "edit" && draft.id === id) {
      handleCancelEdit();
    }
  }

  function handleTogglePublish(test: AdminSpeakingMockTest) {
    if (!test.published && !isDraftValid(loadTestIntoDraft(test))) {
      setError("Cannot publish — complete all required fields first.");
      return;
    }
    setAdminSpeakingTestPublished(test.id, !test.published);
  }

  const categoryLabel = getAdminSpeakingCategoryLabel(draft.category);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit"
                ? `Edit speaking ${categoryLabel.toLowerCase()}`
                : `Create speaking ${categoryLabel.toLowerCase()}`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {draft.category === "mock"
                ? `All 3 parts required · ${totalQuestions} questions`
                : `${categoryLabel} practice · ${totalQuestions} questions`}
            </p>
          </div>
          {mode === "edit" ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Content type
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  disabled={mode === "edit"}
                  onClick={() => handleCategoryChange(option.id)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                    draft.category === option.id
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50",
                    mode === "edit" && draft.category !== option.id && "opacity-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {draft.category === "mock" ? (
              <p className="mt-2 text-xs text-slate-500">
                Mock tests must include Part 1, Part 2, and Part 3.
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-500">
                Standalone {categoryLabel} practice — only this part is required.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="speaking-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              {draft.category === "mock" ? "Mock test title" : "Title"}
            </label>
            <input
              id="speaking-title"
              type="text"
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="e.g. IELTS Speaking — Mock Test 3"
              className={inputClass}
            />
          </div>

          {draft.category === "mock" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Test parts</label>
              <div className="flex flex-wrap gap-2">
                {([1, 2, 3] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActivePart(num)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                      activePart === num
                        ? "bg-violet-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Part {num}
                    {(num === 1 && isPart1Valid(draft)) ||
                    (num === 2 && isPart2Valid(draft)) ||
                    (num === 3 && isPart3Valid(draft))
                      ? " ✓"
                      : ""}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {showPart1 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Part 1 — Introduction & Interview
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Add interview questions. Reorder with the arrow buttons.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPart1Question}
                  className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                >
                  + Add question
                </button>
              </div>

              <div className="space-y-3">
                {draft.part1.questions.map((question, index) => (
                  <QuestionRow
                    key={question.id}
                    index={index}
                    total={draft.part1.questions.length}
                    text={question.text}
                    onChange={(text) => updatePart1Question(question.id, text)}
                    onRemove={() => removePart1Question(question.id)}
                    onMoveUp={() =>
                      updatePart1Questions(moveQuestion(draft.part1.questions, question.id, "up"))
                    }
                    onMoveDown={() =>
                      updatePart1Questions(
                        moveQuestion(draft.part1.questions, question.id, "down")
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {showPart2 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
              <h3 className="text-sm font-semibold text-slate-800">Part 2 — Cue Card</h3>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Cue card title
                </label>
                <input
                  type="text"
                  value={draft.part2.cueCardTitle}
                  onChange={(e) => updatePart2({ cueCardTitle: e.target.value })}
                  placeholder="e.g. Describe a memorable trip you took"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Cue card description
                </label>
                <textarea
                  rows={3}
                  value={draft.part2.cueCardDescription}
                  onChange={(e) => updatePart2({ cueCardDescription: e.target.value })}
                  placeholder="Describe a memorable trip you took."
                  className={cn(inputClass, "resize-y")}
                />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Bullet points ({MIN_BULLET_POINTS}–{MAX_BULLET_POINTS})
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Count:</span>
                    <input
                      type="number"
                      min={MIN_BULLET_POINTS}
                      max={MAX_BULLET_POINTS}
                      value={draft.part2.bulletPoints.length}
                      onChange={(e) => setBulletPointCount(Number(e.target.value))}
                      className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {draft.part2.bulletPoints.map((point, index) => (
                    <input
                      key={index}
                      type="text"
                      value={point}
                      onChange={(e) => updateBulletPoint(index, e.target.value)}
                      placeholder={`Bullet point ${index + 1}`}
                      className={inputClass}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Closing question
                </label>
                <input
                  type="text"
                  value={draft.part2.closingQuestion}
                  onChange={(e) => updatePart2({ closingQuestion: e.target.value })}
                  placeholder="e.g. Would you like to go there again?"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Preparation time (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={draft.part2.preparationMinutes}
                    onChange={(e) =>
                      updatePart2({ preparationMinutes: Number(e.target.value) || 1 })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Speaking time (minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={draft.part2.speakingMinutes}
                    onChange={(e) =>
                      updatePart2({ speakingMinutes: Number(e.target.value) || 2 })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {showPart3 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Discussion topic
                </label>
                <input
                  type="text"
                  value={draft.part3.topic}
                  onChange={(e) => updatePart3({ topic: e.target.value })}
                  placeholder="e.g. Travel and tourism"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Part 3 — Discussion</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Add discussion questions related to the Part 2 topic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPart3Question}
                  className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                >
                  + Add question
                </button>
              </div>

              <div className="space-y-3">
                {draft.part3.questions.map((question, index) => (
                  <QuestionRow
                    key={question.id}
                    index={index}
                    total={draft.part3.questions.length}
                    text={question.text}
                    onChange={(text) => updatePart3Question(question.id, text)}
                    onRemove={() => removePart3Question(question.id)}
                    onMoveUp={() =>
                      updatePart3({
                        questions: moveQuestion(draft.part3.questions, question.id, "up"),
                      })
                    }
                    onMoveDown={() =>
                      updatePart3({
                        questions: moveQuestion(draft.part3.questions, question.id, "down"),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {!canSave ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {draft.category === "mock"
                ? `Complete all 3 parts: title, Part 1 questions, Part 2 cue card (${MIN_BULLET_POINTS}–${MAX_BULLET_POINTS} bullets, closing question), and Part 3 topic with questions.`
                : draft.category === "part-1"
                  ? "Add at least one Part 1 interview question."
                  : draft.category === "part-2"
                    ? "Complete the cue card title, description, bullet points, closing question, and timings."
                    : "Add a discussion topic and at least one Part 3 question."}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !canSave}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#553285] text-sm font-medium text-white transition-colors hover:bg-[#432668] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
          >
            {isSubmitting
              ? "Saving…"
              : mode === "edit"
                ? "Update content"
                : draft.category === "mock"
                  ? "Create mock test"
                  : "Save part"}
          </button>
        </form>
      </div>

      <div
        ref={savedListRef}
        key={version}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-slate-900">Saved content</h2>
        <p className="mt-1 text-sm text-slate-500">
          {tests.length} test{tests.length === 1 ? "" : "s"} in admin storage.
        </p>

        {tests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No speaking content yet. Create your first item using the form.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {tests.map((test) => (
              <li
                key={test.id}
                className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-violet-200"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      test.published
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {test.published ? "Published" : "Draft"}
                  </span>
                  <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                    {getAdminSpeakingCategoryLabel(test.category)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {countAdminSpeakingQuestions(test)} questions
                  </span>
                  {test.category === "mock" ? (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      3 parts
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-2 font-medium text-slate-900">{test.title}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Updated {new Date(test.updatedAt).toLocaleDateString()}
                </p>

                <div className="mt-3 grid gap-2 text-xs text-slate-600">
                  {test.category === "mock" || test.category === "part-1" ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-violet-700">Part 1</span> ·{" "}
                      {test.part1.questions.length} interview questions
                    </div>
                  ) : null}
                  {test.category === "mock" || test.category === "part-2" ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-violet-700">Part 2</span> ·{" "}
                      {test.part2.cueCardTitle || "Cue card"} · {test.part2.preparationMinutes}m prep
                      + {test.part2.speakingMinutes}m speak
                    </div>
                  ) : null}
                  {test.category === "mock" || test.category === "part-3" ? (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-violet-700">Part 3</span> ·{" "}
                      {test.part3.topic || "Discussion"} · {test.part3.questions.length} questions
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(test)}
                    className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(test)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium",
                      test.published
                        ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    )}
                  >
                    {test.published ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(test.id)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function QuestionRow({
  index,
  total,
  text,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number;
  total: number;
  text: string;
  onChange: (text: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-violet-700">Question {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={index === 0}
            onClick={onMoveUp}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index >= total - 1}
            onClick={onMoveDown}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Move down"
          >
            ↓
          </button>
          <button
            type="button"
            disabled={total <= 1}
            onClick={onRemove}
            className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter question text…"
        className={cn(inputClass, "mt-3 resize-y")}
      />
    </div>
  );
}
