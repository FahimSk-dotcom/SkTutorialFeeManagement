import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { comparePassword, signJwtToken, setAdminCookie, ensureDefaultAdmin } from "@/lib/auth";
import { loginSchema } from "@/schemas";

export async function POST(req: Request) {
  try {
    await ensureDefaultAdmin();
    const body = await req.json();

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;

    const db = await getDb();
    const admin = await db.collection("admins").findOne({ email: email.toLowerCase() });

    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const isValid = await comparePassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const payload = {
      adminId: admin._id.toString(),
      email: admin.email,
      name: admin.name || "SK Admin",
    };

    const token = signJwtToken(payload, rememberMe);
    await setAdminCookie(token, rememberMe);

    return NextResponse.json({ success: true, user: payload });
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
