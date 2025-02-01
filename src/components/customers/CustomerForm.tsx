import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TablesInsert } from "@/integrations/supabase/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash } from "lucide-react";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required").refine(val => val === val.toUpperCase(), "Name must be in capital letters"),
  mobile: z.string().length(10, "Mobile number must be 10 digits"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().optional(),
  company: z.string().optional(),
  gst: z.string().length(15, "GST must be 15 digits").optional().or(z.literal("")),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  onSuccess: (customerId: string) => void;
  customerId?: string;
  defaultValues?: CustomerFormData;
  onDelete?: () => void;
}

export function CustomerForm({ onSuccess, customerId, defaultValues, onDelete }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues || {
      name: "",
      mobile: "",
      email: "",
      address: "",
      company: "",
      gst: "",
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      // Check if mobile number already exists
      const { data: existingCustomers, error: searchError } = await supabase
        .from("customers")
        .select("mobile")
        .eq("mobile", data.mobile)
        .eq("is_deleted", false);

      if (searchError) throw searchError;

      if (existingCustomers && existingCustomers.length > 0) {
        toast.error("A customer with this mobile number already exists");
        return;
      }

      const customerData: TablesInsert<'customers'> = {
        name: data.name,
        mobile: data.mobile,
        email: data.email || null,
        address: data.address || null,
        company: data.company || null,
        gst: data.gst || null,
      };

      const { data: newCustomer, error } = await supabase
        .from("customers")
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      toast.success("Customer added successfully");
      form.reset();
      if (newCustomer) {
        onSuccess(newCustomer.cust_id);
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer");
    }
  };

  const handleDelete = async () => {
    if (!customerId) return;

    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_deleted: true })
        .eq("cust_id", customerId);

      if (error) throw error;

      toast.success("Customer deleted successfully");
      onDelete?.();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="CUSTOMER NAME" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="1234567890" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="email@example.com" />
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
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Company name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gst"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GST</FormLabel>
              <FormControl>
                <Input {...field} placeholder="15-digit GST number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="submit">Submit</Button>
          {customerId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the customer and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </Form>
  );
}