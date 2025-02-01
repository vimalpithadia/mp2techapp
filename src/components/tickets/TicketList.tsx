import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  created_by: string;
  profiles: {
    name: string;
  };
}

interface Ticket {
  ticket_id: string;
  title: string;
  description: string;
  // ... add other ticket fields as needed
}

export function TicketList() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchComments = async (ticketId: string): Promise<Comment[]> => {
    try {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          id,
          comment,
          created_at,
          created_by,
          profiles!ticket_comments_created_by_fkey (
            name
          )
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchComments:', error);
      return [];
    }
  };

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', selectedTicket],
    queryFn: () => selectedTicket ? fetchComments(selectedTicket) : Promise.resolve([]),
    enabled: !!selectedTicket
  });

  const addComment = async (ticketId: string, comment: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('ticket_comments')
        .insert([
          {
            ticket_id: ticketId,
            comment: comment,
            created_by: user.id
          }
        ]);

      if (error) throw error;
      
      queryClient.invalidateQueries(['comments', ticketId]);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <div key={ticket.ticket_id} className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold">{ticket.title}</h3>
          <p className="text-gray-600">{ticket.description}</p>
          
          {/* Comments section */}
          <div className="mt-4">
            <button
              onClick={() => setSelectedTicket(ticket.ticket_id)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show Comments
            </button>
            
            {selectedTicket === ticket.ticket_id && (
              <div className="mt-2 space-y-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-2 rounded">
                    <p className="text-sm">{comment.comment}</p>
                    <p className="text-xs text-gray-500">
                      By {comment.profiles.name} on {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                
                {/* Add comment form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const comment = (form.elements.namedItem('comment') as HTMLTextAreaElement).value;
                    if (comment.trim()) {
                      addComment(ticket.ticket_id, comment);
                      form.reset();
                    }
                  }}
                  className="mt-2"
                >
                  <textarea
                    name="comment"
                    className="w-full p-2 border rounded"
                    placeholder="Add a comment..."
                    rows={2}
                  />
                  <button
                    type="submit"
                    className="mt-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Comment
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 