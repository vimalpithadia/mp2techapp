import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

// Add status configuration
const statusConfig = {
  ticket_accepted: {
    label: "Ticket Accepted",
    color: "bg-blue-500 text-white",
  },
  pickup: {
    label: "Pickup Schedule",
    color: "bg-purple-500 text-white",
  },
  product_received: {
    label: "Product Received",
    color: "bg-indigo-500 text-white",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-yellow-500 text-white",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-500 text-white",
  },
  done: {
    label: "Done",
    color: "bg-emerald-500 text-white",
  },
  on_hold: {
    label: "On Hold",
    color: "bg-red-500 text-white",
  }
};

interface TechnicianTicketListProps {
  technicianId: string;
}

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_name: string | null;
  user_avatar: string | null;
  user_role: string | null;
}

export function TechnicianTicketList({ technicianId }: TechnicianTicketListProps) {
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  const { data: tickets, refetch } = useQuery({
    queryKey: ['technician-tickets', technicianId],
    queryFn: async () => {
      const { data } = await supabase
        .from('tickets')
        .select(`
          *,
          customers (
            name,
            mobile,
            address
          )
        `)
        .eq('technician_id', technicianId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!technicianId,
  });

  const { data: ticketComments, refetch: refetchComments } = useQuery({
    queryKey: ['ticket-comments'],
    queryFn: async () => {
      console.log('Fetching comments...');
      const { data, error } = await supabase
        .from('ticket_comments_with_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      console.log('Fetched comments:', data);
      return data;
    },
  });

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          ticket_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('ticket_id', ticketId);

      if (error) throw error;
      
      toast.success(`Status updated to ${statusConfig[newStatus as keyof typeof statusConfig].label}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleCommentSubmit = async (ticketId: string) => {
    try {
      const comment = comments[ticketId];
      if (!comment?.trim()) {
        toast.error('Please enter a comment');
        return;
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User error:', userError);
        toast.error('Authentication error. Please try again.');
        return;
      }

      console.log('Submitting comment:', {
        ticketId,
        comment: comment.trim(),
        userId: user.id
      });

      // Insert comment
      const { data: newComment, error: insertError } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          comment: comment.trim()
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('New comment created:', newComment);

      toast.success('Comment added successfully');
      setComments(prev => ({ ...prev, [ticketId]: '' }));
      
      // Refresh both tickets and comments
      await Promise.all([refetch(), refetchComments()]);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'Failed to add comment. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {tickets?.map((ticket) => (
        <Card key={ticket.ticket_id} className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-medium text-lg">{ticket.title}</h3>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-muted-foreground">
                  Customer: {ticket.customers?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Mobile: {ticket.customers?.mobile}
                </p>
                <p className="text-sm text-muted-foreground">
                  Address: {ticket.customers?.address}
                </p>
              </div>
            </div>
            <Badge className={statusConfig[ticket.ticket_status as keyof typeof statusConfig]?.color || 'bg-gray-500'}>
              {statusConfig[ticket.ticket_status as keyof typeof statusConfig]?.label || 'Unknown'}
            </Badge>
          </div>

          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm font-medium">Description:</p>
              <p className="text-sm mt-1">{ticket.description}</p>
            </div>

            <Select
              defaultValue={ticket.ticket_status}
              onValueChange={(value) => handleStatusChange(ticket.ticket_id, value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ticket_accepted">Ticket Accepted</SelectItem>
                <SelectItem value="pickup">Pickup Schedule</SelectItem>
                <SelectItem value="product_received">Product Received</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Comments</h4>
                <div className="space-y-2">
                  {ticketComments
                    ?.filter(comment => comment.ticket_id === ticket.ticket_id)
                    .map(comment => (
                      <div 
                        key={comment.id} 
                        className="bg-white p-2 rounded border text-sm"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {comment.user_avatar && (
                              <img 
                                src={comment.user_avatar} 
                                alt={comment.user_name || 'User'} 
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span className="font-medium">
                              {comment.user_name || 'Unknown User'}
                              {comment.user_role && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({comment.user_role})
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{comment.comment}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={comments[ticket.ticket_id] || ''}
                  onChange={(e) => setComments(prev => ({
                    ...prev,
                    [ticket.ticket_id]: e.target.value
                  }))}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={() => handleCommentSubmit(ticket.ticket_id)}
                  className="w-full"
                >
                  Add Comment
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 