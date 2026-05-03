"use client";

import { Suspense } from "react";
import AuthCallbackInner from "./AuthCallbackInner";

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthCallbackInner />
    </Suspense>
  );
}

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}