"use client";

import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export default function FeedbackPopup({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      alert("Please select rating");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();

    try {
      // insert feedback
      await supabase.from("feedbacks").insert({
        user_id: userId,
        rating,
        message,
      });

      // stop future prompts
      await supabase
        .from("user_feedback_status")
        .update({ feedback_given: true })
        .eq("user_id", userId);

      onClose();
    } catch (err) {
      console.error(err);
      alert("Error submitting feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white shadow-xl border rounded-xl p-4 z-50 space-y-4">
      
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold">Quick Feedback</h2>
        <button onClick={onClose} className="text-gray-400">✕</button>
      </div>

      {/* ⭐ Rating */}
      <div className="flex gap-2 justify-center">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            className={`text-xl ${
              rating && n <= rating ? "text-yellow-500" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {/* 💬 Message */}
      <textarea
        placeholder="Your thoughts..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full border rounded-md p-2 text-sm"
        rows={3}
      />

      {/* 🚀 Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded-md text-sm"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}