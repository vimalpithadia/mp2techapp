import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TechnicianTicketList } from "@/components/technicians/TechnicianTicketList";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, LogIn, LogOut, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: currentUser, error: userError } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('user_id', user.id)
        .single();
      
      return data;
    },
    retry: 1,
  });

  const { data: ticketStats, isLoading } = useQuery({
    queryKey: ['technician-stats', currentUser?.user_id],
    queryFn: async () => {
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('technician_id', currentUser?.user_id)
        .eq('is_deleted', false);

      if (!tickets) return null;

      const total = tickets.length;
      const completed = tickets.filter(t => t.ticket_status === 'complete').length;
      const inProgress = tickets.filter(t => t.ticket_status === 'in_progress').length;
      const pending = tickets.filter(t => ['in_queue', 'assigned'].includes(t.ticket_status)).length;

      const statusData = [
        { name: 'Completed', value: completed },
        { name: 'In Progress', value: inProgress },
        { name: 'Pending', value: pending },
      ];

      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleString('default', { month: 'short' });
        const monthTickets = tickets.filter(t => {
          const ticketDate = new Date(t.created_at);
          return ticketDate.getMonth() === date.getMonth() &&
                 ticketDate.getFullYear() === date.getFullYear();
        });

        return {
          month,
          total: monthTickets.length,
          completed: monthTickets.filter(t => t.ticket_status === 'complete').length,
        };
      }).reverse();

      return {
        total,
        completed,
        inProgress,
        pending,
        statusData,
        monthlyData,
      };
    },
    enabled: !!currentUser?.user_id,
    retry: 1,
  });

  const { data: pendingTickets } = useQuery({
    queryKey: ['pending-tickets', currentUser?.user_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tickets')
        .select(`
          *,
          customers (
            name,
            mobile,
            address
          )
        `)
        .eq('created_by', currentUser?.user_id)
        .eq('needs_approval', true)
        .eq('ticket_status', 'generated')
        .order('created_at', { ascending: false });
      return data;
    },
    enabled: !!currentUser?.user_id,
    retry: 1,
  });

  const { data: todayAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('technician_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data;
    },
    retry: 1,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();

      // First check if there's already an attendance record for today
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('technician_id', user.id)
        .eq('date', today)
        .single();

      if (existingAttendance) {
        throw new Error('Already checked in for today');
      }

      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          technician_id: user.id,
          date: today,
          check_in: now,
          status: 'present'
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(insertError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Checked in successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to check in: ' + error.message);
    }
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      if (!todayAttendance?.attendance_id) {
        throw new Error('No check-in record found for today');
      }

      const { error: updateError } = await supabase
        .from('attendance')
        .update({
          check_out: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('attendance_id', todayAttendance.attendance_id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Checked out successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to check out: ' + error.message);
    }
  });

  useQuery({
    queryKey: ['run-migrations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Only run migrations if user is an admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('user_id', user.id)
        .single();

      if (profile?.roles?.name !== 'admin') return null;

      // Run migrations
      const migrations = [
        // Drop the view if it exists
        `DROP VIEW IF EXISTS public.ticket_comments_with_users;`,

        // Create ticket comments table if it doesn't exist
        `CREATE TABLE IF NOT EXISTS public.ticket_comments (
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
        );`,

        // Add RLS policies
        `ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;`,

        `DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ticket_comments;
         CREATE POLICY "Enable read access for authenticated users"
          ON public.ticket_comments
          FOR SELECT
          TO authenticated
          USING (true);`,

        `DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.ticket_comments;
         CREATE POLICY "Enable insert access for authenticated users"
          ON public.ticket_comments
          FOR INSERT
          TO authenticated
          WITH CHECK (true);`,

        // Create the view
        `CREATE OR REPLACE VIEW public.ticket_comments_with_users AS
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
          tc.created_at DESC;`
      ];

      // Execute each migration
      for (const migration of migrations) {
        const { error } = await supabase.rpc('exec_sql', { sql: migration });
        if (error) throw error;
      }

      return true;
    },
    retry: false
  });

  if (isLoading || isLoadingAttendance) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Skeleton className="h-8 w-8 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (userError) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error loading dashboard</h1>
            <p className="text-muted-foreground mb-4">{userError.message}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Dashboard</h2>
          <Button 
            onClick={() => navigate("/new-ticket")}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Ticket
          </Button>
        </div>

        {/* Attendance Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-lg">
                    {format(new Date(), 'EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!todayAttendance?.check_in && (
                    <Button
                      onClick={() => checkInMutation.mutate()}
                      disabled={checkInMutation.isPending}
                      className="gap-2"
                    >
                      <LogIn className="h-4 w-4" />
                      Check In
                    </Button>
                  )}
                  {todayAttendance?.check_in && !todayAttendance?.check_out && (
                    <Button
                      onClick={() => checkOutMutation.mutate()}
                      disabled={checkOutMutation.isPending}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Check Out
                    </Button>
                  )}
                </div>
              </div>
              {todayAttendance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todayAttendance.check_in && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <LogIn className="h-4 w-4" />
                      Check In: {format(new Date(todayAttendance.check_in), 'hh:mm a')}
                      {!todayAttendance.is_approved && (
                        <span className="text-yellow-500 text-xs">(Pending Approval)</span>
                      )}
                    </div>
                  )}
                  {todayAttendance.check_out && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <LogOut className="h-4 w-4" />
                      Check Out: {format(new Date(todayAttendance.check_out), 'hh:mm a')}
                      {!todayAttendance.is_approved && (
                        <span className="text-yellow-500 text-xs">(Pending Approval)</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats?.completed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ticketStats?.pending || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ticketStats?.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8884d8" name="Total" />
                    <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ticket Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ticketStats?.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ticketStats?.statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <TechnicianTicketList technicianId={currentUser?.user_id} />
            </ScrollArea>
          </CardContent>
        </Card>

        {pendingTickets && pendingTickets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTickets.map((ticket) => (
                  <div key={ticket.ticket_id} className="p-4 border rounded-lg bg-yellow-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{ticket.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Customer: {ticket.customers?.name}
                        </p>
                      </div>
                      <Badge variant="outline">Pending Approval</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
} 