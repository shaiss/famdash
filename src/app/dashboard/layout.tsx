import { AppHeader } from "@/components/app-shell";
import { requireAllowlistedUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAllowlistedUser();

  return (
    <div className="flex min-h-full flex-col">
      <AppHeader variant="app" />
      {children}
    </div>
  );
}
