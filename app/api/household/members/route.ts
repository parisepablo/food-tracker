import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get user's household
    const { data: memberData, error: memberError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "No se encontró un hogar" },
        { status: 400 }
      );
    }

    const householdId = memberData.household_id;

    // Use service role client to read auth emails for other users
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get household members
    const { data: members, error: membersError } = await supabaseAdmin
      .from("household_members")
      .select("id, user_id, role, joined_at")
      .eq("household_id", householdId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Members fetch error:", membersError);
      return NextResponse.json(
        { error: "Error al obtener miembros" },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Get profiles for all members
    const userIds = members.map((m) => m.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .in("id", userIds);

    // Get emails from auth.users via admin API
    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const profile = profiles?.find((p) => p.id === member.user_id);

        let email = profile?.display_name || "Usuario";
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
            member.user_id
          );
          if (userData?.user?.email) {
            email = userData.user.email;
          }
        } catch {
          // Fallback to profile display name
        }

        return {
          ...member,
          email,
          display_name: profile?.display_name || null,
          avatar_url: profile?.avatar_url || null,
        };
      })
    );

    return NextResponse.json({ members: membersWithDetails });
  } catch (error) {
    console.error("Error fetching household members:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
