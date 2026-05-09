"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink, AlertTriangle, ShieldCheck, Database } from "lucide-react";
import { useEffect } from "react";
import { useTheme } from "@/theme/ThemeProvider"; // 🔥 Import the theme provider

export default function TermsPage() {
  const router = useRouter();
  const { isDarkMode } = useTheme(); // 🔥 Consume theme state

  // Enable smooth scrolling on the page
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);


  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 relative">
      
      {/* 🚀 STICKY HEADER & ANCHOR NAVIGATION */}
      <div className={`sticky top-6 z-10 backdrop-blur rounded-xl pt-3 pb-5 border shadow-[0_4px_20px_-15px_rgba(0,0,0,0.15)] -mx-4 sm:-mx-6 px-4 sm:px-6 transition-colors duration-300 ${
        isDarkMode ? "bg-[#0a0a0a]/80 border-gray-800" : "bg-[#FAFAFA]/80 border-gray-200/60 supports-[backdrop-filter]:bg-white/70"
      }`}>
        {/* Breadcrumb Navigation */}
        <div className={`flex items-center text-sm mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          <span onClick={() => router.push("/settings")} className={`cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
            Settings
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span onClick={() => router.push("/settings/account-management")} className={`cursor-pointer transition-colors ${isDarkMode ? "hover:text-white" : "hover:text-black"}`}>
            Account Management
          </span>
          <ChevronRight size={14} className="mx-2" />
          <span className={`font-medium ${isDarkMode ? "text-white" : "text-black"}`}>Terms</span>
        </div>

        {/* Title */}
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>Terms & Conditions</h1>
        </div>
      </div>

      {/* META INFO SECTION */}
      <div className="mt-6 mb-10 px-1">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
          <div>
            <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Version:</span>{" "}
            <span className={`font-mono px-1.5 py-0.5 rounded ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-200 text-gray-700"}`}>
              terms_v2_compliance
            </span>
          </div>
          <div>
            <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Last Updated:</span>{" "}
            April 2026
          </div>
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      <div className={`space-y-14 md:space-y-16 text-sm leading-relaxed md:leading-loose mt-8 px-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>

        {/* 1 */}
        <section id="acceptance" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>1. Acceptance of Terms</h2>
          <p>
            By accessing or using NexTask, you agree to be bound by these Terms & Conditions. 
            If you do not agree, you must not use the service.
          </p>
        </section>

        {/* 2 */}
        <section id="description" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>2. Description of Service</h2>
          <p>
            This platform provides productivity tools, task management, and personal dashboard features. 
            We may update, modify, or discontinue features at any time without prior notice.
          </p>
        </section>

        {/* 3. PLATFORM FEATURES */}
        <section id="features" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>
            3. Platform Features & Usage
          </h2>
          <p>This platform provides tools including, but not limited to:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Task management and tracking</li>
            <li>Notes and document creation</li>
            <li>File and folder organization</li>
            <li>Personal diary entries</li>
            <li>Calendar and planning features</li>
          </ul>
          <p className={`mt-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>By using these features, you agree that:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>You are strictly responsible for the content you create, store, and upload.</li>
            <li>You will not store illegal, harmful, highly sensitive (e.g., unencrypted passwords), or abusive content.</li>
            <li>You understand that data is stored digitally and may be subject to technical limitations or disruptions.</li>
          </ul>
        </section>

        {/* 4 */}
        <section id="accounts" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>4. User Accounts</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li>You must provide accurate and complete information upon registration.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are fully responsible for all activity occurring under your account.</li>
          </ul>
        </section>

        {/* 5. THIRD PARTY AUTHENTICATION */}
        <section id="third-party" className={`pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 md:space-y-4 p-6 rounded-xl border ${isDarkMode ? "bg-[#111111] border-gray-800" : "bg-gray-50 border-gray-200"}`}>
            <h2 className={`text-base font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>
              5. Third-Party Authentication
            </h2>
            <p>Our platform allows login via Google, GitHub, and Facebook. By using these services:</p>
            <ul className="list-disc ml-5 space-y-2 mt-2">
              <li>You authorize us to access basic profile info (name, email, avatar).</li>
              <li>We do <strong>NOT</strong> store your passwords. Authentication is handled securely by the provider.</li>
              <li><strong>Deleting your NexTask account does not automatically delete your account with Google, GitHub, or Facebook.</strong></li>
            </ul>
            
            <p className={`mt-4 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>Your use of these services is also governed by their respective policies:</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 hover:underline ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}>
                Google Terms <ExternalLink size={12} />
              </a>
              <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 hover:underline ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}>
                GitHub Terms <ExternalLink size={12} />
              </a>
              <a href="https://www.facebook.com/legal/terms" target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 hover:underline ${isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}>
                Facebook Terms <ExternalLink size={12} />
              </a>
            </div>
            
            <p className={`mt-4 text-xs italic leading-snug ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              We are not responsible for provider downtime, account bans from third-party platforms, or changes in their APIs/policies.
            </p>
            
            <p className={`mt-2 text-xs italic leading-snug ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
              If you delete your NexTask account, your connection with Google, GitHub, or Facebook will be removed. 
              However, you may need to manage or revoke access permissions directly from your respective provider account settings.
            </p>
          </div>
        </section>

        {/* 6. CONTENT OWNERSHIP */}
        <section id="ownership" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>6. User Content Ownership</h2>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong>You retain full ownership</strong> of all content you create (tasks, notes, files, diary entries).</li>
            <li>We do not claim ownership, copyright, or exclusive rights over your personal data.</li>
            <li>You grant us a limited permission to store, process, and display your data <strong>only</strong> to provide you with the NexTask service.</li>
          </ul>
        </section>

        {/* 7 */}
        <section id="responsibilities" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>7. User Responsibilities</h2>
          <p>You agree <strong>NOT</strong> to:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Use the platform for any unlawful or unauthorized purpose.</li>
            <li>Attempt hacking, reverse engineering, or scraping the system.</li>
            <li>Upload malware, viruses, or disruptive code.</li>
          </ul>
        </section>

        {/* 8. FAIR USAGE */}
        <section id="fair-use" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>8. Fair Usage Policy</h2>
          <p>To ensure a fast and stable experience for all users, you agree not to:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Upload excessively large files that bypass our intended storage limits or affect system performance.</li>
            <li>Spam notes, tasks, or diary entries in a way that abuses database resources.</li>
            <li>Use automated scripts, bots, or unofficial APIs to overload the system.</li>
          </ul>
          <p className={`mt-2 italic text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Accounts violating the fair usage policy may be rate-limited or temporarily suspended.</p>
        </section>

        {/* 9. PRIVACY HIGHLIGHT */}
        <section id="privacy" className={`pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 md:space-y-4 p-6 rounded-xl border ${isDarkMode ? "bg-blue-950/20 border-blue-900/30" : "bg-blue-50/50 border-blue-100"}`}>
            <h2 className={`text-base font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? "text-blue-400" : "text-blue-900"}`}>
              <ShieldCheck size={18} className={isDarkMode ? "text-blue-500" : "text-blue-600"} />
              9. Data Usage & Privacy
            </h2>
            <ul className={`list-disc ml-5 space-y-2 ${isDarkMode ? "text-blue-200/80" : "text-blue-800/80"}`}>
              <li>Your data is used <strong>strictly</strong> to operate and improve your NexTask experience.</li>
              <li>We do <strong>NOT</strong> and will never sell your personal data or notes to third-party marketers.</li>
              <li>Data handling is explained in full detail in our Privacy Policy.</li>
            </ul>
          </div>
        </section>

        {/* 10. DATA RISK DISCLAIMER */}
        <section id="data-risk" className={`pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 md:space-y-4 p-6 rounded-xl border ${isDarkMode ? "bg-amber-950/20 border-amber-900/30" : "bg-amber-50 border-amber-200"}`}>
            <h2 className={`text-base font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? "text-amber-500" : "text-amber-900"}`}>
              <Database size={18} className={isDarkMode ? "text-amber-500" : "text-amber-600"} />
              10. Data Storage & Risk Disclaimer
            </h2>
            <p className={`font-medium ${isDarkMode ? "text-amber-200/90" : "text-amber-800/90"}`}>While we take reasonable industry-standard measures to protect and secure your data, we cannot guarantee absolute zero data loss.</p>
            <ul className={`list-disc ml-5 space-y-2 mt-2 ${isDarkMode ? "text-amber-200/80" : "text-amber-800/80"}`}>
              <li><strong>You are strictly responsible</strong> for maintaining independent backups of your highly important notes, files, or tasks.</li>
              <li>We are not financially or legally liable for the accidental loss, corruption, or deletion of notes, files, or tasks due to system failures, server crashes, or account termination.</li>
            </ul>
          </div>
        </section>

        {/* 11 */}
        <section id="security" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>11. Account Security</h2>
          <p>
            You are responsible for protecting your login credentials. 
            We are not liable for unauthorized access to your diary, files, or tasks caused by your negligence (e.g., sharing passwords or leaving devices unlocked).
          </p>
        </section>

        {/* 12 */}
        <section id="availability" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>12. Service Availability</h2>
          <p>
            We aim for high uptime but do not guarantee uninterrupted service. Downtime may occur due to scheduled maintenance, major updates, or unexpected server issues.
          </p>
        </section>

        {/* 13 */}
        <section id="termination" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>13. Termination</h2>
          <p>
            We reserve the right to suspend or terminate accounts immediately, without prior notice, if these terms are severely violated or if we detect harmful, bot-driven activity.
          </p>
        </section>

        {/* 14. LIABILITY HIGHLIGHT */}
        <section id="liability" className={`pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <div className={`space-y-3 md:space-y-4 p-6 rounded-xl border ${isDarkMode ? "bg-red-950/20 border-red-900/30" : "bg-red-50 border-red-100"}`}>
            <h2 className={`text-base font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? "text-red-400" : "text-red-900"}`}>
              <AlertTriangle size={18} className={isDarkMode ? "text-red-500" : "text-red-600"} />
              14. Limitation of Liability
            </h2>
            <p className={isDarkMode ? "text-red-200/80" : "text-red-800/80"}>To the maximum extent permitted by law, NexTask and its creators shall not be liable for any:</p>
            <ul className={`list-disc ml-5 space-y-2 ${isDarkMode ? "text-red-200/80" : "text-red-800/80"}`}>
              <li>Loss of data, notes, or uploaded files.</li>
              <li>Loss of business, productivity, or revenue.</li>
              <li>Indirect, incidental, or consequential damages arising from your use of or inability to use the platform.</li>
            </ul>
          </div>
        </section>

        {/* 15 */}
        <section id="ip" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>15. Intellectual Property</h2>
          <p>
            While you own your content, the NexTask application itself—including its design, code, architecture, and UI/UX—belongs to the application owner. 
            You may not copy, reproduce, reverse engineer, or distribute our platform's code or design without explicit written permission.
          </p>
        </section>

        {/* 16 */}
        <section id="governing-law" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>16. Governing Law</h2>
          <p>
            These Terms shall be governed by and interpreted in accordance with the laws of <strong>India</strong>. Any disputes arising from the use of this platform shall be subject to the exclusive jurisdiction of the courts located in India.
          </p>
        </section>

        {/* 17 */}
        <section id="changes" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>17. Changes to Terms</h2>
          <p>
            We may update these terms periodically to reflect new features or legal requirements. Continued use of the service after modifications constitutes your absolute acceptance of the updated terms.
          </p>
        </section>

        {/* 18 */}
        <section id="contact" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>18. Contact</h2>
          <p>For support, legal inquiries, or data-related requests, you can reach us via:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>The dedicated <span onClick={() => router.push("/settings/contact")} className={`hover:underline cursor-pointer font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>Contact Page</span> in your settings.</li>
            <li>The "Provide Feedback" module located in the app sidebar.</li>
          </ul>
        </section>

        {/* 19. ACCOUNT DELETION & DATA REMOVAL */}
        <section id="account-deletion" className={`space-y-3 md:space-y-4 pb-6 border-b last:border-none scroll-mt-32 ${isDarkMode ? "border-gray-800" : "border-gray-100"}`}>
          <h2 className={`text-base font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-black"}`}>
            19. Account Deletion & Data Removal
          </h2>

          <p>
            You have the right to permanently delete your account at any time from the Account Management settings.
          </p>

          <ul className="list-disc ml-5 space-y-2">
            <li>
              Upon deletion, all your personal data including tasks, notes, files, folders, and diary entries will be permanently removed from active systems.
            </li>
            <li>
              Your profile information such as name, email, and profile image will be deleted.
            </li>
            <li>
              This action is <strong>irreversible</strong> and cannot be undone.
            </li>
          </ul>

          <p className={`mt-2 font-medium ${isDarkMode ? "text-gray-300" : "text-gray-800"}`}>
            Data Retention:
          </p>

          <ul className="list-disc ml-5 space-y-2">
            <li>
              Backup systems may retain data for up to <strong>30 days</strong> before complete removal.
            </li>
            <li>
              Limited system logs may be retained for security, fraud prevention, and legal compliance.
            </li>
          </ul>

          <p className="mt-2">
            You can delete your account via:
          </p>

          <ul className="list-disc ml-5 space-y-2">
            <li>Settings → Account Management → Delete Account</li>
            <li>
              Or by contacting support through the{" "}
              <span
                onClick={() => router.push("/settings/contact")}
                className={`hover:underline cursor-pointer font-medium ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
              >
                Contact Page
              </span>
            </li>
          </ul>
        </section>

      </div>
    </div>
  );
}