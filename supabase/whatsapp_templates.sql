-- Insert default WhatsApp templates
INSERT INTO public.whatsapp_templates (name, message, status, is_active) VALUES
('Ticket Generated', 'Dear {customer_name},

Your service request #{ticket_id} has been generated.

Issue: {issue}
Priority: {priority}

We will assign a technician shortly.

Best regards,
Support Team', 'in_queue', true),

('Ticket Assigned', 'Dear {customer_name},

A technician has been assigned to your service request #{ticket_id}.

Technician: {technician_name}
Issue: {issue}

Our technician will contact you shortly.

Best regards,
Support Team', 'assigned', true),

('Ticket Accepted', 'Dear {customer_name},

Your service request #{ticket_id} has been accepted.

Technician: {technician_name}
Issue: {issue}

Our technician will proceed with the service.

Best regards,
Support Team', 'ticket_accepted', true),

('Pickup Scheduled', 'Dear {customer_name},

The pickup for your service request #{ticket_id} has been scheduled.

Technician: {technician_name}
Issue: {issue}

Our technician will arrive for pickup shortly.

Best regards,
Support Team', 'pickup', true),

('Product Received', 'Dear {customer_name},

We have received your product for service request #{ticket_id}.

Issue: {issue}
Technician: {technician_name}

We will begin working on it shortly.

Best regards,
Support Team', 'product_received', true),

('In Progress', 'Dear {customer_name},

Work has begun on your service request #{ticket_id}.

Technician: {technician_name}
Issue: {issue}

We will keep you updated on the progress.

Best regards,
Support Team', 'in_progress', true),

('Client Approval', 'Dear {customer_name},

We have completed the assessment for your service request #{ticket_id}.

Please review and approve the service estimate.

Issue: {issue}
Technician: {technician_name}

Best regards,
Support Team', 'client_approval', true),

('Delivery Scheduled', 'Dear {customer_name},

The delivery for your service request #{ticket_id} has been scheduled.

Technician: {technician_name}
Issue: {issue}

Our team will contact you for delivery coordination.

Best regards,
Support Team', 'delivery_scheduled', true),

('Delivered', 'Dear {customer_name},

Your product has been delivered for service request #{ticket_id}.

Please check the product and confirm everything is in order.

Best regards,
Support Team', 'delivered', true),

('Done', 'Dear {customer_name},

The service for your request #{ticket_id} has been completed.

Issue: {issue}
Resolution: {resolution}

Please let us know if you have any questions.

Best regards,
Support Team', 'done', true),

('Invoice Sent', 'Dear {customer_name},

The invoice for your service request #{ticket_id} has been generated.

Please process the payment at your earliest convenience.

Best regards,
Support Team', 'invoice_sent', true),

('Payment Received', 'Dear {customer_name},

We have received your payment for service request #{ticket_id}.

Thank you for your business.

Best regards,
Support Team', 'payment_received', true),

('Complete', 'Dear {customer_name},

Your service request #{ticket_id} has been marked as complete.

Thank you for choosing our services.

Best regards,
Support Team', 'complete', true),

('On Hold', 'Dear {customer_name},

Your service request #{ticket_id} has been placed on hold.

Reason: {resolution}

We will contact you shortly with more information.

Best regards,
Support Team', 'on_hold', true);
