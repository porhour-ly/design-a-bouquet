import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const VALID_WRAPPER_TYPES = ["pink", "blue", "red", "purple", "foral"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { wrapper_type, flowers, note } = body as {
    wrapper_type?: string;
    flowers?: unknown[];
    note?: unknown;
  };

  if (!wrapper_type || !VALID_WRAPPER_TYPES.includes(wrapper_type)) {
    return NextResponse.json({ error: "Invalid wrapper_type" }, { status: 400 });
  }

  if (!Array.isArray(flowers) || flowers.length === 0) {
    return NextResponse.json({ error: "Flowers array is required and cannot be empty" }, { status: 400 });
  }

  if (flowers.length > 50) {
    return NextResponse.json({ error: "Too many flowers (max 50)" }, { status: 400 });
  }

  // Validate note if provided
  let trimmedNote: string | null = null;
  if (note !== undefined && note !== null) {
    if (typeof note !== "string") {
      return NextResponse.json({ error: "Note must be a string" }, { status: 400 });
    }
    const t = note.trim();
    if (t.length > 150) {
      return NextResponse.json({ error: "Note must be 150 characters or fewer" }, { status: 400 });
    }
    if (t.length > 0) {
      trimmedNote = t;
    }
  }

  // Validate each flower has required fields
  for (const f of flowers) {
    const flower = f as Record<string, unknown>;
    if (
      typeof flower.type !== "string" ||
      typeof flower.nx !== "number" ||
      typeof flower.ny !== "number" ||
      typeof flower.scale !== "number" ||
      typeof flower.rotation !== "number" ||
      typeof flower.zIndex !== "number"
    ) {
      return NextResponse.json({ error: "Invalid flower data" }, { status: 400 });
    }
  }

  try {
    const { data, error } = await getSupabase()
      .from("bouquets")
      .insert({ wrapper_type, flowers, ...(trimmedNote ? { note: trimmedNote } : {}) })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save bouquet", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}
