import re

file_path = "c:/Users/ADITYA/OneDrive/Desktop/Aeroward/src/components/AeroWardDashboard.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    'CheckCircle, // ── POLISH 3: Right sidebar dispatch button icon purge ──',
    'CheckCircle, // ── POLISH 3: Right sidebar dispatch button icon purge ──\n    Loader2, // ── SIM 2: Dispatch Button State Machine ──'
)

# 2. AqiBadge
badgedef_old = 'function AqiBadge({ aqi, size = "sm" }: { aqi: number; size?: "sm" | "lg" }) {'
badgedef_new = '''function AqiBadge({ aqi, size = "sm", isFlashing = false }: { aqi: number; size?: "sm" | "lg", isFlashing?: boolean }) {
    // ── HYDRATION SAFETY ──────────────────────────────────────
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
'''
content = content.replace(badgedef_old, badgedef_new)

badge_style_old = '                color,\n                padding,'
badge_style_new = '''                // ── SIM 1: AQI LIVE FLUCTUATION ENGINE ──────────────────────────────────────
                color: mounted && isFlashing ? '#67e8f9' : color,
                textShadow: mounted && isFlashing
                  ? '0 0 12px #67e8f9, 0 0 24px #67e8f988'
                  : 'none',
                transition: mounted && isFlashing 
                  ? 'color 0.08s linear, text-shadow 0.08s linear'
                  : 'color 0.4s ease-out, text-shadow 0.4s ease-out',
                padding,'''
content = content.replace(badge_style_old, badge_style_new)
content = content.replace('{aqi}', '{mounted ? aqi : (typeof aqi === "number" ? aqi : 0)}', 1)

# 3. SonarRing
sonarring_old = 'style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: `${i}s` }}'
sonarring_new = 'style={{ transformOrigin: `${cx}px ${cy}px`, animationDelay: `${i * 0.6}s`, animationDuration: "2s", animationTimingFunction: "linear" }}\n                    // ── SIM 4: RADAR, PULSE & STATUS ANIMATIONS ──────────────────────────────────────\n                    className="sonar-ring animate-ping"'
content = content.replace(sonarring_old, sonarring_new)

# 4. WardRow
wardrowdef_old = '''function WardRow({
    ward,
    rank,
    expanded,
    onToggle,
}: {
    ward: WardData;
    rank: number;
    expanded: boolean;
    onToggle: () => void;
}) {'''
wardrowdef_new = '''function WardRow({
    ward,
    rank,
    expanded,
    onToggle,
    isFlashing,
}: {
    ward: WardData;
    rank: number;
    expanded: boolean;
    onToggle: () => void;
    isFlashing: boolean;
}) {
    // ── HYDRATION SAFETY ──────────────────────────────────────
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => { setMounted(true); }, []);
'''
content = content.replace(wardrowdef_old, wardrowdef_new)

wardrowcls_old = 'className="flex flex-row items-center justify-between w-full h-12 mb-2 px-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-white/5"'
wardrowcls_new = 'className="flex flex-row items-center justify-between w-full h-12 mb-2 px-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-slate-800/50 border-l-2 border-l-transparent hover:border-l-cyan-500"'
content = content.replace(wardrowcls_old, wardrowcls_new)

wardrowaqi_old = '''<span
                    className="text-xs font-bold font-mono px-2 py-1 rounded-md"
                    style={{
                        color: color,
                        background: `${color}15`,
                        boxShadow: `0 0 0 1px ${color}40`,
                    }}
                >
                    {ward.aqi}
                </span>'''
wardrowaqi_new = '''<span
                    className="text-xs font-bold font-mono px-2 py-1 rounded-md"
                    style={{
                        color: mounted && isFlashing ? '#67e8f9' : color,
                        background: `${color}15`,
                        textShadow: mounted && isFlashing 
                          ? '0 0 12px #67e8f9, 0 0 24px #67e8f988' 
                          : 'none',
                        transition: mounted && isFlashing 
                          ? 'color 0.08s linear, text-shadow 0.08s linear' 
                          : 'color 0.4s ease-out, text-shadow 0.4s ease-out',
                        boxShadow: `0 0 0 1px ${color}40`,
                    }}
                >
                    {mounted ? ward.aqi : ward.baseAqi}
                </span>'''
content = content.replace(wardrowaqi_old, wardrowaqi_new)

# 5. ActionCard
actioncarddef_old = '''    const [showCitizenPreview, setShowCitizenPreview] = React.useState(false);

    return ('''
