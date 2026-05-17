import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function ExamsSection() {
  return (
    <section id="exams" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Start with IELTS, grow beyond
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Phase one focuses on IELTS. More language tests are planned for the roadmap.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.exams.map((exam) => {
            const available = exam.status === "available";
            return (
              <article
                key={exam.id}
                className={cn(
                  "relative rounded-2xl border p-6 transition-all",
                  available
                    ? "border-indigo-200 bg-indigo-50/50 shadow-sm"
                    : "border-slate-200 bg-white opacity-80"
                )}
              >
                {available ? (
                  <span className="absolute right-4 top-4 rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    Live
                  </span>
                ) : (
                  <span className="absolute right-4 top-4 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    Soon
                  </span>
                )}
                <h3 className="text-xl font-semibold text-slate-900">{exam.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{exam.description}</p>
                {available && (
                  <Link
                    href="/dashboard"
                    className="mt-4 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Go to dashboard →
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
