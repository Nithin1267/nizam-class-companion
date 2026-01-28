import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StudentAuth } from "./pages/StudentAuth";
import { TeacherAuth } from "./pages/TeacherAuth";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Dashboard } from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedStudentRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/student" replace />;
  }
  
  if (role === 'teacher') {
    return <Navigate to="/teacher/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function StudentDashboardWrapper() {
  const { signOut } = useAuth();
  return <Dashboard onLogout={signOut} />;
}

function LandingRedirect() {
  const { user, role, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (user) {
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    if (role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Navigate to="/student" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/student" element={<StudentAuth />} />
      <Route path="/teacher" element={<TeacherAuth />} />
      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedStudentRoute>
            <StudentDashboardWrapper />
          </ProtectedStudentRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
