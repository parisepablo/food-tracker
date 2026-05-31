import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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

    // Use service role client to bypass RLS and reliably read/update invitations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from("household_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      console.error("Invitation lookup error:", inviteError);
      return NextResponse.json(
        { error: "La invitación no existe o ya fue utilizada" },
        { status: 404 }
      );
    }

    // Check if user's email matches invitation email
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Esta invitación fue enviada a otro email" },
        { status: 403 }
      );
    }

    // Check if user is already a member of the target household
    const { data: existingMember } = await supabaseAdmin
      .from("household_members")
      .select("id")
      .eq("household_id", invitation.household_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingMember) {
      // Ensure invitation is marked as accepted
      if (invitation.status === "pending") {
        await supabaseAdmin
          .from("household_invitations")
          .update({ status: "accepted" })
          .eq("id", invitation.id);
      }

      return NextResponse.json({
        success: true,
        message: "Ya eres miembro de este hogar",
      });
    }

    // If invitation is already accepted but user is not a member, try to add them
    // (handles edge cases from previous bugs)
    if (invitation.status === "accepted") {
      const { error: memberError } = await supabaseAdmin
        .from("household_members")
        .insert({
          household_id: invitation.household_id,
          user_id: user.id,
          role: "member",
        });

      if (memberError) {
        console.error("Error adding member to accepted invite:", memberError);
        return NextResponse.json(
          { error: "Error al unirse al hogar" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Te has unido al hogar correctamente",
      });
    }

    // Check if expired
    if (invitation.status === "expired" || new Date(invitation.expires_at) < new Date()) {
      // Mark as expired just in case
      await supabaseAdmin
        .from("household_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);

      return NextResponse.json(
        { error: "La invitación ha expirado" },
        { status: 400 }
      );
    }

    // Check invitation status
    if (invitation.status !== "pending") {
      return NextResponse.json(
        { error: "La invitación no existe o ya fue utilizada" },
        { status: 400 }
      );
    }

    // Add user to household
    const { error: memberError } = await supabaseAdmin
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
    await supabaseAdmin
      .from("household_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    // Clean up auto-created solo households (from the old bug)
    const { data: userMemberships } = await supabaseAdmin
      .from("household_members")
      .select("household_id, role")
      .eq("user_id", user.id);

    if (userMemberships) {
      for (const membership of userMemberships) {
        // Skip the household they were just invited to
        if (membership.household_id === invitation.household_id) continue;

        // If they are admin of another solo household, it's likely auto-created
        if (membership.role === "admin") {
          const { data: otherMembers } = await supabaseAdmin
            .from("household_members")
            .select("id")
            .eq("household_id", membership.household_id)
            .neq("user_id", user.id);

          if (!otherMembers || otherMembers.length === 0) {
            await supabaseAdmin
              .from("households")
              .delete()
              .eq("id", membership.household_id);
          }
        }
      }
    }

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
