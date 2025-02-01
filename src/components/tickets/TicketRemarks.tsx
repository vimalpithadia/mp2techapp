import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUploadSection } from "./FileUploadSection";

interface TicketRemarksProps {
  ticketId: string;
  technicianId: string;
}

export function TicketRemarks({ ticketId, technicianId }: TicketRemarksProps) {
  const [remark, setRemark] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const { data: remarks } = useQuery({
    queryKey: ["ticket-remarks", ticketId],
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_remarks")
        .select("*, profiles(name)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const addRemarkMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("ticket_remarks")
        .insert({
          ticket_id: ticketId,
          technician_id: technicianId,
          remark_text: remark,
        })
        .select()
        .single();

      if (error) throw error;

      if (files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${ticketId}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: imageError } = await supabase
            .from('ticket_images')
            .insert({
              ticket_id: ticketId,
              name: file.name,
              path: filePath,
            });

          if (imageError) throw imageError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-remarks", ticketId] });
      setRemark("");
      setFiles([]);
      toast.success("Remark added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add remark: " + error.message);
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <Textarea
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Add your remark..."
          className="mb-4"
        />
        <FileUploadSection
          files={files}
          setFiles={setFiles}
          maxSize={25 * 1024 * 1024}
        />
        <Button 
          onClick={() => addRemarkMutation.mutate()}
          disabled={!remark.trim() && files.length === 0}
          className="mt-4"
        >
          Add Remark
        </Button>
      </div>

      <div className="space-y-4">
        {remarks?.map((remark) => (
          <div key={remark.remark_id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{remark.profiles?.name}</p>
                <p className="text-sm text-gray-500">
                  {new Date(remark.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-gray-700">{remark.remark_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}