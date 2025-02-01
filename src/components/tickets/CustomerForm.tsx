import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const customerSchema = z.object({
  name: z.string().min(1, "Name is required").refine(val => val === val.toUpperCase(), "Name must be in capital letters"),
  mobile: z.string().length(10, "Mobile number must be 10 digits"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().optional(),
  company: z.string().optional(),
  gst: z.string().length(15, "GST must be 15 digits").optional().or(z.literal("")),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
}

export const CustomerForm = ({ onSubmit }: CustomerFormProps) => {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      mobile: "",
      email: "",
      address: "",
      company: "",
      gst: "",
    },
  });

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
        <button type="submit" className="w-full">Add Customer</button>
      </form>
    </Form>
  );
};