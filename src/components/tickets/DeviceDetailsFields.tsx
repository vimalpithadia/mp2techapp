import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";

interface DeviceDetailsFieldsProps {
  form: UseFormReturn<any>;
}

export function DeviceDetailsFields({ form }: DeviceDetailsFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Device Details</h3>
      <FormField
        control={form.control}
        name="deviceType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Device Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select device type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="LAPTOP">Laptop</SelectItem>
                <SelectItem value="DESKTOP">Desktop</SelectItem>
                <SelectItem value="ALL-IN-ONE">All-in-One</SelectItem>
                <SelectItem value="OTHERS">Others</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="deviceBrand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand/Model</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter brand and model" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="serialNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Serial Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter serial number" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="deviceStatus"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Device Status</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="WORKING" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Working
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="NOT_WORKING" />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Not Working
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}