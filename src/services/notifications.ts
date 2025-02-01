import { whatsappService } from '@/integrations/whatsapp/service';
import { Ticket } from '@/types/tickets';

interface NotificationRecipients {
  clientPhone: string;
  technicianPhone?: string;
  adminPhone: string;
}

const ADMIN_PHONE = import.meta.env.VITE_ADMIN_PHONE_NUMBER;

export class TicketNotificationService {
  static async sendStatusChangeNotifications(
    ticket: Ticket,
    recipients: NotificationRecipients
  ) {
    const statusTemplates = {
      // When ticket is generated
      generated: {
        client: {
          template: 'query_received',
          variables: [ticket.customerName, ticket.ticketId]
        },
        admin: {
          template: 'new_ticket_generated',
          variables: [ticket.ticketId, ticket.customerName, ticket.description]
        }
      },
      // When ticket is assigned
      assigned: {
        client: null, // No client notification for assignment
        technician: {
          template: 'ticket_assigned',
          variables: [ticket.ticketId, ticket.customerName, ticket.description]
        }
      },
      // When technician starts working
      in_progress: {
        client: {
          template: 'technician_started',
          variables: [ticket.customerName, ticket.ticketId]
        },
        admin: {
          template: 'technician_started',
          variables: [ticket.ticketId, ticket.customerName]
        }
      },
      // When pickup is scheduled
      pickup_scheduled: {
        client: {
          template: 'pickup_scheduled',
          variables: [ticket.customerName, ticket.pickupDate, ticket.pickupTime]
        },
        admin: {
          template: 'pickup_scheduled',
          variables: [ticket.ticketId, ticket.customerName, ticket.pickupDate, ticket.pickupTime]
        }
      },
      // When product is received
      product_received: {
        client: {
          template: 'product_received',
          variables: [ticket.customerName, ticket.ticketId]
        },
        admin: {
          template: 'product_received',
          variables: [ticket.ticketId, ticket.customerName]
        }
      },
      // When estimate is sent
      estimate_sent: {
        client: {
          template: 'estimate_sent',
          variables: [ticket.customerName, ticket.ticketId, ticket.estimateAmount]
        }
      },
      // When client approves
      approval_received: {
        admin: {
          template: 'approval_received',
          variables: [ticket.ticketId, ticket.customerName]
        }
      },
      // When delivery is scheduled
      delivery_scheduled: {
        client: {
          template: 'delivery_scheduled',
          variables: [ticket.customerName, ticket.deliveryDate, ticket.deliveryTime]
        },
        admin: {
          template: 'delivery_scheduled',
          variables: [ticket.ticketId, ticket.customerName, ticket.deliveryDate, ticket.deliveryTime]
        }
      },
      // When ticket is completed
      done: {
        client: {
          template: 'feedback',
          variables: [ticket.customerName, ticket.ticketId]
        },
        admin: {
          template: 'generate_invoice',
          variables: [ticket.ticketId, ticket.customerName]
        }
      }
    };

    try {
      const statusConfig = statusTemplates[ticket.status as keyof typeof statusTemplates];
      if (!statusConfig) return;

      // Send client notification if configured
      if (statusConfig.client && recipients.clientPhone) {
        await whatsappService.sendTemplateMessage(
          recipients.clientPhone,
          statusConfig.client.template,
          statusConfig.client.variables
        );
      }

      // Send admin notification if configured
      if (statusConfig.admin && recipients.adminPhone) {
        await whatsappService.sendTemplateMessage(
          recipients.adminPhone,
          statusConfig.admin.template,
          statusConfig.admin.variables
        );
      }

      // Send technician notification if configured
      if (statusConfig.technician && recipients.technicianPhone) {
        await whatsappService.sendTemplateMessage(
          recipients.technicianPhone,
          statusConfig.technician.template,
          statusConfig.technician.variables
        );
      }
    } catch (error) {
      console.error('Failed to send WhatsApp notifications:', error);
      throw error;
    }
  }
}
