"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Star, Loader2, CheckCircle2, X, Heart } from "lucide-react";

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  1: { text: "Very Bad", emoji: "😡" },
  2: { text: "Needs Improvement", emoji: "😕" },
  3: { text: "Okay", emoji: "😐" },
  4: { text: "Good", emoji: "🙂" },
  5: { text: "Excellent", emoji: "🔥" },
};

export default function FeedbackPage({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const supabase = getSupabaseClient();

  // State
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🔥 New state to show the emotional plea before closing
  const [showPlea, setShowPlea] = useState(false);

  // Load User Data
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }
      }
    };
    fetchUser();
  }, [supabase]);

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted || showPlea) return;
      
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        setRating(Number(e.key));
        setErrorMsg(null);
      }
      
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rating, message, selectedChips, submitted, showPlea]);

  const getPrompt = () => {
    if (!rating) return "Tell us what you think...";
    if (rating <= 2) return "What went wrong? Tell us honestly.";
    if (rating === 3) return "What could we do better?";
    return "What did you like the most?";
  };

  const getChips = () => {
    if (!rating) return [];
    if (rating <= 3) return ["Confusing UI", "Too slow", "Missing features", "Bugs"];
    return ["Love the design", "Very fast", "Easy to use", "Great features"];
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) => 
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  // 🔥 Completely exits the feedback UI (goes back or closes modal)
  const handleFinalClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back(); // Goes back to the previous page instead of hardcoded Dashboard
    }
  };

  // 🔥 Triggers when the user first clicks Skip/Close
  const handleAttemptClose = () => {
    if (!rating && !message && !showPlea) {
      // If they haven't typed anything, show the plea
      setShowPlea(true);
    } else {
      // If they already left feedback or already saw the plea, close it.
      handleFinalClose();
    }
  };

  const handleSubmit = async () => {
    if (!rating) {
      setErrorMsg("Please select a rating first.");
      return;
    }
    if (rating <= 3 && !message && selectedChips.length === 0) {
      setErrorMsg("Please tell us a bit more so we can improve.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (!userId) throw new Error("User not found");

      const finalMessage = selectedChips.length > 0 
        ? `[Tags: ${selectedChips.join(", ")}] ${message}` 
        : message;

      const { error: insertError } = await supabase
        .from("feedbacks")
        .insert([
          {
            user_id: userId,
            rating,
            message: finalMessage,
          },
        ]);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("user_feedback_status")
        .update({ feedback_given: true })
        .eq("user_id", userId);

      if (updateError) console.error(updateError);

      setSubmitted(true);
      
      // Auto-dismiss cleanly after 3 seconds on success
      setTimeout(() => {
        handleFinalClose();
      }, 3000);

    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-end justify-center md:justify-end bg-black/20 backdrop-blur-sm transition-all duration-300">
      
      <div className="w-full md:w-[400px] bg-white md:m-6 rounded-t-3xl md:rounded-2xl shadow-[0_-8px_30px_rgb(0,0,0,0.08)] md:shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300 ease-out">
        
        {/* Header / Skip */}
        <div className="flex justify-between items-center p-5 pb-2">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto md:hidden absolute left-1/2 -translate-x-1/2 top-3" />
          <h2 className="text-lg font-bold text-gray-900 tracking-tight mt-2 md:mt-0">
            {!submitted && !showPlea ? "How are we doing?" : ""}
          </h2>
          {!submitted && (
            <button 
              onClick={handleAttemptClose}
              className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors px-2 py-1 rounded-md hover:bg-gray-50 flex items-center gap-1"
            >
              Skip
              <X size={14} />
            </button>
          )}
        </div>

        <div className="px-6 pb-6 space-y-5">
          {submitted ? (
            /* Success State */
            <div className="text-center py-6 animate-in zoom-in-95 duration-500 fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center scale-110 shadow-sm border border-emerald-100">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Thanks{userName ? `, ${userName}` : ""}! 🙌
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                You just helped improve NexTask 🚀
              </p>
            </div>
          ) : showPlea ? (
            /* 🔥 Emotional Plea State */
            <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                  <Heart size={28} className="text-red-400 fill-red-100" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Wait, please? 🥺</h3>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                Your feedback is the heartbeat of NexTask. It only takes a few seconds, but it helps us tremendously to build a better experience for you.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={() => setShowPlea(false)}
                  className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-md"
                >
                  Okay, I'll help out
                </button>
                <button
                  onClick={handleFinalClose}
                  className="w-full text-gray-400 hover:text-gray-700 py-2.5 text-sm font-medium transition-colors"
                >
                  No, skip for real
                </button>
              </div>
            </div>
          ) : (
            /* Standard Rating UI */
            <>
              {/* ⭐ Rating Stars */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isActive = (hoveredRating || rating || 0) >= num;
                    return (
                      <button
                        key={num}
                        onMouseEnter={() => setHoveredRating(num)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => {
                          setRating(num);
                          setErrorMsg(null);
                        }}
                        className="p-1 transition-transform duration-200 hover:scale-125 active:scale-95"
                      >
                        <Star 
                          size={36} 
                          fill={isActive ? "#fbbf24" : "transparent"} 
                          className={`transition-all duration-200 ${isActive ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-gray-200 hover:text-gray-300"}`}
                          strokeWidth={1.5} 
                        />
                      </button>
                    );
                  })}
                </div>
                
                {/* Dynamic Label */}
                <div className="h-6 flex items-center justify-center text-sm font-medium animate-in fade-in duration-200">
                  {rating || hoveredRating ? (
                    <span className="text-gray-700 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 flex items-center gap-2">
                      {RATING_LABELS[hoveredRating || rating!].emoji} 
                      {RATING_LABELS[hoveredRating || rating!].text}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Tap a star to rate</span>
                  )}
                </div>
              </div>

              {/* Reveal Input & Chips if Rating is Selected */}
              {rating && (
                <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  
                  {/* Chips */}
                  <div className="flex flex-wrap gap-2">
                    {getChips().map((chip) => (
                      <button
                        key={chip}
                        onClick={() => toggleChip(chip)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 font-medium ${
                          selectedChips.includes(chip) 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* 💬 Message */}
                  <div className="relative">
                    <textarea
                      placeholder={getPrompt()}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl p-3.5 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none shadow-inner"
                      rows={3}
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 font-medium">
                      Press <kbd className="bg-gray-200 px-1 py-0.5 rounded text-gray-600">Cmd</kbd> + <kbd className="bg-gray-200 px-1 py-0.5 rounded text-gray-600">Enter</kbd>
                    </div>
                  </div>

                  {/* Error Message */}
                  {errorMsg && (
                    <div className="text-red-500 text-xs font-medium bg-red-50 p-2 rounded-md border border-red-100 flex items-center gap-2 animate-in fade-in">
                      <X size={14} />
                      {errorMsg}
                    </div>
                  )}

                  {/* 🚀 Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Submit Feedback"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}