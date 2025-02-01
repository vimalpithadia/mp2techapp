import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Bot, User } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("ChatInterface mounted");
    // Verify API key is available
    console.log("API Key available:", !!import.meta.env.VITE_GEMINI_API_KEY);
  }, []);

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    try {
      const userMessage = input.trim();
      setInput('');
      setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
      setIsLoading(true);
      setError(null);

      console.log("Sending message to Gemini:", userMessage);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(userMessage);
      const response = await result.response;
      const text = response.text();
      console.log("Received response:", text);

      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (error: any) {
      console.error('Error generating response:', error);
      setError(error.message || 'An error occurred');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] p-4 border rounded-lg bg-background">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              Start a conversation by typing a message below.
            </div>
          )}
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`p-4 max-w-[80%] ${
                message.role === 'user' 
                  ? 'ml-auto bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.role === 'assistant' ? (
                  <Bot className="h-5 w-5 mt-1" />
                ) : (
                  <User className="h-5 w-5 mt-1" />
                )}
                <div className="space-y-1">
                  <div className="font-medium">
                    {message.role === 'assistant' ? 'Assistant' : 'You'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {isLoading && (
            <Card className="p-4 max-w-[80%] bg-muted">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
} 