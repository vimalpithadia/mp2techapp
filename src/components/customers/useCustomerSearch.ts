import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useDebounce } from "@/hooks/useDebounce";

export const useCustomerSearch = (searchTerm: string) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  return useQuery({
    queryKey: ['customers', debouncedSearchTerm],
    queryFn: async () => {
      try {
        const query = supabase
          .from('customers')
          .select()
          .eq('is_deleted', false);

        if (debouncedSearchTerm) {
          query.ilike('name', `%${debouncedSearchTerm}%`);
        }

        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        return data || [];
      } catch (err) {
        console.error("Error in customer fetch:", err);
        return []; 
      }
    },
    enabled: true,
    staleTime: 30000,
  });
};

export const useSelectedCustomer = (selectedCustomerId: string | null) => {
  return useQuery({
    queryKey: ['customer', selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      
      try {
        const { data, error: fetchError } = await supabase
          .from('customers')
          .select()
          .eq('cust_id', selectedCustomerId)
          .maybeSingle();
        
        if (fetchError) throw fetchError;
        
        return data;
      } catch (err) {
        console.error("Error in selected customer fetch:", err);
        return null;
      }
    },
    enabled: !!selectedCustomerId,
  });
};