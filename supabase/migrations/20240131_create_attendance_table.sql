-- Drop existing table if it exists
DROP TABLE IF EXISTS public.attendance;

-- Create attendance table
CREATE TABLE public.attendance (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    technician_id UUID NOT NULL,
    date DATE NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'present',
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_technician_date UNIQUE (technician_id, date),
    CONSTRAINT fk_technician
        FOREIGN KEY (technician_id)
        REFERENCES public.profiles(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_approver
        FOREIGN KEY (approved_by)
        REFERENCES public.profiles(user_id)
        ON DELETE SET NULL
);

-- Add RLS policies
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own attendance records and admins to view all
CREATE POLICY "Users can view their own attendance"
    ON public.attendance
    FOR SELECT
    TO authenticated
    USING (
        technician_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );

-- Allow users to insert their own attendance records
CREATE POLICY "Users can insert their own attendance"
    ON public.attendance
    FOR INSERT
    TO authenticated
    WITH CHECK (technician_id = auth.uid());

-- Allow users to update their own attendance records
CREATE POLICY "Users can update their own attendance"
    ON public.attendance
    FOR UPDATE
    TO authenticated
    USING (technician_id = auth.uid())
    WITH CHECK (technician_id = auth.uid());

-- Allow admins to update any attendance record
CREATE POLICY "Admins can update any attendance"
    ON public.attendance
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            JOIN public.roles r ON p.role_id = r.role_id
            WHERE p.user_id = auth.uid() AND r.name = 'admin'
        )
    );
