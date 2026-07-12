"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminWritingCategory, AdminWritingQuestion } from "@/types/admin";
import {
  deleteAdminMockTest,
  deleteAdminWritingQuestion,
  groupAdminSavedWritingItems,
  isAdminMockTestComplete,
  isAdminWritingQuestionComplete,
  saveAdminWritingQuestion,
  setAdminMockTestPublished,
  setAdminWritingQuestionPublished,
  type AdminSavedWritingItem,
} from "@/lib/admin/writing-storage";
import { useAdminWritingQuestions } from "@/hooks/useAdminWritingQuestions";
import { cn } from "@/lib/utils";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const CATEGORY_OPTIONS: { id: AdminWritingCategory; label: string; taskNumber: 1 | 2 }[] = [
  { id: "mock", label: "Mock Test", taskNumber: 1 },
  { id: "task-1", label: "Task 1", taskNumber: 1 },
  { id: "task-2", label: "Task 2", taskNumber: 2 },
];

const VISUAL_TYPE_OPTIONS = [
  { value: "graph", label: "Line Graph", typeLabel: "Line Graph" },
  { value: "chart", label: "Bar Chart", typeLabel: "Bar Chart" },
  { value: "pie", label: "Pie Chart", typeLabel: "Pie Chart" },
  { value: "table", label: "Table", typeLabel: "Table" },
  { value: "map", label: "Maps", typeLabel: "Maps" },
  { value: "process", label: "Process Diagram", typeLabel: "Process Diagram" },
  { value: "diagram", label: "Diagram", typeLabel: "Diagram" },
] as const;

type VisualType = (typeof VISUAL_TYPE_OPTIONS)[number]["value"];

type FormDraft = {
  title: string;
  prompt: string;
  visualType: VisualType;
  imageAlt: string;
  imagePreview: string | null;
};

type FormMode = "create" | "edit";
type FormContext = "mock-1" | "mock-2" | "task-1" | "task-2";

const MAX_IMAGE_SIZE_MB = 5;

function emptyDraft(): FormDraft {
  return {
    title: "",
    prompt: "",
    visualType: "graph",
    imageAlt: "",
    imagePreview: null,
  };
}

function getFormContext(category: AdminWritingCategory, mockTaskNumber: 1 | 2): FormContext {
  if (category === "mock") return `mock-${mockTaskNumber}`;
  return category;
}

function isMockPartComplete(draft: FormDraft, partNumber: 1 | 2) {
  if (!draft.title.trim() || !draft.prompt.trim()) return false;
  if (partNumber === 1) return Boolean(draft.imagePreview);
  return true;
}

function isPracticeDraftComplete(
  draft: FormDraft,
  category: Extract<AdminWritingCategory, "task-1" | "task-2">
) {
  if (!draft.title.trim() || !draft.prompt.trim()) return false;
  if (category === "task-1") return Boolean(draft.imagePreview);
  return true;
}

function questionToDraft(question: AdminWritingQuestion): FormDraft {
  return {
    title: question.title,
    prompt: question.prompt,
    visualType: (question.task1Type as VisualType) ?? "graph",
    imageAlt: question.imageAlt ?? "",
    imagePreview: question.imageUrl ?? null,
  };
}

function loadMockPartsIntoDrafts(parts: AdminWritingQuestion[]): Record<"mock-1" | "mock-2", FormDraft> {
  const part1 = parts.find((part) => part.taskNumber === 1);
  const part2 = parts.find((part) => part.taskNumber === 2);

  return {
    "mock-1": part1 ? questionToDraft(part1) : emptyDraft(),
    "mock-2": part2 ? questionToDraft(part2) : emptyDraft(),
  };
}

