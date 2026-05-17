const features = [
  {
    title: "AI band scoring",
    description:
      "Get estimated IELTS band scores aligned with official criteria for writing and speaking responses.",
    icon: "📊",
  },
  {
    title: "Detailed feedback",
    description:
      "Understand strengths and weaknesses with actionable suggestions on grammar, coherence, and vocabulary.",
    icon: "💬",
  },
  {
    title: "All four skills",
    description:
      "Practice Speaking, Writing, Reading, and Listening in one platform designed for abroad study prep.",
    icon: "🎯",
  },
  {
    title: "Track progress",
    description:
      "View your history, compare attempts, and focus on skills that need the most improvement.",
    icon: "📈",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need to prepare
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            NexBand combines realistic practice with AI analysis so you know exactly where to improve.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden>
                {feature.icon}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
