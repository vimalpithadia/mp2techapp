-- Create ticket comments table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
    comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(ticket_id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_ticket
        FOREIGN KEY (ticket_id)
        REFERENCES public.tickets(ticket_id)
        ON DELETE CASCADE
);

-- Add RLS policies
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users"
    ON public.ticket_comments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users"
    ON public.ticket_comments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

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