actioncarddef_new = '''    const [showCitizenPreview, setShowCitizenPreview] = React.useState(false);

    // ── SIM 2: DISPATCH BUTTON STATE MACHINE ──────────────────────────────────────
    const [dispatchState, setDispatchState] = React.useState<'idle' | 'loading' | 'success'>('idle');
    const dispatchTimer = React.useRef<any>(null);
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => { 
        setMounted(true);
        return () => clearTimeout(dispatchTimer.current);
    }, []);

    const handleDispatch = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (dispatchState !== 'idle') return;
        setDispatchState('loading');
        dispatchTimer.current = setTimeout(() => {
            setDispatchState('success');
            onApprove();
        }, 1500);
    };

    return ('''
content = content.replace(actioncarddef_old, actioncarddef_new)

actioncardbtn_old = '''{!data.dispatched ? (
                    <button
                        className="btn-primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onApprove();
                        }}
                        aria-label={`Approve and dispatch action for ${data.wardName}`}
                        style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "12px",
                            color: "#fff",
                            background: data.priority === "LOW" ? "transparent" : COLORS.danger,
                            boxShadow: data.priority === "LOW" ? `0 0 0 1px ${COLORS.rim}` : `0 0 0 1px ${COLORS.danger}`,
                            marginBottom: "6px",
                        }}
                    >
                        {data.priority === "LOW" ? (
                            <div className="flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                <span>APPROVE ACTION & DISPATCH</span>
                            </div>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Zap size={13} strokeWidth={2.5} />
                                <span>APPROVE ACTION & DISPATCH</span>
                            </span>
                        )}
                    </button>
                ) : (
                    <button
                        disabled
                        className="btn-primary cursor-not-allowed opacity-90"
                        aria-label={`Dispatched at ${data.dispatchTime}`}
                        style={{
                            width: "100%",
                            padding: "8px",
                            fontSize: "12px",
                            color: COLORS.nominal,
                            background: "rgba(48,209,88,0.12)",
                            boxShadow: `0 0 0 1px ${COLORS.nominal}`,
                            marginBottom: "6px",
                        }}
                    >
                        <span className="flex items-center justify-center gap-2">
                            <CheckCircle2 size={13} strokeWidth={2.5} />
                            <span>DISPATCHED</span>
                        </span>
                    </button>
                )}'''

actioncardbtn_new = '''{dispatchState === 'idle' && !data.dispatched && (
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
                    <button disabled
                      className="w-full py-2.5 rounded-lg text-xs font-bold tracking-widest bg-slate-700 text-slate-400 cursor-not-allowed"
                      style={{ marginBottom: "6px" }}>
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={13} className="animate-spin" />
                        TRANSMITTING TO FIELD UNIT...
                      </span>
                    </button>
                  )}

                  {(dispatchState === 'success' || data.dispatched) && (
                    <button disabled
                      className="w-full py-2.5 rounded-lg text-xs font-bold tracking-widest bg-emerald-600/80 text-emerald-100 cursor-not-allowed ring-1 ring-emerald-500/50"
                      style={{ boxShadow: '0 0 16px rgba(52,211,153,0.3)', marginBottom: "6px" }}>
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                        DISPATCHED — UNITS EN ROUTE
                      </span>
                    </button>
                  )}'''
content = content.replace(actioncardbtn_old, actioncardbtn_new)

actioncardlog_old = '''{data.dispatched && (
                    <div
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "9px",
                            color: COLORS.nominal,
                            padding: "4px 0",
                            borderTop: `1px solid rgba(48,209,88,0.15)`,
                            marginTop: "4px",
                        }}
                    >
                        DISPATCH LOG: Action approved and dispatched at {data.dispatchTime}.
                        Confirmation sent to field unit.
                    </div>
                )}'''
actioncardlog_new = '''{(dispatchState === 'success' || data.dispatched) && (
                    <div className="mt-2 text-[10px] font-mono text-emerald-500/80 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                        DISPATCH LOG · {mounted ? data.dispatchTime : '--:--:--'} · REF: ENV-2024-0891
                    </div>
                )}'''
content = content.replace(actioncardlog_old, actioncardlog_new)

# 6. Topbar Status Dot
topbardot_old = '''<div
                            className="pulse-dot"
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: COLORS.rim,
                            }}
                        />'''
topbardot_new = '''<span className="relative flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
                                  style={{ animationDuration: '1.5s' }} />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>'''
content = content.replace(topbardot_old, topbardot_new)

