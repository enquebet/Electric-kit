/**
 * ElectroKit — Phase 13 Engineering Workspace & Intelligence Layer
 * Optional Bring-Your-Own-AI (BYO AI) Client-Side Intelligence
 *
 * Strict Architectural Rule:
 * "Workspace orchestrates. Engines calculate. AI explains and reviews."
 * AI never generates or replaces primary deterministic calculation results.
 */

import { GoogleGenAI } from '@google/genai';
import {
  AiConfig,
  AiReviewAction,
  AiReviewResult,
  CalculationSnapshot,
  ElectroKitProject,
} from './types';
import { loadAiConfig } from './storage';

const SYSTEM_PROMPT_ENGINEERING_CONSTITUTION = `
You are ElectroKit's Senior Hardware Engineering Peer Reviewer.
ElectroKit is a 100% client-side deterministic engineering toolbox.
All numerical calculations, voltages, currents, temperatures, margins, and component values have ALREADY been computed with mathematical rigor by verified deterministic engineering engines.

YOUR STRICT CONSTITUTION:
1. YOU MUST NEVER RE-CALCULATE, ALTER, OR OVERRIDE NUMERICAL RESULTS. The deterministic numbers provided to you are authoritative.
2. YOUR ROLE IS STRICTLY ANALYTICAL, CRITICAL, AND EXPLANATORY:
   - Explain the physical and electromagnetic principles governing the result.
   - Critique engineering assumptions and call out unmodeled physical parasitics (e.g. ESL/ESR, thermal gradients, component tolerances, copper tempco).
   - Identify environmental, manufacturing, or layout risks (e.g. hot spots, return path discontinuity, cold-temp battery sag).
   - Propose laboratory validation procedures (e.g. probe techniques, electronic load steps, thermal imaging).
3. Be concise, precise, and use professional engineering terminology (IPC standards, IEEE conventions, SI units).
4. NEVER CLAIM REGULATORY CERTIFICATION OR GUARANTEED SAFETY: All analyses represent modeled engineering estimations subject to physical testing.
5. NO SILENT MUTATIONS: Never pretend to execute or alter project parameters directly. All recommendations must be presented as proposals for the engineer's manual review.
`;

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'Network or API error';
  return msg
    .replace(/key=[^&\s]+/gi, 'key=[REDACTED]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
    .replace(/sk-[0-9A-Za-z-_]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]');
}

