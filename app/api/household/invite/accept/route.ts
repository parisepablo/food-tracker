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
      return NextResponse.json(
        { error: "Debes iniciar sesión para aceptar una invitación" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token de invitación requerido" },
        { status: 400 }
      );
    }

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("household_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "La invitación no existe o ya fue utilizada" },
        { status: 404 }
      );
    }

    // Check invitation status
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "La invitación no existe o ya fue utilizada" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("household_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "La invitación ha expirado" },
        { status: 400 }
      );
    }

    // Check if user's email matches invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Esta invitación fue enviada a otro email" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("household_members")
      .select("id")
      .eq("household_id", invitation.household_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // Mark invitation as accepted anyway
      await supabase
        .from("household_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "Ya eres miembro de este hogar" },
        { status: 400 }
      );
    }

    // Add user to household
    const { error: memberError } = await supabase
      .from("household_members")
      .insert({
        household_id: invitation.household_id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json(
        { error: "Error al unirse al hogar" },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await supabase
      .from("household_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    return NextResponse.json({
      success: true,
      message: "Te has unido al hogar correctamente",
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
