import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react"; // <--- Import Clerk Hook
import { createHabit } from "../api";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function AddHabit() {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getToken } = useAuth(); // <--- Get the token function

  const mutation = useMutation({
    // Updated Logic: Get token first, then call API
    mutationFn: async (newHabitData) => {
      const token = await getToken();
      return createHabit(newHabitData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["habits"]);
      navigate("/");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate({ title });
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen p-6 pt-12">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-8 p-2 -ml-2 text-slate-400 hover:text-white transition flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back to Habits</span>
      </button>

      <h1 className="text-3xl font-extrabold text-white mb-2">New Goal</h1>
      <p className="text-slate-400 mb-8">What habit do you want to build?</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">
            Habit Name
          </label>
          <div className="relative group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 100 Pushups"
              className="w-full bg-white/5 border border-white/10 text-white text-xl p-5 rounded-2xl focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
              autoFocus
            />
            {/* Glow effect behind input */}
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity -z-10" />
          </div>
        </div>

        {/* Quick Suggestions */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Ideas
          </label>
          <div className="flex flex-wrap gap-3">
            {['Read 10 Pages', 'No Sugar', 'Code for 1h', 'Drink 3L Water', 'Morning Run'].map(suggestion => (
                <button 
                    key={suggestion}
                    type="button"
                    onClick={() => setTitle(suggestion)}
                    className="text-sm bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition active:scale-95"
                >
                    {suggestion}
                </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!title.trim() || mutation.isPending}
          className="w-full bg-indigo-600 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            "Creating..."
          ) : (
            <>
              <Sparkles size={20} className="fill-indigo-200 text-indigo-200" />
              Start Streak
            </>
          )}
        </button>
      </form>
    </div>
  );
}