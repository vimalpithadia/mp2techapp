import { Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tables } from "@/integrations/supabase/types";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CustomerSearchInputProps {
  customers: Tables<'customers'>[];
  onCustomerSelect: (customer: Tables<'customers'>) => void;
  onAddNewClick: () => void;
  isLoading?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const CustomerSearchInput = ({ 
  customers, 
  onCustomerSelect,
  onAddNewClick,
  isLoading = false,
  searchTerm,
  onSearchChange,
}: CustomerSearchInputProps) => {
  return (
    <Command className="rounded-lg border shadow-md">
      <div className="flex items-center border-b px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <CommandInput 
          placeholder="Search customers..." 
          value={searchTerm}
          onValueChange={onSearchChange}
          className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" 
        />
      </div>
      <CommandList>
        {isLoading ? (
          <div className="py-6 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Searching customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <CommandEmpty className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No customers found.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onAddNewClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add New Customer
            </Button>
          </CommandEmpty>
        ) : (
          <CommandGroup heading="Customers">
            {customers.map((customer) => (
              <CommandItem
                key={customer.cust_id}
                value={customer.name}
                onSelect={() => onCustomerSelect(customer)}
                className="flex items-center justify-between"
              >
                <div>
                  <span className="font-medium">{customer.name}</span>
                  {customer.company && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({customer.company})
                    </span>
                  )}
                </div>
                {customer.mobile && (
                  <span className="text-sm text-muted-foreground">
                    {customer.mobile}
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