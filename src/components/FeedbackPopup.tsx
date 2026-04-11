"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { Star, Loader2, CheckCircle2, X, Heart } from "lucide-react";

const RATING_LABELS: Record<number, { text: string; emoji: string }> = {
  1: { text: "Very Bad", emoji: "😡" },
  2: { text: "Needs Improvement", emoji: "😕" },
  3: { text: "Okay", emoji: "😐" },
  4: { text: "Good", emoji: "🙂" },
  5: { text: "Excellent", emoji: "🔥" },
};

export default function FeedbackPopup({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const supabase = getSupabaseClient();

  // State
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPlea, setShowPlea] = useState(false);

  // Keyboard Support (Cmd+Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitted || showPlea) return;
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rating, message, selectedChips, submitted, showPlea]);

  const getPrompt = () => {
    if (!rating) return "How was your experience?";
    if (rating <= 2) return "What went wrong? Tell us honestly.";
    if (rating === 3) return "What could we do better?";
    return "What did you like the most?";
  };

  const getChips = () => {
    if (!rating) return [];
    if (rating <= 3) return ["Confusing UI", "Too slow", "Bugs", "Missing features"];
    return ["Love the design", "Very fast", "Easy to use", "Great features"];
  };

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleAttemptClose = () => {
    if (!rating && !message && !showPlea) {
      setShowPlea(true);
    } else {
      onClose();
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
      const finalMessage = selectedChips.length > 0 
        ? `[Tags: ${selectedChips.join(", ")}] ${message}` 
        : message;

      const { error: insertError } = await supabase
        .from("feedbacks")
        .insert([{ user_id: userId, rating, message: finalMessage }]);

      if (insertError) throw insertError;

      await supabase
        .from("user_feedback_status")
        .update({ feedback_given: true })
        .eq("user_id", userId);

      setSubmitted(true);
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] w-[90vw] md:w-[380px] animate-in slide-in-from-bottom-8 duration-300 ease-out">
      <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 pb-2">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            {!submitted && !showPlea ? "Quick Feedback" : ""}
          </h2>
          {!submitted && (
            <button 
              onClick={handleAttemptClose}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-50 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-6 pb-6">
          {submitted ? (
            /* Success State */
            <div className="text-center py-6 animate-in zoom-in-95 duration-500 fade-in">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm border border-emerald-100">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                </div>
              </div>
              <h1 className="text-lg font-bold text-gray-900">Thanks! 🙌</h1>
              <p className="text-xs text-gray-500 mt-1 font-medium">Your feedback makes NexTask better.</p>
            </div>
          ) : showPlea ? (
            /* Emotional Plea State */
            <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100">
                  <Heart size={24} className="text-red-400 fill-red-100" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Wait, please? 🥺</h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                It only takes a few seconds, but your feedback is the heartbeat of our growth.
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={() => setShowPlea(false)}
                  className="w-full bg-black text-white py-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] shadow-md"
                >
                  Okay, I'll help
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-gray-400 hover:text-gray-600 py-2 text-xs font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            /* Standard Rating UI */
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isActive = (hoveredRating || rating || 0) >= num;
                    return (
                      <button
                        key={num}
                        onMouseEnter={() => setHoveredRating(num)}
                        onMouseLeave={() => setHoveredRating(null)}
                        onClick={() => { setRating(num); setErrorMsg(null); }}
                        className="p-1 transition-transform duration-200 hover:scale-110 active:scale-90"
                      >
                        <Star 
                          size={32} 
                          fill={isActive ? "#fbbf24" : "transparent"} 
                          className={`transition-all duration-200 ${isActive ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" : "text-gray-200"}`}
                          strokeWidth={1.5} 
                        />
                      </button>
                    );
                  })}
                </div>
                
                <div className="h-6">
                  {rating || hoveredRating ? (
                    <span className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 flex items-center gap-2">
                      {RATING_LABELS[hoveredRating || rating!].emoji} 
                      {RATING_LABELS[hoveredRating || rating!].text}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Rate your experience</span>
                  )}
                </div>
              </div>

              {rating && (
                <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                  <div className="flex flex-wrap gap-1.5">
                    {getChips().map((chip) => (
                      <button
                        key={chip}
                        onClick={() => toggleChip(chip)}
                        className={`text-[10px] px-2.5 py-1.5 rounded-full border transition-all font-bold ${
                          selectedChips.includes(chip) 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <textarea
                      placeholder={getPrompt()}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl p-3 text-xs outline-none focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black transition-all resize-none shadow-inner min-h-[80px]"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-red-500 text-[10px] font-bold bg-red-50 p-2 rounded-lg border border-red-100 flex items-center gap-2">
                      <X size={12} /> {errorMsg}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 text-white py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg flex justify-center items-center gap-2"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : "Send Feedback"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}