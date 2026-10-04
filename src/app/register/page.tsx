import { Suspense } from "react";
import RegisterScreen from "@/authentication/screens/RegisterScreen/RegisterScreen";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#000000]">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterScreen />
    </Suspense>
  );
}