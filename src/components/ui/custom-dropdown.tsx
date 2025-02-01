import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DropdownProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  error?: boolean;
  placeholder?: string;
}

export const Dropdown = ({
  label,
  value,
  onChange,
  options,
  loading = false,
  error = false,
  placeholder = "Select..",
}: DropdownProps) => {
  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Failed to load data</p>;

  return (
    <div>
      <Label className="block text-sm font-medium mb-2">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};