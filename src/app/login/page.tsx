import { Suspense } from "react";
import LoginScreen from "@/authentication/screens/LoginScreen/LoginScreen";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginScreen />
    </Suspense>
  );
}