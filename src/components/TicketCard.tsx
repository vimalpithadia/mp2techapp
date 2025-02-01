import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Trash2, Eye, Edit2, UserPlus, Archive } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { TicketActions } from "./tickets/TicketActions";
import { TicketRemarks } from "./tickets/TicketRemarks";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { TemplateActionButton } from "./tickets/TemplateActionButton";

interface TicketCardProps {
  ticket_id: string;
  title: string;
  description: string | null;
  ticket_status: Tables<'tickets'>['ticket_status'];
  technician_id?: string | null;
  cust_id?: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string;
  created_by: string;
  needs_approval: boolean;
  customers?: { name: string; mobile: string };
  profiles?: { name: string };
}

const statusConfig = {
  in_queue: { label: "Generated", color: "bg-blue-500 text-white" },
  assigned: { label: "Ticket Assigned", color: "bg-purple-500 text-white" },
  ticket_accepted: { label: "Ticket Accepted", color: "bg-indigo-500 text-white" },
  pickup: { label: "Pickup Schedule", color: "bg-cyan-500 text-white" },
  product_received: { label: "Product Received", color: "bg-teal-500 text-white" },
  in_progress: { label: "In Progress", color: "bg-orange-500 text-white" },
  client_approval: { label: "Client Approval", color: "bg-amber-500 text-white" },
  delivery_scheduled: { label: "Delivery Scheduled", color: "bg-lime-500 text-white" },
  delivered: { label: "Delivered", color: "bg-green-500 text-white" },
  done: { label: "Done", color: "bg-emerald-500 text-white" },
  invoice_sent: { label: "Invoice Sent", color: "bg-sky-500 text-white" },
  payment_received: { label: "Payment Received", color: "bg-violet-500 text-white" },
  complete: { label: "Complete", color: "bg-green-700 text-white" },
  on_hold: { label: "On Hold", color: "bg-red-500 text-white" }
} as const;

type TicketStatus = keyof typeof statusConfig;

export function TicketCard({ 
  ticket_id, 
  title, 
  description, 
  ticket_status, 
  technician_id,
  cust_id,
  created_at,
  updated_at,
  status,
  created_by,
  needs_approval,
  customers,
  profiles,
}: TicketCardProps) {
  const [showRemarks, setShowRemarks] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      console.log('Current user:', data);
      console.log('User role:', data?.roles?.name);
      
      return data;
    },
  });

  const isAdmin = currentUser?.roles?.name === 'admin';
  console.log('Is admin:', isAdmin);

  const { data: technician } = useQuery({
    queryKey: ['technician', technician_id],
    queryFn: async () => {
      if (!technician_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', technician_id)
        .single();
      return data;
    },
    enabled: !!technician_id
  });

  const { data: customer } = useQuery({
    queryKey: ['customer', cust_id],
    queryFn: async () => {
      if (!cust_id) return null;
      const { data } = await supabase
        .from('customers')
        .select('name, mobile')
        .eq('cust_id', cust_id)
        .single();
      return data;
    },
    enabled: !!cust_id
  });

  const isTechnician = currentUser?.roles?.name === 'technician';

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ ticket_status: newStatus })
        .eq('ticket_id', ticket_id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ is_deleted: true })
        .eq('ticket_id', ticket_id);

      if (error) throw error;

      toast.success('Ticket deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handleEdit = () => {
    if (!ticket_id) {
      toast.error('Invalid ticket ID');
      return;
    }
    
    console.log('Navigating to edit ticket:', ticket_id);
    navigate(`/ticket/edit/${ticket_id}`);
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          {customers?.name && (
            <p className="font-bold text-lg text-primary">{customers.name}</p>
          )}
          <h3 className="font-medium text-base">{title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusConfig[ticket_status as TicketStatus]?.color || 'bg-gray-500 text-white'}>
            {statusConfig[ticket_status as TicketStatus]?.label || 'Unknown Status'}
          </Badge>
          {(isTechnician || currentUser?.roles?.name === 'admin') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Change Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {Object.entries(statusConfig).map(([status, config]) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status as TicketStatus)}
                    className="cursor-pointer"
                    disabled={status === ticket_status}
                  >
                    <Badge className={`${config.color} mr-2`}>•</Badge>
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {technician?.name && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{technician.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{updated_at ? new Date(updated_at).toLocaleDateString() : 'No date'}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {(isAdmin || isTechnician) && (
            <>
              <TemplateActionButton
                ticketStatus={ticket_status}
                ticketId={ticket_id}
                customerName={customers?.name || ''}
                customerMobile={customers?.mobile || ''}
                technicianName={technician?.name || ''}
                issue={title}
                priority={status}
                resolution={description || ''}
              />
              {isAdmin && (
                <>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleEdit}
                    title="Edit ticket"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowDeleteAlert(true)}
                    title="Delete ticket"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </>
          )}

          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the ticket.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {showRemarks && isTechnician && technician_id && (
        <div className="mt-4">
          <TicketRemarks ticketId={ticket_id} technicianId={technician_id} />
        </div>
      )}
    </Card>
  );
}