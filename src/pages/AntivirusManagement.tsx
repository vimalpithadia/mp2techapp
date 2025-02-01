import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format, differenceInDays } from "date-fns";
import { AlertCircle, Shield, ShieldAlert, ShieldCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AntivirusForm } from "@/components/antivirus/AntivirusForm";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';

interface AntivirusLicense {
  id: string;
  customer_id: string;
  installation_date: string;
  license_key: string;
  expiry_date: string;
  customers: {
    name: string;
  };
}

const COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function AntivirusManagement() {
  const { data: licenses, isLoading } = useQuery({
    queryKey: ['antivirus-licenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('antivirus_licenses')
        .select(`
          *,
          customers (
            name
          )
        `)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      return data as AntivirusLicense[];
    },
  });

  const [selectedLicense, setSelectedLicense] = useState<AntivirusLicense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const columns: ColumnDef<AntivirusLicense>[] = [
    {
      accessorKey: "customers.name",
      header: "Customer Name",
    },
    {
      accessorKey: "installation_date",
      header: "Installation Date",
      cell: ({ row }) => format(new Date(row.original.installation_date), 'MMM d, yyyy'),
    },
    {
      accessorKey: "license_key",
      header: "License Key",
    },
    {
      accessorKey: "expiry_date",
      header: "Expiry Date",
      cell: ({ row }) => {
        const expiryDate = new Date(row.original.expiry_date);
        const daysUntilExpiry = differenceInDays(expiryDate, new Date());
        
        if (daysUntilExpiry < 0) {
          return (
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span className="text-red-500">Expired</span>
            </div>
          );
        }
        
        if (daysUntilExpiry <= 15) {
          return (
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-500">
                Expires in {daysUntilExpiry} days
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>{format(expiryDate, 'MMM d, yyyy')}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const license = row.original;
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedLicense(license);
              setIsEditDialogOpen(true);
            }}
          >
            Edit
          </Button>
        );
      },
    },
  ];

  // Calculate statistics
  const stats = licenses?.reduce((acc, license) => {
    const daysUntilExpiry = differenceInDays(new Date(license.expiry_date), new Date());
    if (daysUntilExpiry < 0) acc.expired++;
    else if (daysUntilExpiry <= 15) acc.expiringSoon++;
    else acc.active++;
    return acc;
  }, { active: 0, expiringSoon: 0, expired: 0 });

  const chartData = stats ? [
    { name: 'Active', value: stats.active },
    { name: 'Expiring Soon', value: stats.expiringSoon },
    { name: 'Expired', value: stats.expired },
  ] : [];

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            Antivirus Management
          </h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add License
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New License</DialogTitle>
              </DialogHeader>
              <AntivirusForm />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Shield className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.expiringSoon || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.expired || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>License Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expiring Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {licenses
                  ?.filter(license => {
                    const daysUntilExpiry = differenceInDays(new Date(license.expiry_date), new Date());
                    return daysUntilExpiry <= 15 && daysUntilExpiry >= 0;
                  })
                  .map(license => (
                    <div key={license.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{license.customers.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(license.expiry_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="warning">
                        {differenceInDays(new Date(license.expiry_date), new Date())} days left
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={licenses || []} />
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit License</DialogTitle>
            </DialogHeader>
            <AntivirusForm
              mode="edit"
              initialData={selectedLicense || undefined}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedLicense(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}