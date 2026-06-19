"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsHome() {
  const router = useRouter();

  useEffect(() => {
    // Safely perform the redirect after the component mounts
    // This prevents the Next.js internal hook counter from crashing
    router.replace("/settings/profile");
  }, [router]);

  // Return null so nothing renders while the redirect happens
  return null;
}