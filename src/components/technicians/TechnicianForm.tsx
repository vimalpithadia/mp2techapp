import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthError } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const technicianSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .refine(
      (email) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
      },
      { message: "Please provide a valid email address" }
    )
    .optional(),
  mobile: z.string().min(10, "Mobile number must be at least 10 digits"),
  address: z.string().optional(),
  aadhar_number: z.string().optional(),
  blood_group: z.string().optional(),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

interface TechnicianFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    user_id: string;
    name: string | null;
    mobile: string | null;
    address: string | null;
    aadhar_number: string | null;
    blood_group: string | null;
  };
}

const getAuthErrorMessage = (error: AuthError) => {
  switch (error.message) {
    case "Email address is invalid":
      return "Please enter a valid email address";
    case "User already registered":
      return "A user with this email already exists";
    default:
      return error.message || "An error occurred during signup";
  }
};

export function TechnicianForm({ onSuccess, onCancel, initialData }: TechnicianFormProps) {
  const form = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      name: "",
      mobile: "",
      address: "",
      aadhar_number: "",
      blood_group: "",
    },
  });

  // Set form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        mobile: initialData.mobile || "",
        address: initialData.address || "",
        aadhar_number: initialData.aadhar_number || "",
        blood_group: initialData.blood_group || "",
      });
    }
  }, [form, initialData]);

  async function onSubmit(data: TechnicianFormData) {
    try {
      // First check if current user is admin
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      // Get current user's role
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile Error:', profileError);
        toast.error('Failed to verify user role');
        return;
      }

      // Get role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('name')
        .eq('role_id', currentUserProfile.role_id)
        .single();

      if (roleError) {
        console.error('Role Error:', roleError);
        toast.error('Failed to verify user role');
        return;
      }

      if (roleData.name !== 'admin') {
        toast.error('Only admin users can modify technician details');
        return;
      }

      // Get technician role ID
      const { data: techRoleData, error: techRoleError } = await supabase
        .from("roles")
        .select("role_id")
        .eq("name", "technician")
        .single();

      if (techRoleError) {
        console.error("Role Error:", techRoleError);
        throw techRoleError;
      }

      if (initialData) {
        // Update existing technician
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            mobile: data.mobile,
            address: data.address || null,
            aadhar_number: data.aadhar_number || null,
            blood_group: data.blood_group || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', initialData.user_id)
          .eq('role_id', techRoleData.role_id);

        if (updateError) {
          console.error('Update Error:', updateError);
          throw updateError;
        }
        
        toast.success('Technician updated successfully');
        onSuccess();
      } else {
        if (!data.email) {
          toast.error('Email is required for new technicians');
          return;
        }

        // Create new technician
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: 'Welcome@123', // Default password
          options: {
            data: {
              name: data.name,
              role: 'technician',
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              name: data.name,
              mobile: data.mobile,
              address: data.address || null,
              aadhar_number: data.aadhar_number || null,
              blood_group: data.blood_group || null,
              role_id: techRoleData.role_id,
              is_deleted: false,
            })
            .eq('user_id', authData.user.id);

          if (profileError) {
            console.error("Profile Error:", profileError);
            throw profileError;
          }
          
          toast.success('Technician created successfully');
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      if (error instanceof AuthError) {
        toast.error(getAuthErrorMessage(error));
      } else {
        toast.error('Failed to save technician');
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!initialData && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="Enter email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter mobile number" />
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
                <Input {...field} placeholder="Enter address" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="aadhar_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aadhar Number</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter Aadhar number" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="blood_group"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Group</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter blood group" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? 'Update' : 'Create'} Technician
          </Button>
        </div>
      </form>
    </Form>
  );
}