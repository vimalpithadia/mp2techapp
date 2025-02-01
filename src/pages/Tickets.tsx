import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { TicketCard } from "@/components/TicketCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { TechnicianSelect } from "@/components/tickets/TechnicianSelect";
import { useQueryClient } from "@tanstack/react-query";

const ticketStatuses = [
  { label: "Generated", value: "in_queue", color: "border-blue-500" },
  { label: "Ticket Assigned", value: "assigned", color: "border-purple-500" },
  { label: "Ticket Accepted", value: "ticket_accepted", color: "border-indigo-500" },
  { label: "Pickup Schedule", value: "pickup", color: "border-cyan-500" },
  { label: "Product Received", value: "product_received", color: "border-teal-500" },
  { label: "In Progress", value: "in_progress", color: "border-orange-500" },
  { label: "Client Approval", value: "client_approval", color: "border-amber-500" },
  { label: "Delivery Scheduled", value: "delivery_scheduled", color: "border-lime-500" },
  { label: "Delivered", value: "delivered", color: "border-green-500" },
  { label: "Done", value: "done", color: "border-emerald-500" },
  { label: "Invoice Sent", value: "invoice_sent", color: "border-sky-500" },
  { label: "Payment Received", value: "payment_received", color: "border-violet-500" },
  { label: "Complete", value: "complete", color: "border-green-700" },
  { label: "On Hold", value: "on_hold", color: "border-red-500" }
];

const statusConfig = {
  in_queue: { label: "Generated", color: "bg-blue-500" },
  assigned: { label: "Ticket Assigned", color: "bg-purple-500" },
  ticket_accepted: { label: "Ticket Accepted", color: "bg-indigo-500" },
  pickup: { label: "Pickup Schedule", color: "bg-cyan-500" },
  product_received: { label: "Product Received", color: "bg-teal-500" },
  in_progress: { label: "In Progress", color: "bg-orange-500" },
  client_approval: { label: "Estimate Sent", color: "bg-amber-500" },
  approval_received: { label: "Approval Received", color: "bg-yellow-500" },
  delivery_scheduled: { label: "Delivery Scheduled", color: "bg-lime-500" },
  delivered: { label: "Delivered", color: "bg-green-500" },
  done: { label: "Done", color: "bg-emerald-500" },
  invoice_sent: { label: "Invoice Sent", color: "bg-sky-500" },
  payment_received: { label: "Payment Received", color: "bg-violet-500" },
  complete: { label: "Complete", color: "bg-green-700" },
  on_hold: { label: "On Hold", color: "bg-red-500" }
};

// Add this debug function at the top level
const debugTickets = (tickets: any[]) => {
  console.log('All Tickets:', tickets);
  tickets.forEach(ticket => {
    console.log(`Ticket ID: ${ticket.ticket_id}, Status: ${ticket.ticket_status}, Title: ${ticket.title}`);
  });
};

