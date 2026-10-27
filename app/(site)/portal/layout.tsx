import { VerifyBanner } from "@/components/auth/account-forms";
import { PortalTabs } from "@/components/site/portal-tabs";
import { requireUser } from "@/lib/auth/session";
import { mailEnabled } from "@/lib/mail";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/portal");
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
      <PortalTabs />
      {mailEnabled() && !user.emailVerifiedAt && <VerifyBanner email={user.email} />}
      {children}
    </div>
  );
}
