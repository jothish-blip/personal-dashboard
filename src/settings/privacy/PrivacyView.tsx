"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, ShieldCheck, Database, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function PrivacyPage() {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 relative">
      
      {/* 🔹 STICKY HEADER */}
      <div className="sticky top-4 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-[#FAFAFA]/90 rounded-xl pt-3 pb-5 border border-gray-200/60 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.15)] -mx-4 sm:-mx-6 px-4 sm:px-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span onClick={() => router.push("/settings")} className="cursor-pointer hover:text-black transition-colors">
            Settings
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span onClick={() => router.push("/settings/account-management")} className="cursor-pointer hover:text-black transition-colors">
            Account Management
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-black font-medium">Privacy Policy</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Privacy Policy
        </h1>
      </div>

      {/* 🔹 META INFO */}
      <div className="mt-6 mb-10 px-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500">
          <div>
            <span className="font-medium text-gray-700">Version:</span>{" "}
            <span className="font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-700">
              privacy_v1
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Last Updated:</span>{" "}
            April 2026
          </div>
        </div>
      </div>

      {/* 🔹 CONTENT */}
      <div className="space-y-14 md:space-y-16 text-sm text-gray-600 leading-relaxed md:leading-loose mt-8">

        {/* 1 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">1. Introduction</h2>
          <p>
            This Privacy Policy explains how NexTask collects, uses, and protects your information 
            when you use the platform, including tasks, notes, files, diary, and planner features.
          </p>
        </section>

        {/* 2 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">2. Information We Collect</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li>Basic profile data (name, email, avatar)</li>
            <li>Tasks, notes, files, folders, and diary content</li>
            <li>Usage data (how you interact with the app)</li>
            <li>Device and browser information</li>
          </ul>
        </section>

        {/* 3 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">3. How We Use Your Data</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li>To provide and operate the platform</li>
            <li>To sync your data across devices</li>
            <li>To improve features and performance</li>
            <li>To provide support and resolve issues</li>
          </ul>
        </section>

        {/* 4. UPDATED: Third-Party Auth & OAuth Compliance */}
        <section className="pb-6 border-b border-gray-100 last:border-none">
          <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-base font-semibold text-black">4. Third-Party Authentication & OAuth</h2>
            <p>You may sign in using Google, GitHub, or Facebook.</p>
            
            <p className="mt-2 font-medium text-gray-800">When using third-party authentication:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>We only access basic profile information (name, email, avatar).</li>
              <li>We do <strong>not</strong> access your passwords or private account data.</li>
              <li>Authentication is handled securely by the provider.</li>
              <li>We do not store sensitive authentication tokens beyond what is required for active login sessions.</li>
            </ul>

            <p className="mt-4 font-medium text-gray-800">Third-Party Services Disclaimer:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Our platform relies on these providers for authentication, and your use is governed by their respective policies.</li>
              <li>We are <strong>not</strong> responsible for service outages or downtime from these providers.</li>
              <li>We are <strong>not</strong> responsible for account suspensions, restrictions, or bans imposed by them.</li>
              <li>We are not liable for changes in their APIs, policies, or data practices.</li>
            </ul>
          </div>
        </section>

        {/* 5 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">5. Data Storage</h2>
          <p>
            Your data (tasks, notes, files, diary entries) is securely stored in our backend systems. 
            We implement reasonable technical and organizational safeguards to protect your information.
          </p>
        </section>

        {/* 6 */}
        <section className="pb-6 border-b border-gray-100 last:border-none">
          <div className="space-y-3 bg-blue-50/50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-600" />
              6. Data Protection
            </h2>
            <ul className="list-disc ml-5 space-y-2 text-blue-800/90">
              <li>Your data is encrypted and securely stored.</li>
              <li>We do <strong>NOT</strong> sell your personal data to anyone.</li>
              <li>Access to your data is restricted and protected.</li>
            </ul>
          </div>
        </section>

        {/* 7 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">7. Data Sharing</h2>
          <p>
            We do not sell or share your personal data with third parties, except in the following limited circumstances:
          </p>
          <ul className="list-disc ml-5 space-y-2">
            <li>When legally required by law enforcement or court order.</li>
            <li>To protect our system security and investigate fraud.</li>
          </ul>
        </section>

        {/* 8. UPDATED: Data Retention */}
        <section className="pb-6 border-b border-gray-100 last:border-none">
          <div className="space-y-3 bg-amber-50 p-6 rounded-xl border border-amber-200">
            <h2 className="text-base font-semibold text-amber-900 flex items-center gap-2">
              <Database size={18} className="text-amber-600" />
              8. Data Retention & Risk
            </h2>
            <p className="text-amber-900/80">We retain your data as long as your account remains active.</p>
            
            <p className="mt-4 font-medium text-amber-900">After account deletion:</p>
            <ul className="list-disc ml-5 space-y-2 text-amber-800/90">
              <li>Your personal data is deleted immediately from active systems.</li>
              <li>Encrypted backup data may persist for up to <strong>30 days</strong> before permanent removal.</li>
            </ul>

            <p className="mt-4 font-medium text-amber-900">We may retain limited logs for:</p>
            <ul className="list-disc ml-5 space-y-2 text-amber-800/90">
              <li>Security monitoring and debugging</li>
              <li>Fraud prevention</li>
              <li>Legal compliance</li>
            </ul>
          </div>
        </section>

        {/* 9 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">9. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Access and review your data</li>
            <li>Edit, modify, or delete specific data entries</li>
            <li>Request a full and permanent account deletion</li>
          </ul>
        </section>

        {/* 10. NEW: Account Deletion (CRITICAL FOR APP STORES/FACEBOOK) */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">10. Account Deletion & Data Removal</h2>
          <p>You have the absolute right to permanently delete your account at any time.</p>
          
          <p className="mt-4 font-medium text-gray-800">When you delete your account:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>All your personal data including tasks, notes, files, folders, and diary entries will be permanently deleted.</li>
            <li>Your profile information (name, email, avatar) will be purged from our systems.</li>
            <li><strong>This action is completely irreversible.</strong></li>
          </ul>

          <p className="mt-4 font-medium text-gray-800">Data Retention Limits:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Some minimal system logs (strictly for security/legal purposes) may be retained temporarily.</li>
            <li>Offline backup systems may retain encrypted fragments for up to 30 days before complete automatic deletion.</li>
          </ul>

          <div className="mt-6 bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <p className="font-medium text-gray-800 mb-1">How to delete your account:</p>
            <p className="text-gray-600">
              Navigate to <span className="font-semibold text-gray-900">Settings → Account Management → Delete Account</span>. Alternatively, you can initiate a deletion request through our Contact page.
            </p>
          </div>
        </section>

        {/* 11 */}
        <section className="pb-6 border-b border-gray-100 last:border-none">
          <div className="space-y-3 bg-red-50 p-6 rounded-xl border border-red-100">
            <h2 className="text-base font-semibold text-red-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              11. Limitation of Security
            </h2>
            <p className="text-red-800/90">
              While we take strong, industry-standard security measures, no system is impenetrable. We cannot guarantee the absolute security of your data against highly sophisticated attacks or breaches resulting from compromised user credentials.
            </p>
          </div>
        </section>

        {/* 12 */}
        <section className="space-y-3 pb-6 border-b border-gray-100 last:border-none">
          <h2 className="text-base font-semibold text-black">12. Changes to Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. Continued use of the platform after changes are posted means you accept the updated policy.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-black">13. Contact</h2>
          <p>
            For any privacy-related concerns, data inquiries, or account deletion requests, please visit:
          </p>
          <div className="mt-2">
            <span 
              onClick={() => router.push("/settings/contact")}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium inline-flex items-center gap-1"
            >
              Settings → Contact <ChevronRight size={14} />
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}