# 7. Main Component setup
maincomp_old = '''export default function AeroWardDashboard() {
    const [wards, setWards] = useState<WardData[]>(INITIAL_WARDS);
    const [clock, setClock] = useState("");
    const [lastSync, setLastSync] = useState(0);
    const [countdown, setCountdown] = useState(300); // 5 min in seconds'''
maincomp_new = '''// ── SIM 3: COUNTDOWN TIMER FORMATTER ──────────────────────────────────────
function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}

export default function AeroWardDashboard() {
    const [wards, setWards] = useState<WardData[]>(INITIAL_WARDS);
    const [clock, setClock] = useState("");
    const [lastSync, setLastSync] = useState(0);
    
    // ── SIM 3: COUNTDOWN TIMER ENGINE ──────────────────────────────────────
    const [countdown, setCountdown] = useState(4 * 60 + 53); // 04:53
    const dispatchSuccessRef = useRef(false);
    
    // ── SIM 1: AQI LIVE FLUCTUATION ENGINE ──────────────────────────────────────
    const [flashingWards, setFlashingWards] = useState<Set<string>>(new Set());
    const [histories, setHistories] = useState<Record<string, number[]>>(() =>
        Object.fromEntries(INITIAL_WARDS.map(w => [w.id, w.history]))
    );
'''
content = content.replace(maincomp_old, maincomp_new)

handleapprove_old = '''    const handleApprove = useCallback((actionId: string) => {
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        setActions((prev) =>
            prev.map((a) =>
                a.id === actionId ? { ...a, dispatched: true, dispatchTime: ts } : a
            )
        );
    }, []);'''
handleapprove_new = '''    const handleApprove = useCallback((actionId: string) => {
        dispatchSuccessRef.current = true;
        const now = new Date();
        const ts = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        setActions((prev) =>
            prev.map((a) =>
                a.id === actionId ? { ...a, dispatched: true, dispatchTime: ts } : a
            )
        );
    }, []);'''
content = content.replace(handleapprove_old, handleapprove_new)

countdownfmt_old = '''    // Countdown formatting
    const countdownMin = String(Math.floor(countdown / 60)).padStart(2, "0");
    const countdownSec = String(countdown % 60).padStart(2, "0");'''
content = content.replace(countdownfmt_old, "")

clock_old = '''    // ── Clock + last sync (1s) ──
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, "0");
            const m = String(now.getMinutes()).padStart(2, "0");
            const s = String(now.getSeconds()).padStart(2, "0");
            setClock(`${h}:${m}:${s}`);
            lastSyncRef.current += 1;
            setLastSync(lastSyncRef.current);
            setCountdown((prev) => (prev <= 0 ? 300 : prev - 1));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);'''
clock_new = '''    // ── Clock + last sync (1s) & SIM 3 Countdown ──
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const h = String(now.getHours()).padStart(2, "0");
            const m = String(now.getMinutes()).padStart(2, "0");
            const s = String(now.getSeconds()).padStart(2, "0");
            setClock(`${h}:${m}:${s}`);
            lastSyncRef.current += 1;
            setLastSync(lastSyncRef.current);
            
            // SIM 3 COUNTDOWN LOGIC
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
    }, []);'''
content = content.replace(clock_old, clock_new)

fluct_pattern = re.compile(r"    // ── AQI Fluctuation.*?return \(\) => clearInterval\(id\);\n    \}, \[\]\);", re.DOTALL)
fluct_new = '''    // ── SIM 1: AQI LIVE FLUCTUATION ENGINE ──
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
                    
                    return { 
                        ...ward, 
                        baseAqi: ward.baseAqi,
                        aqi: newAqi,
                        pm25: Math.round(newAqi * pm25Ratio),
                        pm10: Math.round(newAqi * pm10Ratio),
                        no2: Math.round(newAqi * no2Ratio),
                    };
                });
                
                setHistories(h => {
                    const newHistories = Object.fromEntries(
                        next.map(w => [
                            w.id,
                            [...(h[w.id] || w.history).slice(-7), w.aqi]
                        ])
                    );
                    return newHistories;
                });
                
                setFlashingWards(flashing);
                setTimeout(() => setFlashingWards(new Set()), 300);
                
                return next; // don't sort here since we want same order, or sort if previous sorted.
            });
            
            setWards((prev) => {
                const updatedPrev = prev.map(w => ({
                    ...w,
                    history: histories[w.id] || w.history
                })).sort((a, b) => b.aqi - a.aqi);
                
                const tickerStr = updatedPrev
                    .map(
                        (w) =>
                            `[${w.id}] AQI:${w.aqi} PM2.5:${w.pm25} PM10:${w.pm10} NO₂:${w.no2}`
                    )
                    .join("  ···  ");
                setTickerValues(tickerStr);
                return updatedPrev;
            });
        }, 3500);
        return () => clearInterval(id);
    }, [histories]);'''
