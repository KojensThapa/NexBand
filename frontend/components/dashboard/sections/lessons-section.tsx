const LESSONS = [
  { title: "Writing Task 2 structure", skill: "Writing", level: "Beginner" },
  { title: "Speaking Part 2 cue cards", skill: "Speaking", level: "Intermediate" },
  { title: "Listening note-taking tips", skill: "Listening", level: "Beginner" },
  { title: "Reading skimming & scanning", skill: "Reading", level: "Intermediate" },
];

export function LessonsSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Structured lessons to build each IELTS skill step by step. Content will be
        added in a future update.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson) => (
          <article
            key={lesson.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                {lesson.skill}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {lesson.level}
              </span>
            </div>
            <h3 className="mt-3 font-medium text-slate-900">{lesson.title}</h3>
            <p className="mt-2 text-xs text-slate-500">Lesson player coming soon</p>
          </article>
        ))}
      </div>
    </div>
  );
}