export async function runEngineeringAiReview(params: {
  action: AiReviewAction;
  project: ElectroKitProject;
  targetSnapshot?: CalculationSnapshot;
  customPrompt?: string;
  configOverride?: AiConfig;
}): Promise<AiReviewResult> {
  const config = params.configOverride || loadAiConfig();
  const timestamp = new Date().toISOString();
  const id = 'airev_' + Math.random().toString(36).substring(2, 9);

  // If AI is disabled or offline, or no key provided for hosted providers, use deterministic rule-based review
  if (
    !config.isEnabled ||
    config.provider === 'offline' ||
    (config.provider !== 'ollama' && !config.apiKey)
  ) {
    return runDeterministicOfflineReview(params.action, params.project, params.targetSnapshot);
  }

  // Construct minimal, strictly bounded context payload
  let context: Record<string, any> = {};

  if (params.action === 'explain') {
    // Only send the target calculation snapshot
    context = {
      calculationName: params.targetSnapshot?.name || 'Selected Calculation',
      engineId: params.targetSnapshot?.engineId,
      inputs: params.targetSnapshot?.inputs,
      outputs: params.targetSnapshot?.outputs,
      margins: params.targetSnapshot?.margins,
    };
  } else if (params.action === 'critique') {
    // Only send calculation snapshot and its declared assumptions/warnings
    context = {
      calculationName: params.targetSnapshot?.name || 'Selected Calculation',
      inputs: params.targetSnapshot?.inputs,
      outputs: params.targetSnapshot?.outputs,
      assumptions: params.targetSnapshot?.assumptions || params.project.assumptions,
      warnings: params.targetSnapshot?.warnings,
    };
  } else if (params.action === 'test-plan') {
    // Send target snapshot and target operational specifications
    context = {
      calculationName: params.targetSnapshot?.name || 'Selected Hardware',
      inputs: params.targetSnapshot?.inputs,
      outputs: params.targetSnapshot?.outputs,
      margins: params.targetSnapshot?.margins,
      constraints: params.project.constraints,
    };
  } else {
    // review-synthesis: System-level overview of active case
    context = {
      projectName: params.project.metadata.name,
      projectType: params.project.metadata.projectType,
      domain: params.project.metadata.domain,
      requirements: params.project.requirements,
      constraints: params.project.constraints,
      assumptions: params.project.assumptions,
      targetSnapshot: params.targetSnapshot
        ? {
            name: params.targetSnapshot.name,
            inputs: params.targetSnapshot.inputs,
            outputs: params.targetSnapshot.outputs,
            margins: params.targetSnapshot.margins,
          }
        : undefined,
    };
  }

  const actionInstruction = getPromptForAction(
    params.action,
    params.targetSnapshot?.name,
    params.customPrompt
  );

  const prompt = `${actionInstruction}\n\nDeterministic Engineering Context:\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``;

  try {
    let content = '';

    if (config.provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });
      const modelName = config.model || 'gemini-2.5-flash';
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT_ENGINEERING_CONSTITUTION,
          temperature: 0.2, // Low temperature for factual precision
        },
      });
      content = response.text || 'No response text received from Gemini.';
    } else if (config.provider === 'openai') {
      const endpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT_ENGINEERING_CONSTITUTION },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI API returned status ${res.status}`);
      const data = await res.json();
      content = data.choices?.[0]?.message?.content || 'No response from OpenAI.';
    } else if (config.provider === 'anthropic') {
      const endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model || 'claude-3-5-sonnet-20241022',
          system: SYSTEM_PROMPT_ENGINEERING_CONSTITUTION,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
        }),
      });
      if (!res.ok) throw new Error(`Anthropic API returned status ${res.status}`);
      const data = await res.json();
      content = data.content?.[0]?.text || 'No response from Anthropic.';
    } else if (config.provider === 'ollama') {
      const endpoint = config.endpoint || 'http://localhost:11434/api/generate';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model || 'llama3.2',
          system: SYSTEM_PROMPT_ENGINEERING_CONSTITUTION,
          prompt,
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
      const data = await res.json();
      content = data.response || 'No response from local Ollama.';
    }

    return {
      id,
      action: params.action,
      timestamp,
      title: getActionTitle(params.action, params.targetSnapshot?.name),
      content,
      providerUsed: config.provider,
      offlineFallback: false,
      targetName: params.targetSnapshot?.name,
    };
  } catch (err: any) {
    const cleanMsg = sanitizeErrorMessage(err?.message);
    console.warn('Online AI review failed, falling back to deterministic review:', cleanMsg);
    const fallback = runDeterministicOfflineReview(
      params.action,
      params.project,
      params.targetSnapshot
    );
    fallback.content = `*[Provider Notice: ${config.provider.toUpperCase()} call failed (${cleanMsg}). Switched to ElectroKit Deterministic Engine Review]*\n\n` + fallback.content;
    return fallback;
  }
}

function getPromptForAction(
  action: AiReviewAction,
  snapshotName?: string,
  customPrompt?: string
): string {
  if (customPrompt) return customPrompt;
  switch (action) {
    case 'explain':
      return `Please provide a rigorous physical explanation of the calculation results in "${snapshotName || 'the active snapshot'}". Detail the primary physical mechanisms, why the outputs settled at these values, and how the sensitivity behaves under parameter shifts.`;
    case 'critique':
      return `Perform an engineering assumption critique for "${snapshotName || 'the active design'}". What unmodeled parasitics, environmental deratings, or component wear-out factors could invalidate these margins? Highlight specific weak points.`;
    case 'test-plan':
      return `Generate a step-by-step Hardware Bench Validation and Test Procedure to verify the deterministic numbers calculated in "${snapshotName || 'the project'}" using standard lab equipment (oscilloscope, electronic load, DMM, thermal camera). Include probe grounding cautions.`;
    case 'review-synthesis':
      return `Generate a formal Hardware Engineering Peer Review Synthesis for project "${snapshotName || 'System'}". Summarize the margin posture, risk areas, critical components needing datasheet verification, and pass/fail readiness for prototyping.`;
  }
}

function getActionTitle(action: AiReviewAction, snapshotName?: string): string {
  switch (action) {
    case 'explain':
      return `Physical Explanation: ${snapshotName || 'Calculation'}`;
    case 'critique':
      return `Assumptions & Parasitic Critique: ${snapshotName || 'Design Case'}`;
    case 'test-plan':
      return `Bench Test & Validation Procedure: ${snapshotName || 'Hardware'}`;
    case 'review-synthesis':
      return `Engineering Peer Review Synthesis: ${snapshotName || 'Project'}`;
  }
}

/**
 * Deterministic Rule-Based Fallback
 * Provides high-value, instant engineering analysis without external network calls or API keys.
 */
