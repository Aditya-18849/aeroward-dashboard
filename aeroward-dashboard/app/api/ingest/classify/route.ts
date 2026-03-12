// app/api/classify/route.ts
// ─── AeroWard ML Pollution Source Classifier ───
// Drop this file at: app/api/classify/route.ts

import { NextRequest, NextResponse } from "next/server";

// ─── TYPES ───
interface SensorReading {
  ward_id: string;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  timestamp?: string;
}

interface ClassificationResult {
  ward_id: string;
  source: string;
  confidence: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  adminAction: string[];
  citizenAdvisory: string[];
  llm_directive: {
    adminAction: string[];
    citizenAdvisory: string[];
  };
}

// ─── RULE-BASED ML CLASSIFIER ───
// Uses pollutant ratios — a well-established technique in air quality science.
// PM10/PM2.5 ratio > 3 → coarse particles → construction/road dust
// High NO2 with moderate PM → vehicular/industrial
// High PM2.5 with low NO2 → biomass burning
// High across all → industrial complex

function classifyPollutionSource(reading: SensorReading): ClassificationResult {
  const { ward_id, aqi, pm25, pm10, no2 } = reading;

  const pm_ratio = pm10 / (pm25 || 1); // coarse vs fine particle ratio
  const no2_dominance = no2 / (aqi || 1);
  const pm25_dominance = pm25 / (aqi || 1);

  let source = "Unknown";
  let confidence = 0;
  let adminAction: string[] = [];
  let citizenAdvisory: string[] = [];

  // ── CLASSIFICATION RULES ──

  // Rule 1: Construction / Road Dust
  // High PM10, PM10/PM2.5 ratio > 2.5, moderate NO2
  if (pm_ratio > 2.5 && pm10 > 100) {
    source = "Construction Dust";
    confidence = Math.min(95, 70 + pm_ratio * 3);
    adminAction = [
      `Deploy municipal water sprinklers to Ward ${ward_id} construction zones.`,
      "Issue stop-work order for unpermitted excavation sites.",
      "Mandate dust suppression nets on all active construction sites.",
    ];
    citizenAdvisory = [
      "Avoid outdoor exercise. Keep windows closed.",
      "N95 masks advised for essential transit.",
      "Children and elderly should remain indoors.",
    ];
  }

  // Rule 2: Biomass / Crop Burning
  // Very high PM2.5, PM10/PM2.5 ratio < 1.5, low NO2
  else if (pm25 > 80 && pm_ratio < 1.5 && no2 < 30) {
    source = "Biomass Burning";
    confidence = Math.min(92, 65 + pm25_dominance * 40);
    adminAction = [
      `Dispatch enforcement teams to Ward ${ward_id} for illegal burning activity.`,
      "Issue field burning prohibition notice.",
      "Coordinate with agricultural department for stubble management.",
    ];
    citizenAdvisory = [
      "Smoke advisory in effect. Avoid all outdoor activity.",
      "Use air purifiers indoors if available.",
      "Seek medical attention if experiencing respiratory symptoms.",
    ];
  }

  // Rule 3: Vehicular / Traffic Emissions
  // Moderate PM, high NO2 dominance
  else if (no2_dominance > 0.25 && no2 > 35) {
    source = "Vehicular Emissions";
    confidence = Math.min(88, 60 + no2_dominance * 80);
    adminAction = [
      `Activate dynamic traffic signal optimization in Ward ${ward_id}.`,
      "Divert heavy vehicles to alternate routes.",
      "Deploy odd-even vehicle restriction if AQI exceeds 200.",
    ];
    citizenAdvisory = [
      "Avoid peak-hour outdoor exposure (8-10am, 5-8pm).",
      "Use public transport where possible.",
      "Sensitive groups: wear masks during commute.",
    ];
  }

  // Rule 4: Industrial / Refinery Emissions
  // High NO2 + high PM2.5, sustained elevation
  else if (no2 > 40 && pm25 > 60 && aqi > 150) {
    source = "Industrial Emissions";
    confidence = Math.min(90, 68 + (no2 / 100) * 30);
    adminAction = [
      `Issue emission compliance notice to industrial units in Ward ${ward_id}.`,
      "Request pollution control board inspection within 24 hours.",
      "Activate emergency stack emission monitoring.",
    ];
    citizenAdvisory = [
      "Health advisory: limit outdoor exposure.",
      "HEPA filter advisory for schools within 2km radius.",
      "Report any visible smoke or odor to municipal helpline.",
    ];
  }

  // Rule 5: Mixed / Composite Source
  else if (aqi > 100) {
    source = "Mixed Sources";
    confidence = 55;
    adminAction = [
      `Increase monitoring frequency for Ward ${ward_id}.`,
      "Deploy mobile sensor units for source triangulation.",
      "Review recent industrial activity logs.",
    ];
    citizenAdvisory = [
      "Moderate air quality. Sensitive groups should limit outdoor activity.",
      "Stay updated via AeroWard alerts.",
    ];
  }

  // Rule 6: Good / Nominal
  else {
    source = "Nominal — No significant source";
    confidence = 98;
    adminAction = ["Continue routine monitoring."];
    citizenAdvisory = ["Air quality is acceptable for most individuals."];
  }

  // ── SEVERITY ──
  let severity: ClassificationResult["severity"] = "LOW";
  if (aqi > 300) severity = "CRITICAL";
  else if (aqi > 200) severity = "HIGH";
  else if (aqi > 100) severity = "MEDIUM";

  return {
    ward_id,
    source,
    confidence: Math.round(confidence),
    severity,
    adminAction,
    citizenAdvisory,
    llm_directive: { adminAction, citizenAdvisory },
  };
}

// ─── API HANDLER ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept single reading or array
    const readings: SensorReading[] = Array.isArray(body) ? body : [body];

    if (!readings.length) {
      return NextResponse.json(
        { error: "No sensor readings provided" },
        { status: 400 }
      );
    }

    const results = readings.map(classifyPollutionSource);

    return NextResponse.json({
      success: true,
      classified: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Classification failed", detail: err.message },
      { status: 500 }
    );
  }
}

// ─── GET: Health check ───
export async function GET() {
  return NextResponse.json({
    status: "AeroWard ML Classifier online",
    version: "1.0.0",
    model: "Rule-Based Pollutant Ratio Classifier",
    supported_sources: [
      "Construction Dust",
      "Biomass Burning",
      "Vehicular Emissions",
      "Industrial Emissions",
      "Mixed Sources",
    ],
  });
}