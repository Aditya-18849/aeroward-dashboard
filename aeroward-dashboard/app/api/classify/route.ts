import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const WARD_META: Record<string, { name: string; zone: string; shortId: string }> = {
  'c534390a-9f5a-42b8-9b83-6e4ce3946b77': { name: 'WARD A', zone: 'GREENFIELD', shortId: 'A' },
  'e7568f54-2b9e-4b51-a076-ed6513b3b91d': { name: 'WARD B', zone: 'MILLHAVEN',  shortId: 'B' },
  '0d39942b-441d-4081-af2e-787c32af327f': { name: 'WARD C', zone: 'IRONBRIDGE', shortId: 'C' },
  'e9931c64-caf1-4497-81ad-225e0803bab6': { name: 'WARD D', zone: 'EASTPORT',   shortId: 'D' },
  'ed03ccf4-8318-4912-9e20-ce8833219b0e': { name: 'WARD E', zone: 'NORTHPOINT', shortId: 'E' },
};

function classifyPollutionSource(pm25: number, pm10: number, shortId: string) {
  const no2 = Math.floor(pm25 * 0.4);
  const aqi = Math.min(500, Math.floor(pm25 * 1.5 + pm10 * 0.5 + no2 * 0.3));
  const pm_ratio = pm10 / (pm25 || 1);
  const no2_dominance = no2 / (aqi || 1);

  let source = "Vehicular / Traffic Emissions";
  let confidence = 0.65;
  let adminAction: string[] = [
    `Activate dynamic traffic signal optimization in Ward ${shortId}.`,
    "Divert heavy vehicles to alternate routes.",
  ];
  let citizenAdvisory: string[] = [
    "Avoid peak-hour outdoor exposure.",
    "Sensitive groups: wear masks during commute.",
  ];

  if (pm_ratio > 2.5 && pm10 > 100) {
    source = "Construction Dust";
    confidence = Math.min(0.95, 0.70 + pm_ratio * 0.03);
    adminAction = [
      `Deploy municipal water sprinklers to Ward ${shortId} construction zones.`,
      "Issue stop-work order for unpermitted excavation sites.",
      "Mandate dust suppression nets on all active construction sites.",
    ];
    citizenAdvisory = [
      "Avoid outdoor exercise. Keep windows closed.",
      "N95 masks advised for essential transit.",
      "Children and elderly should remain indoors.",
    ];
  } else if (pm25 > 80 && pm_ratio < 1.5) {
    source = "Biomass Burning";
    confidence = 0.82;
    adminAction = [
      `Dispatch enforcement teams to Ward ${shortId} for illegal burning.`,
      "Issue field burning prohibition notice.",
      "Coordinate with agricultural department for stubble management.",
    ];
    citizenAdvisory = [
      "Smoke advisory in effect. Avoid all outdoor activity.",
      "Use air purifiers indoors if available.",
      "Seek medical attention if experiencing respiratory symptoms.",
    ];
  } else if (no2_dominance > 0.25 && pm25 > 60) {
    source = "Industrial Emissions";
    confidence = 0.78;
    adminAction = [
      `Issue emission compliance notice to industrial units in Ward ${shortId}.`,
      "Request pollution control board inspection within 24 hours.",
      "Activate emergency stack emission monitoring.",
    ];
    citizenAdvisory = [
      "Health advisory: limit outdoor exposure.",
      "HEPA filter advisory for schools within 2km radius.",
      "Report any visible smoke or odor to municipal helpline.",
    ];
  }

  const priority = aqi > 200 ? "HIGH" : aqi > 100 ? "MEDIUM" : "LOW";
  const severity = aqi > 300 ? "CRITICAL" : aqi > 200 ? "HIGH" : aqi > 100 ? "MEDIUM" : "LOW";
  return { source, confidence: parseFloat(confidence.toFixed(2)), aqi, no2, priority, severity, adminAction, citizenAdvisory };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sensor_id, ward_id, pm2_5, pm10 } = body;

    console.log(`📥 Received City Mesh Data | Ward: ${ward_id} | PM2.5: ${pm2_5} | PM10: ${pm10}`);

    const { error: telemetryError } = await supabase
      .from('telemetry_data')
      .insert([{ sensor_id, ward_id, pm2_5, pm10 }]);

    if (telemetryError) {
      console.error('❌ Supabase Telemetry Error:', telemetryError.message);
      return NextResponse.json({ error: telemetryError.message }, { status: 500 });
    }

    const meta = WARD_META[ward_id] ?? { name: 'UNKNOWN', zone: 'UNKNOWN', shortId: '?' };
    const ml = classifyPollutionSource(pm2_5, pm10, meta.shortId);
    console.log(`🔬 ML Classification | Source: ${ml.source} | Confidence: ${ml.confidence} | AQI: ${ml.aqi}`);

    if (pm10 > 150 || pm2_5 > 100) {
      console.log(`🚨 ANOMALY DETECTED: ${ml.source} | Priority: ${ml.priority}`);

      const anomalyPayload = {
        sensor_id,
        ward_id,
        anomaly_type:     `${ml.source} — ${ml.severity}`,
        confidence_score: ml.confidence,
        llm_directive:    JSON.stringify({
          adminAction:     ml.adminAction,
          citizenAdvisory: ml.citizenAdvisory,
        }),
        is_resolved:   false,
        detected_at:   new Date().toISOString(),
        ward_name:     meta.name,
        zone:          meta.zone,
        aqi:           ml.aqi,
        priority:      ml.priority,
        source:        ml.source,
        source_detail: `Auto-detected by AeroWard ML. PM2.5=${pm2_5}, PM10=${pm10}. Confidence: ${(ml.confidence * 100).toFixed(0)}%.`,
        dispatched:    false,
        dispatch_time: '',
        created_at:    new Date().toISOString(),
      };

      // Safe update-or-insert — no unique constraint needed
      const { data: existing } = await supabase
        .from('anomalies')
        .select('id')
        .eq('ward_id', ward_id)
        .eq('is_resolved', false)
        .maybeSingle();

      let anomalyError;
      if (existing?.id) {
        const { error } = await supabase
          .from('anomalies')
          .update(anomalyPayload)
          .eq('id', existing.id);
        anomalyError = error;
      } else {
        const { error } = await supabase
          .from('anomalies')
          .insert([anomalyPayload]);
        anomalyError = error;
      }

      if (anomalyError) {
        console.error('❌ Failed to log anomaly:', anomalyError.message);
      } else {
        console.log(`✅ Anomaly logged: ${ml.source} (${(ml.confidence * 100).toFixed(0)}% confidence)`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'City Mesh updated successfully',
      ml_classification: { source: ml.source, confidence: ml.confidence, aqi: ml.aqi, priority: ml.priority }
    });

  } catch (err: any) {
    console.error('❌ Request Error:', err.message);
    return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
  }
}