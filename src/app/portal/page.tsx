import { redirect } from "next/navigation";
import { getPortalSession } from "@/lib/auth/portal-session";

export default async function PortalRootPage() {
  const session = await getPortalSession();
  if (session) {
    redirect("/portal/dashboard");
  } else {
    redirect("/portal/login");
  }
}