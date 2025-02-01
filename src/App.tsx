import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Technicians from "./pages/Technicians";
import Tickets from "./pages/Tickets";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import NewTicket from "./pages/NewTicket";
import EditTicket from "./pages/EditTicket";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AntivirusManagement from "./pages/AntivirusManagement";
import Chat from "./pages/Chat";
import Templates from "./pages/Templates";
import TechnicianAttendance from "./pages/TechnicianAttendance";
import ErrorBoundary from './components/ErrorBoundary';
import { Button } from "@/components/ui/button";
import ErrorPage from "./pages/ErrorPage";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        setIsAuthenticated(!!session);

        if (session?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*, roles(name)')
            .eq('user_id', session.user.id)
            .single();
          
          if (profileError) throw profileError;
          setUserRole(data?.roles?.name || null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setError(error as Error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);

      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*, roles(name)')
          .eq('user_id', session.user.id)
          .single();
        
        setUserRole(data?.roles?.name || null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route 
                path="/login" 
                element={isAuthenticated ? <Navigate to={userRole === 'technician' ? '/technician-dashboard' : '/'} /> : <Login />} 
              />
              <Route 
                path="/" 
                element={
                  isAuthenticated ? (
                    userRole === 'technician' ? 
                      <Navigate to="/technician-dashboard" /> : 
                      <Index />
                  ) : 
                  <Navigate to="/login" />
                } 
              />
              <Route 
                path="/technician-dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['technician']}>
                    <TechnicianDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/new-ticket" 
                element={
                  <ProtectedRoute allowedRoles={['admin', 'technician']}>
                    <NewTicket />
                  </ProtectedRoute>
                } 
              />
              <Route path="/technicians" element={<ProtectedRoute><Technicians /></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/ticket/edit/:ticketId" element={<ProtectedRoute><EditTicket /></ProtectedRoute>} />
              <Route path="/antivirus" element={<ProtectedRoute><AntivirusManagement /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route 
                path="/templates" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Templates />
                  </ProtectedRoute>
                } 
              />
              <Route path="/attendance" element={<ProtectedRoute><TechnicianAttendance /></ProtectedRoute>} />
              <Route 
                path="*" 
                element={<ErrorPage />} 
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;