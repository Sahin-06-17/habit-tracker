import { Check, Flame, Snowflake } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { checkInHabit, useStreakFreeze } from "../api";
import { useState } from "react";
import clsx from "clsx";

export default function HabitCard({ habit }) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);

  // 👇 FIX IS HERE: Destructure the correct property names from the 'habit' prop
  const { 
    id, 
    title, 
    currentStreak, 
    completedToday, // <--- Use this name
    missedYesterday 
  } = habit;

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return checkInHabit(id, token);
    },
    onSuccess: () => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
      queryClient.invalidateQueries(["habits"]);
    },
  });

 const freezeMutation = useMutation({
    mutationFn: async () => {
        const token = await getToken();
        return useStreakFreeze(id, token);
    },
    onSuccess: () => {
        queryClient.invalidateQueries(["habits"]);
        queryClient.invalidateQueries(["userStats"]); // Update the counter in header
        alert("Streak Saved! You used 1 Freeze.");
    },
    onError: (err) => {
        // This grabs the error message from the backend ("Not enough freezes!")
        alert(err.response?.data?.error || "Failed to freeze");
    }
  });

  return (
    <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div 
            className={clsx(
                "h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all",
                // 👇 UPDATE: Check 'completedToday' instead of 'isCompletedToday'
                completedToday ? "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]" : "bg-white/5 text-slate-500"
            )}
        >
          {title.charAt(0)}
        </div>
        
        <div>
          <h3 className={clsx("font-bold text-lg", completedToday ? "text-white" : "text-slate-200")}>
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Flame size={14} className={clsx(currentStreak > 0 ? "text-orange-500 fill-orange-500" : "text-slate-600")} />
            <span className={clsx(currentStreak > 0 && "text-orange-400")}>{currentStreak} day streak</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Streak Freeze Button (Only shows if missed yesterday) */}
        {missedYesterday && !completedToday && (
            <button
                onClick={() => freezeMutation.mutate()}
                className="p-3 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition"
                title="Use Streak Freeze"
            >
                <Snowflake size={20} />
            </button>
        )}

        {/* Check In Button */}
        <button
          onClick={() => checkInMutation.mutate()}
          disabled={completedToday || checkInMutation.isPending}
          className={clsx(
            "p-3 rounded-xl transition-all active:scale-95 relative overflow-hidden",
            completedToday 
              ? "bg-green-500/20 text-green-400 cursor-default" 
              : "bg-white/5 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30"
          )}
        >
            {/* Animation Ping */}
            {isAnimating && <span className="absolute inset-0 bg-green-400/30 animate-ping rounded-xl" />}
            
            <Check size={24} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}