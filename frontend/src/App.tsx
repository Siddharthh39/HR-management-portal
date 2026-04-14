import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/auth/AuthContext";
import { AdminRoute } from "@/auth/AdminRoute";
import { AppLayout } from "@/layouts/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import UsersListPage from "@/pages/admin/UsersListPage";
import PermissionsPage from "@/pages/admin/PermissionsPage";
import MyProfilePage from "@/pages/admin/MyProfilePage";
import DataExplorerPage from "@/pages/explorer/DataExplorerPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import { leaveApi, onboardingApi, punchApi, salaryApi } from "@/api/db-query";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin/users" element={<AdminRoute><UsersListPage /></AdminRoute>} />
              <Route path="/admin/permissions" element={<AdminRoute><PermissionsPage /></AdminRoute>} />
              <Route path="/admin/me" element={<MyProfilePage />} />
              <Route path="/leave-requests/explorer" element={<DataExplorerPage title="Leave Requests" description="Explore leave request data" api={leaveApi} />} />
              <Route path="/onboarding/explorer" element={<DataExplorerPage title="Onboarding" description="Explore onboarding data" api={onboardingApi} />} />
              <Route path="/punch-in-out/explorer" element={<DataExplorerPage title="Punch In/Out" description="Explore attendance records" api={punchApi} />} />
              <Route path="/salary-management/explorer" element={<DataExplorerPage title="Salary Management" description="Explore salary data" api={salaryApi} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
