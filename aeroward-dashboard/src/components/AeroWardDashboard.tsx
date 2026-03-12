"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Shield,
    Users,
    Radio,
    Activity,
    AlertTriangle,
    Eye,
    Smartphone,
    Zap,
    CheckCircle2,
    CheckCircle,
    Loader2,
} from "lucide-react";
import AqiHistoryChart from "@/src/components/AqiHistoryChart";

// ─── SUPABASE ───
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── TYPES ───
interface WardData {
    id: string;
    name: string;
    zone: string;
    aqi: number;
    baseAqi: number;
    pm25: number;
    pm10: number;
    no2: number;
    history: number[];
    sensorStatus: "nominal" | "warning" | "critical";
    position: { x: number; y: number };
}

interface ActionCardData {
    id: string;
    wardId: string;
    wardName: string;
    zone: string;
    aqi: number;
    priority: "HIGH" | "MEDIUM" | "LOW";
    time: string;
    source: string;
    sourceDetail: string;
    adminAction: string[];
    citizenAdvisory: string[];
    dispatched: boolean;
    dispatchTime: string;
}

// ─── CONSTANTS ───
const COLORS = {
    base: "#050A14",
    surface: "#0B1120",
    rim: "#0EA5E9",
    danger: "#FF2D55",
    anomaly: "#BF5AF2",
    nominal: "#30D158",
    warning: "#FFD60A",
    ghost: "rgba(148,163,184,0.4)",
};

const getAqiColor = (aqi: number): string => {
    if (aqi <= 50) return COLORS.nominal;
    if (aqi <= 100) return COLORS.warning;
    if (aqi <= 200) return COLORS.rim;
    if (aqi <= 300) return COLORS.anomaly;
    return COLORS.danger;
};

const getAqiLabel = (aqi: number): string => {
    if (aqi <= 50) return "GOOD";
    if (aqi <= 100) return "MODERATE";
    if (aqi <= 200) return "POOR";
    if (aqi <= 300) return "CRITICAL";
    return "HAZARDOUS";
};

const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

const INITIAL_WARDS: WardData[] = [
    {
        id: "A",
        name: "WARD A",
        zone: "GREENFIELD",
        aqi: 42,
        baseAqi: 42,
        pm25: 18,
        pm10: 35,
        no2: 12,
        history: [38, 40, 44, 41, 39, 43, 42, 42],
        sensorStatus: "nominal",
        position: { x: 30, y: 25 },
    },
    {
        id: "B",
        name: "WARD B",
        zone: "MILLHAVEN",
        aqi: 78,
        baseAqi: 78,
        pm25: 34,
        pm10: 62,
        no2: 23,
        history: [72, 76, 80, 74, 78, 75, 79, 78],
        sensorStatus: "nominal",
        position: { x: 65, y: 20 },
    },
    {
        id: "C",
        name: "WARD C",
        zone: "IRONBRIDGE",
        aqi: 245,
        baseAqi: 245,
        pm25: 89,
        pm10: 214,
        no2: 47,
        history: [220, 232, 240, 238, 250, 248, 242, 245],
        sensorStatus: "critical",
        position: { x: 50, y: 55 },
    },
    {
        id: "D",
        name: "WARD D",
        zone: "EASTPORT",
        aqi: 156,
        baseAqi: 156,
        pm25: 68,
        pm10: 130,
        no2: 38,
        history: [148, 150, 158, 154, 160, 155, 152, 156],
        sensorStatus: "warning",
        position: { x: 75, y: 60 },
    },
    {
        id: "E",
        name: "WARD E",
        zone: "NORTHPOINT",
        aqi: 95,
        baseAqi: 95,
        pm25: 42,
        pm10: 78,
        no2: 28,
        history: [88, 92, 96, 90, 94, 98, 93, 95],
        sensorStatus: "nominal",
        position: { x: 35, y: 75 },
    },
];

// ─── SUB-COMPONENTS ───

function AqiBadge({ aqi, size = "sm", isFlashing = false }: { aqi: number; size?: "sm" | "lg", isFlashing?: boolean }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    const color = getAqiColor(aqi);
    const fontSize = size === "lg" ? "48px" : "13px";
    const padding = size === "lg" ? "0" : "2px 8px";
    return (
        <span
            className="min-w-[52px] text-center"
            style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize,
                fontWeight: 600,
                color: mounted && isFlashing ? '#67e8f9' : color,
                textShadow: mounted && isFlashing
                    ? '0 0 12px #67e8f9, 0 0 24px #67e8f988'
                    : 'none',
                transition: mounted && isFlashing
                    ? 'color 0.08s linear, text-shadow 0.08s linear'
                    : 'color 0.4s ease-out, text-shadow 0.4s ease-out',
                padding,
                borderRadius: "2px",
                boxShadow: size === "sm" ? `0 0 0 1px ${color}` : "none",
                letterSpacing: "0.5px",
                lineHeight: size === "lg" ? 1 : 1.4,
            }}
            aria-label={`AQI ${mounted ? aqi : (typeof aqi === "number" ? aqi : 0)} - ${getAqiLabel(aqi)}`}
        >
            {aqi}
        </span>
    );
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
    if (data.length < 2) return null;
    const w = 60, h = 20, pad = 2;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => ({
        x: pad + (i / (data.length - 1)) * (w - pad * 2),
        y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }));
    const d = "M" + points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L");
    return (
        <svg width="100%" height="20" viewBox={`0 0 ${w} ${h}`} style={{ flexShrink: 0 }} aria-label="AQI trend sparkline">
            <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="2" fill={color} />
        </svg>
    );
}

