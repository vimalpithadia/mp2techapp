import { Layout } from "@/components/Layout";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useEffect } from "react";

export default function Chat() {
  useEffect(() => {
    console.log("Chat component mounted");
  }, []);

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
        </div>
        <div className="border p-4 rounded-lg">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
} 