import SiteHeader from "@/components/SiteHeader";
import { CRISIS_TEXT, DISCLAIMER_TEXT } from "@/lib/legal";

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-sage flex flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <footer className="px-6 py-10 md:px-16">
        <div className="max-w-[680px] mx-auto text-center text-xs text-white/70 leading-relaxed space-y-2">
          <p>{CRISIS_TEXT}</p>
          <p>{DISCLAIMER_TEXT}</p>
        </div>
      </footer>
    </div>
  );
}
