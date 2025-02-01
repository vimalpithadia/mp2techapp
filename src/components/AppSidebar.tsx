import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sidebar, SidebarContent } from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  WrenchIcon,
  Shield,
  MessageSquare,
  Plus,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { useEffect } from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppSidebar({ className }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('user_id', user.id)
        .single();
      
      return data;
    },
  });

  const isAdmin = currentUser?.roles?.name === 'admin';
  const isTechnician = currentUser?.roles?.name === 'technician';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Modify the useEffect for route protection
  useEffect(() => {
    if (isTechnician && 
        !location.pathname.includes('technician-dashboard') && 
        !location.pathname.includes('new-ticket')) {
      navigate('/technician-dashboard');
    }
  }, [isTechnician, location.pathname, navigate]);

  return (
    <Sidebar className={cn("border-r", className)}>
      <SidebarContent className="flex flex-col h-full">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">
              Service Management
            </h2>
            <div className="space-y-1">
              {/* Show different dashboard links based on role */}
              {isAdmin ? (
                <Button
                  variant={location.pathname === "/" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate("/")}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <Button
                  variant={location.pathname === "/technician-dashboard" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => navigate("/technician-dashboard")}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              )}

              {/* Show New Ticket button for both admin and technician */}
              <Button
                variant={location.pathname === "/new-ticket" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => navigate("/new-ticket")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>

              {/* Only show these options to admin */}
              {isAdmin && (
                <>
                  <Button
                    variant={location.pathname === "/tickets" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/tickets")}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Tickets
                  </Button>
                  <Button
                    variant={location.pathname === "/technicians" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/technicians")}
                  >
                    <WrenchIcon className="mr-2 h-4 w-4" />
                    Technicians
                  </Button>
                  <Button
                    variant={location.pathname === "/attendance" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/attendance")}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Attendance
                  </Button>
                  <Button
                    variant={location.pathname === "/customers" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/customers")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Customers
                  </Button>
                  <Button
                    variant={location.pathname === "/antivirus" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/antivirus")}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Antivirus
                  </Button>
                  <Button
                    variant={location.pathname === "/chat" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/chat")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    AI Assistant
                  </Button>
                  <Button
                    variant={location.pathname === "/templates" ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate("/templates")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Templates
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="mt-auto p-4">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}