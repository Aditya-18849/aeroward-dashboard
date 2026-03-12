// app/api/anomaly/route.ts
// Auto-writes ML-classified anomalies to Supabase
// Drop at: app/api/anomaly/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for server-side writes
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      ward_id,
      ward_name,
      zone,
      aqi,
      priority,
      time,
      source,
      source_detail,
      llm_directive,
      dispatched,
      dispatch_time,
    } = body;

    // Upsert — update existing anomaly for ward if not dispatched,
    // otherwise insert a new one
    const { data: existing } = await supabase
      .from("anomalies")
      .select("id, dispatched")
      .eq("ward_id", ward_id)
      .eq("dispatched", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let result;

    if (existing) {
      // Update existing un-dispatched anomaly with fresh data
      result = await supabase
        .from("anomalies")
        .update({
          aqi,
          priority,
          source,
          source_detail,
          llm_directive,
        })
        .eq("id", existing.id);
    } else {
      // Insert new anomaly
      result = await supabase.from("anomalies").insert({
        ward_id,
        ward_name,
        zone,
        aqi,
        priority,
        source,
        source_detail: source_detail,
        llm_directive,
        dispatched: false,
        dispatch_time: "",
      });
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: existing ? "updated" : "inserted" });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Anomaly write failed", detail: err.message },
      { status: 500 }
    );
  }
}