import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.18),transparent)]"
      />
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            AI-powered · Built for international students
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Master IELTS with{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              instant AI feedback
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            {siteConfig.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href={siteConfig.links.getStarted} size="lg">
              Start practicing free
            </ButtonLink>
            <ButtonLink href="#how-it-works" variant="outline" size="lg">
              See how it works
            </ButtonLink>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Writing Task 2</p>
              <p className="text-xs text-slate-500">Sample AI evaluation</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
              Band 7.0
            </span>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            Your essay demonstrates clear position and logical paragraphing. To reach Band 8,
            vary lexical resources and reduce repetitive linking phrases in body paragraphs.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <p className="font-medium">Strengths</p>
              <p className="mt-1 text-emerald-700">Coherent structure, clear thesis</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <p className="font-medium">Improve</p>
              <p className="mt-1 text-amber-700">Vocabulary range, conclusion depth</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
