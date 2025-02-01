-- Drop the view if it exists
DROP VIEW IF EXISTS public.ticket_comments_with_users;

-- Create ticket comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES public.tickets(ticket_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Add RLS policies for ticket_comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ticket_comments;
CREATE POLICY "Enable read access for authenticated users"
    ON public.ticket_comments
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.ticket_comments;
CREATE POLICY "Enable insert access for authenticated users"
    ON public.ticket_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile and admins to view all profiles
DROP POLICY IF EXISTS "Users can view own profile and admins all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile and admins all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Allow admins to insert new profiles
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    ticket_status VARCHAR(50) NOT NULL,
    recipient_type VARCHAR(20) NOT NULL, -- 'customer' or 'technician'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    is_deleted BOOLEAN DEFAULT false,
    CONSTRAINT valid_recipient_type CHECK (recipient_type IN ('customer', 'technician'))
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage templates
CREATE POLICY "Allow admins to manage templates"
    ON public.email_templates
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Allow all authenticated users to view templates
CREATE POLICY "Allow authenticated users to view templates"
    ON public.email_templates
    FOR SELECT
    TO authenticated
    USING (NOT is_deleted);

-- Insert some default templates
INSERT INTO public.email_templates (name, subject, body, ticket_status, recipient_type) VALUES
('Ticket Generated - Customer', 'Your Service Request Has Been Generated', 'Dear {customer_name},\n\nYour service request #{ticket_id} has been generated successfully.\n\nIssue: {issue}\nPriority: {priority}\n\nWe will assign a technician shortly.\n\nBest regards,\nSupport Team', 'in_queue', 'customer'),

('Ticket Assigned - Customer', 'Technician Assigned to Your Request', 'Dear {customer_name},\n\nA technician has been assigned to your service request #{ticket_id}.\n\nTechnician: {technician_name}\nIssue: {issue}\n\nOur technician will contact you shortly.\n\nBest regards,\nSupport Team', 'assigned', 'customer'),

('Ticket Assigned - Technician', 'New Service Request Assigned', 'Dear {technician_name},\n\nA new service request has been assigned to you.\n\nTicket ID: {ticket_id}\nCustomer: {customer_name}\nIssue: {issue}\nPriority: {priority}\n\nPlease review and take necessary action.\n\nBest regards,\nSupport Team', 'assigned', 'technician'),

('Ticket Accepted - Customer', 'Your Request Has Been Accepted', 'Dear {customer_name},\n\nYour service request #{ticket_id} has been accepted by our technician.\n\nTechnician: {technician_name}\nIssue: {issue}\n\nOur technician will proceed with the service.\n\nBest regards,\nSupport Team', 'ticket_accepted', 'customer'),

('Pickup Scheduled - Customer', 'Product Pickup Scheduled', 'Dear {customer_name},\n\nThe pickup for your service request #{ticket_id} has been scheduled.\n\nTechnician: {technician_name}\nIssue: {issue}\n\nOur technician will arrive for pickup shortly.\n\nBest regards,\nSupport Team', 'pickup', 'customer'),

('Product Received - Customer', 'Product Received for Service', 'Dear {customer_name},\n\nWe have received your product for service request #{ticket_id}.\n\nIssue: {issue}\nTechnician: {technician_name}\n\nWe will begin working on it shortly.\n\nBest regards,\nSupport Team', 'product_received', 'customer'),

('In Progress - Customer', 'Your Product Service in Progress', 'Dear {customer_name},\n\nWork has begun on your service request #{ticket_id}.\n\nTechnician: {technician_name}\nIssue: {issue}\n\nWe will keep you updated on the progress.\n\nBest regards,\nSupport Team', 'in_progress', 'customer'),

('Client Approval - Customer', 'Service Estimate for Your Approval', 'Dear {customer_name},\n\nWe have completed the assessment for your service request #{ticket_id}.\n\nPlease review and approve the service estimate.\n\nIssue: {issue}\nTechnician: {technician_name}\n\nBest regards,\nSupport Team', 'client_approval', 'customer'),

('Delivery Scheduled - Customer', 'Product Delivery Scheduled', 'Dear {customer_name},\n\nThe delivery for your service request #{ticket_id} has been scheduled.\n\nTechnician: {technician_name}\nIssue: {issue}\n\nOur team will contact you for delivery coordination.\n\nBest regards,\nSupport Team', 'delivery_scheduled', 'customer'),

('Delivered - Customer', 'Product Delivered', 'Dear {customer_name},\n\nYour product has been delivered for service request #{ticket_id}.\n\nPlease check the product and confirm everything is in order.\n\nBest regards,\nSupport Team', 'delivered', 'customer'),

('Done - Customer', 'Service Completed', 'Dear {customer_name},\n\nThe service for your request #{ticket_id} has been completed.\n\nIssue: {issue}\nResolution: {resolution}\n\nPlease let us know if you have any questions.\n\nBest regards,\nSupport Team', 'done', 'customer'),

('Invoice Sent - Customer', 'Service Invoice', 'Dear {customer_name},\n\nThe invoice for your service request #{ticket_id} has been generated.\n\nPlease process the payment at your earliest convenience.\n\nBest regards,\nSupport Team', 'invoice_sent', 'customer'),

('Payment Received - Customer', 'Payment Confirmation', 'Dear {customer_name},\n\nWe have received your payment for service request #{ticket_id}.\n\nThank you for your business.\n\nBest regards,\nSupport Team', 'payment_received', 'customer'),

('Complete - Customer', 'Service Request Completed', 'Dear {customer_name},\n\nYour service request #{ticket_id} has been marked as complete.\n\nThank you for choosing our services.\n\nBest regards,\nSupport Team', 'complete', 'customer'),

('On Hold - Customer', 'Service Request On Hold', 'Dear {customer_name},\n\nYour service request #{ticket_id} has been placed on hold.\n\nReason: {resolution}\n\nWe will contact you shortly with more information.\n\nBest regards,\nSupport Team', 'on_hold', 'customer');

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.whatsapp_templates;

-- Create WhatsApp templates table with simplified schema
CREATE TABLE public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view active templates
CREATE POLICY "Allow authenticated users to view templates"
    ON public.whatsapp_templates
    FOR SELECT
    TO authenticated
    USING (is_active = true);

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

-- Create the view
CREATE OR REPLACE VIEW public.ticket_comments_with_users AS
SELECT 
    tc.comment_id as id,
    tc.ticket_id,
    tc.user_id,
    tc.comment,
    tc.created_at,
    tc.updated_at,
    p.name as user_name,
    p.avatar_url as user_avatar,
    r.name as user_role
FROM 
    public.ticket_comments tc
    LEFT JOIN public.profiles p ON tc.user_id = p.user_id
    LEFT JOIN public.roles r ON p.role_id = r.role_id
ORDER BY 
    tc.created_at DESC;
