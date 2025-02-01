import { Layout } from "@/components/Layout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Plus, Trash2, Copy } from "lucide-react";
import { WhatsAppTemplate, TICKET_STATUSES, DEFAULT_TEMPLATES } from "@/types/templates";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Templates() {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [showTemplateForm, setShowTemplateForm] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      console.log('Fetching templates...');
      try {
        const { data, error } = await supabase
          .from('whatsapp_templates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Fetch error:', error);
          throw error;
        }

        console.log('Fetched templates:', data);
        return data as WhatsAppTemplate[];
      } catch (error) {
        console.error('Query error:', error);
        throw error;
      }
    },
    onError: (error) => {
      console.error('Templates query error:', error);
      toast.error('Failed to fetch templates');
    }
  });

  const mutation = useMutation({
    mutationFn: async (template: WhatsAppTemplate) => {
      const templateForDB = {
        id: template.id,
        title: template.title,
        subject: template.subject,
        message: template.message,
        recipient: template.recipient,
        status: template.status,
        is_active: true,
        variables: template.variables || []
      };

      const { error } = await supabase
        .from('whatsapp_templates')
        .upsert([templateForDB], {
          onConflict: 'id',
          returning: 'minimal'
        });
      
      if (error) {
        throw new Error(error.message || 'Failed to save template');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-templates']);
      toast.success('Template saved successfully');
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Template save error:', error);
      toast.error(`Failed to save template: ${errorMessage}`);
    }
  });

  const handleImportDefaults = async () => {
    console.log('Starting import of default templates...');
    try {
      const templatesForDB = DEFAULT_TEMPLATES.map(template => ({
        title: template.title,
        subject: template.subject,
        message: template.message,
        recipient: template.recipient,
        status: template.status,
        is_active: true,
        variables: template.variables || []
      }));

      console.log('Prepared templates for import:', templatesForDB);

      const { error } = await supabase
        .from('whatsapp_templates')
        .insert(templatesForDB);

      if (error) {
        console.error('Import error:', error);
        throw new Error(`Failed to import templates: ${error.message}`);
      }

      console.log('Templates imported successfully');
      queryClient.invalidateQueries(['whatsapp-templates']);
      toast.success('Templates imported successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Import error details:', {
          message: error.message,
          stack: error.stack
        });
        toast.error(`Import failed: ${error.message}`);
      } else {
        console.error('Unknown import error:', error);
        toast.error('Failed to import templates');
      }
    }
  };

  const handleSaveTemplate = async (template: WhatsAppTemplate) => {
    console.log('Starting template save...', template);
    try {
      await mutation.mutateAsync(template);
      console.log('Template saved successfully');
      toast.success('Template saved successfully');
      setShowTemplateForm(false);
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to save template: ${errorMessage}`);
    }
  };

  const filteredTemplates = selectedStatus && selectedStatus !== 'all'
    ? templates?.filter(t => t.status === selectedStatus)
    : templates;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!templates?.length) {
    return (
      <Layout>
        <div className="space-y-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">WhatsApp Templates</h1>
            <Button variant="outline" onClick={handleImportDefaults}>
              Import Default Templates
            </Button>
          </div>
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">No templates found</p>
              <p className="text-sm text-muted-foreground">
                Click "Import Default Templates" to add the default templates
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Templates</h1>
            <p className="text-muted-foreground">
              Manage message templates for different ticket statuses
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportDefaults}>
              Import Defaults
            </Button>
            <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    console.log('New Template button clicked');
                    setShowTemplateForm(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <TemplateForm onSave={handleSaveTemplate} initialData={null} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={selectedStatus || undefined}
            onValueChange={(value) => setSelectedStatus(value || null)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(TICKET_STATUSES).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          {filteredTemplates?.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold">
                    {template.title}
                  </CardTitle>
                  <Badge variant="secondary">
                    {TICKET_STATUSES[template.status as keyof typeof TICKET_STATUSES]}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Template</DialogTitle>
                      </DialogHeader>
                      <TemplateForm onSave={mutation.mutate} initialData={template} />
                    </DialogContent>
                  </Dialog>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => {
                      const newTemplate = {
                        ...template,
                        id: crypto.randomUUID(),
                        title: `${template.title} (Copy)`
                      };
                      mutation.mutate(newTemplate);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Subject</h3>
                    <p>{template.subject}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Message</h3>
                    <p className="whitespace-pre-wrap">{template.message}</p>
                  </div>
                  {template.variables && template.variables.length > 0 && (
                    <div>
                      <h3 className="font-semibold">Variables</h3>
                      <div className="flex gap-2 flex-wrap">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
} 