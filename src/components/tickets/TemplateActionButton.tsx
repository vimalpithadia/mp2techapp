import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
  message: string;
  status: string;
}

interface TemplateActionButtonProps {
  ticketStatus: string;
  ticketId: string;
  customerName: string;
  customerMobile?: string;
  technicianName?: string;
  issue: string;
  priority: string;
  resolution?: string;
}

export const TemplateActionButton = ({
  ticketStatus,
  ticketId,
  customerName,
  customerMobile,
  technicianName,
  issue,
  priority,
  resolution
}: TemplateActionButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['whatsapp_templates', ticketStatus],
    queryFn: async () => {
      console.log('Fetching templates for status:', ticketStatus);
      
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('id, name, message, status')
        .eq('status', ticketStatus)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Failed to load templates: ' + error.message);
        throw error;
      }

      console.log('Found templates:', data);
      return data as Template[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const replaceVariables = (text: string) => {
    return text
      .replace(/{customer_name}/g, customerName)
      .replace(/{technician_name}/g, technicianName || '')
      .replace(/{ticket_id}/g, ticketId)
      .replace(/{issue}/g, issue)
      .replace(/{priority}/g, priority)
      .replace(/{resolution}/g, resolution || '');
  };

  const handleSendTemplate = (template: Template) => {
    try {
      const message = replaceVariables(template.message);
      
      // Format phone number (remove spaces, add country code if needed)
      const phone = customerMobile?.replace(/\s+/g, '') || '';
      const whatsappPhone = phone.startsWith('+') ? phone.substring(1) : phone;
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp in a new window
      window.open(whatsappUrl, '_blank');
      
      toast.success(`Opening WhatsApp with template "${template.name}"`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error sending template:', error);
      toast.error('Failed to open WhatsApp');
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsDialogOpen(true)}
        title="Send WhatsApp Message"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Select WhatsApp Template</DialogTitle>
            <DialogDescription>
              Choose a template to send via WhatsApp based on the current ticket status: {ticketStatus}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : !customerMobile ? (
            <div className="text-center py-4 text-amber-500">
              Customer mobile number is required to send WhatsApp messages
            </div>
          ) : !templates?.length ? (
            <div className="text-center py-4 text-gray-500">
              No templates available for this ticket status
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSendTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 whitespace-pre-line">
                      {replaceVariables(template.message)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
