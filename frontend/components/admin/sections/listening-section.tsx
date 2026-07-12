"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AdminListeningMockTest,
  AdminListeningPart,
  AdminListeningQuestion,
  AdminListeningQuestionType,
} from "@/types/admin";
import {
  LISTENING_AUDIO_ACCEPT,
  LISTENING_ICON_OPTIONS,
  LISTENING_QUESTION_TYPE_OPTIONS,
  MAX_LISTENING_AUDIO_SIZE_MB,
  MAX_LISTENING_IMAGE_SIZE_MB,
} from "@/lib/admin/listening-constants";
import {
  countAdminListeningQuestions,
  createEmptyMockTestDraft,
  createEmptyQuestion,
  deleteAdminListeningTest,
  saveAdminListeningTest,
  setAdminListeningTestPublished,
} from "@/lib/admin/listening-storage";
import { useAdminListeningTests } from "@/hooks/useAdminListeningTests";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

type FormMode = "create" | "edit";

type TestDraft = Omit<AdminListeningMockTest, "createdAt" | "updatedAt">;

function emptyDraft(): TestDraft {
  return {
    ...createEmptyMockTestDraft(),
    id: "",
  };
}

function isPartValid(part: AdminListeningPart): boolean {
  if (!part.title.trim() || !part.instruction.trim()) return false;
  if (!part.audioUrl) return false;
  return part.questions.every(
    (q) => q.questionText.trim() && q.correctAnswer.trim() && q.marks > 0
  );
}

function isDraftValid(draft: TestDraft): boolean {
  if (!draft.title.trim()) return false;
  return draft.parts.every(isPartValid);
}

function loadTestIntoDraft(test: AdminListeningMockTest): TestDraft {
  return {
    id: test.id,
    title: test.title,
    iconStyle: test.iconStyle,
    published: test.published,
    parts: test.parts.map((part) => ({
      ...part,
      questions: part.questions.map((q) => ({ ...q })),
    })),
  };
}

