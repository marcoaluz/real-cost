import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/layout/BottomNav";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { PlaceholderPage } from "@/pages/Placeholder";
import LoginPage from "@/pages/auth/LoginPage";
import AuthCallback from "@/pages/auth/AuthCallback";
import OnboardingWelcome from "@/pages/onboarding/OnboardingWelcome";
import OnboardingIncome from "@/pages/onboarding/OnboardingIncome";
import OnboardingExpenses from "@/pages/onboarding/OnboardingExpenses";
import ResultPage from "@/pages/result/ResultPage";
import ExpensesPage from "@/pages/expenses/ExpensesPage";
import NewExpensePage from "@/pages/expenses/NewExpensePage";
import SimulatorPage from "@/pages/simulator/SimulatorPage";
import GoalsPage from "@/pages/goals/GoalsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const DashboardPage = () => <PlaceholderPage title="Meu Custo Real" />;
const SharePage = () => <PlaceholderPage title="Compartilhado" />;
const AdminDashboard = () => <PlaceholderPage title="Admin - Dashboard" />;
const AdminUsers = () => <PlaceholderPage title="Admin - Usuários" />;
const AdminSuggestions = () => <PlaceholderPage title="Admin - Sugestões" />;
const AdminEvents = () => <PlaceholderPage title="Admin - Eventos" />;
const AdminMetrics = () => <PlaceholderPage title="Admin - Métricas" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Auth */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={<PrivateRoute><OnboardingWelcome /></PrivateRoute>} />
          <Route path="/onboarding/income" element={<PrivateRoute><OnboardingIncome /></PrivateRoute>} />
          <Route path="/onboarding/expenses" element={<PrivateRoute><OnboardingExpenses /></PrivateRoute>} />

          {/* Main app */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><ExpensesPage /></PrivateRoute>} />
          <Route path="/expenses/new" element={<PrivateRoute><NewExpensePage /></PrivateRoute>} />
          <Route path="/result" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
          <Route path="/simulator" element={<PrivateRoute><SimulatorPage /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />

          {/* Public share */}
          <Route path="/share/:token" element={<SharePage />} />

          {/* Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/suggestions" element={<AdminRoute><AdminSuggestions /></AdminRoute>} />
          <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
          <Route path="/admin/metrics" element={<AdminRoute><AdminMetrics /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
