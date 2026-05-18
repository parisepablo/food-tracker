import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get current user
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

    // Get user's household and verify they are admin
    const { data: memberData, error: memberError } = await supabase
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json(
        { error: "No se encontró un hogar" },
        { status: 400 }
      );
    }

    if (memberData.role !== "admin") {
      return NextResponse.json(
        { error: "Solo los administradores pueden enviar invitaciones" },
        { status: 403 }
      );
    }

    const householdId = memberData.household_id;

    // Check if the email is already a member by looking up the user
    const { data: invitedUser } = await supabase
      .from("household_members")
      .select("id, users:user_id(email)")
      .eq("household_id", householdId);

    // Check if any existing member has this email
    if (invitedUser) {
      for (const member of invitedUser) {
        const memberEmail = (member as unknown as { users: { email: string } }).users?.email;
        if (memberEmail === email.toLowerCase()) {
          return NextResponse.json(
            { error: "Este usuario ya es miembro del hogar" },
            { status: 400 }
          );
        }
      }
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabase
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

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("household_invitations")
      .insert({
        household_id: householdId,
        invited_by: user.id,
        email: email.toLowerCase(),
      })
      .select("token")
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Error al crear la invitación" },
        { status: 500 }
      );
    }

    // Build invitation URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/invite/accept?token=${invitation.token}`;

    // Send invitation email via Supabase
    // We use generateLink to create a magic link and customize the email
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
      options: {
        redirectTo: inviteUrl,
      },
    });

    if (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't fail the request - invitation was created, user can use the link directly
    }

    return NextResponse.json({
      success: true,
      message: "Invitación enviada correctamente",
    });
  } catch (error) {
    console.error("Error in invite route:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
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