function SonarRing({ cx, cy }: { cx: number; cy: number }) {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="14"
                    fill="none"
                    stroke={COLORS.anomaly}
                    strokeWidth="1"
                    opacity="0.6"
                    className="sonar-ring animate-ping"
                    style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: `${i * 0.6}s`, animationDuration: "2s", animationTimingFunction: "linear" }}
                />
            ))}
        </g>
    );
}

function WardRow({
    ward, rank, expanded, onToggle, isFlashing,
}: {
    ward: WardData; rank: number; expanded: boolean; onToggle: () => void; isFlashing: boolean;
}) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);

    const color = getAqiColor(ward.aqi);

    return (
        <div
            key={ward.id}
            onClick={onToggle}
            className="flex flex-row items-center justify-between w-full h-12 mb-2 px-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-800/50 border-l-2 border-l-transparent hover:border-l-cyan-500"
            style={{ background: expanded ? "rgba(14,165,233,0.06)" : "transparent" }}
        >
            <div className="w-24 flex-shrink-0 min-w-0">
                <span className="block text-sm font-semibold text-slate-200 truncate leading-none">Ward {ward.id}</span>
                <span className="block text-[10px] text-slate-500 truncate leading-none mt-0.5">{ward.zone}</span>
            </div>
            <div className="flex-shrink-0 min-w-[56px] flex justify-center">
                <span
                    className="text-xs font-bold font-mono px-2 py-1 rounded-md"
                    style={{
                        color: mounted && isFlashing ? '#67e8f9' : color,
                        background: `${color}15`,
                        textShadow: mounted && isFlashing ? '0 0 12px #67e8f9, 0 0 24px #67e8f988' : 'none',
                        transition: mounted && isFlashing ? 'color 0.08s linear, text-shadow 0.08s linear' : 'color 0.4s ease-out, text-shadow 0.4s ease-out',
                        boxShadow: `0 0 0 1px ${color}40`,
                    }}
                >
                    {mounted ? ward.aqi : ward.baseAqi}
                </span>
            </div>
            <div className="flex-1 min-w-0 max-w-[64px] h-6">
                <SparkLine data={ward.history} color={color} />
            </div>
        </div>
    );
}

