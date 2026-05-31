"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Household, HouseholdMember } from "@/types";

export function useHousehold() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["household"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("household_members")
        .select("household_id, role, households(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("No household");

      return {
        household: data.households as Household,
        role: data.role,
      };
    },
  });
}

export function useHouseholdMembers() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["household-members"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Not authenticated");

      const { data: memberData } = await supabase
        .from("household_members")
        .select("household_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!memberData) throw new Error("No household found");

      const { data, error } = await supabase
        .from("household_members")
        .select("*")
        .eq("household_id", memberData.household_id);

      if (error) throw error;

      return data as HouseholdMember[];
    },
  });
}
