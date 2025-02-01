export interface Ticket {
  ticket_id: string;
  customer_id: string;
  technician_id?: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  customer_phone: string;  // Added for WhatsApp integration
  technician_phone?: string;  // Added for WhatsApp integration
  customer_name: string;
  pickup_date?: string;
  pickup_time?: string;
  delivery_date?: string;
  delivery_time?: string;
  estimate_amount?: number;
  is_active: boolean;
  archive_status: boolean;
}

export type TicketStatus = 
  | 'generated'
  | 'assigned'
  | 'in_progress'
  | 'pickup_scheduled'
  | 'product_received'
  | 'estimate_sent'
  | 'approval_received'
  | 'delivery_scheduled'
  | 'done'
  | 'hold'
  | 'complete';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  generated: 'Generated',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pickup_scheduled: 'Pickup Scheduled',
  product_received: 'Product Received',
  estimate_sent: 'Estimate Sent',
  approval_received: 'Approval Received',
  delivery_scheduled: 'Delivery Scheduled',
  done: 'Done',
  hold: 'On Hold',
  complete: 'Complete'
};
