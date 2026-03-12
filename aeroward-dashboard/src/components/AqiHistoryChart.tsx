"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WARD_COLORS: Record<string, string> = {
  A: "#30D158", B: "#FFD60A", C: "#FF2D55", D: "#0EA5E9", E: "#BF5AF2",
};

const UUID_TO_SHORT: Record<string, string> = {
  "c534390a-9f5a-42b8-9b83-6e4ce3946b77": "A",
  "e7568f54-2b9e-4b51-a076-ed6513b3b91d": "B",
  "0d39942b-441d-4081-af2e-787c32af327f": "C",
  "e9931c64-caf1-4497-81ad-225e0803bab6": "D",
  "ed03ccf4-8318-4912-9e20-ce8833219b0e": "E",
};

interface HistoryRow { ward_id: string; aqi: number; recorded_at: string; }
interface ChartPoint { time: string; [key: string]: number | string; }

export default function AqiHistoryChart() {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWards, setActiveWards] = useState<Set<string>>(new Set(["A","B","C","D","E"]));

  useEffect(() => {
    fetchHistory();
    const id = setInterval(fetchHistory, 30000);
    return () => clearInterval(id);
  }, []);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("aqi_history")
      .select("ward_id, aqi, recorded_at")
      .order("recorded_at", { ascending: true })
      .limit(200);

    if (error || !data) return;

    const buckets: Record<string, ChartPoint> = {};
    data.forEach((row: HistoryRow) => {
      const shortId = UUID_TO_SHORT[row.ward_id] ?? row.ward_id;
      const time = new Date(row.recorded_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      if (!buckets[time]) buckets[time] = { time };
      const existing = (buckets[time][`Ward ${shortId}`] as number) ?? 0;
      buckets[time][`Ward ${shortId}`] = Math.max(existing, row.aqi);
    });

    setChartData(Object.values(buckets).slice(-40));
    setLoading(false);
  };

  const toggleWard = (id: string) => {
    setActiveWards(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0B1120", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "6px", padding: "10px 14px", fontFamily: "monospace", fontSize: "11px" }}>
        <div style={{ color: "#94a3b8", marginBottom: "6px" }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.name} style={{ color: p.color, marginBottom: "2px" }}>{p.name}: <strong>{p.value}</strong></div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ background: "#050A14", border: "1px solid rgba(14,165,233,0.1)", borderRadius: "8px", padding: "16px", marginTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontFamily: "sans-serif", fontSize: "13px", letterSpacing: "2px", color: "#e2e8f0", fontWeight: 700 }}>HISTORICAL AQI TRENDS</div>
          <div style={{ fontFamily: "monospace", fontSize: "9px", color: "rgba(148,163,184,0.4)", marginTop: "2px" }}>LAST 40 READINGS · AUTO-REFRESH 30s</div>
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["A","B","C","D","E"].map(id => (
            <button key={id} onClick={() => toggleWard(id)} style={{ padding: "2px 8px", borderRadius: "12px", border: `1px solid ${WARD_COLORS[id]}`, background: activeWards.has(id) ? `${WARD_COLORS[id]}22` : "transparent", color: activeWards.has(id) ? WARD_COLORS[id] : "#475569", fontFamily: "monospace", fontSize: "9px", cursor: "pointer" }}>
              W-{id}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "monospace", fontSize: "11px" }}>LOADING HISTORICAL DATA...</div>
      ) : chartData.length === 0 ? (
        <div style={{ height: "160px", display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontFamily: "monospace", fontSize: "11px" }}>NO DATA YET — SIMULATOR RUNNING...</div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,165,233,0.06)" />
            <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 8 }} tickLine={false} axisLine={{ stroke: "rgba(14,165,233,0.1)" }} />
            <YAxis tick={{ fill: "#475569", fontSize: 8 }} tickLine={false} axisLine={false} domain={[0, 500]} />
            <Tooltip content={<CustomTooltip />} />
            {["A","B","C","D","E"].filter(id => activeWards.has(id)).map(id => (
              <Line key={id} type="monotone" dataKey={`Ward ${id}`} stroke={WARD_COLORS[id]} strokeWidth={id === "C" ? 2 : 1.5} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        {[{ label: "GOOD", color: "#30D158" }, { label: "MODERATE", color: "#FFD60A" }, { label: "POOR", color: "#0EA5E9" }, { label: "CRITICAL", color: "#BF5AF2" }, { label: "HAZARDOUS", color: "#FF2D55" }].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "3px", fontFamily: "monospace", fontSize: "7px", color: item.color }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "1px", background: item.color }} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}