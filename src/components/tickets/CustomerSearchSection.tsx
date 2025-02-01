import { Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

interface CustomerSearchSectionProps {
  customerSearch: string;
  setCustomerSearch: (value: string) => void;
  onCustomerSelect: (customer: { cust_id: string; name: string; mobile: string; address: string; }) => void;
  onAddCustomerClick: () => void;
}

export const CustomerSearchSection = ({ 
  customerSearch,
  setCustomerSearch,
  onCustomerSelect,
  onAddCustomerClick
}: CustomerSearchSectionProps) => {
  const { data: customers = [], isLoading } = useQuery<Tables<'customers'>[]>({
    queryKey: ['customers', customerSearch],
    queryFn: async () => {
      try {
        const query = supabase
          .from('customers')
          .select()
          .eq('is_deleted', false);

        if (customerSearch) {
          query.ilike('name', `%${customerSearch}%`);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error fetching customers:', error);
        return [];
      }
    },
    initialData: [], // Provide initial empty array
    staleTime: 30000, // Cache results for 30 seconds
  });

  // Ensure we have a valid array to work with
  const validCustomers = Array.isArray(customers) ? customers : [];

  return (
    <Command className="rounded-lg border shadow-md">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput 
          placeholder="Search customers..." 
          value={customerSearch}
          onValueChange={setCustomerSearch}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" 
        />
      </div>
      <CommandList>
        {isLoading ? (
          <div className="py-6 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Loading customers...</p>
          </div>
        ) : validCustomers.length === 0 ? (
          <CommandEmpty>
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No customers found.</p>
              <button
                onClick={onAddCustomerClick}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Add new customer
              </button>
            </div>
          </CommandEmpty>
        ) : (
          <CommandGroup>
            {validCustomers.map((customer) => (
              <CommandItem
                key={customer.cust_id}
                value={customer.cust_id}
                onSelect={() => onCustomerSelect({
                  cust_id: customer.cust_id,
                  name: customer.name,
                  mobile: customer.mobile || '',
                  address: customer.address || ''
                })}
              >
                {customer.name}
                {customer.company && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({customer.company})
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  );
};