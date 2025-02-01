import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "./NotificationBell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Layout({ children }: { children: React.ReactNode }) {
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-8 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <SidebarTrigger className="lg:hidden" />
            {isAdmin && <NotificationBell />}
          </div>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}