import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CustomerSelect } from "./CustomerSelect";
import { TechnicianSelect } from "./TechnicianSelect";
import { FileUploadSection } from "./FileUploadSection";
import { TicketDetailsFields } from "./TicketDetailsFields";
import { DeviceDetailsFields } from "./DeviceDetailsFields";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/ui/data-table";

const ticketSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  issueType: z.enum(["hardware", "software", "network", "other"]),
  ticketType: z.enum(["customer", "internal"]),
  deviceType: z.enum(["LAPTOP", "DESKTOP", "ALL-IN-ONE", "OTHERS"]),
  deviceBrand: z.string().min(1, "Brand/Model is required"),
  serialNumber: z.string().min(1, "Serial Number is required"),
  deviceStatus: z.enum(["WORKING", "NOT_WORKING"]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  technicianId: z.string().optional(),
  comment: z.string().optional(),
  mobile: z.string().optional(),
  address: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onSuccess: () => void;
  initialData?: any;
  isTechnician?: boolean;
}

export function TicketForm({ onSuccess, initialData, isTechnician }: TicketFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
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
  });

  const isAdmin = currentUser?.roles?.name === 'admin';

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: initialData ? {
      customerId: initialData.cust_id,
      title: initialData.title,
      description: initialData.description,
      issueType: initialData.issue_type,
      ticketType: initialData.ticket_type,
      ticketStatus: initialData.ticket_status,
      priority: initialData.priority,
      technicianId: initialData.technician_id,
      comment: initialData.comment,
      mobile: initialData.customers?.mobile,
      address: initialData.customers?.address,
      deviceType: initialData.device_type,
      deviceBrand: initialData.device_brand,
      serialNumber: initialData.serial_number,
      deviceStatus: initialData.device_status,
    } : {
      title: "",
      description: "",
      issueType: "hardware",
      ticketType: "customer",
      priority: "medium",
      comment: "",
      mobile: "",
      address: "",
      deviceType: "LAPTOP",
      deviceBrand: "",
      serialNumber: "",
      deviceStatus: "WORKING",
    },
  });

  const onSubmit = async (data: z.infer<typeof ticketSchema>) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('Starting ticket submission...', { data, isTechnician });

      const ticketData = {
          cust_id: data.customerId,
          title: data.title,
          description: data.description,
          issue_type: data.issueType,
          ticket_type: data.ticketType,
          device_type: data.deviceType,
          device_brand: data.deviceBrand,
          serial_number: data.serialNumber,
          device_status: data.deviceStatus,
        ticket_status: 'in_queue',
        priority: data.priority,
        technician_id: isTechnician ? null : data.technicianId,
        comment: data.comment || null,
        created_by: user.id,
        needs_approval: isTechnician
      };

      console.log('Prepared ticket data:', ticketData);

      const { error: insertError, data: newTicket } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (insertError) {
        console.error('Ticket insertion error:', insertError);
        throw new Error(`Failed to create ticket: ${insertError.message}`);
      }

      if (!isTechnician && data.technicianId) {
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ ticket_status: 'assigned' })
          .eq('ticket_id', newTicket.ticket_id);

        if (updateError) {
          console.error('Error updating ticket status:', updateError);
        }
      }

      // Create notification for admin if technician creates ticket
      if (isTechnician) {
        try {
          // First get admin role id
          const { data: roleData } = await supabase
            .from('roles')
            .select('role_id')
            .eq('name', 'admin')
            .single();

          if (roleData) {
            // Then get all admin profiles
            const { data: adminProfiles } = await supabase
              .from('profiles')
              .select('user_id')
              .eq('role_id', roleData.role_id);

            if (adminProfiles) {
              console.log('Creating notifications for admins:', adminProfiles);
              
              const notificationPromises = adminProfiles.map(admin => 
                supabase
                  .from('notifications')
                  .insert({
                    user_id: admin.user_id,
                    title: 'New Ticket Generated',
                    message: `Technician ${currentUser?.name} has created a new ticket "${data.title}" that needs assignment.`,
                    ticket_id: newTicket.ticket_id,
                    is_read: false
                  })
              );

              await Promise.all(notificationPromises);
              console.log('Admin notifications created successfully');
            }
          }
        } catch (error) {
          console.error('Error creating admin notifications:', error);
          // Don't throw here, just log the error as notifications are not critical
        }
      }

      toast.success(isTechnician ? 'Ticket submitted for approval' : 'Ticket created successfully');
      queryClient.invalidateQueries(['tickets']);
      onSuccess();
    } catch (error: any) {
      console.error('Ticket submission error:', error);
      toast.error(error.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <FormControl>
              <CustomerSelect
                    selectedCustomerId={field.value}
                    setSelectedCustomerId={field.onChange}
                setMobile={(value) => form.setValue("mobile", value)}
                setAddress={(value) => form.setValue("address", value)}
              />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Ticket title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Mobile number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Address" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Describe the issue" rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Issue *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticketType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isAdmin && (
            <>
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
            control={form.control}
            name="technicianId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Technician</FormLabel>
                <FormControl>
                      <TechnicianSelect 
                        value={field.value} 
                        onChange={field.onChange}
                      />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

              <FormField
                control={form.control}
                name="ticketStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticket Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="generated">Generated</SelectItem>
                        <SelectItem value="assigned">Ticket Assigned</SelectItem>
                        <SelectItem value="pickup_schedule">Pickup Schedule</SelectItem>
                        <SelectItem value="product_received">Product Received</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="estimate_sent">Estimate Sent</SelectItem>
                        <SelectItem value="approval_received">Approval Received</SelectItem>
                        <SelectItem value="delivery_scheduled">Delivery Scheduled</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                        <SelectItem value="payment_received">Payment Received</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                        <SelectItem value="hold">Hold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <DeviceDetailsFields form={form} />

          <div className="space-y-2">
            <FormLabel>Attachments</FormLabel>
            <FileUploadSection
              files={files}
              setFiles={setFiles}
              maxSize={50 * 1024 * 1024}
              acceptedTypes={".jpg,.jpeg,.png,.pdf,.mp4,.mov"}
            />
            <p className="text-sm text-muted-foreground">
              Max file size: 50 MB. Allowed formats: Images, PDF, Video
            </p>
          </div>

          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comments</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Add any comments" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isTechnician && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              Your ticket will be submitted for admin approval before being assigned.
            </p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Updating Ticket..." : "Creating Ticket..."}
              </>
            ) : (
            initialData ? "Update Ticket" : "Create Ticket"
            )}
          </Button>
        </form>
      </Form>
  );
}