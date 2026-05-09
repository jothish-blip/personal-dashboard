"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, ShieldCheck, Database, AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Import the theme provider

export default function PrivacyPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme(); // 🔥 Consume theme state

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 relative">
      
      {/* 🔹 STICKY HEADER */}
      <div className={`sticky top-4 z-10 backdrop-blur rounded-xl pt-3 pb-5 border shadow-[0_4px_20px_-15px_rgba(0,0,0,0.15)] -mx-4 sm:-mx-6 px-4 sm:px-6 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0a0a0a]/80 border-gray-800" : "bg-[#FAFAFA]/90 border-gray-200/60 supports-[backdrop-filter]:bg-white/70"
      }`}>
        
        {/* Breadcrumb */}
        <div className={`flex items-center text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <span onClick={() => router.push("/settings")} className={`cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
            Settings
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span onClick={() => router.push("/settings/account-management")} className={`cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
            Account Management
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className={`font-medium ${isDarkMode ? "text-white" : "text-black"}`}>Privacy Policy</span>
        </div>

        {/* Title */}
        <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Privacy Policy
        </h1>
      </div>

      {/* 🔹 META INFO */}
      <div className="mt-6 mb-10 px-1">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
          <div>
            <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Version:</span>{" "}
            <span className={`font-mono px-1.5 py-0.5 rounded ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"}`}>
              privacy_v1
            </span>
          </div>
          <div>
            <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Last Updated:</span>{" "}
            April 2026
          </div>
        </div>
      </div>

      {/* 🔹 CONTENT */}
      <div className={`space-y-14 md:space-y-16 text-sm leading-relaxed md:leading-loose mt-8 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>

        {/* 1 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>1. Introduction</h2>
          <p>
            This Privacy Policy explains how NexTask collects, uses, and protects your information 
            when you use the platform, including tasks, notes, files, diary, and planner features.
          </p>
        </section>

        {/* 2 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>2. Information We Collect</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li>Basic profile data (name, email, avatar)</li>
            <li>Tasks, notes, files, folders, and diary content</li>
            <li>Usage data (how you interact with the app)</li>
            <li>Device and browser information</li>
          </ul>
        </section>

        {/* 3 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>3. How We Use Your Data</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li>To provide and operate the platform</li>
            <li>To sync your data across devices</li>
            <li>To improve features and performance</li>
            <li>To provide support and resolve issues</li>
          </ul>
        </section>

        {/* 4. Third-Party Auth & OAuth Compliance */}
        <section className={`pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-4 p-6 rounded-xl border ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-50 border-gray-200"}`}>
            <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>4. Third-Party Authentication & OAuth</h2>
            <p>You may sign in using Google, GitHub, or Facebook.</p>
            
            <p className={`mt-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>When using third-party authentication:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>We only access basic profile information (name, email, avatar).</li>
              <li>We do <strong>not</strong> access your passwords or private account data.</li>
              <li>Authentication is handled securely by the provider.</li>
              <li>We do not store sensitive authentication tokens beyond what is required for active login sessions.</li>
            </ul>

            <p className={`mt-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>Third-Party Services Disclaimer:</p>
            <ul className="list-disc ml-5 space-y-2">
              <li>Our platform relies on these providers for authentication, and your use is governed by their respective policies.</li>
              <li>We are <strong>not</strong> responsible for service outages or downtime from these providers.</li>
              <li>We are <strong>not</strong> responsible for account suspensions, restrictions, or bans imposed by them.</li>
              <li>We are not liable for changes in their APIs, policies, or data practices.</li>
            </ul>
          </div>
        </section>

        {/* 5 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>5. Data Storage</h2>
          <p>
            Your data (tasks, notes, files, diary entries) is securely stored in our backend systems. 
            We implement reasonable technical and organizational safeguards to protect your information.
          </p>
        </section>

        {/* 6 */}
        <section className={`pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 p-6 rounded-xl border ${isDarkMode ? "bg-blue-950/20 border-blue-900/30" : "bg-blue-50/50 border-blue-100"}`}>
            <h2 className={`text-base font-semibold flex items-center gap-2 ${isDarkMode ? "text-blue-400" : "text-blue-900"}`}>
              <ShieldCheck size={18} className={isDarkMode ? "text-blue-500" : "text-blue-600"} />
              6. Data Protection
            </h2>
            <ul className={`list-disc ml-5 space-y-2 ${isDarkMode ? "text-blue-200/80" : "text-blue-800/90"}`}>
              <li>Your data is encrypted and securely stored.</li>
              <li>We do <strong>NOT</strong> sell your personal data to anyone.</li>
              <li>Access to your data is restricted and protected.</li>
            </ul>
          </div>
        </section>

        {/* 7 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>7. Data Sharing</h2>
          <p>
            We do not sell or share your personal data with third parties, except in the following limited circumstances:
          </p>
          <ul className="list-disc ml-5 space-y-2">
            <li>When legally required by law enforcement or court order.</li>
            <li>To protect our system security and investigate fraud.</li>
          </ul>
        </section>

        {/* 8. Data Retention */}
        <section className={`pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 p-6 rounded-xl border ${isDarkMode ? "bg-amber-950/20 border-amber-900/30" : "bg-amber-50 border-amber-200"}`}>
            <h2 className={`text-base font-semibold flex items-center gap-2 ${isDarkMode ? "text-amber-500" : "text-amber-900"}`}>
              <Database size={18} className={isDarkMode ? "text-amber-500" : "text-amber-600"} />
              8. Data Retention & Risk
            </h2>
            <p className={isDarkMode ? "text-amber-200/80" : "text-amber-900/80"}>We retain your data as long as your account remains active.</p>
            
            <p className={`mt-4 font-medium ${isDarkMode ? "text-amber-300" : "text-amber-900"}`}>After account deletion:</p>
            <ul className={`list-disc ml-5 space-y-2 ${isDarkMode ? "text-amber-200/80" : "text-amber-800/90"}`}>
              <li>Your personal data is deleted immediately from active systems.</li>
              <li>Encrypted backup data may persist for up to <strong>30 days</strong> before permanent removal.</li>
            </ul>

            <p className={`mt-4 font-medium ${isDarkMode ? "text-amber-300" : "text-amber-900"}`}>We may retain limited logs for:</p>
            <ul className={`list-disc ml-5 space-y-2 ${isDarkMode ? "text-amber-200/80" : "text-amber-800/90"}`}>
              <li>Security monitoring and debugging</li>
              <li>Fraud prevention</li>
              <li>Legal compliance</li>
            </ul>
          </div>
        </section>

        {/* 9 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>9. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Access and review your data</li>
            <li>Edit, modify, or delete specific data entries</li>
            <li>Request a full and permanent account deletion</li>
          </ul>
        </section>

        {/* 10. Account Deletion */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>10. Account Deletion & Data Removal</h2>
          <p>You have the absolute right to permanently delete your account at any time.</p>
          
          <p className={`mt-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>When you delete your account:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>All your personal data including tasks, notes, files, folders, and diary entries will be permanently deleted.</li>
            <li>Your profile information (name, email, avatar) will be purged from our systems.</li>
            <li><strong>This action is completely irreversible.</strong></li>
          </ul>

          <p className={`mt-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>Data Retention Limits:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Some minimal system logs (strictly for security/legal purposes) may be retained temporarily.</li>
            <li>Offline backup systems may retain encrypted fragments for up to 30 days before complete automatic deletion.</li>
          </ul>

          <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-50 border-gray-200"}`}>
            <p className={`font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>How to delete your account:</p>
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Navigate to <span className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>Settings → Account Management → Delete Account</span>. Alternatively, you can initiate a deletion request through our Contact page.
            </p>
          </div>
        </section>

        {/* 11 */}
        <section className={`pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 p-6 rounded-xl border ${isDarkMode ? "bg-red-950/20 border-red-900/30" : "bg-red-50 border-red-100"}`}>
            <h2 className={`text-base font-semibold flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-900"}`}>
              <AlertTriangle size={18} className={isDarkMode ? "text-red-500" : "text-red-600"} />
              11. Limitation of Security
            </h2>
            <p className={isDarkMode ? "text-red-200/80" : "text-red-800/90"}>
              While we take strong, industry-standard security measures, no system is impenetrable. We cannot guarantee the absolute security of your data against highly sophisticated attacks or breaches resulting from compromised user credentials.
            </p>
          </div>
        </section>

        {/* 12 */}
        <section className={`space-y-3 pb-6 border-b last:border-none ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>12. Changes to Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. Continued use of the platform after changes are posted means you accept the updated policy.
          </p>
        </section>

        {/* 13 */}
        <section className="space-y-3">
          <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-200" : "text-black"}`}>13. Contact</h2>
          <p>
            For any privacy-related concerns, data inquiries, or account deletion requests, please visit:
          </p>
          <div className="mt-2">
            <span 
              onClick={() => router.push("/settings/contact")}
              className={`hover:underline cursor-pointer font-medium inline-flex items-center gap-1 ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
            >
              Settings → Contact <ChevronRight size={14} />
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}