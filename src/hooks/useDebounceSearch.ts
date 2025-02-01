import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type TableName = keyof Database['public']['Tables'];

interface UseDebounceSearchProps<T extends TableName> {
  searchTerm: string;
  tableName: T;
  searchColumn: string;
  select?: string;
  additionalFilters?: Record<string, { eq: any }>;
}

export const useDebounceSearch = <T extends TableName>({
  searchTerm,
  tableName,
  searchColumn,
  select = "*",
  additionalFilters = {},
}: UseDebounceSearchProps<T>) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  return useQuery({
    queryKey: [tableName, debouncedSearchTerm],
    queryFn: async () => {
      let query = supabase
        .from(tableName)
        .select(select);

      if (debouncedSearchTerm) {
        query = query.ilike(searchColumn, `%${debouncedSearchTerm}%`);
      }

      // Apply additional filters
      Object.entries(additionalFilters).forEach(([key, value]) => {
        query = query.eq(key, value.eq);
      });

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as Database['public']['Tables'][T]['Row'][];
    },
    enabled: true, // Always enable the query to show initial results
  });
};