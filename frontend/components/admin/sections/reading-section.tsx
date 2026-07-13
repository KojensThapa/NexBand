"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminReadingPassage,
  AdminReadingQuestion,
  AdminReadingQuestionType,
  AdminReadingTest,
} from "@/types/admin";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  DEFAULT_READING_TOTAL_MINUTES,
  DEFAULT_READING_TOTAL_QUESTIONS,
  getAdminReadingCategoryLabel,
  getDefaultOptionsForType,
  MAX_READING_IMAGE_SIZE_MB,
  READING_QUESTION_TYPE_OPTIONS,
  READING_TYPES_WITH_OPTIONS,
} from "@/lib/admin/reading-constants";
import {
  countAdminReadingQuestions,
  createEmptyPassage,
  createEmptyQuestion,
  createEmptyReadingDraft,
  deleteAdminReadingTest,
  getAdminReadingValidationError,
  isAdminReadingPassageValid,
  isAdminReadingTestValid,
  saveAdminReadingTest,
  setAdminReadingTestPublished,
} from "@/lib/admin/reading-storage";
import { useAdminReadingTests } from "@/hooks/useAdminReadingTests";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

type FormMode = "create" | "edit";
type TestDraft = Omit<AdminReadingTest, "createdAt" | "updatedAt">;

function emptyDraft(): TestDraft {
  return { ...createEmptyReadingDraft(), id: "" };
}

function loadTestIntoDraft(test: AdminReadingTest): TestDraft {
  return {
    id: test.id,
    title: test.title,
    category: test.category,
    tags: [...test.tags],
    published: test.published,
    totalQuestions: test.totalQuestions,
    totalMinutes: test.totalMinutes,
    passages: test.passages.map((passage) => ({
      ...passage,
      questions: passage.questions.map((question) => ({ ...question })),
    })),
  };
}

function moveQuestion(
  questions: AdminReadingQuestion[],
  questionId: string,
  direction: "up" | "down"
): AdminReadingQuestion[] {
  const index = questions.findIndex((question) => question.id === questionId);
  if (index === -1) return questions;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) return questions;

  const next = [...questions];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next.map((question, questionIndex) => ({
    ...question,
    questionNumber: questionIndex + 1,
  }));
}

