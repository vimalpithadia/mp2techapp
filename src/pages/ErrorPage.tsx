import { useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  const error = useRouteError() as any;

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Oops!</h1>
        <p className="text-xl mb-4">Sorry, an unexpected error has occurred.</p>
        <p className="text-gray-600 mb-8">
          {error.statusText || error.message}
        </p>
        <Button onClick={() => window.location.href = "/"}>
          Go to Home
        </Button>
      </div>
    </div>
  );
} 