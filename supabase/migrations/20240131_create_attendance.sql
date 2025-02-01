-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    attendance_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    technician_id UUID NOT NULL REFERENCES public.profiles(user_id),
    date DATE NOT NULL,
    check_in TIMESTAMP WITH TIME ZONE,
    check_out TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'half_day')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false,
    UNIQUE(technician_id, date)
);

-- Create RLS policies
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.attendance
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.attendance
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.attendance
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create function to update updated_at on changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
