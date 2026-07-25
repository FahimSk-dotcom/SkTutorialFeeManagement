import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { settingsSchema } from "@/schemas";

export const DEFAULT_LOGO_URL = "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png";
export const DEFAULT_QR_URL = "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896626/WhatsApp_Image_2026-07-24_at_6.06.26_PM_l0ulqc.jpg";

const DEFAULT_SETTINGS = {
  instituteName: "SK Tutorials",
  logoUrl: DEFAULT_LOGO_URL,
  upiId: "sktutorials@upi",
  upiQrUrl: DEFAULT_QR_URL,
  receiptFooter: "Thank you for choosing SK Tutorials. Fee once paid is non-refundable.",
  whatsappTemplate: "Assalamualaikum, this is a tuition fee reminder from SK Tutorials.",
};

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const settings = await db.collection("settings").findOne({});

    if (!settings) {
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    return NextResponse.json({
      settings: {
        _id: settings._id.toString(),
        instituteName: settings.instituteName || DEFAULT_SETTINGS.instituteName,
        logoUrl: settings.logoUrl || DEFAULT_LOGO_URL,
        upiId: settings.upiId || DEFAULT_SETTINGS.upiId,
        upiQrUrl: settings.upiQrUrl || DEFAULT_QR_URL,
        receiptFooter: settings.receiptFooter || DEFAULT_SETTINGS.receiptFooter,
        whatsappTemplate: settings.whatsappTemplate || DEFAULT_SETTINGS.whatsappTemplate,
      },
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.collection("settings").findOne({});

    const updateData = {
      ...parsed.data,
      updatedAt: new Date(),
    };

    if (existing) {
      await db.collection("settings").updateOne({ _id: existing._id }, { $set: updateData });
    } else {
      await db.collection("settings").insertOne(updateData);
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
