import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Staff from "./pages/Staff";
import Expenses from "./pages/Expenses";
import DailyCash from "./pages/DailyCash";
import Scanner from "./pages/Scanner";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Payments />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/daily-cash" element={<DailyCash />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
