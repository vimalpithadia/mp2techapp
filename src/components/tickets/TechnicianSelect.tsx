import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TechnicianSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export function TechnicianSelect({ value, onChange }: TechnicianSelectProps) {
  const [open, setOpen] = useState(false);

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, name, roles(name)')
        .eq('roles.name', 'technician')
        .eq('is_deleted', false);
      return data || [];
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            technicians?.find((tech) => tech.user_id === value)?.name
          ) : (
            "Select technician..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search technicians..." />
          <CommandList>
            <CommandEmpty>No technician found.</CommandEmpty>
            <CommandGroup>
              {technicians?.map((tech) => (
                <CommandItem
                  key={tech.user_id}
                  value={tech.user_id}
                  onSelect={(currentValue) => {
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === tech.user_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tech.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}