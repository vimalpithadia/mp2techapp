import { Button } from "@/components/ui/button";
import { Eye, Edit2, Archive, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { TechnicianSelect } from "./TechnicianSelect";
import { useTicketActions } from "@/hooks/useTicketActions";

interface TicketActionsProps {
  ticketId: string;
  status: string;
  isAdmin: boolean;
  isTechnician: boolean;
  createdBy: string;
  needsApproval: boolean;
  customerPhone: string;
  technicianPhone?: string;
}

export function TicketActions({ 
  ticketId, 
  status, 
  isAdmin, 
  isTechnician,
  createdBy,
  needsApproval,
  customerPhone,
  technicianPhone
}: TicketActionsProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  
  const { isLoading, updateTicketStatus, assignTechnician } = useTicketActions();

  const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE_NUMBER;

  const handleView = () => {
    navigate(`/tickets/${ticketId}`);
  };

  const handleEdit = () => {
    navigate(`/tickets/${ticketId}/edit`);
  };

  const handleArchive = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ archive_status: true })
        .eq('ticket_id', ticketId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket archived successfully');
    } catch (error) {
      console.error('Error archiving ticket:', error);
      toast.error('Failed to archive ticket');
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnicianId) {
      toast.error('Please select a technician');
      return;
    }

    try {
      await assignTechnician(
        ticketId,
        selectedTechnicianId,
        {
          clientPhone: customerPhone,
          technicianPhone: technicianPhone || '',
          adminPhone: ADMIN_PHONE
        }
      );
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error assigning technician:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateTicketStatus(
        ticketId,
        newStatus,
        {
          clientPhone: customerPhone,
          technicianPhone: technicianPhone,
          adminPhone: ADMIN_PHONE
        }
      );
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleApprove = () => handleStatusUpdate('in_queue');
  const handleReject = () => handleStatusUpdate('rejected');

  if (isLoading) {
    return (
      <Button disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Updating...
      </Button>
    );
  }

  // Show approve/reject buttons for admin when ticket needs approval
  if (isAdmin && needsApproval) {
    return (
      <div className="flex gap-2">
        <Button onClick={handleApprove} variant="default">
          Approve
        </Button>
        <Button onClick={handleReject} variant="destructive">
          Reject
        </Button>
      </div>
    );
  }

  // Show status change buttons for technician after approval
  if (isTechnician && !needsApproval) {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={() => handleStatusUpdate('in_progress')}
          disabled={status === 'in_progress'}
        >
          Start Work
        </Button>
        <Button 
          onClick={() => handleStatusUpdate('complete')}
          disabled={status === 'complete'}
        >
          Complete
        </Button>
      </div>
    );
  }

  // Show pending approval message for technician
  if (isTechnician && needsApproval) {
    return (
      <div className="text-sm text-muted-foreground">
        Waiting for admin approval
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handleView}>
        <Eye className="h-4 w-4" />
      </Button>
      
      {isAdmin && (
        <>
          <Button variant="outline" size="icon" onClick={handleEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => setIsDialogOpen(true)}>
            <UserPlus className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleArchive}>
            <Archive className="h-4 w-4" />
          </Button>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Technician</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <TechnicianSelect
              value={selectedTechnicianId}
              onChange={setSelectedTechnicianId}
            />
            <Button 
              onClick={handleAssignTechnician}
              disabled={isLoading || !selectedTechnicianId}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}