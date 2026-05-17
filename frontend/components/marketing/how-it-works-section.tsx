const steps = [
  {
    step: "01",
    title: "Sign in with Google",
    description: "Create your account in seconds and access your personal dashboard.",
  },
  {
    step: "02",
    title: "Choose a skill",
    description: "Pick Speaking, Writing, Reading, or Listening under the IELTS module.",
  },
  {
    step: "03",
    title: "Complete the test",
    description: "Answer prompts, record audio, or write essays within timed sessions.",
  },
  {
    step: "04",
    title: "Get AI feedback",
    description: "Receive band scores, detailed feedback, and tips to improve faster.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-slate-900 px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How NexBand works</h2>
          <p className="mt-4 text-lg text-slate-300">
            From sign-up to score report in four simple steps.
          </p>
        </div>
        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <li key={item.step} className="relative">
              <span className="text-4xl font-bold text-indigo-400/40">{item.step}</span>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