export default function Tickets() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

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

  const isTechnician = currentUser?.roles?.name === 'technician';

  const { data: tickets, isLoading: ticketsLoading, error: ticketsError, refetch } = useQuery({
    queryKey: ['tickets', selectedStatus],
    queryFn: async () => {
      try {
        let query = supabase
          .from('tickets')
          .select(`
            *,
            customers (
              name,
              mobile,
              address
            ),
            creator:profiles!tickets_created_by_fkey (
              name
            ),
            technician:profiles!tickets_technician_id_fkey (
              name
            )
          `)
          .eq('is_deleted', false);

        if (selectedStatus) {
          query = query.eq('ticket_status', selectedStatus);
        }

        // Don't show generated tickets in the main list
        query = query.not('ticket_status', 'eq', 'in_queue');
        
        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching tickets:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in ticket query:', error);
        throw error;
      }
    },
    enabled: !!currentUser
  });

  const filteredTickets = selectedStatus
    ? tickets?.filter((ticket) => ticket.ticket_status === selectedStatus)
    : tickets;

  // Update the ticket counts query
  const { data: ticketCounts, isLoading } = useQuery({
    queryKey: ['ticket-counts'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('ticket_status')
          .eq('is_deleted', false);

        if (error) {
          console.error('Error fetching ticket counts:', error);
          throw error;
        }

        // Calculate counts manually
        const counts = data.reduce((acc: { [key: string]: number }, ticket) => {
          const status = ticket.ticket_status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        console.log('Ticket counts:', counts);
        return Object.entries(counts).map(([ticket_status, count]) => ({
          ticket_status,
          count
        }));
      } catch (error) {
        console.error('Error calculating ticket counts:', error);
        throw error;
      }
    },
    enabled: !!currentUser,
  });

  // Function to get count for a specific status
  const getTicketCountByStatus = (status: string) => {
    const statusCount = ticketCounts?.find(
      count => count.ticket_status === status
    );
    return statusCount?.count || 0;
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatus(status === selectedStatus ? null : status);
  };

  const navigate = useNavigate();

  // Refetch tickets when component mounts or route changes
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Add this effect to log tickets when they change
  useEffect(() => {
    if (tickets) {
      console.log('Tickets updated:', tickets.length, 'tickets found');
      debugTickets(tickets);
    }
  }, [tickets]);

  // Add error display
  useEffect(() => {
    if (ticketsError) {
      console.error('Tickets query error:', ticketsError);
      toast.error('Failed to fetch tickets. Please try again.');
    }
  }, [ticketsError]);

  // Add data logging effect
  useEffect(() => {
    if (tickets) {
      console.log('Tickets loaded:', tickets.length);
      tickets.forEach(ticket => {
        console.log(`Ticket ${ticket.ticket_id}:`, {
          status: ticket.ticket_status,
          title: ticket.title,
          customer: ticket.customers?.name
        });
      });
    }
  }, [tickets]);

  const queryClient = useQueryClient();

  // Update the generated tickets query
  const { data: generatedTickets } = useQuery({
    queryKey: ['generated-tickets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select(`
            *,
            customers (
              name,
              mobile,
              address
            ),
            creator:profiles!tickets_created_by_fkey (
              name
            ),
            technician:profiles!tickets_technician_id_fkey (
              name
            )
          `)
          .eq('ticket_status', 'in_queue')
          .eq('needs_approval', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching generated tickets:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in generated tickets query:', error);
        throw error;
      }
    },
    enabled: !!currentUser
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tickets</h1>
            <p className="text-gray-500">
              {isTechnician 
                ? "View and manage your tickets" 
                : "Manage and track all service tickets"}
            </p>
          </div>
          {isTechnician && (
            <Button onClick={() => navigate('/new-ticket')}>
              <Plus className="mr-2 h-4 w-4" /> New Ticket
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isTechnician && (
              <TabsTrigger value="pending">Pending Approval</TabsTrigger>
            )}
            <TabsTrigger value="recent">Recent Tickets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {isLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ticketStatuses.map((status) => {
                  const count = getTicketCountByStatus(status.value);
                  return (
                    <Card 
                      key={status.value} 
                      className={`
                        border-l-4 ${status.color} cursor-pointer 
                        transition-all hover:shadow-md 
                        ${selectedStatus === status.value ? 'ring-2 ring-primary' : ''}
                        ${count > 0 ? 'opacity-100' : 'opacity-60'}
                      `}
                      onClick={() => handleStatusClick(status.value)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">
                          {status.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">{count}</p>
                          {count > 0 && (
                            <Badge variant="secondary">
                              Click to view
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {selectedStatus && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {ticketStatuses.find(s => s.value === selectedStatus)?.label} Tickets
                  </h2>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedStatus(null)}
                  >
                    Show All
                  </Button>
                </div>
                {filteredTickets?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tickets found with this status
                  </div>
                ) : (
                  filteredTickets?.map((ticket) => (
                    <TicketCard
                      key={ticket.ticket_id}
                      {...ticket}
                    />
                  ))
                )}
              </div>
            )}

            {generatedTickets && generatedTickets.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Generated Tickets</span>
                    <Badge>{generatedTickets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {generatedTickets.map((ticket) => (
                      <div key={ticket.ticket_id} className="p-4 border rounded-lg bg-blue-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{ticket.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created by: {ticket.creator?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Customer: {ticket.customers?.name}
                            </p>
                            {ticket.technician?.name && (
                              <p className="text-sm text-muted-foreground">
                                Assigned to: {ticket.technician.name}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <TechnicianSelect
                              value={ticket.technician_id || ''}
                              onChange={async (technicianId) => {
                                try {
                                  const { error: updateError } = await supabase
                                    .from('tickets')
                                    .update({ 
                                      technician_id: technicianId,
                                      ticket_status: 'assigned',
                                      needs_approval: false,
                                      updated_at: new Date().toISOString()
                                    })
                                    .eq('ticket_id', ticket.ticket_id);
                                  
                                  if (updateError) throw updateError;

                                  // Create notification for the assigned technician
                                  const { error: notificationError } = await supabase
                                    .from('notifications')
                                    .insert({
                                      user_id: technicianId,
                                      title: 'New Ticket Assigned',
                                      message: `You have been assigned to ticket: ${ticket.title}`,
                                      ticket_id: ticket.ticket_id,
                                      is_read: false
                                    });

                                  if (notificationError) {
                                    console.error('Error creating notification:', notificationError);
                                  }

                                  toast.success('Technician assigned successfully');
                                  queryClient.invalidateQueries(['generated-tickets']);
                                  queryClient.invalidateQueries(['tickets']);
                                } catch (error) {
                                  console.error('Error assigning technician:', error);
                                  toast.error('Failed to assign technician');
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isTechnician && (
            <TabsContent value="pending">
              <ScrollArea className="h-[600px] rounded-md border p-4">
                <div className="space-y-4">
                  {tickets
                    ?.filter(ticket => 
                      ticket.created_by === currentUser?.user_id && 
                      ticket.needs_approval
                    )
                    .map((ticket) => (
                      <TicketCard
                        key={ticket.ticket_id}
                        {...ticket}
                      />
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}

          <TabsContent value="recent">
            <ScrollArea className="h-[600px] rounded-md border p-4">
              <div className="space-y-4">
                {tickets?.map((ticket) => (
                  <TicketCard
                    key={ticket.ticket_id}
                    {...ticket}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}