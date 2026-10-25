import { PortalTabs } from "@/components/site/portal-tabs";
import { requireUser } from "@/lib/auth/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/portal");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <PortalTabs />
      {children}
    </div>
  );
}
