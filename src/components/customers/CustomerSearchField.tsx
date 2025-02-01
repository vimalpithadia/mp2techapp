import { useState } from "react";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomerForm } from "./CustomerForm";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCustomerSearch } from "./useCustomerSearch";
import { Input } from "@/components/ui/input";

interface CustomerSearchFieldProps {
  selectedCustomerId: string | null;
  onCustomerSelect: (customer: Tables<'customers'>) => void;
}

export const CustomerSearchField = ({
  selectedCustomerId,
  onCustomerSelect,
}: CustomerSearchFieldProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const { data: customers = [], isLoading } = useCustomerSearch(searchTerm);
  const selectedCustomer = customers.find(c => c.cust_id === selectedCustomerId);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.cust_id === customerId);
    if (customer) {
      onCustomerSelect(customer);
      setIsSearchOpen(false);
      setSearchTerm("");
    }
  };

  const handleNewCustomerSuccess = (customerId: string) => {
    setIsDialogOpen(false);
    const newCustomer = customers.find(c => c.cust_id === customerId);
    if (newCustomer) {
      onCustomerSelect(newCustomer);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Select
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          value={selectedCustomerId || ""}
          onValueChange={handleCustomerSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select or add a customer" />
          </SelectTrigger>
          <SelectContent>
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                className="flex h-8 w-full rounded-md bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <SelectGroup>
              {isLoading ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : customers.length === 0 ? (
                <div className="p-2 text-center text-sm text-muted-foreground">
                  No customers found
                </div>
              ) : (
                customers.map((customer) => (
                  <SelectItem key={customer.cust_id} value={customer.cust_id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{customer.name}</span>
                      {customer.company && (
                        <span className="text-sm text-muted-foreground">
                          ({customer.company})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSuccess={handleNewCustomerSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};