import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "./components/AuthGuard";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import LogActivity from "./pages/LogActivity";
import Quests from "./pages/Quests";
import SpiritualHub from "./pages/SpiritualHub";
import Achievements from "./pages/Achievements";
import Parties from "./pages/Parties";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AreaDetail from "./pages/AreaDetail";
import Leaderboards from "./pages/Leaderboards";
import Challenges from "./pages/Challenges";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/log-activity" element={<AuthGuard><LogActivity /></AuthGuard>} />
          <Route path="/quests" element={<AuthGuard><Quests /></AuthGuard>} />
          <Route path="/spiritual-hub" element={<AuthGuard><SpiritualHub /></AuthGuard>} />
          <Route path="/achievements" element={<AuthGuard><Achievements /></AuthGuard>} />
          <Route path="/parties" element={<AuthGuard><Parties /></AuthGuard>} />
          <Route path="/challenges" element={<AuthGuard><Challenges /></AuthGuard>} />
          <Route path="/leaderboards" element={<AuthGuard><Leaderboards /></AuthGuard>} />
          <Route path="/area/:area" element={<AuthGuard><AreaDetail /></AuthGuard>} />
          <Route path="/insights" element={<AuthGuard><Insights /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
