import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplatePreviewProps {
  templateName: string;
  variables: string[];
  recipient: 'client' | 'technician' | 'admin';
  status: string;
}

export function TemplatePreview({
  templateName,
  variables,
  recipient,
  status
}: TemplatePreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">{templateName}</CardTitle>
          <Badge variant={
            recipient === 'client' ? 'default' :
            recipient === 'technician' ? 'secondary' : 'outline'
          }>
            {recipient}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Variables</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {variables.map((variable) => (
                <Badge key={variable} variant="outline">
                  {variable}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
