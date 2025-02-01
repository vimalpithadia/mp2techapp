import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, X, Calendar, Clock, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  is_completed: boolean;
  created_by: string;
  created_at: string;
}

const priorityColors = {
  low: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  high: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
};

export function TodoList() {
  const [newTodo, setNewTodo] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Todo[];
    },
  });

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('todos')
        .insert([
          {
            title: newTodo.trim(),
            description: description.trim(),
            due_date: dueDate || null,
            priority,
            created_by: user?.id,
          },
        ]);

      if (error) throw error;

      setNewTodo("");
      setDescription("");
      setDueDate("");
      setPriority('medium');
      setShowForm(false);
      queryClient.invalidateQueries(['todos']);
      toast.success('Todo added successfully');
    } catch (error) {
      console.error('Error adding todo:', error);
      toast.error('Failed to add todo');
    }
  };

  const handleToggleTodo = async (todo: Todo) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !todo.is_completed })
        .eq('id', todo.id);

      if (error) throw error;

      queryClient.invalidateQueries(['todos']);
      toast.success(todo.is_completed ? 'Todo unmarked' : 'Todo completed');
    } catch (error) {
      console.error('Error toggling todo:', error);
      toast.error('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      queryClient.invalidateQueries(['todos']);
      toast.success('Todo deleted successfully');
    } catch (error) {
      console.error('Error deleting todo:', error);
      toast.error('Failed to delete todo');
    }
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <Button 
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Todo
        </Button>
      ) : (
        <form onSubmit={handleAddTodo} className="space-y-4 p-4 border rounded-lg bg-card">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Todo title..."
            className="w-full"
          />
          <Input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full"
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1"
            />
            <Select
              value={priority}
              onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Add Todo
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="grid gap-2">
        {todos?.map((todo) => (
          <div
            key={todo.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors",
              todo.is_completed && "opacity-60"
            )}
          >
            <div className="flex items-start gap-4 flex-1">
              <Checkbox
                checked={todo.is_completed}
                onCheckedChange={() => handleToggleTodo(todo)}
              />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={todo.is_completed ? "line-through text-muted-foreground" : "font-medium"}>
                    {todo.title}
                  </span>
                  <Badge className={priorityColors[todo.priority]}>
                    {todo.priority}
                  </Badge>
                </div>
                {todo.description && (
                  <p className="text-sm text-muted-foreground">
                    {todo.description}
                  </p>
                )}
                {todo.due_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(new Date(todo.due_date), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Created: {format(new Date(todo.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-500/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
} 