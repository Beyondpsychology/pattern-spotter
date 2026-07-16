import type { ReadingResultData } from "@/lib/toolTypes";
import CopyButton from "./CopyButton";

export default function ReadingResult({ reading }: { reading: ReadingResultData }) {
  const { sections, sessions, toolkitFit } = reading;

  return (
    <div>
      <div className="flex flex-col gap-6">
        {sections.map((section, i) => (
          <div key={i} className="card relative pl-7">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-terracotta rounded-l-card" />
            <h3 className="text-xl mb-4">{section.heading}</h3>
            <p className="whitespace-pre-wrap leading-relaxed text-dark/90 mb-4">
              {section.body}
            </p>
            <div className="flex justify-end">
              <CopyButton text={`${section.heading}\n\n${section.body}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-dark text-cream rounded-card p-8 mt-10">
        <h3 className="text-2xl mb-6">If you want to work on this more</h3>

        {sessions.length > 0 && (
          <>
            <p className="text-cream/80 mb-6">
              These are the sessions I guide people through for exactly what
              you just named:
            </p>
            <div
              className={`grid gap-4 mb-8 ${
                sessions.length >= 3
                  ? "grid-cols-1 sm:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {sessions.map((session, i) => (
                <a
                  key={i}
                  href={session.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-cream/20 bg-cream/5 hover:bg-cream/10 transition rounded-card p-5 text-cream text-sm leading-relaxed"
                >
                  {session.name}
                </a>
              ))}
            </div>
          </>
        )}

        {toolkitFit && (
          <>
            {sessions.length > 0 && <div className="border-t border-cream/15 my-6" />}
            <p className="eyebrow eyebrow-on-dark text-base mb-4">Or, the complete path</p>
            <a
              href="https://beyondpsychology.eu/overcome-people-pleasing/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center btn-primary bg-terracotta"
            >
              The Overcome People Pleasing Toolkit
            </a>
          </>
        )}
      </div>
    </div>
  );
}