content = fluct_pattern.sub(fluct_new, content)

content = content.replace(
'''                        <WardRow
                            key={w.id}
                            ward={w}
                            rank={i + 1}
                            expanded={expandedWard === w.id}
                            onToggle={() =>
                                setExpandedWard((prev) => (prev === w.id ? null : w.id))
                            }
                        />''',
'''                        <WardRow
                            key={w.id}
                            ward={w}
                            rank={i + 1}
                            expanded={expandedWard === w.id}
                            isFlashing={flashingWards.has(w.id)}
                            onToggle={() =>
                                setExpandedWard((prev) => (prev === w.id ? null : w.id))
                            }
                        />'''
)

content = content.replace(
    '<AqiBadge aqi={compositeAqi} size="lg" />',
    '<AqiBadge aqi={compositeAqi} size="lg" isFlashing={flashingWards.size > 0} />'
)

# Fix Ward C Ring + Anomaly styling
content = content.replace(
'''                                            <circle
                                                cx={w.position.x}
                                                cy={w.position.y}
                                                r={r + 1.5}
                                                fill="none"
                                                stroke={COLORS.anomaly}
                                                strokeWidth="0.3"
                                                opacity="0.5"
                                                className="ward-c-glow"
                                            />''',
'''                                            <circle
                                                cx={w.position.x}
                                                cy={w.position.y}
                                                r={r + 1.5}
                                                fill="none"
                                                stroke={COLORS.anomaly}
                                                strokeWidth="0.3"
                                                opacity="0.5"
                                                className="ward-c-glow"
                                            />
                                    )}
                                    {isCritical && (
                                            <circle cx={w.position.x} cy={w.position.y} r="14" 
                                                fill="rgba(168,85,247,0.15)"
                                                className="animate-ping"
                                                style={{ animationDuration: '1.5s', transformOrigin: `${w.position.x}px ${w.position.y}px` }}
                                            />'''
)

content = content.replace(
'''                                    <text
                                        x={w.position.x}
                                        y={w.position.y + (isCritical ? 5.5 : 4)}
                                        textAnchor="middle"
                                        fill={color}
                                        fontSize="2"
                                        fontFamily="'JetBrains Mono', monospace"
                                    >''',
'''                                    <text
                                        x={w.position.x}
                                        y={w.position.y + (isCritical ? 5.5 : 4)}
                                        textAnchor="middle"
                                        fill={mounted && flashingWards.has(w.id) ? '#67e8f9' : color}
                                        fontSize="2"
                                        fontFamily="'JetBrains Mono', monospace"
                                        style={{
                                            transition: mounted && flashingWards.has(w.id) ? 'fill 0.08s linear' : 'fill 0.4s ease-out',
                                        }}
                                    >'''
)

content = content.replace(
'''                                                    <div
                                                        style={{
                                                            width: `${clamp((bar.value / bar.max) * 100, 2, 100)}%`,
                                                            height: "100%",
                                                            background: bar.color,
                                                            transition: "width 0.3s linear",
                                                        }}
                                                    />''',
'''                                                    <div
                                                        style={{
                                                            width: `${clamp((bar.value / bar.max) * 100, 2, 100)}%`,
                                                            height: "100%",
                                                            background: bar.color,
                                                            transition: "width 0.8s ease-out", // ── SIM 1: Animated Bar Widths
                                                        }}
                                                    />'''
)

countdown_old_render = '''                        <div
                            style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "11px",
                                color: countdown < 60 ? COLORS.danger : COLORS.warning,
                                fontWeight: 600,
                            }}
                        >
                            AUTO-DISPATCH IN {mounted ? countdownMin : "00"}:{mounted ? countdownSec : "00"} {/* FIX-3 */}
                        </div>'''

countdown_new_render = '''                        <span className={`font-mono font-bold tabular-nums
                            ${countdown <= 30 
                            ? 'text-red-400 animate-pulse' 
                            : countdown <= 60 
                                ? 'text-orange-400' 
                                : 'text-cyan-400'
                            }`}
                            style={{ fontSize: "11px" }}>
                            AUTO-DISPATCH IN {mounted ? formatCountdown(countdown) : '04:53'}
                        </span>'''
content = content.replace(countdown_old_render, countdown_new_render)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("SUCCESS")
