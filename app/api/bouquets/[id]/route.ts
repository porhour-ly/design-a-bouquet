import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Invalid bouquet ID" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("bouquets")
    .select("id, wrapper_type, flowers, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Bouquet not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
