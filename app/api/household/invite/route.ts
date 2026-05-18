import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user (cookie-based client)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    // Verify user is admin using cookie-based client
    const { data: memberData, error: memberError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      console.error("Member lookup error:", memberError);
      return NextResponse.json(
        { error: "No se encontró un hogar" },
        { status: 400 }
      );
    }

    if (memberData.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const householdId = memberData.household_id;

    // Use service role client for inserts and admin operations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if the email is already a member
    const { data: existingMembers } = await supabaseAdmin
      .from("household_members")
      .select("user_id")
      .eq("household_id", householdId);

    if (existingMembers && existingMembers.length > 0) {
      for (const member of existingMembers) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id);
        if (userData?.user?.email?.toLowerCase() === email.toLowerCase()) {
          return NextResponse.json(
            { error: "Este usuario ya es miembro del hogar" },
            { status: 400 }
          );
        }
      }
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabaseAdmin
      .from("household_invitations")
      .select("id")
      .eq("household_id", householdId)
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Ya existe una invitación pendiente para este email" },
        { status: 400 }
      );
    }

    // Create the invitation using service role client
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("household_invitations")
      .insert({
        household_id: householdId,
        invited_by: user.id,
        email: email.toLowerCase(),
      })
      .select("token")
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation insert error:", JSON.stringify(inviteError, null, 2));
      return NextResponse.json(
        { error: inviteError?.message || "Error al crear la invitación" },
        { status: 500 }
      );
    }

    // Build invitation URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/invite/accept?token=${invitation.token}`;

    // Send invitation email via service role client
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
      options: {
        redirectTo: inviteUrl,
      },
    });

    if (emailError) {
      console.error("Email send error:", JSON.stringify(emailError, null, 2));
      // Don't fail the request - invitation was created, user can use the link directly
    }

    return NextResponse.json({
      success: true,
      message: "Invitación enviada correctamente",
    });
  } catch (error) {
    console.error("Error in invite route:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET - List invitations for the household
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
    const { data: memberData } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .single();

    if (!memberData) {
      return NextResponse.json(
        { error: "No se encontró un hogar" },
        { status: 400 }
      );
    }

    // Get invitations
    const { data: invitations, error } = await supabase
      .from("household_invitations")
      .select("*")
      .eq("household_id", memberData.household_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Error al obtener invitaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel an invitation
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json(
        { error: "ID de invitación requerido" },
        { status: 400 }
      );
    }

    // Get user's household and verify admin
    const { data: memberData } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (!memberData || memberData.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden cancelar invitaciones" },
        { status: 403 }
      );
    }

    // Delete the invitation
    const { error } = await supabase
      .from("household_invitations")
      .delete()
      .eq("id", invitationId)
      .eq("household_id", memberData.household_id);

    if (error) {
      return NextResponse.json(
        { error: "Error al cancelar la invitación" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
