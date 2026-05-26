const SAMPLE_REPORTS = [
  { skill: "Writing", band: "7.5", title: "Task 2 Opinion Essay — Technology" },
  { skill: "Speaking", band: "7.0", title: "Part 2 Cue Card — Travel Experience" },
  { skill: "Reading", band: "8.0", title: "Academic Passage — Climate Science" },
  { skill: "Listening", band: "7.5", title: "Section 3 — University Lecture" },
];

export function SampleReportsSection() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Explore band-scored sample reports to understand what strong answers look
        like across each IELTS skill.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {SAMPLE_REPORTS.map((report) => (
          <article
            key={report.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                {report.skill}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                Band {report.band}
              </span>
            </div>
            <h3 className="mt-3 font-medium text-slate-900">{report.title}</h3>
            <p className="mt-2 text-xs text-slate-500">Full report view coming soon</p>
          </article>
        ))}
      </div>
    </div>
  );
}
