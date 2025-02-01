import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TicketNotificationService } from '@/services/notifications';
import { toast } from 'sonner';

export function useTicketActions() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const updateTicketStatus = async (
    ticketId: string,
    newStatus: string,
    recipients: {
      clientPhone: string;
      technicianPhone?: string;
      adminPhone: string;
    }
  ) => {
    setIsLoading(true);
    try {
      // First, update the ticket status
      const { data: ticket, error: updateError } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('ticket_id', ticketId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Send WhatsApp notifications
      if (ticket) {
        await TicketNotificationService.sendStatusChangeNotifications(
          ticket,
          recipients
        );
      }

      // Invalidate tickets query to refresh the UI
      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      
      toast.success('Ticket status updated successfully');
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const assignTechnician = async (
    ticketId: string,
    technicianId: string,
    recipients: {
      clientPhone: string;
      technicianPhone: string;
      adminPhone: string;
    }
  ) => {
    setIsLoading(true);
    try {
      // Update ticket with technician assignment
      const { data: ticket, error: updateError } = await supabase
        .from('tickets')
        .update({ 
          technician_id: technicianId,
          status: 'assigned'
        })
        .eq('ticket_id', ticketId)
        .select('*')
        .single();

      if (updateError) throw updateError;

      // Send WhatsApp notifications
      if (ticket) {
        await TicketNotificationService.sendStatusChangeNotifications(
          ticket,
          recipients
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Technician assigned successfully');
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast.error('Failed to assign technician');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    updateTicketStatus,
    assignTechnician
  };
}
