import { redirect } from "next/navigation";

export default function SettingsHome() {
  // Instantly redirect users to the Profile page 
  // when they try to access the root /settings route.
  redirect("/settings/profile");
}