export function ListeningSection() {
  const { tests, version } = useAdminListeningTests();
  const savedListRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<FormMode>("create");
  const [draft, setDraft] = useState<TestDraft>(emptyDraft);
  const [activePart, setActivePart] = useState<1 | 2 | 3 | 4>(1);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentPart = draft.parts.find((p) => p.partNumber === activePart)!;
  const canSave = useMemo(() => isDraftValid(draft), [draft]);
  const totalQuestions = useMemo(
    () => draft.parts.reduce((sum, part) => sum + part.questions.length, 0),
    [draft.parts]
  );

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 2500);
    return () => window.clearTimeout(timer);
  }, [success]);

  function updateDraft(updates: Partial<TestDraft>) {
    setDraft((current) => ({ ...current, ...updates }));
  }

  function updatePart(partNumber: 1 | 2 | 3 | 4, updates: Partial<AdminListeningPart>) {
    setDraft((current) => ({
      ...current,
      parts: current.parts.map((part) =>
        part.partNumber === partNumber ? { ...part, ...updates } : part
      ),
    }));
  }

  function updateQuestion(
    partNumber: 1 | 2 | 3 | 4,
    questionId: string,
    updates: Partial<AdminListeningQuestion>
  ) {
    setDraft((current) => ({
      ...current,
      parts: current.parts.map((part) =>
        part.partNumber === partNumber
          ? {
              ...part,
              questions: part.questions.map((q) =>
                q.id === questionId ? { ...q, ...updates } : q
              ),
            }
          : part
      ),
    }));
  }

  function handleAudioUpload(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["audio/mpeg", "audio/wav", "audio/x-m4a", "audio/mp4", "audio/x-wav"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
      setError("Please upload an audio file (MP3, WAV, or M4A).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LISTENING_AUDIO_SIZE_MB * 1024 * 1024) {
      setError(`Audio must be smaller than ${MAX_LISTENING_AUDIO_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const audioUrl = reader.result as string;
      const audio = new Audio(audioUrl);
      audio.addEventListener("loadedmetadata", () => {
        updatePart(activePart, {
          audioUrl,
          audioDurationSeconds: Math.round(audio.duration) || 480,
        });
      });
      audio.addEventListener("error", () => {
        updatePart(activePart, { audioUrl, audioDurationSeconds: 480 });
      });
    };
    reader.readAsDataURL(file);
  }

  function handleMapImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      updatePart(activePart, { mapImageUrl: undefined, mapImageAlt: undefined });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP, etc.).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LISTENING_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_LISTENING_IMAGE_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updatePart(activePart, { mapImageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function addQuestion() {
    const nextNumber = currentPart.questions.length + 1;
    updatePart(activePart, {
      questions: [...currentPart.questions, createEmptyQuestion(nextNumber)],
    });
  }

  function removeQuestion(questionId: string) {
    const renumbered = currentPart.questions
      .filter((q) => q.id !== questionId)
      .map((q, index) => ({ ...q, questionNumber: index + 1 }));
    updatePart(activePart, { questions: renumbered });
  }

  function setQuestionCount(count: number) {
    const clamped = Math.max(1, Math.min(20, count));
    const current = currentPart.questions;
    let next: AdminListeningQuestion[];

    if (clamped > current.length) {
      next = [
        ...current,
        ...Array.from({ length: clamped - current.length }, (_, i) =>
          createEmptyQuestion(current.length + i + 1)
        ),
      ];
    } else {
      next = current.slice(0, clamped).map((q, index) => ({
        ...q,
        questionNumber: index + 1,
      }));
    }

    updatePart(activePart, { questions: next });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (!canSave) {
        throw new Error("Complete all 4 parts with audio, instructions, and valid questions.");
      }

      saveAdminListeningTest({
        id: mode === "edit" ? draft.id : undefined,
        title: draft.title.trim(),
        iconStyle: draft.iconStyle,
        published: draft.published,
        parts: draft.parts,
      });

      setDraft(emptyDraft());
      setMode("create");
      setActivePart(1);
      setSuccess(
        mode === "edit"
          ? "Listening mock test updated successfully."
          : "Listening mock test created successfully."
      );
      savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save mock test.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(test: AdminListeningMockTest) {
    setDraft(loadTestIntoDraft(test));
    setMode("edit");
    setActivePart(1);
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
    deleteAdminListeningTest(id);
    if (mode === "edit" && draft.id === id) {
      handleCancelEdit();
    }
  }

  function handleTogglePublish(test: AdminListeningMockTest) {
    if (!test.published && !isDraftValid(loadTestIntoDraft(test))) {
      setError("Cannot publish — complete all parts and questions first.");
      return;
    }
    setAdminListeningTestPublished(test.id, !test.published);
  }

  const partComplete = (num: 1 | 2 | 3 | 4) => {
    const part = draft.parts.find((p) => p.partNumber === num);
    return part ? isPartValid(part) : false;
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit listening mock test" : "Create listening mock test"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              4 parts · {totalQuestions} questions · supports all IELTS listening question types
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="test-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Mock test title
              </label>
              <input
                id="test-title"
                type="text"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="e.g. Cambridge IELTS 21 Listening Test 1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Icon style</label>
              <div className="flex flex-wrap gap-2">
                {LISTENING_ICON_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateDraft({ iconStyle: option.value })}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      draft.iconStyle === option.value
                        ? "bg-violet-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Test parts</label>
            <div className="flex flex-wrap gap-2">
              {([1, 2, 3, 4] as const).map((num) => (
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
                  {partComplete(num) ? " ✓" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-5">
            <h3 className="text-sm font-semibold text-slate-800">Part {activePart} settings</h3>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Part title</label>
              <input
                type="text"
                value={currentPart.title}
                onChange={(e) => updatePart(activePart, { title: e.target.value })}
                placeholder="e.g. Restaurant Recommendations"
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Instructions</label>
              <textarea
                rows={3}
                value={currentPart.instruction}
                onChange={(e) => updatePart(activePart, { instruction: e.target.value })}
                placeholder="Complete the table below. Write ONE WORD AND/OR A NUMBER for each answer."
                className={cn(inputClass, "resize-y")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Transcript</label>
              <textarea
                rows={4}
                value={currentPart.transcript ?? ""}
                onChange={(e) => updatePart(activePart, { transcript: e.target.value })}
                placeholder="Full audio transcript (for admin reference and future student review)…"
                className={cn(inputClass, "resize-y")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Upload audio (MP3 / WAV / M4A)
                </label>
                <input
                  key={`audio-${activePart}-${mode}`}
                  type="file"
                  accept={LISTENING_AUDIO_ACCEPT}
                  onChange={handleAudioUpload}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700 hover:file:bg-violet-100"
                />
                {currentPart.audioUrl ? (
                  <p className="mt-2 text-xs text-emerald-700">
                    Audio uploaded · {currentPart.audioDurationSeconds}s
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">Audio required for this part</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Map / diagram image (optional)
                </label>
                <input
                  key={`map-${activePart}-${mode}`}
                  type="file"
                  accept="image/*"
                  onChange={handleMapImageUpload}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700 hover:file:bg-violet-100"
                />
                {currentPart.mapImageUrl ? (
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPart.mapImageUrl}
                      alt={currentPart.mapImageAlt ?? "Map preview"}
                      className="max-h-24 object-contain"
                    />
                  </div>
                ) : null}
                <input
                  type="text"
                  value={currentPart.mapImageAlt ?? ""}
                  onChange={(e) => updatePart(activePart, { mapImageAlt: e.target.value })}
                  placeholder="Image alt text"
                  className={cn(inputClass, "mt-2")}
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  Questions ({currentPart.questions.length})
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs text-slate-500">Questions in part:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={currentPart.questions.length}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    + Add question
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {currentPart.questions.map((question) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    onChange={(updates) => updateQuestion(activePart, question.id, updates)}
                    onRemove={() => removeQuestion(question.id)}
                    canRemove={currentPart.questions.length > 1}
                  />
                ))}
              </div>
            </div>
          </div>

          {!canSave ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Complete all 4 parts: title, instructions, audio upload, and every question (text,
              correct answer, marks).
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
                ? "Update mock test"
                : "Create mock test"}
          </button>
        </form>
      </div>

      <div
        ref={savedListRef}
        key={version}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-slate-900">Saved mock tests</h2>
        <p className="mt-1 text-sm text-slate-500">
          {tests.length} test{tests.length === 1 ? "" : "s"} in admin storage.
        </p>

        {tests.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No listening mock tests yet. Create your first test using the form.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {tests.map((test) => (
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
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        {countAdminListeningQuestions(test)} questions
                      </span>
                      <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        4 parts
                      </span>
                    </div>
                    <h3 className="mt-2 font-medium text-slate-900">{test.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Updated {new Date(test.updatedAt).toLocaleDateString()}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {test.parts.map((part) => (
                        <div
                          key={part.partNumber}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                        >
                          <span className="font-semibold text-violet-700">
                            Part {part.partNumber}
                          </span>
                          {" · "}
                          {part.questions.length} Q
                          {part.audioUrl ? " · Audio ✓" : " · No audio"}
                        </div>
                      ))}
                    </div>
                  </div>
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

function QuestionEditor({
  question,
  onChange,
  onRemove,
  canRemove,
}: {
  question: AdminListeningQuestion;
  onChange: (updates: Partial<AdminListeningQuestion>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const showOptions =
    question.type === "multiple-choice" || question.type === "matching";

  function updateOption(index: number, value: string) {
    const options = [...(question.options ?? [])];
    options[index] = value;
    onChange({ options });
  }

  function addOption() {
    onChange({ options: [...(question.options ?? []), ""] });
  }

  function removeOption(index: number) {
    const options = (question.options ?? []).filter((_, i) => i !== index);
    onChange({ options });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-violet-700">
          Question {question.questionNumber}
        </span>
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

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Question type</label>
          <select
            value={question.type}
            onChange={(e) =>
              onChange({ type: e.target.value as AdminListeningQuestionType })
            }
            className={inputClass}
          >
            {LISTENING_QUESTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
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
            onChange={(e) => onChange({ marks: Number(e.target.value) || 1 })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Correct answer</label>
          <input
            type="text"
            value={question.correctAnswer}
            onChange={(e) => onChange({ correctAnswer: e.target.value })}
            placeholder="e.g. seafood or B"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs font-medium text-slate-600">Question text</label>
        <textarea
          rows={2}
          value={question.questionText}
          onChange={(e) => onChange({ questionText: e.target.value })}
          placeholder="Question prompt or completion sentence…"
          className={cn(inputClass, "resize-y")}
        />
      </div>

      {showOptions ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-600">
              Options {question.type === "multiple-choice" ? "(A, B, C…)" : "(matching items)"}
            </label>
            <button
              type="button"
              onClick={addOption}
              className="text-xs font-medium text-violet-700 hover:underline"
            >
              + Add option
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {(question.options ?? []).map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="shrink-0 rounded-lg px-2 text-xs text-red-600 hover:bg-red-50"
                >
                  ×
                </button>
              </div>
            ))}
            {(question.options ?? []).length === 0 ? (
              <button
                type="button"
                onClick={addOption}
                className="text-xs text-slate-500 hover:text-violet-700"
              >
                Add options for this question type
              </button>
            ) : null}
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
          onChange={(e) => onChange({ explanation: e.target.value })}
          placeholder="Why this is the correct answer…"
          className={cn(inputClass, "resize-y")}
        />
      </div>
    </div>
  );
}
