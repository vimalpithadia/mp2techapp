import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, Plus, Ticket, CheckCircle2, UserPlus } from "lucide-react";
import { TodoList } from "@/components/dashboard/TodoList";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Index() {
  const navigate = useNavigate();

  const { data: ticketStats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // First, get all non-deleted tickets
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('is_deleted', false);

      if (error) {
        console.error('Error fetching tickets:', error);
        throw error;
      }

      console.log('Fetched tickets:', tickets); // Debug log

      if (!tickets) return null;

      const total = tickets.length;
      const completed = tickets.filter(t => t.ticket_status === 'done').length;

      const statusData = [
        { name: 'Completed', value: completed },
        { name: 'Active', value: total - completed },
      ];

      // Get monthly data
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
          completed: monthTickets.filter(t => t.ticket_status === 'done').length,
        };
      }).reverse();

      return {
        total,
        completed,
        statusData,
        monthlyData,
      };
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/new-ticket')}>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
            <Button onClick={() => navigate('/technicians')}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Technician
            </Button>
          </div>
        </div>

        {/* Stats Cards - Only Total and Completed */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
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
        </div>

        {/* Charts and Todo List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
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

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Ticket Distribution</CardTitle>
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

          {/* Todo List Section */}
          <Card className="col-span-7">
            <CardHeader>
              <CardTitle>Todo List</CardTitle>
            </CardHeader>
            <CardContent>
              <TodoList />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
