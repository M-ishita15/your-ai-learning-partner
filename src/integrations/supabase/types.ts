export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_access_state: {
        Row: {
          id: string
          message: string
          status: number
          updated_at: string
        }
        Insert: {
          id: string
          message: string
          status: number
          updated_at?: string
        }
        Update: {
          id?: string
          message?: string
          status?: number
          updated_at?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          citations: Json
          content: string
          created_at: string
          grounded: boolean
          id: string
          lesson_id: string
          retrieved: Json
          role: string
          user_id: string
          watched_up_to_sec: number
        }
        Insert: {
          citations?: Json
          content: string
          created_at?: string
          grounded?: boolean
          id?: string
          lesson_id: string
          retrieved?: Json
          role: string
          user_id?: string
          watched_up_to_sec?: number
        }
        Update: {
          citations?: Json
          content?: string
          created_at?: string
          grounded?: boolean
          id?: string
          lesson_id?: string
          retrieved?: Json
          role?: string
          user_id?: string
          watched_up_to_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      explanation_attempts: {
        Row: {
          answer: string
          created_at: string
          feedback: Json
          id: string
          lesson_id: string
          topic_marker_id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          feedback: Json
          id?: string
          lesson_id: string
          topic_marker_id: string
          user_id?: string
        }
        Update: {
          answer?: string
          created_at?: string
          feedback?: Json
          id?: string
          lesson_id?: string
          topic_marker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explanation_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explanation_attempts_topic_marker_id_fkey"
            columns: ["topic_marker_id"]
            isOneToOne: false
            referencedRelation: "topic_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          questions: Json
          scorecard: Json | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          questions?: Json
          scorecard?: Json | null
          status?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          questions?: Json
          scorecard?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_turns: {
        Row: {
          answer: string
          evidence: Json
          id: string
          question: string
          score: Json
          session_id: string
          turn_index: number
        }
        Insert: {
          answer: string
          evidence?: Json
          id?: string
          question: string
          score?: Json
          session_id: string
          turn_index: number
        }
        Update: {
          answer?: string
          evidence?: Json
          id?: string
          question?: string
          score?: Json
          session_id?: string
          turn_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "interview_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          duration_sec: number
          id: string
          note: string
          owner_id: string | null
          source: string
          summary: string
          title: string
          transcript_status: string
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          duration_sec?: number
          id?: string
          note?: string
          owner_id?: string | null
          source?: string
          summary?: string
          title: string
          transcript_status?: string
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          duration_sec?: number
          id?: string
          note?: string
          owner_id?: string | null
          source?: string
          summary?: string
          title?: string
          transcript_status?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          correct: boolean
          created_at: string
          id: string
          question_id: string
          request_id: string | null
          user_id: string
        }
        Insert: {
          correct: boolean
          created_at?: string
          id?: string
          question_id: string
          request_id?: string | null
          user_id?: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          id?: string
          question_id?: string
          request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          answer_index: number
          explanation: string
          id: string
          lesson_id: string
          options: Json
          question: string
          source_start_sec: number
          topic_marker_id: string | null
        }
        Insert: {
          answer_index: number
          explanation?: string
          id?: string
          lesson_id: string
          options: Json
          question: string
          source_start_sec?: number
          topic_marker_id?: string | null
        }
        Update: {
          answer_index?: number
          explanation?: string
          id?: string
          lesson_id?: string
          options?: Json
          question?: string
          source_start_sec?: number
          topic_marker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_topic_marker_id_fkey"
            columns: ["topic_marker_id"]
            isOneToOne: false
            referencedRelation: "topic_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_items: {
        Row: {
          due_at: string
          ease: number
          id: string
          interval_days: number
          last_result: string | null
          topic_marker_id: string
          user_id: string
        }
        Insert: {
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          last_result?: string | null
          topic_marker_id: string
          user_id?: string
        }
        Update: {
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          last_result?: string | null
          topic_marker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_items_topic_marker_id_fkey"
            columns: ["topic_marker_id"]
            isOneToOne: false
            referencedRelation: "topic_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_scorecards: {
        Row: {
          created_at: string
          id: string
          session_id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          token?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_scorecards_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_markers: {
        Row: {
          id: string
          lesson_id: string
          start_sec: number
          summary: string
          title: string
        }
        Insert: {
          id?: string
          lesson_id: string
          start_sec: number
          summary?: string
          title: string
        }
        Update: {
          id?: string
          lesson_id?: string
          start_sec?: number
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_markers_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      transcript_chunks: {
        Row: {
          end_sec: number
          id: string
          lesson_id: string
          start_sec: number
          text: string
          tsv: unknown
        }
        Insert: {
          end_sec: number
          id?: string
          lesson_id: string
          start_sec: number
          text: string
          tsv?: unknown
        }
        Update: {
          end_sec?: number
          id?: string
          lesson_id?: string
          start_sec?: number
          text?: string
          tsv?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "transcript_chunks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          lesson_id: string
          max_watched_sec: number
          updated_at: string
          user_id: string
        }
        Insert: {
          lesson_id: string
          max_watched_sec?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          lesson_id?: string
          max_watched_sec?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_chunks: {
        Args: {
          _lesson: string
          _limit?: number
          _query: string
          _upto: number
        }
        Returns: {
          end_sec: number
          id: string
          rank: number
          start_sec: number
          text: string
        }[]
      }
      match_later: {
        Args: { _lesson: string; _query: string; _upto: number }
        Returns: {
          start_sec: number
          title: string
        }[]
      }
      read_scorecard: { Args: { _token: string }; Returns: Json }
      record_playback: {
        Args: { _lesson: string; _position: number }
        Returns: number
      }
      replace_lesson_content: {
        Args: {
          _chunks: Json
          _generated: Json
          _lesson: string
          _source: string
          _title: string
          _youtube: string
        }
        Returns: string
      }
      reserve_ai_request: { Args: never; Returns: undefined }
      submit_quiz: {
        Args: { _pick: number; _question: string; _request: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
