import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json({ message: "No token" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ STEP 1: Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ message: "Invalid user" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email;

    // ✅ STEP 2: STORE deleted user (CRITICAL ADDITION)
    const { error: insertError } = await supabaseAdmin
      .from("deleted_users")
      .insert({
        id: userId,
        email: email,
      });

    if (insertError) {
      console.error("Delete tracking error:", insertError);
      return NextResponse.json(
        { message: "Failed to track deletion" },
        { status: 500 }
      );
    }

    // ✅ STEP 3: DELETE USER DATA (recommended cleanup)
    await supabaseAdmin.from("tasks").delete().eq("user_id", userId);
    await supabaseAdmin.from("daily_stats").delete().eq("user_id", userId);

    // (optional) if you have more tables → delete here

    // ✅ STEP 4: DELETE AUTH USER
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Delete user error:", deleteError);
      return NextResponse.json(
        { message: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Account deleted successfully" });

  } catch (err: any) {
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}