export function ReadingSection() {
  const { tests, version } = useAdminReadingTests();
  const mockTests = useMemo(
    () => tests.filter((test) => test.category === "mock"),
    [tests]
  );
  const savedListRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<FormMode>("create");
  const [draft, setDraft] = useState<TestDraft>(emptyDraft);
  const [activePassageIndex, setActivePassageIndex] = useState(0);
  const [tagsInput, setTagsInput] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPassage = draft.passages[activePassageIndex];
  const canSave = useMemo(() => isAdminReadingTestValid(draft), [draft]);
  const totalQuestions = useMemo(() => countAdminReadingQuestions(draft), [draft]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  function updateDraft(updates: Partial<TestDraft>) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function updatePassage(passageId: string, updates: Partial<AdminReadingPassage>) {
    setDraft((current) => ({
      ...current,
      passages: current.passages.map((passage) =>
        passage.id === passageId ? { ...passage, ...updates } : passage
      ),
    }));
  }

  function updateQuestion(
    passageId: string,
    questionId: string,
    updates: Partial<AdminReadingQuestion>
  ) {
    setDraft((current) => ({
      ...current,
      passages: current.passages.map((passage) =>
        passage.id === passageId
          ? {
              ...passage,
              questions: passage.questions.map((question) =>
                question.id === questionId ? { ...question, ...updates } : question
              ),
            }
          : passage
      ),
    }));
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!currentPassage) return;
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      updatePassage(currentPassage.id, { imageUrl: undefined, imageAlt: undefined });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP, etc.).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_READING_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_READING_IMAGE_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updatePassage(currentPassage.id, { imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function addQuestion() {
    if (!currentPassage) return;
    const nextNumber = currentPassage.questions.length + 1;
    updatePassage(currentPassage.id, {
      questions: [...currentPassage.questions, createEmptyQuestion(nextNumber)],
    });
  }

  function removeQuestion(questionId: string) {
    if (!currentPassage || currentPassage.questions.length <= 1) return;
    const renumbered = currentPassage.questions
      .filter((question) => question.id !== questionId)
      .map((question, index) => ({ ...question, questionNumber: index + 1 }));
    updatePassage(currentPassage.id, { questions: renumbered });
  }

  function setQuestionCount(count: number) {
    if (!currentPassage) return;
    const clamped = Math.max(1, Math.min(20, count));
    const current = currentPassage.questions;
    let next: AdminReadingQuestion[];

    if (clamped > current.length) {
      next = [
        ...current,
        ...Array.from({ length: clamped - current.length }, (_, index) =>
          createEmptyQuestion(current.length + index + 1)
        ),
      ];
    } else {
      next = current.slice(0, clamped).map((question, index) => ({
        ...question,
        questionNumber: index + 1,
      }));
    }

    updatePassage(currentPassage.id, { questions: next });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const validationError = getAdminReadingValidationError(draft);
      if (validationError) {
        throw new Error(validationError);
      }

      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      saveAdminReadingTest({
        id: mode === "edit" ? draft.id : undefined,
        title: draft.title.trim(),
        category: "mock",
        tags,
        published: draft.published,
        totalQuestions: draft.totalQuestions,
        totalMinutes: draft.totalMinutes,
        passages: draft.passages.map((passage) => ({
          ...passage,
          title: passage.title.trim(),
          instruction: passage.instruction.trim(),
          questions: passage.questions
            .filter((question) => question.questionText.trim())
            .map((question, index) => ({
              ...question,
              questionNumber: index + 1,
            })),
        })),
      });

      setDraft(emptyDraft());
      setMode("create");
      setActivePassageIndex(0);
      setTagsInput("");
      setSuccess(
        mode === "edit"
          ? "Reading test updated successfully."
          : "Reading test created successfully."
      );
      savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save reading test.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(test: AdminReadingTest) {
    setDraft(loadTestIntoDraft(test));
    setTagsInput(test.tags.join(", "));
    setMode("edit");
    setActivePassageIndex(0);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setDraft(emptyDraft());
    setMode("create");
    setActivePassageIndex(0);
    setTagsInput("");
    setError(null);
  }

  function handleDelete(id: string) {
    deleteAdminReadingTest(id);
    if (mode === "edit" && draft.id === id) {
      handleCancelEdit();
    }
  }

  function handleTogglePublish(test: AdminReadingTest) {
    if (!test.published) {
      const validationError = getAdminReadingValidationError(test);
      if (validationError) {
        setError(`Cannot publish — ${validationError}`);
        setSuccess(null);
        savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }
    }
    setAdminReadingTestPublished(test.id, !test.published);
    setError(null);
    setSuccess(
      test.published
        ? `"${test.title}" unpublished — hidden from student site.`
        : `"${test.title}" published — now visible on student site.`
    );
    savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const categoryLabel = getAdminReadingCategoryLabel();

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit"
                ? `Edit ${categoryLabel.toLowerCase()}`
                : `Create ${categoryLabel.toLowerCase()}`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Full mock test — all 3 passages required · {totalQuestions} questions
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
            <label htmlFor="reading-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              Test title
            </label>
            <input
              id="reading-title"
              type="text"
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="e.g. Academic Reading — Mock Test 3"
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="reading-tags" className="mb-1.5 block text-sm font-medium text-slate-700">
                Tags
              </label>
              <input
                id="reading-tags"
                type="text"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="e.g. academic, science, environment"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Total questions
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={draft.totalQuestions}
                onChange={(event) =>
                  updateDraft({
                    totalQuestions: Number(event.target.value) || DEFAULT_READING_TOTAL_QUESTIONS,
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Total minutes
              </label>
              <input
                type="number"
                min={20}
                max={90}
                value={draft.totalMinutes}
                onChange={(event) =>
                  updateDraft({
                    totalMinutes: Number(event.target.value) || DEFAULT_READING_TOTAL_MINUTES,
                  })
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Passages</label>
              <div className="flex flex-wrap gap-2">
                {draft.passages.map((passage, index) => {
                  const isComplete = isAdminReadingPassageValid(passage);
                  return (
                    <button
                      key={passage.id}
                      type="button"
                      onClick={() => setActivePassageIndex(index)}
                      className={cn(
                        "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                        activePassageIndex === index
                          ? "bg-violet-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      Passage {passage.partNumber}
                      {isComplete ? (
                        <span className="ml-1.5 text-xs opacity-80">✓</span>
                      ) : (
                        <span className="ml-1.5 text-xs opacity-60">·</span>
                      )}
                    </button>
                  );
                })}
              </div>
          </div>

          {currentPassage ? (
            <PassageEditor
              passage={currentPassage}
              onChange={(updates) => updatePassage(currentPassage.id, updates)}
              onImageUpload={handleImageUpload}
              onAddQuestion={addQuestion}
              onRemoveQuestion={removeQuestion}
              onSetQuestionCount={setQuestionCount}
              onUpdateQuestion={(questionId, updates) =>
                updateQuestion(currentPassage.id, questionId, updates)
              }
              onMoveQuestion={(questionId, direction) =>
                updatePassage(currentPassage.id, {
                  questions: moveQuestion(currentPassage.questions, questionId, direction),
                })
              }
            />
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
                ? "Update reading test"
                : "Save reading test"}
          </button>
        </form>
      </div>

      <div
        ref={savedListRef}
        key={version}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-slate-900">Saved reading tests</h2>
        <p className="mt-1 text-sm text-slate-500">
          {mockTests.length} mock test{mockTests.length === 1 ? "" : "s"} in admin storage. Published
          tests appear on the student reading page.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {mockTests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No mock tests yet. Create your first test using the form.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {mockTests.map((test) => (
              <li
                key={test.id}
                className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-violet-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
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
                        {getAdminReadingCategoryLabel()}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {countAdminReadingQuestions(test)} questions
                      </span>
                    </div>
                    <h3 className="mt-2 font-medium text-slate-900">{test.title}</h3>
                    {test.tags.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">{test.tags.join(" · ")}</p>
                    ) : null}
                    <div className="mt-3 space-y-2">
                      {test.passages.map((passage) => (
                        <p key={passage.id} className="text-sm text-slate-600">
                          <span className="font-medium text-slate-700">
                            Passage {passage.partNumber}:
                          </span>{" "}
                          {passage.title || "Untitled"}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
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
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PassageEditor({
  passage,
  onChange,
  onImageUpload,
  onAddQuestion,
  onRemoveQuestion,
  onSetQuestionCount,
  onUpdateQuestion,
  onMoveQuestion,
}: {
  passage: AdminReadingPassage;
  onChange: (updates: Partial<AdminReadingPassage>) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (questionId: string) => void;
  onSetQuestionCount: (count: number) => void;
  onUpdateQuestion: (questionId: string, updates: Partial<AdminReadingQuestion>) => void;
  onMoveQuestion: (questionId: string, direction: "up" | "down") => void;
}) {
  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-slate-900">
        Passage {passage.partNumber} details
      </h3>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Passage title
        </label>
        <input
          type="text"
          value={passage.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="e.g. The History of Chocolate"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Passage instructions
        </label>
        <textarea
          rows={2}
          value={passage.instruction}
          onChange={(event) => onChange({ instruction: event.target.value })}
          placeholder="e.g. Do the following statements agree with the information in the passage?"
          className={cn(inputClass, "resize-y")}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Passage text
        </label>
        <RichTextEditor
          value={passage.passageText}
          onChange={(value) => onChange({ passageText: value })}
          placeholder="Enter the full reading passage…"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Optional diagram image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700 hover:file:bg-violet-100"
        />
        {passage.imageUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={passage.imageUrl}
              alt={passage.imageAlt ?? passage.title}
              className="mx-auto max-h-48 object-contain"
            />
            <input
              type="text"
              value={passage.imageAlt ?? ""}
              onChange={(event) => onChange({ imageAlt: event.target.value })}
              placeholder="Image description (alt text)"
              className={cn(inputClass, "mt-3")}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Questions</h4>
          <p className="text-xs text-slate-500">{passage.questions.length} questions in this passage</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600">Count:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={passage.questions.length}
            onChange={(event) => onSetQuestionCount(Number(event.target.value) || 1)}
            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={onAddQuestion}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {passage.questions.map((question, index) => (
          <ReadingQuestionEditor
            key={question.id}
            question={question}
            canRemove={passage.questions.length > 1}
            canMoveUp={index > 0}
            canMoveDown={index < passage.questions.length - 1}
            onChange={(updates) => onUpdateQuestion(question.id, updates)}
            onRemove={() => onRemoveQuestion(question.id)}
            onMoveUp={() => onMoveQuestion(question.id, "up")}
            onMoveDown={() => onMoveQuestion(question.id, "down")}
          />
        ))}
      </div>
    </div>
  );
}

function ReadingQuestionEditor({
  question,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
  canMoveUp,
  canMoveDown,
}: {
  question: AdminReadingQuestion;
  onChange: (updates: Partial<AdminReadingQuestion>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canRemove: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const showOptions = READING_TYPES_WITH_OPTIONS.has(question.type);

  function handleTypeChange(type: AdminReadingQuestionType) {
    onChange({
      type,
      options: getDefaultOptionsForType(type),
    });
  }

  function updateOption(index: number, value: string) {
    const options = [...(question.options ?? [])];
    options[index] = value;
    onChange({ options });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-violet-700">
          Question {question.questionNumber}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40"
          >
            ↓
          </button>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Question type</label>
          <select
            value={question.type}
            onChange={(event) =>
              handleTypeChange(event.target.value as AdminReadingQuestionType)
            }
            className={inputClass}
          >
            {READING_QUESTION_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Marks</label>
          <input
            type="number"
            min={1}
            max={10}
            value={question.marks}
            onChange={(event) => onChange({ marks: Number(event.target.value) || 1 })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Correct answer</label>
          <input
            type="text"
            value={question.correctAnswer}
            onChange={(event) => onChange({ correctAnswer: event.target.value })}
            placeholder="e.g. TRUE or B"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">Question text</label>
        <textarea
          rows={2}
          value={question.questionText}
          onChange={(event) => onChange({ questionText: event.target.value })}
          placeholder="Question prompt or completion sentence…"
          className={cn(inputClass, "resize-y")}
        />
      </div>

      {showOptions ? (
        <div className="mt-3">
          <label className="text-xs font-medium text-slate-600">Options</label>
          <div className="mt-2 space-y-2">
            {(question.options ?? []).map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(event) => updateOption(index, event.target.value)}
                placeholder={`Option ${index + 1}`}
                className={inputClass}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">
          Explanation (optional)
        </label>
        <textarea
          rows={2}
          value={question.explanation ?? ""}
          onChange={(event) => onChange({ explanation: event.target.value })}
          placeholder="Why this is the correct answer…"
          className={cn(inputClass, "resize-y")}
        />
      </div>
    </div>
  );
}
