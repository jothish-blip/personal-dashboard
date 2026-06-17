import { Suspense } from "react";
import CallbackScreen from "@/authentication/components/AuthCallbackInner/AuthCallbackInner";

export default function Page() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
          <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-400 text-sm font-medium tracking-wide">Loading...</div>
          </div>
        </div>
      }
    >
      <CallbackScreen />
    </Suspense>
  );
}