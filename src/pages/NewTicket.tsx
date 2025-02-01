import { Layout } from "@/components/Layout";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function NewTicket() {
  const navigate = useNavigate();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('user_id', user.id)
        .single();
      
      console.log('Current user data:', data);
      return data;
    },
  });

  const isTechnician = currentUser?.roles?.name === 'technician';
  console.log('Is technician:', isTechnician);

  const handleSuccess = () => {
    console.log('Ticket created successfully, redirecting...');
    if (isTechnician) {
      navigate('/technician-dashboard');
    } else {
      navigate('/tickets');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Create New Ticket</h2>
        </div>

        <div className="grid gap-4">
          <TicketForm 
            onSuccess={handleSuccess}
            isTechnician={isTechnician}
          />
        </div>
      </div>
    </Layout>
  );
}