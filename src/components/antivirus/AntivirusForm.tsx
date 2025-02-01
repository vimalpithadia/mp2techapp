import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

const formSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  installation_date: z.string().min(1, "Installation date is required"),
  license_key: z.string().min(1, "License key is required"),
  expiry_date: z.string().min(1, "Expiry date is required"),
});

interface AntivirusFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: string;
    customer_id: string;
    installation_date: string;
    license_key: string;
    expiry_date: string;
  };
  mode?: 'create' | 'edit';
}

export function AntivirusForm({ onSuccess, initialData, mode = 'create' }: AntivirusFormProps) {
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('cust_id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      installation_date: initialData?.installation_date || new Date().toISOString().split('T')[0],
      customer_id: initialData?.customer_id || '',
      license_key: initialData?.license_key || '',
      expiry_date: initialData?.expiry_date || '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        customer_id: initialData.customer_id,
        installation_date: initialData.installation_date.split('T')[0],
        license_key: initialData.license_key,
        expiry_date: initialData.expiry_date.split('T')[0],
      });
    }
  }, [initialData, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (mode === 'edit' && initialData) {
        const { error } = await supabase
          .from('antivirus_licenses')
          .update({
            customer_id: values.customer_id,
            installation_date: values.installation_date,
            license_key: values.license_key,
            expiry_date: values.expiry_date,
          })
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('License updated successfully');
      } else {
        const { error } = await supabase
          .from('antivirus_licenses')
          .insert([{
            customer_id: values.customer_id,
            installation_date: values.installation_date,
            license_key: values.license_key,
            expiry_date: values.expiry_date,
          }]);

        if (error) throw error;
        toast.success('License added successfully');
      }

      queryClient.invalidateQueries(['antivirus-licenses']);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(`Failed to ${mode} license: ${error.message}`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.cust_id} value={customer.cust_id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="installation_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Installation Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Key</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiry_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {mode === 'edit' ? 'Update License' : 'Add License'}
        </Button>
      </form>
    </Form>
  );
}