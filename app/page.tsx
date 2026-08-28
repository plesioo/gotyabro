import { redirect } from "next/navigation";
import { getSessionGymId } from "@/lib/session";

export default async function Home() {
  const gymId = await getSessionGymId();
  redirect(gymId ? "/dashboard" : "/login");
}
