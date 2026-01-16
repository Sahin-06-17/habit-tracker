import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // <--- 1. Import this
import Dashboard from "./pages/Dashboard";
import AddHabit from "./pages/AddHabit";

// 2. Create the "Brain" outside the component
const queryClient = new QueryClient();

export default function App() {
  return (
    // 3. Wrap EVERYTHING in the Provider
    <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-[#0f172a] text-white font-display">
            {/* Navbar */}
            <header className="p-6 flex justify-between items-center max-w-lg mx-auto">
                <h1 className="font-bold text-xl tracking-tight">StreakBuilder</h1>
                <div>
                    <SignedOut>
                        <SignInButton className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold transition text-sm" />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </div>
            </header>

            <main>
                <SignedOut>
                    <div className="text-center mt-32 px-6">
                        <div className="inline-block p-4 rounded-full bg-white/5 mb-6">
                            <span className="text-4xl">🔥</span>
                        </div>
                        <h2 className="text-4xl font-black mb-4">Don't break the chain.</h2>
                        <p className="text-slate-400 mb-8 text-lg">The simple way to build habits that stick.</p>
                        <SignInButton className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition shadow-xl shadow-indigo-500/20" />
                    </div>
                </SignedOut>

                <SignedIn>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/add" element={<AddHabit />} />
                    </Routes>
                </SignedIn>
            </main>
        </div>
    </QueryClientProvider>
  );
}