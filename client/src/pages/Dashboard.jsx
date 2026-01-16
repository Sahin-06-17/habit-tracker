import { useAuth, useUser } from "@clerk/clerk-react"; // <--- Import hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHabits, getUserStats, watchAd } from "../api";
import HabitCard from "../components/HabitCard";
import { Link } from "react-router-dom";
import { Plus, Trophy, Snowflake, PlayCircle } from "lucide-react"; // <--- Import Icons

export default function Dashboard() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient(); // <--- Need this to refresh data

  // 1. Fetch User Stats (Freezes)
  const { data: stats } = useQuery({
    queryKey: ["userStats"],
    queryFn: async () => {
      const token = await getToken();
      return getUserStats(token);
    }
  });

  const { data: habits, isLoading } = useQuery({
    queryKey: ["habits"],
    queryFn: async () => {
      const token = await getToken();
      return getHabits(token);
    },
  });

  // 2. Mutation for "Watching Ad"
  const adMutation = useMutation({
    mutationFn: async () => {
        const token = await getToken();
        return watchAd(token);
    },
    onSuccess: () => {
        alert("Ad Watched! (Simulation)\nYou earned 1 Streak Freeze.");
        queryClient.invalidateQueries(["userStats"]); // Refresh the counter
    }
  });

  const totalStreak = habits?.reduce((acc, curr) => acc + curr.currentStreak, 0) || 0;

  return (
    <div className="max-w-lg mx-auto min-h-screen pb-24 px-6 pt-12">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
            Hi, {user?.firstName || "User"}
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Focus on the process.</p>
        </div>
        
        {/* STATS WIDGETS */}
        <div className="flex gap-2">
            
            {/* 1. Total Days */}
            <div className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl flex flex-col items-center min-w-[60px]">
                <Trophy size={16} className="text-yellow-400 mb-1" />
                <span className="text-lg font-bold leading-none">{totalStreak}</span>
            </div>

            {/* 2. Freeze Wallet (Click to buy) */}
            <button 
                onClick={() => adMutation.mutate()}
                disabled={adMutation.isPending}
                className="bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-xl flex flex-col items-center min-w-[60px] hover:bg-blue-500/20 transition active:scale-95"
            >
                <div className="flex items-center gap-1 mb-1">
                    <Snowflake size={16} className="text-blue-400" />
                    {adMutation.isPending && <PlayCircle size={10} className="animate-spin text-blue-400"/>}
                </div>
                <span className="text-lg font-bold leading-none text-blue-100">{stats?.freezes || 0}</span>
            </button>

        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
        </div>
      )}

      {/* Habits Grid */}
      <div className="space-y-4">
        {habits?.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
        
        {!isLoading && habits?.length === 0 && (
          <div className="text-center py-16 px-6 rounded-3xl border-2 border-dashed border-slate-700/50">
            <p className="text-slate-500 text-lg mb-2">Void.</p>
            <p className="text-slate-600 text-sm">Create a habit to begin your journey.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <Link 
          to="/add" 
          className="pointer-events-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40 hover:bg-indigo-500 hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-[#0f172a]"
        >
          <Plus className="text-white" size={32} strokeWidth={3} />
        </Link>
      </div>
    </div>
  );
}