function ActionCard({ data, onApprove }: { data: ActionCardData; onApprove: () => void; }) {
    const priorityColors: Record<string, string> = {
        HIGH: COLORS.danger,
        MEDIUM: COLORS.warning,
        LOW: COLORS.rim,
    };
    const pColor = priorityColors[data.priority] || COLORS.rim;

    const [showCitizenPreview, setShowCitizenPreview] = React.useState(false);
    const [dispatchState, setDispatchState] = React.useState<'idle' | 'loading' | 'success'>('idle');
    const dispatchTimer = React.useRef<any>(null);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        return () => clearTimeout(dispatchTimer.current);
    }, []);

    // Sync dispatched state from DB
    React.useEffect(() => {
        if (data.dispatched) setDispatchState('success');
    }, [data.dispatched]);

    const handleDispatch = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (dispatchState !== 'idle') return;
        setDispatchState('loading');
        dispatchTimer.current = setTimeout(() => {
            setDispatchState('success');
            onApprove();
        }, 1500);
    };

    return (
        <div
            style={{
                marginBottom: "10px",
                borderRadius: "4px",
                border: `1px solid rgba(14,165,233,0.1)`,
                borderLeft: data.dispatched ? `3px solid ${COLORS.nominal}` : `3px solid ${pColor}`,
                overflow: "hidden",
                background: COLORS.surface,
            }}
        >
            {/* Priority banner */}
            <div
                style={{
                    padding: "6px 10px",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "11px",
                    letterSpacing: "2px",
                    color: pColor,
                    borderBottom: `1px solid ${pColor}22`,
                    boxShadow: `0 0 0 1px ${pColor}33 inset`,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                }}
            >
                <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: pColor }} />
                ● {data.priority} PRIORITY INTERVENTION
            </div>

            <div style={{ padding: "10px" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: COLORS.ghost, marginBottom: "8px" }}>
                    {data.wardName} · {data.zone} · AQI {data.aqi} · {data.time} LOCAL
                </div>

                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "1px", color: "#94a3b8", marginBottom: "4px" }}>
                    SOURCE ANALYSIS
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "11px", color: "#cbd5e1", lineHeight: 1.5, marginBottom: "10px" }}>
                    {data.sourceDetail}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "1px", color: COLORS.rim, marginBottom: "4px" }}>
                    <Shield size={12} /> ADMIN ACTION
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "11px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "10px", paddingLeft: "4px" }}>
                    {data.adminAction.map((a, i) => (<div key={i}>▸ {a}</div>))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "1px", color: COLORS.rim, marginBottom: "4px" }}>
                    <Users size={12} /> CITIZEN ADVISORY
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "11px", color: "#94a3b8", lineHeight: 1.6, marginBottom: "12px", paddingLeft: "4px" }}>
                    {data.citizenAdvisory.map((a, i) => (<div key={i}>▸ {a}</div>))}
                </div>

                {/* Dispatch button states */}
                {dispatchState === 'idle' && !data.dispatched && (
                    <button onClick={handleDispatch}
                        className="w-full py-2.5 rounded-lg text-xs font-bold tracking-widest transition-all duration-200 active:scale-[0.98]"
                        style={{
                            background: data.priority === "LOW" ? "transparent" : "#9333ea",
                            boxShadow: data.priority === "LOW" ? `0 0 0 1px ${COLORS.rim}` : '0 0 20px rgba(168,85,247,0.4)',
                            color: "#fff",
                            marginBottom: "6px"
                        }}>
                        <span className="flex items-center justify-center gap-2">
                            {data.priority === "LOW" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <Zap size={13} strokeWidth={2.5} />}
                            APPROVE ACTION & DISPATCH
                        </span>
                    </button>
                )}

                {dispatchState === 'loading' && !data.dispatched && (
                    <button disabled className="w-full py-2.5 rounded-lg text-xs font-bold tracking-widest bg-slate-700 text-slate-400 cursor-not-allowed" style={{ marginBottom: "6px" }}>
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 size={13} className="animate-spin" />
                            TRANSMITTING TO FIELD UNIT...
                        </span>
                    </button>
                )}

                {(dispatchState === 'success' || data.dispatched) && (
                    <button disabled className="w-full py-2.5 rounded-lg text-xs font-bold tracking-widest bg-emerald-600/80 text-emerald-100 cursor-not-allowed ring-1 ring-emerald-500/50" style={{ boxShadow: '0 0 16px rgba(52,211,153,0.3)', marginBottom: "6px" }}>
                        <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={13} strokeWidth={2.5} />
                            DISPATCHED — UNITS EN ROUTE
                        </span>
                    </button>
                )}

                {(dispatchState === 'success' || data.dispatched) && (
                    <div className="mt-2 text-[10px] font-mono text-emerald-500/80 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                        DISPATCH LOG · {mounted ? data.dispatchTime : '--:--:--'} · REF: ENV-2024-0891
                    </div>
                )}

                {data.priority === "HIGH" && (
                    <button
                        className="w-full mt-2 mb-2 py-2 rounded-lg text-xs font-bold tracking-wide border border-slate-600 text-slate-400 hover:border-sky-500/60 hover:text-sky-400 transition-all duration-200"
                        onClick={(e) => { e.stopPropagation(); setShowCitizenPreview(true); }}
                    >
                        👁️ Preview Citizen App Alert
                    </button>
                )}

                <button className="btn-ghost" aria-label={`View evidence chain for ${data.wardName}`} style={{ width: "100%", padding: "6px", fontSize: "11px" }}>
                    <Eye size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                    VIEW EVIDENCE CHAIN
                </button>
            </div>

            {showCitizenPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowCitizenPreview(false); }}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="text-lg tracking-widest text-[#e2e8f0] mb-2 pb-2 border-b border-slate-700" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                            <Smartphone size={16} className="inline mr-2 text-slate-400" />
                            AeroWard Citizen Alert
                        </div>
                        <div className="text-xl tracking-wide mt-4" style={{ fontFamily: "'Bebas Neue', sans-serif", color: COLORS.danger }}>
                            🚨 AIR QUALITY ALERT — {data.wardName}
                        </div>
                        <div className="text-slate-400 text-sm mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>{data.zone} District</div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-slate-300 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>AQI:</span>
                            <AqiBadge aqi={data.aqi} />
                            <span className="text-xs font-bold" style={{ color: getAqiColor(data.aqi), fontFamily: "'JetBrains Mono', monospace" }}>Very Unhealthy</span>
                        </div>
                        <div className="text-slate-300 text-sm leading-relaxed mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <div className="font-bold mb-1 text-slate-200">What this means for you:</div>
                            <ul className="list-disc pl-5 mb-4 space-y-1">
                                <li>Avoid outdoor exercise</li>
                                <li>Keep windows closed until 18:00</li>
                                <li>N95 masks for essential travel</li>
                            </ul>
                            <div className="text-xs text-slate-400">
                                <div>Source: Construction activity, Site 4</div>
                                <div>Est. clearance: Today 18:00</div>
                                <div>Updated: {data.time} LOCAL</div>
                            </div>
                        </div>
                        <button className="w-full py-2 rounded-lg text-xs font-bold tracking-wide border border-slate-600 text-slate-400 hover:border-sky-500/60 hover:text-sky-400 transition-all duration-200" onClick={(e) => { e.stopPropagation(); setShowCitizenPreview(false); }}>
                            Close Preview
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatusBarComponent({ wards, lastSyncSec, mounted }: { wards: WardData[]; lastSyncSec: number; mounted: boolean; }) {
    const wardC = wards.find((w) => w.id === "C");
    const jsonStr = (mounted && wardC)
        ? `{"ward":"C","pm10":${wardC?.pm10 ?? 0},"pm25":${wardC?.pm25 ?? 0},"no2":${wardC?.no2 ?? 0},"ts":"${new Date().toISOString().slice(11, 19)}Z"}`
        : "";
    const anomalyCount = wards.filter((w) => w.aqi > 200).length;

    return (
        <div className="statusbar overflow-hidden">
            <style>{`
                @keyframes marquee { from { transform: translateX(0%) } to { transform: translateX(-50%) } }
                .animate-marquee { animation: marquee 12s linear infinite; }
            `}</style>
            <div style={{ overflow: "hidden", width: "35%", position: "relative" }}>
                <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1 px-4">
                    <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap tracking-wide">
                        Live Telemetry: Connected&nbsp;•&nbsp;Ingesting 47 Nodes
                    </span>
                </div>
            </div>
            <div style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                5 WARDS MONITORED &nbsp;·&nbsp; 47 SENSORS ACTIVE &nbsp;·&nbsp; {anomalyCount} ANOMALIES
            </div>
            <div style={{ textAlign: "right", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace" }}>
                LAST SYNC: {mounted ? lastSyncSec : "0"}s AGO &nbsp;·&nbsp; LATENCY: 12ms
            </div>
        </div>
    );
}

function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// ─── MAIN COMPONENT ───
export default function AeroWardDashboard() {
    const [wards, setWards] = useState<WardData[]>(INITIAL_WARDS);
    const [clock, setClock] = useState("");
    const [lastSync, setLastSync] = useState(0);
    const [countdown, setCountdown] = useState(4 * 60 + 53);
    const dispatchSuccessRef = useRef(false);
    const [flashingWards, setFlashingWards] = useState<Set<string>>(new Set());
    const [histories, setHistories] = useState<Record<string, number[]>>(() =>
        Object.fromEntries(INITIAL_WARDS.map(w => [w.id, w.history]))
    );
    const [expandedWard, setExpandedWard] = useState<string | null>(null);
    const lastSyncRef = useRef(0);
    const [mounted, setMounted] = useState(false);
    const [autoDispatch, setAutoDispatch] = useState(false);
    const [showAutoWarning, setShowAutoWarning] = useState(false);

    const [actions, setActions] = useState<ActionCardData[]>([]);

    // ── FIX 3: Mount guard ──
    useEffect(() => { setMounted(true); }, []);

    // ════════════════════════════════════════════════
    // SUPABASE CHANGE 1: Fetch action cards from DB
    // ════════════════════════════════════════════════
    useEffect(() => {
        const fetchAnomalies = async () => {
            const { data, error } = await supabase
                .from("anomalies")
                .select("*")
                .order("detected_at", { ascending: false });

            if (data && !error) {
                setActions(
                    data.map((row) => ({
                        id: row.id,
                        wardId: row.ward_id,
                        wardName: row.ward_name ?? `WARD ${row.ward_id?.slice(0,4).toUpperCase()}`,
                        zone: row.zone ?? "UNKNOWN",
                        aqi: row.aqi ?? 0,
                        priority: (row.priority as "HIGH" | "MEDIUM" | "LOW") ?? "HIGH",
                        time: new Date(row.detected_at ?? row.created_at).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        source: row.source ?? row.anomaly_type ?? "Unknown",
                        sourceDetail: row.source_detail ?? row.anomaly_type ?? "",
                        adminAction: (() => {
                            try {
                                const d = typeof row.llm_directive === "string"
                                    ? JSON.parse(row.llm_directive)
                                    : row.llm_directive;
                                return d?.adminAction ?? [];
                            } catch { return []; }
                        })(),
                        citizenAdvisory: (() => {
                            try {
                                const d = typeof row.llm_directive === "string"
                                    ? JSON.parse(row.llm_directive)
                                    : row.llm_directive;
                                return d?.citizenAdvisory ?? [];
                            } catch { return []; }
                        })(),
                        dispatched: row.dispatched ?? row.is_resolved ?? false,
                        dispatchTime: row.dispatch_time ?? "",
                    }))
                );
            } else {
                // Fallback to static data if Supabase is unreachable
                setActions([
                    {
                        id: "1",
                        wardId: "C",
                        wardName: "WARD C",
                        zone: "IRONBRIDGE",
                        aqi: 245,
                        priority: "HIGH",
                        time: "14:23",
                        source: "Construction Dust",
                        sourceDetail: "Localized construction — Site 4. Unpermitted excavation cross-referenced via sensor mesh + satellite overlay.",
                        adminAction: ["Deploy municipal water sprinklers to Site 4.", "Issue stop-work order ENV-2024-0891.", "Halt all unpermitted digging operations immediately."],
                        citizenAdvisory: ["Avoid outdoor exercise. Keep windows closed until 18:00.", "N95 masks advised for essential transit."],
                        dispatched: false,
                        dispatchTime: "",
                    },
                    {
                        id: "2",
                        wardId: "D",
                        wardName: "WARD D",
                        zone: "EASTPORT",
                        aqi: 156,
                        priority: "MEDIUM",
                        time: "14:18",
                        source: "Industrial Emissions",
                        sourceDetail: "Elevated NO₂ levels from Eastport Industrial Zone. Refinery stack emissions exceed permissible limits by 23%.",
                        adminAction: ["Issue emission compliance notice to Eastport Refinery.", "Request EPA satellite verification pass."],
                        citizenAdvisory: ["Sensitive groups should remain indoors.", "HEPA filter advisory for schools in 2km radius."],
                        dispatched: false,
                        dispatchTime: "",
                    },
                    {
                        id: "3",
                        wardId: "B",
                        wardName: "WARD B",
                        zone: "MILLHAVEN",
                        aqi: 78,
                        priority: "LOW",
                        time: "14:10",
                        source: "Traffic Congestion",
                        sourceDetail: "Moderate AQI elevation linked to peak-hour vehicular congestion on Millhaven Boulevard.",
                        adminAction: ["Activate dynamic traffic signal optimization.", "Divert heavy vehicles via alternate route R-14."],
                        citizenAdvisory: ["No immediate health risk. Standard precautions advised."],
                        dispatched: false,
                        dispatchTime: "",
                    },
                ]);
            }
        };
        fetchAnomalies();
    }, []);

    // ════════════════════════════════════════════════
    // SUPABASE CHANGE 2: Realtime telemetry subscription
    // ════════════════════════════════════════════════
    useEffect(() => {
        const channel = supabase
            .channel("telemetry-live")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "telemetry_data" },
                (payload) => {
                    const row = payload.new as any;
                    setWards((prev) =>
                        prev.map((w) =>
                            w.id === row.ward_id
                                ? {
                                    ...w,
                                    aqi: row.aqi,
                                    pm25: row.pm25,
                                    pm10: row.pm10,
                                    no2: row.no2,
                                    sensorStatus: row.sensor_status ?? w.sensorStatus,
                                }
                                : w
                        )
                    );
                    // Flash the updated ward
                    setFlashingWards(new Set([row.ward_id]));
                    setTimeout(() => setFlashingWards(new Set()), 300);
                    // Reset sync timer
                    lastSyncRef.current = 0;
                    setLastSync(0);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // ─── Clock + last sync (1s) + Countdown ──
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, "0");
            const m = String(now.getMinutes()).padStart(2, "0");
            const s = String(now.getSeconds()).padStart(2, "0");
            setClock(`${h}:${m}:${s}`);
            lastSyncRef.current += 1;
            setLastSync(lastSyncRef.current);

            setCountdown(c => {
                if (c <= 1) {
                    if (dispatchSuccessRef.current) return 0;
                    return 5 * 60;
                }
                return c - 1;
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // ─── Local AQI Fluctuation (keeps UI alive between Supabase updates) ──
    useEffect(() => {
        const id = setInterval(() => {
            lastSyncRef.current = 0;
            setLastSync(0);
            setWards(prev => {
                const flashing = new Set<string>();
                const next = prev.map(ward => {
                    const variance = ward.id === 'C' ? 12 : 4;
                    const delta = Math.round(
                        ((Math.random() + Math.random()) / 2 - 0.5) * variance * 2
                    );
                    const newAqi = Math.max(10, Math.min(500, ward.aqi + delta));
                    if (delta !== 0) flashing.add(ward.id);

                    const pm25Ratio = ward.pm25 / (ward.aqi || 1);
                    const pm10Ratio = ward.pm10 / (ward.aqi || 1);
                    const no2Ratio = ward.no2 / (ward.aqi || 1);

                    return { ...ward, baseAqi: ward.baseAqi, aqi: newAqi, pm25: Math.round(newAqi * pm25Ratio), pm10: Math.round(newAqi * pm10Ratio), no2: Math.round(newAqi * no2Ratio) };
                });

                setHistories(h => {
                    const newHistories = Object.fromEntries(next.map(w => [w.id, [...(h[w.id] || w.history).slice(-7), w.aqi]]));
                    return newHistories;
                });

                setFlashingWards(flashing);
                setTimeout(() => setFlashingWards(new Set()), 300);
                return next;
            });

            setWards((prev) => {
                const updatedPrev = prev.map(w => ({ ...w, history: histories[w.id] || w.history })).sort((a, b) => b.aqi - a.aqi);
                return updatedPrev;
            });
        }, 3500);
        return () => clearInterval(id);
    }, [histories]);

    // ════════════════════════════════════════════════
    // SUPABASE CHANGE 3: Persist dispatch to DB
    // ════════════════════════════════════════════════
    const handleApprove = useCallback(async (actionId: string) => {
        dispatchSuccessRef.current = true;
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        // Update local state immediately for instant UI feedback
        setActions((prev) =>
            prev.map((a) =>
                a.id === actionId ? { ...a, dispatched: true, dispatchTime: ts } : a
            )
        );

        // Persist to Supabase
        const { error } = await supabase
            .from("anomalies")
            .update({
                dispatched: true,
                is_resolved: true,
                dispatch_time: ts
            })
            .eq("id", actionId);

        if (error) {
            console.error("[AeroWard] Failed to persist dispatch:", error.message);
        }
    }, []);

    const compositeAqi = Math.round(wards.reduce((sum, w) => sum + w.aqi, 0) / wards.length);
    const compositeColor = getAqiColor(compositeAqi);
    const aiConfidence = 91;

    const connections = [
        ["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["C", "E"], ["A", "E"],
    ];

    return (
        <>
            <div className="scanline-overlay" />
            <svg
                aria-hidden="true"
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                    opacity: 0.025,
                    zIndex: 99,
                }}
            >
                <filter id="noiseFilter">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
                </filter>
                <rect width="100%" height="100%" filter="url(#noiseFilter)" />
            </svg>

            <div className="command-grid">
                {/* ═══ TOPBAR ═══ */}
                <div className="topbar">
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "256px" }}>
                        <span className="relative flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animationDuration: '1.5s' }} />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", color: "#fff", letterSpacing: "3px" }}>AEROWARD</span>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "10px", color: COLORS.ghost, paddingTop: "4px" }}>
                            Urban Air Intelligence Platform · Metro Division
                        </span>
                    </div>

                    <div className="flex-1 flex items-center justify-center overflow-hidden mx-5">
                        <span className="text-[10px] font-mono text-slate-600 hidden md:block tracking-wide uppercase">
                            AEROWARD INTELLIGENCE PLATFORM · METRO DIVISION · LIVE
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px", whiteSpace: "nowrap" }}>
                        <div className="flex flex-row items-center gap-2 flex-shrink-0 relative mr-4">
                            <div className="flex flex-col items-end flex-shrink-0">
                                <span className="text-[9px] text-slate-500 whitespace-nowrap leading-none tracking-wide uppercase">Auto-Dispatch</span>
                                <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap leading-none tracking-widest uppercase mt-0.5">Interventions</span>
                            </div>
                            <div
                                onClick={() => {
                                    const next = !autoDispatch;
                                    setAutoDispatch(next);
                                    if (next) { setShowAutoWarning(true); setTimeout(() => setShowAutoWarning(false), 3000); }
                                    else { setShowAutoWarning(false); }
                                }}
                                className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors duration-200 flex-shrink-0 flex items-center px-0.5 ${autoDispatch ? 'bg-red-600/80 ring-1 ring-red-500/50' : 'bg-slate-700 ring-1 ring-white/10'}`}
                                style={autoDispatch ? { boxShadow: '0 0 12px rgba(239,68,68,0.4)' } : {}}
                            >
                                <span className={`h-4 w-4 rounded-full bg-white transition-transform duration-200 inline-block flex-shrink-0 ${autoDispatch ? 'translate-x-5' : 'translate-x-0'}`} />
                                <span className={`absolute text-[7px] font-bold ${autoDispatch ? "left-1.5 text-red-100" : "right-1 text-slate-400"}`}>
                                    {autoDispatch ? "AUTO" : "MANUAL"}
                                </span>
                            </div>
                            {showAutoWarning && (
                                <div className="absolute top-10 right-0 bg-red-950/90 border border-red-800 text-red-300 text-[10px] rounded-lg px-3 py-2 whitespace-nowrap shadow-lg z-50">
                                    ⚠ AI will auto-dispatch without human approval
                                </div>
                            )}
                        </div>

                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "2px", color: COLORS.nominal, boxShadow: `0 0 0 1px ${COLORS.rim}`, padding: "2px 10px", borderRadius: "2px" }}>
                            SYSTEM STATUS: NOMINAL
                        </span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: COLORS.rim, fontWeight: 500 }}>
                            {mounted ? clock : "--:--:--"}
                        </span>
                        <Radio size={16} className="broadcast-icon" style={{ color: COLORS.rim }} aria-label="Broadcast status indicator" />
                    </div>
                </div>

                {/* ═══ LEFT PANEL ═══ */}
                <div className="left-panel">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "2px", color: "#e2e8f0" }}>WARD THREAT MATRIX</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: COLORS.rim, boxShadow: `0 0 0 1px ${COLORS.rim}`, padding: "1px 6px", borderRadius: "2px" }}>{wards.length}</span>
                    </div>

                    <div style={{ textAlign: "center", marginBottom: "12px", padding: "12px 0", borderBottom: "1px solid rgba(14,165,233,0.08)" }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "2px", color: COLORS.ghost, marginBottom: "4px" }}>CITY COMPOSITE AQI</div>
                        <AqiBadge aqi={compositeAqi} size="lg" isFlashing={flashingWards.size > 0} />
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "11px", letterSpacing: "1px", color: compositeColor, marginTop: "4px" }}>{getAqiLabel(compositeAqi)}</div>
                        <div className="criticality-bar" style={{ marginTop: "8px" }}>
                            <div className="criticality-fill" style={{ width: `${clamp((compositeAqi / 500) * 100, 2, 100)}%`, background: `linear-gradient(90deg, ${COLORS.nominal}, ${compositeColor})` }} />
                        </div>
                    </div>

                    {wards.map((w, i) => (
                        <WardRow
                            key={w.id}
                            ward={w}
                            rank={i + 1}
                            expanded={expandedWard === w.id}
                            isFlashing={flashingWards.has(w.id)}
                            onToggle={() => setExpandedWard((prev) => (prev === w.id ? null : w.id))}
                        />
                    ))}

                    {/* ── HISTORICAL AQI CHART ── */}
                    <AqiHistoryChart />
                </div>

                {/* ═══ CENTER PANEL ═══ */}
                <div className="center-panel">
                    <div className="absolute inset-0 opacity-20 pointer-events-none z-0" style={{ backgroundImage: `repeating-linear-gradient(rgba(14, 165, 233, 0.07) 0px, rgba(14, 165, 233, 0.07) 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, rgba(14, 165, 233, 0.07) 0px, rgba(14, 165, 233, 0.07) 1px, transparent 1px, transparent 48px)` }} />
                    <div className="absolute inset-0 pointer-events-none z-[5]" style={{ background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(5, 10, 20, 0.85) 100%)` }} />

                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} className="pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-label="Ward spatial operations map">
                        {connections.map(([from, to]) => {
                            const wFrom = wards.find((w) => w.id === from);
                            const wTo = wards.find((w) => w.id === to);
                            if (!wFrom || !wTo) return null;
                            return <line key={`${from}-${to}`} x1={wFrom.position.x} y1={wFrom.position.y} x2={wTo.position.x} y2={wTo.position.y} stroke={COLORS.rim} strokeWidth="0.15" opacity="0.1" />;
                        })}

                        {(() => {
                            const wardC = wards.find((w) => w.id === "C");
                            return wardC ? <SonarRing cx={wardC.position.x} cy={wardC.position.y} /> : null;
                        })()}

                        {wards.map((w) => {
                            const isCritical = w.id === "C";
                            const r = isCritical ? 2.2 : 1.2;
                            const color = getAqiColor(w.aqi);
                            return (
                                <g key={w.id}>
                                    {isCritical && <circle cx={w.position.x} cy={w.position.y} r={r + 1.5} fill="none" stroke={COLORS.anomaly} strokeWidth="0.3" opacity="0.5" className="ward-c-glow" />}
                                    {isCritical && <circle cx={w.position.x} cy={w.position.y} r="20" fill="rgba(168, 85, 247, 0.25)" style={{ filter: 'blur(6px)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />}
                                    <circle cx={w.position.x} cy={w.position.y} r={r} fill={color} opacity={isCritical ? 1 : 0.8} style={{ filter: isCritical ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.9)) drop-shadow(0 0 20px rgba(168, 85, 247, 0.5))' : undefined }} />
                                    <text x={w.position.x} y={w.position.y - (isCritical ? 5 : 3)} textAnchor="middle" fill={isCritical ? COLORS.anomaly : "#94a3b8"} fontSize={isCritical ? "3" : "2.2"} fontFamily="'Bebas Neue', sans-serif" letterSpacing="0.5">{w.name}</text>
                                    {isCritical && <text x={w.position.x} y={w.position.y - 8.5} textAnchor="middle" fill={COLORS.danger} fontSize="2.5" fontFamily="'Bebas Neue', sans-serif" letterSpacing="1" className="critical-blink">CRITICAL</text>}
                                    <text x={w.position.x} y={w.position.y + (isCritical ? 5.5 : 4)} textAnchor="middle" fill={mounted && flashingWards.has(w.id) ? '#67e8f9' : color} fontSize="2" fontFamily="'JetBrains Mono', monospace" style={{ transition: mounted && flashingWards.has(w.id) ? 'fill 0.08s linear' : 'fill 0.4s ease-out' }}>
                                        AQI {w.aqi}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>

                    {(() => {
                        const wardC = wards.find((w) => w.id === "C");
                        if (!wardC) return null;
                        return (
                            <div style={{ position: "absolute", right: "12%", top: "28%", zIndex: 20 }}>
                                <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-600/50 p-6 rounded-xl shadow-2xl z-20 relative max-w-sm">
                                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "13px", letterSpacing: "1px", color: COLORS.danger, marginBottom: "6px" }}>🚨 ANOMALY · WARD C · IRONBRIDGE</div>
                                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: COLORS.danger, marginBottom: "4px" }}>PM10 SPIKE DETECTED</div>
                                    <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>
                                        <div>PROBABLE SOURCE: Construction Dust — Site 4</div>
                                        <div>CONFIDENCE: 94% · ONSET: 14:23:07</div>
                                        <div>DURATION: 47 MIN · TREND: ↑ RISING</div>
                                    </div>
                                    <div style={{ marginTop: "10px" }}>
                                        {[
                                            { label: "PM2.5", value: wardC.pm25, max: 250, color: COLORS.warning },
                                            { label: "PM10", value: wardC.pm10, max: 250, color: COLORS.danger },
                                            { label: "NO₂", value: wardC.no2, max: 100, color: COLORS.rim },
                                        ].map((bar) => (
                                            <div key={bar.label} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: COLORS.ghost, width: "36px", textAlign: "right" }}>{bar.label}</span>
                                                <div style={{ flex: 1, height: "6px", background: "rgba(14,165,233,0.08)", borderRadius: "1px", overflow: "hidden" }}>
                                                    <div style={{ width: `${clamp((bar.value / bar.max) * 100, 2, 100)}%`, height: "100%", background: bar.color, transition: "width 0.8s ease-out" }} />
                                                </div>
                                                <span className="text-slate-100 font-bold font-mono text-xs flex-shrink-0 whitespace-nowrap">{bar.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 4 }}>
                        <line x1="50%" y1="55%" x2="88%" y2="38%" stroke={COLORS.anomaly} strokeWidth="0.5" opacity="0.3" strokeDasharray="4 4" />
                    </svg>

                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(11,17,32,0.9)", borderTop: "1px solid rgba(14,165,233,0.08)", zIndex: 5 }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "2px", color: COLORS.ghost }}>SENSOR NETWORK STATUS</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            {wards.map((w) => {
                                const statusColor = w.sensorStatus === "nominal" ? COLORS.nominal : w.sensorStatus === "warning" ? COLORS.warning : COLORS.danger;
                                return (
                                    <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <div style={{ width: "8px", height: "8px", borderRadius: "1px", background: statusColor }} />
                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: COLORS.ghost }}>N-{w.id}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT PANEL ═══ */}
                <div className="right-panel">
                    <div style={{ marginBottom: "12px" }}>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "14px", letterSpacing: "2px", color: "#e2e8f0", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Activity size={14} style={{ color: COLORS.rim }} />
                            AI RESPONSE ENGINE
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: COLORS.ghost, marginTop: "2px" }}>MODEL: AERO-GPT v3.1</div>
                    </div>

                    <div className="flex flex-col gap-2 mb-4 w-full">
                        <span className="text-cyan-400 text-xs font-bold tracking-wider uppercase">
                            {actions.filter((a) => !a.dispatched).length} INTERVENTIONS QUEUED
                        </span>
                        <div className="text-yellow-400 text-xs font-bold bg-yellow-400/10 p-1 rounded w-fit tabular-nums uppercase">
                            AUTO-DISPATCH IN {mounted ? formatCountdown(countdown) : '04:53'}
                        </div>
                    </div>

                    {actions.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-slate-600 text-xs font-mono tracking-wide">
                            LOADING INTERVENTIONS...
                        </div>
                    ) : (
                        actions.map((a) => (
                            <ActionCard key={a.id} data={a} onApprove={() => handleApprove(a.id)} />
                        ))
                    )}

                    <div style={{ marginTop: "8px", padding: "8px", borderTop: "1px solid rgba(14,165,233,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "10px", letterSpacing: "1px", color: COLORS.ghost }}>AI CONFIDENCE COMPOSITE</span>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: COLORS.nominal, fontWeight: 600 }}>{aiConfidence}%</span>
                        </div>
                        <div className="criticality-bar">
                            <div className="criticality-fill" style={{ width: `${aiConfidence}%`, background: `linear-gradient(90deg, ${COLORS.rim}, ${COLORS.nominal})` }} />
                        </div>
                    </div>
                </div>

                {/* ═══ STATUSBAR ═══ */}
                <StatusBarComponent wards={wards} lastSyncSec={lastSync} mounted={mounted} />
            </div>
        </>
    );
}