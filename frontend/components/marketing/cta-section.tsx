import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-14 text-center shadow-xl shadow-indigo-600/30 sm:px-12">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Ready to study abroad with confidence?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-indigo-100">
          Join NexBand and start your IELTS journey with AI-powered practice today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <ButtonLink
            href={siteConfig.links.getStarted}
            variant="secondary"
            size="lg"
            className="min-w-[200px]"
          >
            Get started
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
