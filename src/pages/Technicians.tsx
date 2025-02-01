import { Layout } from "@/components/Layout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Pencil, Phone, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { TechnicianForm } from "@/components/technicians/TechnicianForm";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Technician {
  user_id: string;
  name: string | null;
  mobile: string | null;
  address: string | null;
  aadhar_number: string | null;
  blood_group: string | null;
  role_id: string | null;
  is_deleted: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const Technicians = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          toast.error('You must be logged in to access this page');
          navigate('/login');
          return;
        }

        // Get user's role
        const { data: profile, error: profileError } = await supabase
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
        const { data: role, error: roleError } = await supabase
          .from('roles')
          .select('name')
          .eq('role_id', profile?.role_id || '')
          .single();

        if (roleError) {
          console.error('Role Error:', roleError);
          toast.error('Failed to verify user role');
          return;
        }

        if (role.name !== 'admin') {
          toast.error('Only admin users can access this page');
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Failed to verify user role');
        navigate('/');
      }
    };

    checkAdminStatus();
  }, [navigate]);

  const { data: technicians, isLoading, error } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      try {
        // First get the role_id for technician role
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('role_id')
          .eq('name', 'technician')
          .eq('is_deleted', false)
          .single();
        
        if (roleError) throw roleError;
        if (!roleData) throw new Error('Technician role not found');

        // Then get all technicians with that role_id
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            user_id,
            name,
            mobile,
            address,
            aadhar_number,
            blood_group,
            role_id,
            is_deleted,
            created_at,
            updated_at
          `)
          .eq('role_id', roleData.role_id)
          .eq('is_deleted', false);

        if (error) throw error;
        return data as Technician[];
      } catch (error) {
        console.error('Error fetching technicians:', error);
        throw error;
      }
    },
    enabled: isAdmin, // Only fetch data if user is admin
  });

  const filteredTechnicians = technicians?.filter(tech => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (tech.name?.toLowerCase() || '').includes(searchLower) ||
      (tech.mobile?.toLowerCase() || '').includes(searchLower) ||
      (tech.address?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (!isAdmin) {
    return null; // Don't render anything until admin status is confirmed
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-500">Error: {(error as Error).message}</div>
    </div>
  );

  const handleEdit = (technician: Technician) => {
    setSelectedTechnician(technician);
    setIsEditDialogOpen(true);
  };

  const handleSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedTechnician(null);
    queryClient.invalidateQueries({ queryKey: ['technicians'] });
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Technicians</h1>
            <p className="text-gray-500">Manage your technician team</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Technician
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Technician</DialogTitle>
                <DialogDescription>
                  Add a new technician to your team
                </DialogDescription>
              </DialogHeader>
              <TechnicianForm 
                onSuccess={handleSuccess}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search technicians..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTechnicians?.map((technician) => (
            <Card key={technician.user_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{technician.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(technician)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4" />
                    {technician.mobile}
                  </div>
                  {technician.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="h-4 w-4" />
                      {technician.address}
                    </div>
                  )}
                  {technician.blood_group && (
                    <Badge variant="outline" className="mt-2">
                      Blood Group: {technician.blood_group}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Technician</DialogTitle>
              <DialogDescription>
                Update technician information
              </DialogDescription>
            </DialogHeader>
            {selectedTechnician && (
              <TechnicianForm 
                onSuccess={handleSuccess}
                onCancel={() => setIsEditDialogOpen(false)}
                initialData={selectedTechnician}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Technicians;