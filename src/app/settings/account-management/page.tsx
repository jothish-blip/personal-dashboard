"use client";

import { useRouter } from "next/navigation";
import { FileText, ShieldCheck, Trash2, ChevronRight } from "lucide-react";

export default function AccountManagementPage() {
  const router = useRouter();

  const items = [
    {
      name: "Terms of Service",
      path: "/settings/account-management/terms",
      icon: FileText,
    },
    {
      name: "Privacy Policy",
      path: "/settings/account-management/privacy",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-10">

      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-400">
        <span
          onClick={() => router.push("/settings")}
          className="cursor-pointer hover:text-black transition"
        >
          Settings
        </span>

        <ChevronRight size={14} className="mx-2" />

        <span className="text-gray-800 font-medium">
          Account
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Account Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your policies and account settings.
        </p>
      </div>

      {/* Section */}
      <div className="space-y-1">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-800">
                  {item.name}
                </span>
              </div>

              <ChevronRight size={16} className="text-gray-400" />
            </button>
          );
        })}

      </div>

      {/* Danger Zone */}
      <div className="pt-8 border-t border-gray-100 space-y-3">

        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Danger Zone
        </p>

        <button
          onClick={() =>
            router.push("/settings/account-management/delete-account")
          }
          className="w-full flex items-center justify-between px-3 py-3 rounded-md hover:bg-red-50 transition"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={16} className="text-red-500" />
            <span className="text-sm font-medium text-red-600">
              Delete Account
            </span>
          </div>

          <ChevronRight size={16} className="text-red-400" />
        </button>

        <p className="text-xs text-gray-400">
          Permanently remove your account and all associated data.
        </p>

      </div>

    </div>
  );
}