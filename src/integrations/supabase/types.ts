export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          company: string | null
          created_at: string | null
          cust_id: string
          email: string | null
          gst: string | null
          is_deleted: boolean | null
          mobile: string
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          cust_id?: string
          email?: string | null
          gst?: string | null
          is_deleted?: boolean | null
          mobile: string
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          cust_id?: string
          email?: string | null
          gst?: string | null
          is_deleted?: boolean | null
          mobile?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aadhar_number: string | null
          address: string | null
          blood_group: string | null
          created_at: string | null
          is_deleted: boolean | null
          mobile: string | null
          name: string | null
          role_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aadhar_number?: string | null
          address?: string | null
          blood_group?: string | null
          created_at?: string | null
          is_deleted?: boolean | null
          mobile?: string | null
          name?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aadhar_number?: string | null
          address?: string | null
          blood_group?: string | null
          created_at?: string | null
          is_deleted?: boolean | null
          mobile?: string | null
          name?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          is_deleted: boolean | null
          name: string
          role_id: string
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          is_deleted?: boolean | null
          name: string
          role_id?: string
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          is_deleted?: boolean | null
          name?: string
          role_id?: string
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_images: {
        Row: {
          created_at: string | null
          image_id: string
          is_deleted: boolean | null
          name: string
          path: string
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          image_id?: string
          is_deleted?: boolean | null
          name: string
          path: string
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          image_id?: string
          is_deleted?: boolean | null
          name?: string
          path?: string
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_images_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      ticket_remarks: {
        Row: {
          created_at: string | null
          remark_id: string
          remark_text: string | null
          technician_id: string | null
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          remark_id?: string
          remark_text?: string | null
          technician_id?: string | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          remark_id?: string
          remark_text?: string | null
          technician_id?: string | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_remarks_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "ticket_remarks_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      tickets: {
        Row: {
          archive_status: boolean | null
          attachment_url: string | null
          comment: string | null
          created_at: string | null
          cust_id: string
          description: string | null
          device_brand: string | null
          device_status: string | null
          device_type: string | null
          is_deleted: boolean | null
          issue_type: Database["public"]["Enums"]["issue_type"] | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          serial_number: string | null
          technician_id: string | null
          ticket_id: string
          ticket_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type: Database["public"]["Enums"]["ticket_type"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          archive_status?: boolean | null
          attachment_url?: string | null
          comment?: string | null
          created_at?: string | null
          cust_id: string
          description?: string | null
          device_brand?: string | null
          device_status?: string | null
          device_type?: string | null
          is_deleted?: boolean | null
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          serial_number?: string | null
          technician_id?: string | null
          ticket_id?: string
          ticket_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          archive_status?: boolean | null
          attachment_url?: string | null
          comment?: string | null
          created_at?: string | null
          cust_id?: string
          description?: string | null
          device_brand?: string | null
          device_status?: string | null
          device_type?: string | null
          is_deleted?: boolean | null
          issue_type?: Database["public"]["Enums"]["issue_type"] | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          serial_number?: string | null
          technician_id?: string | null
          ticket_id?: string
          ticket_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_type?: Database["public"]["Enums"]["ticket_type"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_cust_id_fkey"
            columns: ["cust_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["cust_id"]
          },
          {
            foreignKeyName: "tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      issue_type: "hardware" | "software" | "network" | "other"
      ticket_priority: "critical" | "high" | "medium" | "low"
      ticket_status:
        | "in_queue"
        | "assigned"
        | "in_progress"
        | "pickup"
        | "client_approval"
        | "admin_approval"
        | "on_hold"
        | "done"
        | "complete"
        | "archive"
        | "feedback"
        | "rejected"
      ticket_type: "customer" | "internal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export interface Ticket {
  ticket_id: string;
  cust_id: string;
  description: string;
  issue_type: string;
  ticket_type: "customer" | "internal";
  priority: "low" | "medium" | "high" | "critical";
  ticket_status: string;
  comment?: string;
  attachment_url?: string;
  device_type: string;
  device_brand: string;
  serial_number: string;
  device_status: string;
  technician_id?: string;
  created_by: string;
  needs_approval: boolean;
  created_at: string;
  updated_at: string;
}

interface Notification {
  notification_id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  ticket_id: string;
  created_at: string;
  tickets?: Ticket;
}