export function runDeterministicOfflineReview(
  action: AiReviewAction,
  project: ElectroKitProject,
  snapshot?: CalculationSnapshot
): AiReviewResult {
  const timestamp = new Date().toISOString();
  const id = 'detrev_' + Math.random().toString(36).substring(2, 9);
  let content = '';

  if (action === 'explain') {
    content = `### Deterministic Physical Explanation\n\n`;
    if (snapshot) {
      content += `**Calculation Module:** ${snapshot.name} (\`${snapshot.engineId}\`)\n\n`;
      content += `#### Governing Engineering Principles:\n`;
      content += `- **Conservation of Energy & Power Balance:** Input power equals useful load power plus dissipated thermal losses ($P_{\\text{in}} = P_{\\text{out}} + P_{\\text{loss}}$).\n`;
      content += `- **Ohmic & Impedance Relationships:** Voltage drops and current distribution are governed by Ohm's Law ($V = IR$) and frequency-dependent impedance ($Z = R + jX$).\n`;
      content += `- **First-Order Sensitivity:** Parameter variations in temperature or component tolerances shift operating margins linearly or quadratically depending on the reactive or resistive nature of the element.\n\n`;
      content += `#### Deterministic Results Summary:\n`;
      for (const [k, v] of Object.entries(snapshot.outputs)) {
        content += `- \`${k}\`: **${typeof v === 'number' ? v.toFixed(3) : JSON.stringify(v)}**\n`;
      }
    } else {
      content += `Evaluated deterministic system parameters across active design cases.\n`;
    }
  } else if (action === 'critique') {
    content = `### Engineering Assumptions & Risk Critique\n\n`;
    content += `#### Verified Engineering Posture:\n`;
    content += `1. **Parasitic Elements:** Real printed circuit boards introduce stray trace inductance (~1 nH/mm) and capacitive coupling to ground planes that are neglected in DC analysis.\n`;
    content += `2. **Thermal Boundary Conditions:** Passive natural convection assumed $h \\approx 5\\text{–}10\\,\\text{W/(m}^2\\cdot\\text{K)}$. If installed in a sealed enclosure without ventilation, junction temperature will rise significantly higher.\n`;
    content += `3. **Component Tolerances:** Standard resistors (±1%) and MLCC capacitors (±20% with DC bias derating up to -60% at rated voltage) require worst-case stackup verification.\n`;
    content += `4. **Battery Chemistry:** Ambient temperatures below 0°C double internal ESR and lock fast-charging to prevent lithium plating.\n`;
  } else if (action === 'test-plan') {
    content = `### Hardware Bench Validation Plan\n\n`;
    content += `#### Equipment Required:\n`;
    content += `- 4-Channel Mixed-Signal Oscilloscope (>= 200 MHz, low-inductance ground springs)\n`;
    content += `- Programmable DC Power Supply with four-wire Kelvin sensing\n`;
    content += `- Programmable Electronic Load (Constant Current & Dynamic Transient mode)\n`;
    content += `- Calibrated True-RMS Multimeter (6.5 digit resolution)\n`;
    content += `- FLIR or Thermocouple Data Acquisition Unit\n\n`;
    content += `#### Recommended Test Sequence:\n`;
    content += `1. **Cold Resistance & Continuity Check:** Verify zero power short-circuits on all rails prior to energizing.\n`;
    content += `2. **Gradual Voltage Ramp:** Bring supply up slowly while monitoring quiescent current to verify no abnormal inrush.\n`;
    content += `3. **Full Load Thermal Soak:** Run at maximum rated current for 30 minutes until thermal equilibrium is reached; capture peak component temps.\n`;
    content += `4. **Dynamic Step-Load Transient:** Step load from 10% to 90% at 1 A/µs; measure peak rail droop and recovery time.\n`;
  } else {
    // review-synthesis
    const satisfied = (snapshot?.margins || []).filter((m) => m.isSatisfied).length;
    const total = (snapshot?.margins || []).length;
    content = `### Engineering Peer Review Synthesis\n\n`;
    content += `**Project:** ${project.metadata.name} | **Case:** ${project.activeCaseId || 'Baseline'}\n\n`;
    content += `- **Deterministic Margins Audit:** ${satisfied} / ${total || 'N/A'} margins verified compliant.\n`;
    content += `- **Architecture Posture:** Design demonstrates deterministic convergence across power, thermal, and electrical limits.\n`;
    content += `- **Next Milestone:** Hardware prototype assembly, bench Kelvin testing, and BOM validation.\n`;
  }

  return {
    id,
    action,
    timestamp,
    title: getActionTitle(action, snapshot?.name),
    content,
    providerUsed: 'offline',
    offlineFallback: true,
    targetName: snapshot?.name,
  };
}
