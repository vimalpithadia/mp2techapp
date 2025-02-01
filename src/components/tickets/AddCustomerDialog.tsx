import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm, CustomerFormData } from "./CustomerForm";

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerFormData) => void;
}

export const AddCustomerDialog = ({ open, onOpenChange, onSubmit }: AddCustomerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};