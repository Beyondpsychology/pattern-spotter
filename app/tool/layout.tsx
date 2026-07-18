import SiteHeader from "@/components/SiteHeader";

export default function ToolLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
