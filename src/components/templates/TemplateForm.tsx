import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WhatsAppTemplate } from "@/types/templates";

interface TemplateFormProps {
  onSave: (template: WhatsAppTemplate) => void;
  initialData: WhatsAppTemplate | null;
}

export function TemplateForm({ onSave, initialData }: TemplateFormProps) {
  const [template, setTemplate] = useState<WhatsAppTemplate>(
    initialData || {
      id: crypto.randomUUID(),
      title: "",
      subject: "",
      message: "",
      recipient: "Client",
      status: "in_queue",
      isActive: true,
    }
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={template.title}
          onChange={(e) =>
            setTemplate({ ...template, title: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Subject</Label>
        <Input
          value={template.subject}
          onChange={(e) =>
            setTemplate({ ...template, subject: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Message</Label>
        <Textarea
          value={template.message}
          onChange={(e) =>
            setTemplate({ ...template, message: e.target.value })
          }
          className="min-h-[200px]"
        />
      </div>

      <div>
        <Label>Recipient</Label>
        <Select
          value={template.recipient}
          onValueChange={(value: 'Client' | 'Technician' | 'Admin') =>
            setTemplate({ ...template, recipient: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Client">Client</SelectItem>
            <SelectItem value="Technician">Technician</SelectItem>
            <SelectItem value="Admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Status</Label>
        <Select
          value={template.status}
          onValueChange={(value) =>
            setTemplate({ ...template, status: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TICKET_STATUSES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full"
        onClick={() => onSave(template)}
      >
        Save Template
      </Button>
    </div>
  );
} 