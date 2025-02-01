import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";
import { Label } from "@/components/ui/label";

type TicketPriority = Database["public"]["Enums"]["ticket_priority"];
type TicketType = Database["public"]["Enums"]["ticket_type"];

interface TicketDetailsFieldsProps {
  description: string;
  setDescription: (value: string) => void;
  typeOfIssue: string;
  setTypeOfIssue: (value: string) => void;
  priority: TicketPriority;
  setPriority: (value: TicketPriority) => void;
  ticketType: TicketType;
  setTicketType: (value: TicketType) => void;
  comment: string;
  setComment: (value: string) => void;
}

export function TicketDetailsFields({
  description,
  setDescription,
  typeOfIssue,
  setTypeOfIssue,
  priority,
  setPriority,
  ticketType,
  setTicketType,
  comment,
  setComment,
}: TicketDetailsFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter ticket description"
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type of Issue *</Label>
          <Select value={typeOfIssue} onValueChange={setTypeOfIssue} required>
            <SelectTrigger>
              <SelectValue placeholder="Select issue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority *</Label>
          <Select value={priority} onValueChange={setPriority} required>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ticket Type *</Label>
        <Select value={ticketType} onValueChange={setTicketType} required>
          <SelectTrigger>
            <SelectValue placeholder="Select ticket type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Comment</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add any comments or remarks"
          rows={3}
        />
      </div>
    </>
  );
}