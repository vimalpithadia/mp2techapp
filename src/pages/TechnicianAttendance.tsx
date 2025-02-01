import { Layout } from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, XCircle, Download, Check } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';

interface Technician {
  user_id: string;
  name: string | null;
  mobile: string | null;
}

interface Attendance {
  attendance_id: string;
  technician_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'half_day';
  is_approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
}

const TechnicianAttendance = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();

  // Get technicians
  const { data: technicians, isLoading: isLoadingTechnicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data: roleData } = await supabase
        .from('roles')
        .select('role_id')
        .eq('name', 'technician')
        .eq('is_deleted', false)
        .single();

      if (!roleData) throw new Error('Technician role not found');

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, mobile')
        .eq('role_id', roleData.role_id)
        .eq('is_deleted', false);

      if (error) throw error;
      return data;
    },
  });

  // Get attendance for selected date
  const { data: attendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['attendance', format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));

      if (error) throw error;
      return data as Attendance[];
    },
  });

  // Approve attendance mutation
  const approveMutation = useMutation({
    mutationFn: async (attendanceId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('attendance')
        .update({
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('attendance_id', attendanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance approved successfully');
    },
  });

  // Generate attendance report
  const generateReport = async () => {
    try {
      // Get the date range for the current month
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);

      // First get all technicians
      const { data: technicians, error: techError } = await supabase
        .from('profiles')
        .select('user_id, name, mobile')
        .eq('is_deleted', false);

      if (techError) throw techError;

      // Then get attendance records
      const { data: attendanceRecords, error: attendError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));

      if (attendError) throw attendError;

      // Combine the data
      const reportData = attendanceRecords.map(record => {
        const technician = technicians?.find(t => t.user_id === record.technician_id);
        return {
          'Date': format(new Date(record.date), 'dd/MM/yyyy'),
          'Technician Name': technician?.name || 'Unknown',
          'Mobile': technician?.mobile || 'N/A',
          'Check In': record.check_in ? format(new Date(record.check_in), 'hh:mm a') : '-',
          'Check Out': record.check_out ? format(new Date(record.check_out), 'hh:mm a') : '-',
          'Status': record.status,
          'Approved': record.is_approved ? 'Yes' : 'No',
          'Working Hours': record.check_in && record.check_out ? 
            calculateWorkingHours(new Date(record.check_in), new Date(record.check_out)) : '-'
        };
      });

      // Create Excel file
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      
      // Add some styling to the header row
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          fill: { fgColor: { rgb: "FFFF00" } },
          font: { bold: true }
        };
      }
      
      // Auto-size columns
      const colWidths = reportData.reduce((widths: { [key: string]: number }, row) => {
        Object.entries(row).forEach(([key, value]) => {
          const width = Math.max(
            key.length,
            value ? value.toString().length : 0
          );
          widths[key] = Math.max(widths[key] || 0, width);
        });
        return widths;
      }, {});

      ws['!cols'] = Object.values(colWidths).map(width => ({ width }));
      
      // Generate file name with month and year
      const fileName = `attendance_report_${format(selectedDate, 'MMM_yyyy')}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report: ' + (error as Error).message);
    }
  };

  // Helper function to calculate working hours
  const calculateWorkingHours = (checkIn: Date, checkOut: Date) => {
    const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`;
  };

  if (isLoadingTechnicians || isLoadingAttendance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-gray-500">Track and approve technician attendance</p>
          </div>
          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button onClick={generateReport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians?.map((technician) => {
            const attendanceRecord = attendance?.find(a => a.technician_id === technician.user_id);

            return (
              <Card key={technician.user_id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold">{technician.name}</CardTitle>
                  <Badge variant={
                    attendanceRecord?.is_approved ? "success" :
                    attendanceRecord?.status === 'present' ? "warning" :
                    "secondary"
                  }>
                    {attendanceRecord?.is_approved ? "Approved" :
                     attendanceRecord?.status || "Not Marked"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attendanceRecord?.check_in && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        Check In: {format(new Date(attendanceRecord.check_in), 'hh:mm a')}
                      </div>
                    )}
                    {attendanceRecord?.check_out && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        Check Out: {format(new Date(attendanceRecord.check_out), 'hh:mm a')}
                      </div>
                    )}
                    {attendanceRecord && !attendanceRecord.is_approved && (
                      <Button 
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => approveMutation.mutate(attendanceRecord.attendance_id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve Attendance
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default TechnicianAttendance;
