import React from 'react';

interface CircuitDiagramProps {
  type:
    | 'ohms-law'
    | 'voltage-divider'
    | 'led-resistor'
    | 'resistor-color'
    | 'ac-power'
    | 'freq-wavelength'
    | 'pwm'
    | 'battery'
    | 'binary';
  data: Record<string, any>;
}

export const CircuitDiagram: React.FC<CircuitDiagramProps> = ({ type, data }) => {
  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-4 schematic-grid flex flex-col items-center justify-center overflow-hidden">
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider text-[10px]">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          Interactive Schematic &amp; Waveform
        </span>
        <span className="text-[10px] text-slate-500">Vector SVG</span>
      </div>

      {type === 'ohms-law' && (
        <svg viewBox="0 0 340 180" className="w-full max-w-md h-auto select-none">
          {/* Circuit Loop Wires */}
          <rect x="50" y="30" width="240" height="120" rx="8" fill="none" stroke="#475569" strokeWidth="2.5" />
          
          {/* DC Voltage Source */}
          <circle cx="50" cy="90" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          <text x="50" y="85" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace">+</text>
          <text x="50" y="102" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="bold" fontFamily="monospace">-</text>
          <text x="24" y="94" textAnchor="end" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="600">
            {data.voltage?.toFixed(1) ?? 'V'} V
          </text>

          {/* Current Flow Arrow */}
          <path d="M 120 24 L 160 24" stroke="#f59e0b" strokeWidth="2" markerEnd="url(#arrow)" />
          <polygon points="160,20 170,24 160,28" fill="#f59e0b" />
          <text x="145" y="18" textAnchor="middle" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="600">
            I = {data.current < 0.01 ? (data.current * 1000).toFixed(1) + ' mA' : data.current?.toFixed(2) + ' A'}
          </text>

          {/* Resistor Component (Zig-Zag) */}
          <rect x="280" y="65" width="20" height="50" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <path
            d="M 290 30 L 290 65 M 290 65 L 283 73 L 297 81 L 283 89 L 297 97 L 290 105 L 290 150"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <text x="316" y="94" textAnchor="start" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="600">
            R = {data.resistance > 1000 ? (data.resistance / 1000).toFixed(2) + ' kΩ' : data.resistance?.toFixed(1) + ' Ω'}
          </text>

          {/* Power dissipation indicator */}
          <text x="170" y="105" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            P = {data.power < 1 ? (data.power * 1000).toFixed(1) + ' mW' : data.power?.toFixed(2) + ' W'}
          </text>
        </svg>
      )}

      {type === 'voltage-divider' && (
        <svg viewBox="0 0 320 220" className="w-full max-w-md h-auto select-none">
          {/* Main vertical line */}
          <line x1="100" y1="25" x2="100" y2="55" stroke="#475569" strokeWidth="2.5" />
          
          {/* Vin terminal */}
          <circle cx="100" cy="25" r="4" fill="#38bdf8" />
          <text x="90" y="28" textAnchor="end" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
            Vin ({data.vin}V)
          </text>

          {/* R1 Resistor */}
          <rect x="90" y="55" width="20" height="40" rx="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
          <text x="120" y="78" fill="#94a3b8" fontSize="11" fontFamily="monospace">
            R1: {data.r1 > 1000 ? (data.r1 / 1000).toFixed(1) + 'k' : data.r1}Ω
          </text>

          {/* Mid node */}
          <line x1="100" y1="95" x2="100" y2="125" stroke="#475569" strokeWidth="2.5" />
          <circle cx="100" cy="110" r="4" fill="#10b981" />
          
          {/* Vout branch */}
          <line x1="100" y1="110" x2="210" y2="110" stroke="#10b981" strokeWidth="2" />
          <circle cx="210" cy="110" r="4" fill="#10b981" />
          <text x="220" y="114" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">
            Vout = {data.vout?.toFixed(2)}V
          </text>

          {/* R2 Resistor */}
          <rect x="90" y="125" width="20" height="40" rx="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
          <text x="120" y="148" fill="#94a3b8" fontSize="11" fontFamily="monospace">
            R2: {data.r2 > 1000 ? (data.r2 / 1000).toFixed(1) + 'k' : data.r2}Ω
          </text>

          {/* Ground */}
          <line x1="100" y1="165" x2="100" y2="190" stroke="#475569" strokeWidth="2.5" />
          <line x1="85" y1="190" x2="115" y2="190" stroke="#64748b" strokeWidth="2" />
          <line x1="90" y1="195" x2="110" y2="195" stroke="#64748b" strokeWidth="2" />
          <line x1="95" y1="200" x2="105" y2="200" stroke="#64748b" strokeWidth="2" />
          <text x="120" y="196" fill="#64748b" fontSize="10" fontFamily="monospace">GND (0V)</text>

          {/* Load RL if present */}
          {data.rLoad && (
            <>
              <line x1="180" y1="110" x2="180" y2="140" stroke="#475569" strokeWidth="2" />
              <rect x="172" y="140" width="16" height="30" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="195" y="158" fill="#f59e0b" fontSize="10" fontFamily="monospace">RL</text>
              <line x1="180" y1="170" x2="180" y2="190" stroke="#475569" strokeWidth="2" />
              <line x1="180" y1="190" x2="100" y2="190" stroke="#475569" strokeWidth="1.5" />
            </>
          )}
        </svg>
      )}

      {type === 'led-resistor' && (
        <svg viewBox="0 0 340 160" className="w-full max-w-md h-auto select-none">
          {/* Rail wires */}
          <line x1="30" y1="40" x2="300" y2="40" stroke="#475569" strokeWidth="2" />
          <line x1="30" y1="120" x2="300" y2="120" stroke="#475569" strokeWidth="2" />

          {/* Power rails */}
          <text x="25" y="44" textAnchor="end" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
            +{data.Vs}V
          </text>
          <text x="25" y="124" textAnchor="end" fill="#64748b" fontSize="11" fontFamily="monospace">
            0V (GND)
          </text>

          {/* Branch wire */}
          <line x1="120" y1="40" x2="120" y2="60" stroke="#475569" strokeWidth="2" />

          {/* Resistor */}
          <rect x="110" y="60" width="20" height="35" rx="3" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <text x="140" y="78" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
            {data.chosenResistor > 1000 ? (data.chosenResistor / 1000).toFixed(1) + ' kΩ' : data.chosenResistor?.toFixed(0) + ' Ω'}
          </text>

          {/* LED Diode Triangle & Bar */}
          <line x1="120" y1="95" x2="120" y2="105" stroke="#475569" strokeWidth="2" />
          
          <polygon points="110,105 130,105 120,118" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="110" y1="118" x2="130" y2="118" stroke="#ef4444" strokeWidth="2" />
          <line x1="120" y1="118" x2="120" y2="120" stroke="#475569" strokeWidth="2" />

          {/* Photon light emission arrows */}
          <path d="M 132 108 L 144 100" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="144,100 141,105 147,103" fill="#f59e0b" />
          <path d="M 134 116 L 146 108" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="146,108 143,113 149,111" fill="#f59e0b" />

          <text x="155" y="116" fill="#ef4444" fontSize="11" fontFamily="monospace">
            Vf = {data.Vf}V ({data.seriesCount || 1}x)
          </text>

          {/* Current flow */}
          <text x="230" y="80" fill="#f59e0b" fontSize="11" fontFamily="monospace">
            I_led = {(data.actualCurrent * 1000)?.toFixed(1)} mA
          </text>
        </svg>
      )}

      {type === 'resistor-color' && (
        <div className="w-full flex flex-col items-center gap-3 py-2">
          <svg viewBox="0 0 400 120" className="w-full max-w-lg h-auto select-none">
            {/* Metallic Lead Wires */}
            <line x1="20" y1="60" x2="90" y2="60" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <line x1="310" y1="60" x2="380" y2="60" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

            {/* Ceramic Resistor Body */}
            <defs>
              <linearGradient id="resistorBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e2d9c8" />
                <stop offset="50%" stopColor="#f5efe6" />
                <stop offset="100%" stopColor="#c5bbaa" />
              </linearGradient>
            </defs>
            <rect x="90" y="32" width="220" height="56" rx="16" fill="url(#resistorBody)" stroke="#a89f91" strokeWidth="1.5" />

            {/* Color Bands */}
            {data.bands && data.bands.map((band: any, i: number) => {
              const totalBands = data.bands.length;
              // Distribute bands evenly across the body
              const startX = 118;
              const spacing = 28;
              const isLastTolerance = i === totalBands - 1 || (totalBands === 6 && i === totalBands - 2);
              const extraGap = isLastTolerance ? 24 : 0;
              const bandX = startX + i * spacing + extraGap;

              return (
                <g key={i}>
                  <rect
                    x={bandX}
                    y="32"
                    width="14"
                    height="56"
                    fill={band.hex}
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="1"
                  />
                  <text
                    x={bandX + 7}
                    y="105"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    B{i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {type === 'ac-power' && (
        <svg viewBox="0 0 320 180" className="w-full max-w-md h-auto select-none">
          {/* Right Angle Power Triangle */}
          {/* Base: P (Active Power in Watts) */}
          <line x1="50" y1="140" x2="220" y2="140" stroke="#10b981" strokeWidth="3" />
          <text x="135" y="158" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
            Real P = {((data.activePowerW || 0) / 1000).toFixed(2)} kW
          </text>

          {/* Height: Q (Reactive Power in VAR) */}
          <line x1="220" y1="140" x2="220" y2="40" stroke="#f59e0b" strokeWidth="3" />
          <text x="230" y="90" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
            Q = {((data.reactivePowerVar || 0) / 1000).toFixed(2)} kVAR
          </text>

          {/* Hypotenuse: S (Apparent Power in VA) */}
          <line x1="50" y1="140" x2="220" y2="40" stroke="#38bdf8" strokeWidth="3" />
          <text x="120" y="80" textAnchor="end" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="bold">
            S = {((data.apparentPowerVa || 0) / 1000).toFixed(2)} kVA
          </text>

          {/* Phase Angle Arc */}
          <path d="M 90 140 A 40 40 0 0 0 85 125" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="2,2" />
          <text x="96" y="132" fill="#e2e8f0" fontSize="10" fontFamily="monospace">
            φ = {data.phiDeg?.toFixed(1)}° (PF: {data.pf})
          </text>
        </svg>
      )}

      {type === 'pwm' && (
        <svg viewBox="0 0 360 160" className="w-full max-w-md h-auto select-none">
          {/* Axes */}
          <line x1="30" y1="130" x2="340" y2="130" stroke="#334155" strokeWidth="1.5" />
          <line x1="30" y1="20" x2="30" y2="130" stroke="#334155" strokeWidth="1.5" />
          <text x="20" y="35" textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">+{data.Vcc}V</text>
          <text x="20" y="134" textAnchor="end" fill="#64748b" fontSize="10" fontFamily="monospace">0V</text>

          {/* PWM Waveform Pulse */}
          {/* Cycle 1 & 2 */}
          {(() => {
            const duty = Math.min(Math.max((data.dPercent || 50) / 100, 0.05), 0.95);
            const cycleWidth = 140;
            const highWidth = cycleWidth * duty;
            const lowWidth = cycleWidth * (1 - duty);

            return (
              <g>
                <path
                  d={`
                    M 30 130
                    L 30 35
                    L ${30 + highWidth} 35
                    L ${30 + highWidth} 130
                    L ${30 + cycleWidth} 130
                    L ${30 + cycleWidth} 35
                    L ${30 + cycleWidth + highWidth} 35
                    L ${30 + cycleWidth + highWidth} 130
                    L ${30 + cycleWidth * 2} 130
                  `}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />

                {/* Average Voltage Dashed Line */}
                <line
                  x1="30"
                  y1={130 - ((130 - 35) * duty)}
                  x2="330"
                  y2={130 - ((130 - 35) * duty)}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text
                  x="335"
                  y={134 - ((130 - 35) * duty)}
                  fill="#10b981"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  V_avg ({data.averageVoltage?.toFixed(2)}V)
                </text>

                {/* Markers for Ton and Period */}
                <line x1="30" y1="145" x2={30 + highWidth} y2="145" stroke="#f59e0b" strokeWidth="1.5" />
                <text x={30 + highWidth / 2} y="156" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">
                  Ton ({data.dPercent}%)
                </text>

                <line x1="30" y1="16" x2={30 + cycleWidth} y2="16" stroke="#94a3b8" strokeWidth="1" />
                <text x={30 + cycleWidth / 2} y="12" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                  Period T = 1/f
                </text>
              </g>
            );
          })()}
        </svg>
      )}

      {type === 'freq-wavelength' && (
        <svg viewBox="0 0 340 140" className="w-full max-w-md h-auto select-none">
          {/* Sine Wave */}
          <path
            d="M 30 70 Q 70 15, 110 70 T 190 70 T 270 70 T 320 70"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          {/* Axis */}
          <line x1="20" y1="70" x2="330" y2="70" stroke="#334155" strokeWidth="1" strokeDasharray="3,3" />

          {/* Wavelength span λ */}
          <line x1="30" y1="20" x2="190" y2="20" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="30,20 35,17 35,23" fill="#f59e0b" />
          <polygon points="190,20 185,17 185,23" fill="#f59e0b" />
          <text x="110" y="14" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
            λ = {data.lambdaMeters > 1 ? data.lambdaMeters?.toFixed(2) + ' m' : (data.lambdaMeters * 100)?.toFixed(1) + ' cm'}
          </text>

          {/* Monopole / Dipole dimension callout */}
          <rect x="70" y="95" width="200" height="32" rx="6" fill="#0f172a" stroke="#475569" />
          <text x="170" y="115" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="monospace">
            λ/4 Antenna: {(data.quarterWaveMeters * 100)?.toFixed(1)} cm ({(data.quarterWaveMeters * 39.37)?.toFixed(2)} in)
          </text>
        </svg>
      )}

      {type === 'battery' && (
        <svg viewBox="0 0 320 140" className="w-full max-w-md h-auto select-none">
          {/* Battery cell */}
          <rect x="50" y="45" width="50" height="50" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="2" />
          <rect x="100" y="60" width="6" height="20" rx="1" fill="#10b981" />
          <text x="75" y="74" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">
            {data.nominalVoltage}V
          </text>

          {/* Wires to load */}
          <line x1="106" y1="70" x2="220" y2="70" stroke="#475569" strokeWidth="2" />
          
          {/* Load box */}
          <rect x="220" y="45" width="60" height="50" rx="6" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" />
          <text x="250" y="70" textAnchor="middle" fill="#f59e0b" fontSize="11" fontFamily="monospace" fontWeight="bold">
            LOAD
          </text>
          <text x="250" y="85" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
            {data.powerW ? data.powerW.toFixed(1) + 'W' : (data.currentA?.toFixed(2) + 'A')}
          </text>

          {/* Current arrows */}
          <path d="M 140 60 L 170 60" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="170,60 164,57 164,63" fill="#38bdf8" />
          <text x="155" y="52" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace">
            {data.cRate?.toFixed(2)}C Rate
          </text>
        </svg>
      )}
    </div>
  );
};
