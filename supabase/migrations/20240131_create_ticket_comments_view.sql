-- Create a view for ticket comments with user information
CREATE OR REPLACE VIEW public.ticket_comments_with_users AS
SELECT 
    tc.comment_id,
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
