import { Layout } from "@/components/Layout";
import { TicketForm } from "@/components/tickets/TicketForm";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function EditTicket() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const queryClient = useQueryClient();

  // Debug logs
  console.log('Edit Ticket - URL params:', useParams());
  console.log('Edit Ticket - Ticket ID:', ticketId);

  const { data: ticket, isLoading, error } = useQuery({
    queryKey: ['edit-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) throw new Error('No ticket ID provided');

      // Simple query first
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (error) {
        console.error('Failed to fetch ticket:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Ticket not found');
      }

      // Now get the related data
      const [customerResult, technicianResult] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('cust_id', data.cust_id)
          .single(),
        data.technician_id ? supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.technician_id)
          .single() : Promise.resolve({ data: null })
      ]);

      // Combine all the data
      return {
        ...data,
        customers: customerResult.data,
        profiles: technicianResult.data
      };
    },
    enabled: !!ticketId,
  });

  // Log the query results
  useEffect(() => {
    console.log('Edit Ticket - Query Results:', {
      ticket,
      isLoading,
      error
    });
  }, [ticket, isLoading, error]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !ticket) {
    return (
      <Layout>
        <div className="text-center">
          <h2 className="text-2xl font-bold">Ticket not found</h2>
          <p className="text-muted-foreground mt-2">
            {error ? `Error: ${error.message}` : 'The ticket could not be found.'}
          </p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/tickets')}
          >
            Back to Tickets
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Edit Ticket - {ticket.title}
          </h2>
        </div>

        <div className="grid gap-4">
          <TicketForm 
            initialData={ticket}
            onSuccess={() => {
              queryClient.invalidateQueries(['tickets']);
              toast.success('Ticket updated successfully');
              navigate('/tickets');
            }} 
          />
        </div>
      </div>
    </Layout>
  );
} 