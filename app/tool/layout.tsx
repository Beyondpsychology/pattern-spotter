import SiteHeader from "@/components/SiteHeader";

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mint">
      <SiteHeader />
      {children}
    </div>
  );
}
