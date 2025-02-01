import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Edit, Trash, Ticket } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { useNavigate } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customers, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("is_deleted", false);
        
      if (error) throw error;
      return data || [];
    },
  });

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (custId: string) => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({ is_deleted: true })
        .eq("cust_id", custId);

      if (error) throw error;
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await refetch();
      
      toast.success("Customer deleted successfully");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Failed to delete customer");
    }
  };

  const handleEditClick = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-gray-500">Manage customer information</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm 
                onSuccess={(customerId) => {
                  setIsAddDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["customers"] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Search className="text-gray-400" />
          <Input
            placeholder="Search customers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers?.map((customer) => (
            <Card key={customer.cust_id}>
              <CardHeader>
                <CardTitle>{customer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><span className="font-medium">Email:</span> {customer.email || 'N/A'}</p>
                  <p><span className="font-medium">Mobile:</span> {customer.mobile}</p>
                  <p><span className="font-medium">Address:</span> {customer.address || 'N/A'}</p>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(customer)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash className="w-4 h-4" />
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
                          <AlertDialogAction onClick={() => handleDelete(customer.cust_id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/create-ticket?customerId=${customer.cust_id}`)}
                    >
                      <Ticket className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm
              customerId={selectedCustomer?.cust_id}
              defaultValues={selectedCustomer}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["customers"] });
              }}
              onDelete={() => {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["customers"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}