export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      foods: {
        Row: {
          barcode: string | null;
          brand: string | null;
          calories_per_100g: number;
          carbs_per_100g: number;
          created_at: string;
          fat_per_100g: number;
          id: string;
          image_url: string | null;
          name: string;
          protein_per_100g: number;
        };
        Insert: {
          barcode?: string | null;
          brand?: string | null;
          calories_per_100g: number;
          carbs_per_100g: number;
          created_at?: string;
          fat_per_100g: number;
          id?: string;
          image_url?: string | null;
          name: string;
          protein_per_100g: number;
        };
        Update: {
          barcode?: string | null;
          brand?: string | null;
          calories_per_100g?: number;
          carbs_per_100g?: number;
          created_at?: string;
          fat_per_100g?: number;
          id?: string;
          image_url?: string | null;
          name?: string;
          protein_per_100g?: number;
        };
        Relationships: [];
      };
      ingredient_categories: {
        Row: {
          category: string;
          created_at: string;
          food_id: string;
          id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          food_id: string;
          id?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          food_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ingredient_categories_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          }
        ];
      };
      households: {
        Row: {
          active_meal_types: string[] | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          active_meal_types?: string[] | null;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          active_meal_types?: string[] | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          household_id: string;
          id: string;
          joined_at: string;
          role: string;
          user_id: string;
        };
        Insert: {
          household_id: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          household_id?: string;
          id?: string;
          joined_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "household_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      meal_plan_entries: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          meal_plan_id: string;
          meal_type: string;
          recipe_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          id?: string;
          meal_plan_id: string;
          meal_type: string;
          recipe_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          meal_plan_id?: string;
          meal_type?: string;
          recipe_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_entries_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plan_entries_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plan_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      meal_plan_rules: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          rule_config: Json;
          rule_type: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          rule_config: Json;
          rule_type: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          rule_config?: Json;
          rule_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_rules_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      meal_plans: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          week_start: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          week_start: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          week_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plans_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      nutrition_goals: {
        Row: {
          calories_goal: number | null;
          carbs_goal: number | null;
          fat_goal: number | null;
          household_id: string;
          id: string;
          protein_goal: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          calories_goal?: number | null;
          carbs_goal?: number | null;
          fat_goal?: number | null;
          household_id: string;
          id?: string;
          protein_goal?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          calories_goal?: number | null;
          carbs_goal?: number | null;
          fat_goal?: number | null;
          household_id?: string;
          id?: string;
          protein_goal?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "nutrition_goals_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "nutrition_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      recipe_ingredients: {
        Row: {
          food_id: string;
          id: string;
          quantity_grams: number;
          recipe_id: string;
        };
        Insert: {
          food_id: string;
          id?: string;
          quantity_grams: number;
          recipe_id: string;
        };
        Update: {
          food_id?: string;
          id?: string;
          quantity_grams?: number;
          recipe_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          }
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          created_by: string;
          description: string | null;
          household_id: string;
          id: string;
          image_url: string | null;
          name: string;
          servings: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          description?: string | null;
          household_id: string;
          id?: string;
          image_url?: string | null;
          name: string;
          servings: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          description?: string | null;
          household_id?: string;
          id?: string;
          image_url?: string | null;
          name?: string;
          servings?: number;
        };
        Relationships: [
          {
            foreignKeyName: "recipes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipes_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          }
        ];
      };
      shopping_list_items: {
        Row: {
          category: string | null;
          created_at: string;
          food_id: string | null;
          id: string;
          is_checked: boolean;
          is_manual: boolean;
          name: string;
          quantity_grams: number | null;
          shopping_list_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          food_id?: string | null;
          id?: string;
          is_checked?: boolean;
          is_manual?: boolean;
          name: string;
          quantity_grams?: number | null;
          shopping_list_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          food_id?: string | null;
          id?: string;
          is_checked?: boolean;
          is_manual?: boolean;
          name?: string;
          quantity_grams?: number | null;
          shopping_list_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey";
            columns: ["shopping_list_id"];
            isOneToOne: false;
            referencedRelation: "shopping_lists";
            referencedColumns: ["id"];
          }
        ];
      };
      shopping_lists: {
        Row: {
          created_at: string;
          household_id: string;
          id: string;
          is_archived: boolean;
          meal_plan_id: string | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          household_id: string;
          id?: string;
          is_archived?: boolean;
          meal_plan_id?: string | null;
          name: string;
        };
        Update: {
          created_at?: string;
          household_id?: string;
          id?: string;
          is_archived?: boolean;
          meal_plan_id?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_lists_household_id_fkey";
            columns: ["household_id"];
            isOneToOne: false;
            referencedRelation: "households";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "shopping_lists_meal_plan_id_fkey";
            columns: ["meal_plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;
