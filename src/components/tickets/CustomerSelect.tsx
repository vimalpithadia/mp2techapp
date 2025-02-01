import { Check, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { useDebounceSearch } from "@/hooks/useDebounceSearch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerSelectProps {
  selectedCustomerId: string;
  setSelectedCustomerId: (id: string) => void;
  setMobile?: (mobile: string) => void;
  setAddress?: (address: string) => void;
}

export const CustomerSelect = ({
  selectedCustomerId,
  setSelectedCustomerId,
  setMobile,
  setAddress,
}: CustomerSelectProps) => {
  const [open, setOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers = [], isLoading } = useDebounceSearch({
    searchTerm,
    tableName: 'customers',
    searchColumn: 'name',
    additionalFilters: {
      is_deleted: { eq: false }
    }
  });

  const selectedCustomer = customers.find(c => c.cust_id === selectedCustomerId);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomerId(customer.cust_id);
    setMobile?.(customer.mobile || '');
    setAddress?.(customer.address || '');
    setOpen(false);
    setSearchTerm("");
  };

  const handleAddSuccess = (customerId: string) => {
    setIsAddDialogOpen(false);
    const newCustomer = customers.find(c => c.cust_id === customerId);
    if (newCustomer) {
      handleCustomerSelect(newCustomer);
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomer ? (
              <span>{selectedCustomer.name}</span>
            ) : (
              <span className="text-muted-foreground">Select customer...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Search customers..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
            </div>
            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <CommandEmpty className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No customers found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setIsAddDialogOpen(true);
                      setOpen(false);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Customer
                  </Button>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.cust_id}
                      value={customer.cust_id}
                      onSelect={() => handleCustomerSelect(customer)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCustomerId === customer.cust_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <div>{customer.name}</div>
                        {customer.company && (
                          <div className="text-sm text-muted-foreground">{customer.company}</div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={handleAddSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};