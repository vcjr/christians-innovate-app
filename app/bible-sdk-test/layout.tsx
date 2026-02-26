import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

interface BibleSdkTestLayoutProps {
  children: ReactNode;
}

export default async function BibleSdkTestLayout({ children }: BibleSdkTestLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Optional: restrict to admins in the future. For now, any authenticated user.

  return <>{children}</>;
}