export function WritingSection() {
  const { questions, version } = useAdminWritingQuestions();
  const savedListRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<FormMode>("create");
  const [editingMockId, setEditingMockId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [category, setCategory] = useState<AdminWritingCategory>("task-1");
  const [mockTestTitle, setMockTestTitle] = useState("");
  const [mockTaskNumber, setMockTaskNumber] = useState<1 | 2>(1);
  const [drafts, setDrafts] = useState<Record<FormContext, FormDraft>>({
    "mock-1": emptyDraft(),
    "mock-2": emptyDraft(),
    "task-1": emptyDraft(),
    "task-2": emptyDraft(),
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formContext = getFormContext(category, mockTaskNumber);
  const draft = drafts[formContext];
  const mockPart1 = drafts["mock-1"];
  const mockPart2 = drafts["mock-2"];

  const savedItems = useMemo(() => groupAdminSavedWritingItems(questions), [questions]);
  const mockPart1Complete = isMockPartComplete(mockPart1, 1);
  const mockPart2Complete = isMockPartComplete(mockPart2, 2);
  const mockTestReady =
    Boolean(mockTestTitle.trim()) && mockPart1Complete && mockPart2Complete;

  const requiresImage =
    category === "task-1" || (category === "mock" && mockTaskNumber === 1);

  const canSave = useMemo(() => {
    if (category === "mock") return mockTestReady;
    return isPracticeDraftComplete(draft, category);
  }, [category, draft, mockTestReady]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 1000);
    return () => window.clearTimeout(timer);
  }, [success]);

  function updateDraft(updates: Partial<FormDraft>) {
    setDrafts((current) => ({
      ...current,
      [formContext]: { ...current[formContext], ...updates },
    }));
  }

  function clearMockDrafts() {
    setDrafts((current) => ({
      ...current,
      "mock-1": emptyDraft(),
      "mock-2": emptyDraft(),
    }));
    setMockTestTitle("");
    setEditingMockId(null);
  }

  function clearCurrentDraft() {
    setDrafts((current) => ({
      ...current,
      [formContext]: emptyDraft(),
    }));
    setEditingQuestionId(null);
  }

  function handleCancelEdit() {
    setDrafts({
      "mock-1": emptyDraft(),
      "mock-2": emptyDraft(),
      "task-1": emptyDraft(),
      "task-2": emptyDraft(),
    });
    setCategory("task-1");
    setMockTestTitle("");
    setMockTaskNumber(1);
    setEditingMockId(null);
    setEditingQuestionId(null);
    setMode("create");
    setError(null);
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0];
    if (!file) {
      updateDraft({ imagePreview: null });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP, etc.).");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_IMAGE_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft({ imagePreview: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function saveMockTest(existingMockTestId?: string) {
    const trimmedMockTitle = mockTestTitle.trim();
    const mockTestId =
      existingMockTestId ??
      `mock-${trimmedMockTitle.toLowerCase().replace(/\s+/g, "-")}`;
    const part1Visual = VISUAL_TYPE_OPTIONS.find(
      (option) => option.value === mockPart1.visualType
    );

    saveAdminWritingQuestion({
      id: editingMockId
        ? questions.find(
            (question) =>
              question.category === "mock" &&
              question.mockTestId === editingMockId &&
              question.taskNumber === 1
          )?.id
        : undefined,
      category: "mock",
      taskNumber: 1,
      title: mockPart1.title.trim(),
      prompt: mockPart1.prompt.trim(),
      imageUrl: mockPart1.imagePreview ?? undefined,
      imageAlt: mockPart1.imageAlt.trim() || mockPart1.title.trim(),
      task1Type: mockPart1.visualType,
      typeLabel: part1Visual?.typeLabel,
      mockTestId,
      mockTestTitle: trimmedMockTitle,
    });

    saveAdminWritingQuestion({
      id: editingMockId
        ? questions.find(
            (question) =>
              question.category === "mock" &&
              question.mockTestId === editingMockId &&
              question.taskNumber === 2
          )?.id
        : undefined,
      category: "mock",
      taskNumber: 2,
      title: mockPart2.title.trim(),
      prompt: mockPart2.prompt.trim(),
      typeLabel: "Essay",
      mockTestId,
      mockTestTitle: trimmedMockTitle,
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (category === "mock") {
        if (!mockTestReady) {
          throw new Error("Complete Part 1 and Part 2 before saving the mock test.");
        }
        saveMockTest(editingMockId ?? undefined);
        clearMockDrafts();
        setMode("create");
        setSuccess(
          mode === "edit"
            ? "Mock test updated successfully."
            : "Mock test saved successfully."
        );
      } else {
        if (!isPracticeDraftComplete(draft, category)) {
          throw new Error("Please fill in all required fields.");
        }

        const selectedVisual = VISUAL_TYPE_OPTIONS.find(
          (option) => option.value === draft.visualType
        );

        saveAdminWritingQuestion({
          id: editingQuestionId ?? undefined,
          category,
          taskNumber: category === "task-2" ? 2 : 1,
          title: draft.title.trim(),
          prompt: draft.prompt.trim(),
          imageUrl: draft.imagePreview ?? undefined,
          imageAlt: draft.imageAlt.trim() || draft.title.trim(),
          task1Type: category === "task-1" ? draft.visualType : undefined,
          typeLabel: category === "task-2" ? "Essay" : selectedVisual?.typeLabel,
        });

        clearCurrentDraft();
        setMode("create");
        setSuccess(
          mode === "edit"
            ? "Writing question updated successfully."
            : "Writing question saved successfully."
        );
      }

      savedListRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save question.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDeletePractice(id: string) {
    deleteAdminWritingQuestion(id);
    if (mode === "edit" && editingQuestionId === id) {
      handleCancelEdit();
    }
  }

  function handleDeleteMock(mockTestId: string) {
    deleteAdminMockTest(mockTestId);
    if (mode === "edit" && editingMockId === mockTestId) {
      handleCancelEdit();
    }
  }

  function handleEditMock(item: Extract<AdminSavedWritingItem, { kind: "mock" }>) {
    setCategory("mock");
    setMockTestTitle(item.mockTestTitle);
    setMockTaskNumber(1);
    setDrafts((current) => ({
      ...current,
      ...loadMockPartsIntoDrafts(item.parts),
    }));
    setEditingMockId(item.mockTestId);
    setEditingQuestionId(null);
    setMode("edit");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleEditPractice(question: AdminWritingQuestion) {
    setCategory(question.category === "mock" ? "task-1" : question.category);
    setDrafts((current) => ({
      ...current,
      [question.category === "task-2" ? "task-2" : "task-1"]: questionToDraft(question),
    }));
    setEditingQuestionId(question.id);
    setEditingMockId(null);
    setMode("edit");
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleTogglePublishMock(item: Extract<AdminSavedWritingItem, { kind: "mock" }>) {
    if (!item.published && !isAdminMockTestComplete(item.parts)) {
      setError("Cannot publish — complete Part 1 and Part 2 first.");
      return;
    }
    setAdminMockTestPublished(item.mockTestId, !item.published);
    setError(null);
  }

  function handleTogglePublishPractice(question: AdminWritingQuestion) {
    if (!question.published && !isAdminWritingQuestionComplete(question)) {
      setError("Cannot publish — complete all required fields first.");
      return;
    }
    setAdminWritingQuestionPublished(question.id, !question.published);
    setError(null);
  }

  function handleCategoryChange(nextCategory: AdminWritingCategory) {
    if (mode === "edit") return;
    setCategory(nextCategory);
    setError(null);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === "edit" ? "Edit writing question" : "Add writing question"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create questions for Mock Test, Task 1, or Task 2. Upload chart images for visual tasks.
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

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Question placement
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
                    category === option.id
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    mode === "edit" && category !== option.id && "opacity-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {category === "mock" ? (
            <>
              <div>
                <label htmlFor="mock-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mock test title
                </label>
                <input
                  id="mock-title"
                  type="text"
                  value={mockTestTitle}
                  onChange={(event) => setMockTestTitle(event.target.value)}
                  placeholder="e.g. Academic Writing — Mock Test 3"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Task in mock test
                </label>
                <div className="flex gap-2">
                  {([1, 2] as const).map((num) => {
                    const isComplete = num === 1 ? mockPart1Complete : mockPart2Complete;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setMockTaskNumber(num)}
                        className={cn(
                          "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                          mockTaskNumber === num
                            ? "bg-violet-600 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        Part {num}
                        {isComplete ? " ✓" : ""}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Fill Part 1 and Part 2 separately. Save is enabled only after both parts are complete.
                </p>
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="writing-title" className="mb-1.5 block text-sm font-medium text-slate-700">
              Question title
            </label>
            <input
              id="writing-title"
              type="text"
              required
              value={draft.title}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="e.g. Energy Consumption by Fuel Type"
              className={inputClass}
            />
          </div>

          {requiresImage ? (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Visual type
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {VISUAL_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateDraft({ visualType: option.value })}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                        draft.visualType === option.value
                          ? "border-violet-300 bg-violet-50 text-violet-800"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="chart-image" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Upload chart / graph image
                </label>
                <input
                  key={formContext}
                  id="chart-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-violet-700 hover:file:bg-violet-100"
                />
                {draft.imagePreview ? (
                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.imagePreview}
                      alt="Preview"
                      className="mx-auto max-h-48 object-contain"
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label htmlFor="image-alt" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Image description (alt text)
                </label>
                <input
                  id="image-alt"
                  type="text"
                  value={draft.imageAlt}
                  onChange={(event) => updateDraft({ imageAlt: event.target.value })}
                  placeholder="Describe the chart for accessibility"
                  className={inputClass}
                />
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="writing-prompt" className="mb-1.5 block text-sm font-medium text-slate-700">
              Question text
            </label>
            <textarea
              id="writing-prompt"
              required
              rows={6}
              value={draft.prompt}
              onChange={(event) => updateDraft({ prompt: event.target.value })}
              placeholder="Enter the full question instructions shown to students…"
              className={cn(inputClass, "resize-y")}
            />
          </div>

          {category === "mock" && !mockTestReady ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {!mockTestTitle.trim()
                ? "Enter a mock test title."
                : !mockPart1Complete && !mockPart2Complete
                  ? "Complete Part 1 and Part 2 to enable save."
                  : !mockPart1Complete
                    ? "Complete Part 1 (title, question text, and chart image)."
                    : "Complete Part 2 (title and question text)."}
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
                ? category === "mock"
                  ? "Update mock test"
                  : "Update question"
                : category === "mock"
                  ? "Save mock test"
                  : "Save question"}
          </button>
        </form>
      </div>

      <div
        ref={savedListRef}
        key={version}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
      >
        <h2 className="text-lg font-semibold text-slate-900">Saved questions</h2>
        <p className="mt-1 text-sm text-slate-500">
          {savedItems.length} question{savedItems.length === 1 ? "" : "s"} in admin storage.
        </p>

        {savedItems.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            No writing questions yet. Add your first question using the form.
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {savedItems.map((item) =>
              item.kind === "mock" ? (
                <li
                  key={item.mockTestId}
                  className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-violet-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            item.published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {item.published ? "Published" : "Draft"}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                          Mock Test
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          Part 1 + Part 2
                        </span>
                      </div>
                      <h3 className="mt-2 font-medium text-slate-900">{item.mockTestTitle}</h3>

                      <div className="mt-4 space-y-4">
                        {item.parts.map((part) => (
                          <div
                            key={part.id}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-violet-700">
                                Part {part.taskNumber}
                              </span>
                              {part.typeLabel ? (
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                                  {part.typeLabel}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm font-medium text-slate-900">{part.title}</p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{part.prompt}</p>
                            {part.imageUrl ? (
                              <div className="mt-2 overflow-hidden rounded-lg border border-slate-100 bg-white p-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={part.imageUrl}
                                  alt={part.imageAlt ?? part.title}
                                  className="max-h-20 object-contain"
                                />
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditMock(item)}
                        className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePublishMock(item)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium",
                          item.published
                            ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        )}
                      >
                        {item.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMock(item.mockTestId)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                <li
                  key={item.question.id}
                  className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-violet-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-medium",
                            item.question.published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          )}
                        >
                          {item.question.published ? "Published" : "Draft"}
                        </span>
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                          {formatCategoryLabel(item.question.category, item.question.taskNumber)}
                        </span>
                        {item.question.typeLabel ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                            {item.question.typeLabel}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-medium text-slate-900">{item.question.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {item.question.prompt}
                      </p>
                      {item.question.imageUrl ? (
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.question.imageUrl}
                            alt={item.question.imageAlt ?? item.question.title}
                            className="max-h-24 object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditPractice(item.question)}
                        className="rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePublishPractice(item.question)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-medium",
                          item.question.published
                            ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        )}
                      >
                        {item.question.published ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePractice(item.question.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatCategoryLabel(category: AdminWritingCategory, taskNumber: 1 | 2) {
  switch (category) {
    case "mock":
      return `Mock Test · Part ${taskNumber}`;
    case "task-1":
      return "Task 1";
    case "task-2":
      return "Task 2";
  }
}
