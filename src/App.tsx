import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SearchModal } from './components/search/SearchModal';
import { FormulaBookView } from './components/formulas/FormulaBookView';
import { TaxonomyExplorerView } from './components/taxonomy/TaxonomyExplorerView';

import { OhmsLawTool } from './components/tools/OhmsLawTool';
import { ElectricalPowerTool } from './components/tools/ElectricalPowerTool';
import { VoltageDividerTool } from './components/tools/VoltageDividerTool';
import { ResistorColorTool } from './components/tools/ResistorColorTool';
import { LedResistorTool } from './components/tools/LedResistorTool';
import { BatteryRuntimeTool } from './components/tools/BatteryRuntimeTool';
import { AcPowerTool } from './components/tools/AcPowerTool';
import { FreqWavelengthTool } from './components/tools/FreqWavelengthTool';
import { NumberConverterTool } from './components/tools/NumberConverterTool';
import { PwmTool } from './components/tools/PwmTool';
import { SeriesParallelResistorTool } from './components/tools/SeriesParallelResistorTool';
import { SeriesParallelCapacitorTool } from './components/tools/SeriesParallelCapacitorTool';
import { SeriesParallelInductorTool } from './components/tools/SeriesParallelInductorTool';
import { RcRlTimeConstantTool } from './components/tools/RcRlTimeConstantTool';
import { ResonanceCalculatorTool } from './components/tools/ResonanceCalculatorTool';
import { AcImpedanceTool } from './components/tools/AcImpedanceTool';
import { AnalogFilterTool } from './components/tools/AnalogFilterTool';
import { DiodeRectifierTool } from './components/tools/DiodeRectifierTool';
import { BjtTransistorTool } from './components/tools/BjtTransistorTool';
import { MosfetTool } from './components/tools/MosfetTool';
import { OpAmpTool } from './components/tools/OpAmpTool';
import { EnergyPowerTool } from './components/tools/EnergyPowerTool';
import { VoltageDropTool } from './components/tools/VoltageDropTool';
import { CableEngineeringTool } from './components/tools/CableEngineeringTool';
import { TransformerTool } from './components/tools/TransformerTool';
import { PowerFactorTool } from './components/tools/PowerFactorTool';
import { ElectricalProtectionTool } from './components/tools/ElectricalProtectionTool';
import { ElectricMotorsTool } from './components/tools/ElectricMotorsTool';
import { GeneratorTool } from './components/tools/GeneratorTool';
import { ElectricalHeatingTool } from './components/tools/ElectricalHeatingTool';
import { LoadScheduleTool } from './components/tools/LoadScheduleTool';
import { AcSinglePhaseTool } from './components/tools/AcSinglePhaseTool';
import { ThreePhasePowerTool } from './components/tools/ThreePhasePowerTool';
import { ElectricalFundamentalsTool } from './components/tools/ElectricalFundamentalsTool';
import { PowerElectronicsTool } from './components/tools/PowerElectronicsTool';
import { LogicDesignTool } from './components/tools/LogicDesignTool';
import { DigitalDataTool } from './components/tools/DigitalDataTool';
import { ErrorDetectionTool } from './components/tools/ErrorDetectionTool';
import { AdcDacTool } from './components/tools/AdcDacTool';
import { SamplingNyquistTool } from './components/tools/SamplingNyquistTool';
import { SerialProtocolsTool } from './components/tools/SerialProtocolsTool';
import { EmbeddedTimingTool } from './components/tools/EmbeddedTimingTool';
import { SignalFundamentalsTool } from './components/tools/SignalFundamentalsTool';
import { DecibelsPowerTool } from './components/tools/DecibelsPowerTool';
import { LinkBudgetTool } from './components/tools/LinkBudgetTool';
import { AntennasTool } from './components/tools/AntennasTool';
import { RfNoiseTool } from './components/tools/RfNoiseTool';

import { PcbTraceWidthTool } from './components/tools/PcbTraceWidthTool';
import { ViaAmpacityTool } from './components/tools/ViaAmpacityTool';
import { PcbStackupTool } from './components/tools/PcbStackupTool';
import { ControlledImpedanceTool } from './components/tools/ControlledImpedanceTool';
import { DifferentialPairsTool } from './components/tools/DifferentialPairsTool';
import { SignalIntegrityTool } from './components/tools/SignalIntegrityTool';
import { PowerIntegrityTool } from './components/tools/PowerIntegrityTool';
import { PcbDrcClearanceTool } from './components/tools/PcbDrcClearanceTool';
import { PcbReferenceTool } from './components/tools/PcbReferenceTool';

import { EngineeringPrecisionTool } from './components/tools/EngineeringPrecisionTool';
import { ComplexMathTool } from './components/tools/ComplexMathTool';
import { VectorMatrixTool } from './components/tools/VectorMatrixTool';
import { CalculusNumericalTool } from './components/tools/CalculusNumericalTool';
import { RootFindingTool } from './components/tools/RootFindingTool';
import { CurveFittingTool } from './components/tools/CurveFittingTool';
import { EngineeringStatisticsTool } from './components/tools/EngineeringStatisticsTool';
import { EngineeringGeometryTool } from './components/tools/EngineeringGeometryTool';

import { ThermalFundamentalsTool } from './components/tools/ThermalFundamentalsTool';
import { SemiconductorThermalTool } from './components/tools/SemiconductorThermalTool';
import { HeatsinkConvectionTool } from './components/tools/HeatsinkConvectionTool';
import { ThermalInterfaceTool } from './components/tools/ThermalInterfaceTool';
import { PcbEnclosureThermalTool } from './components/tools/PcbEnclosureThermalTool';
import { TransientReliabilityTool } from './components/tools/TransientReliabilityTool';

import { BatteryFundamentalsTool } from './components/tools/BatteryFundamentalsTool';
import { BatteryPackTool } from './components/tools/BatteryPackTool';
import { BatteryDischargeTool } from './components/tools/BatteryDischargeTool';
import { BatterySocTool } from './components/tools/BatterySocTool';
import { BatteryChargingTool } from './components/tools/BatteryChargingTool';
import { BatteryAgingTool } from './components/tools/BatteryAgingTool';

import { RequirementsSpecificationTool } from './components/tools/RequirementsSpecificationTool';
import { PowerSystemDesignTool } from './components/tools/PowerSystemDesignTool';
import { ThermalSystemDesignTool } from './components/tools/ThermalSystemDesignTool';
import { BatterySystemDesignTool } from './components/tools/BatterySystemDesignTool';
import { PcbSystemDesignTool } from './components/tools/PcbSystemDesignTool';
import { SystemDesignReviewTool } from './components/tools/SystemDesignReviewTool';

import { TOOLS_REGISTRY, getToolBySlug } from './data/registry';
import { loadPreferences, savePreferences } from './lib/storage/local';
import { Sparkles, ArrowRight, Share2, Check } from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'tool' | 'formulas' | 'taxonomy'>('tool');
  const [activeToolId, setActiveToolId] = useState<string>('ohms-law');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize from storage or URL hash on load
  useEffect(() => {
    const prefs = loadPreferences();
    setFavorites(prefs.favoriteToolIds || []);

    const parseHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash === 'formulas') {
        setActiveView('formulas');
      } else if (hash === 'taxonomy') {
        setActiveView('taxonomy');
      } else if (hash && getToolBySlug(hash)) {
        setActiveToolId(hash);
        setActiveView('tool');
      } else if (prefs.recentToolIds && prefs.recentToolIds.length > 0) {
        setActiveToolId(prefs.recentToolIds[0]);
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const activeTool = getToolBySlug(activeToolId) || TOOLS_REGISTRY[0];

  // Dynamic SEO metadata synchronization
  useEffect(() => {
    let title = "ElectroKit — The Electronics & Electrical Engineer's Toolbox";
    let description = "100% client-side precision calculators, circuit design utilities, formula references, and component analysis.";
    let canonical = window.location.origin + window.location.pathname;

    if (activeView === 'formulas') {
      title = "Engineering Formula Book & Equation Reference | ElectroKit";
      description = "Searchable engineering formula repository with mathematical derivations, SI unit specifications, and worked electrical examples.";
      canonical += '#/formulas';
    } else if (activeView === 'taxonomy') {
      title = "Engineering Taxonomy & Tool Explorer | ElectroKit";
      description = "Directory of 80+ specialized engineering calculators spanning circuits, power electronics, PCB design, RF, thermal, and embedded systems.";
      canonical += '#/taxonomy';
    } else if (activeTool) {
      title = activeTool.seo?.title || `${activeTool.name} — Precision Calculator | ElectroKit`;
      description = activeTool.seo?.metaDescription || activeTool.description;
      canonical += `#/${activeTool.slug}`;
    }

    document.title = title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // Update og:title & og:description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonical);

    // Update twitter:title & twitter:description
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);

    // Update canonical link
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.setAttribute('href', canonical);
  }, [activeView, activeToolId, activeTool]);

  // Update hash when active tool or view changes
  const handleSelectTool = (slug: string) => {
    setActiveToolId(slug);
    setActiveView('tool');
    window.location.hash = `#/${slug}`;

    const prefs = loadPreferences();
    const updatedRecents = [slug, ...prefs.recentToolIds.filter((id) => id !== slug)].slice(0, 10);
    savePreferences({ recentToolIds: updatedRecents });
  };

  const handleSelectView = (view: 'tool' | 'formulas' | 'taxonomy') => {
    setActiveView(view);
    if (view === 'formulas') window.location.hash = '#/formulas';
    else if (view === 'taxonomy') window.location.hash = '#/taxonomy';
    else window.location.hash = `#/${activeToolId}`;
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      savePreferences({ favoriteToolIds: next });
      return next;
    });
  };

  const handleShareTool = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Engineering App Bar */}
      <Header
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        activeToolName={activeView === 'tool' ? activeTool.name : undefined}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeToolId={activeToolId}
          onSelectTool={handleSelectTool}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          favorites={favorites}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto w-full">
          {activeView === 'formulas' && (
            <FormulaBookView onSelectTool={handleSelectTool} />
          )}

          {activeView === 'taxonomy' && (
            <TaxonomyExplorerView onSelectTool={handleSelectTool} />
          )}

          {activeView === 'tool' && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Tool Header Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 uppercase">
                      {activeTool.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">•</span>
                    <span className="text-xs font-mono text-slate-400">
                      Standard: <span className="text-slate-300 font-semibold">{activeTool.formulaSnippet}</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                    {activeTool.name}
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                    {activeTool.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(activeTool.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      favorites.includes(activeTool.id)
                        ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>{favorites.includes(activeTool.id) ? '★ Favorited' : '☆ Favorite'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareTool}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Link Copied</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tool Quick Switcher Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Quick Switch:
                </span>
                {TOOLS_REGISTRY.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTool(t.id)}
                    className={`px-2.5 py-1 text-xs rounded-md font-mono whitespace-nowrap transition-all cursor-pointer border ${
                      activeToolId === t.id
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {t.name.replace(' Calculator', '').replace(' Converter', '')}
                  </button>
                ))}
              </div>

              {/* Active Calculation Engine Component */}
              <div className="mt-2">
                {activeToolId === 'ohms-law' && <OhmsLawTool />}
                {activeToolId === 'electrical-power' && <ElectricalPowerTool />}
                {activeToolId === 'voltage-divider' && <VoltageDividerTool />}
                {activeToolId === 'resistor-color-code' && <ResistorColorTool />}
                {activeToolId === 'led-resistor' && <LedResistorTool />}
                {activeToolId === 'battery-runtime' && <BatteryRuntimeTool />}
                {activeToolId === 'ac-power' && <AcPowerTool />}
                {activeToolId === 'freq-wavelength' && <FreqWavelengthTool />}
                {activeToolId === 'number-converter' && <NumberConverterTool />}
                {activeToolId === 'pwm-calculator' && <PwmTool />}
                {activeToolId === 'series-parallel-resistors' && <SeriesParallelResistorTool />}
                {activeToolId === 'series-parallel-capacitors' && <SeriesParallelCapacitorTool />}
                {activeToolId === 'series-parallel-inductors' && <SeriesParallelInductorTool />}
                {activeToolId === 'rc-rl-time-constant' && <RcRlTimeConstantTool />}
                {activeToolId === 'rlc-resonance' && <ResonanceCalculatorTool />}
                {activeToolId === 'ac-impedance' && <AcImpedanceTool />}
                {activeToolId === 'analog-filters' && <AnalogFilterTool />}
                {activeToolId === 'diode-rectifiers' && <DiodeRectifierTool />}
                {activeToolId === 'bjt-transistor' && <BjtTransistorTool />}
                {activeToolId === 'mosfet-analysis' && <MosfetTool />}
                {activeToolId === 'op-amp-circuits' && <OpAmpTool />}
                {activeToolId === 'energy-storage' && <EnergyPowerTool />}
                {activeToolId === 'voltage-drop' && <VoltageDropTool onNavigate={handleSelectTool} />}
                {activeToolId === 'cable-engineering' && <CableEngineeringTool onNavigate={handleSelectTool} />}
                {activeToolId === 'transformers' && <TransformerTool onNavigate={handleSelectTool} />}
                {activeToolId === 'power-factor' && <PowerFactorTool onNavigate={handleSelectTool} />}
                {activeToolId === 'electrical-protection' && <ElectricalProtectionTool onNavigate={handleSelectTool} />}
                {activeToolId === 'electric-motors' && <ElectricMotorsTool onNavigate={handleSelectTool} />}
                {activeToolId === 'generators' && <GeneratorTool onNavigate={handleSelectTool} />}
                {activeToolId === 'electrical-heating' && <ElectricalHeatingTool onNavigate={handleSelectTool} />}
                {activeToolId === 'load-schedule' && <LoadScheduleTool onNavigate={handleSelectTool} />}
                {activeToolId === 'ac-single-phase' && <AcSinglePhaseTool onNavigate={handleSelectTool} />}
                {activeToolId === 'three-phase-power' && <ThreePhasePowerTool onNavigate={handleSelectTool} />}
                {activeToolId === 'electrical-fundamentals' && <ElectricalFundamentalsTool onNavigate={handleSelectTool} />}
                {(activeToolId === 'power-converters' ||
                  activeToolId === 'ac-dc-rectifiers' ||
                  activeToolId === 'inverters-spwm' ||
                  activeToolId === 'semiconductor-loss' ||
                  activeToolId === 'converter-design-mode') && <PowerElectronicsTool />}
                {activeToolId === 'logic-design' && <LogicDesignTool />}
                {activeToolId === 'digital-data' && <DigitalDataTool />}
                {activeToolId === 'error-detection' && <ErrorDetectionTool />}
                {activeToolId === 'adc-dac' && <AdcDacTool />}
                {activeToolId === 'sampling-nyquist' && <SamplingNyquistTool />}
                {activeToolId === 'serial-protocols' && <SerialProtocolsTool />}
                {activeToolId === 'embedded-timing' && <EmbeddedTimingTool />}
                {activeToolId === 'signal-fundamentals' && <SignalFundamentalsTool />}
                {activeToolId === 'decibels-power' && <DecibelsPowerTool />}
                {activeToolId === 'link-budget' && <LinkBudgetTool />}
                {activeToolId === 'antennas' && <AntennasTool />}
                {activeToolId === 'rf-noise' && <RfNoiseTool />}
                {activeToolId === 'pcb-trace-width' && <PcbTraceWidthTool />}
                {activeToolId === 'via-ampacity' && <ViaAmpacityTool />}
                {activeToolId === 'pcb-stackup' && <PcbStackupTool />}
                {activeToolId === 'controlled-impedance' && <ControlledImpedanceTool />}
                {activeToolId === 'differential-pairs' && <DifferentialPairsTool />}
                {activeToolId === 'signal-integrity' && <SignalIntegrityTool />}
                {activeToolId === 'power-integrity' && <PowerIntegrityTool />}
                {activeToolId === 'pcb-drc-clearance' && <PcbDrcClearanceTool />}
                {activeToolId === 'pcb-reference' && <PcbReferenceTool />}
                {(activeToolId === 'scientific-prefixes' || activeToolId === 'engineering-precision') && <EngineeringPrecisionTool />}
                {(activeToolId === 'phasor-calculator' || activeToolId === 'complex-numbers') && <ComplexMathTool />}
                {activeToolId === 'vector-matrix-math' && <VectorMatrixTool />}
                {activeToolId === 'calculus-numerical' && <CalculusNumericalTool />}
                {activeToolId === 'root-finding' && <RootFindingTool />}
                {activeToolId === 'curve-fitting' && <CurveFittingTool />}
                {activeToolId === 'engineering-statistics' && <EngineeringStatisticsTool />}
                {activeToolId === 'engineering-geometry' && <EngineeringGeometryTool />}
                {(activeToolId === 'thermal-fundamentals' || activeToolId === 'thermal-resistance') && <ThermalFundamentalsTool />}
                {(activeToolId === 'semiconductor-thermal' || activeToolId === 'junction-temperature') && <SemiconductorThermalTool />}
                {(activeToolId === 'heatsink-convection' || activeToolId === 'heatsink-estimator') && <HeatsinkConvectionTool />}
                {activeToolId === 'thermal-interfaces' && <ThermalInterfaceTool />}
                {activeToolId === 'pcb-enclosure-thermal' && <PcbEnclosureThermalTool />}
                {activeToolId === 'transient-reliability' && <TransientReliabilityTool />}
                {(activeToolId === 'battery-fundamentals' || activeToolId === 'battery-capacity') && <BatteryFundamentalsTool />}
                {(activeToolId === 'battery-pack' || activeToolId === 'battery-pack-designer') && <BatteryPackTool />}
                {activeToolId === 'battery-discharge' && <BatteryDischargeTool />}
                {activeToolId === 'battery-soc' && <BatterySocTool />}
                {activeToolId === 'battery-charging' && <BatteryChargingTool />}
                {activeToolId === 'battery-aging' && <BatteryAgingTool />}
                {activeToolId === 'requirements-specification' && <RequirementsSpecificationTool />}
                {activeToolId === 'power-system-design' && <PowerSystemDesignTool />}
                {activeToolId === 'thermal-system-design' && <ThermalSystemDesignTool />}
                {activeToolId === 'battery-system-design' && <BatterySystemDesignTool />}
                {activeToolId === 'pcb-system-design' && <PcbSystemDesignTool />}
                {activeToolId === 'system-design-review' && <SystemDesignReviewTool />}
              </div>

              {/* Related Tools Navigator */}
              {activeTool.relatedToolIds && activeTool.relatedToolIds.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Related Engineering Tools
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeTool.relatedToolIds.map((relId) => {
                      const relTool = getToolBySlug(relId);
                      if (!relTool) return null;
                      return (
                        <div
                          key={relTool.id}
                          onClick={() => handleSelectTool(relTool.id)}
                          className="p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-900 hover:border-cyan-500/50 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                              {relTool.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {relTool.formulaSnippet}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Global Command Palette / Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTool={handleSelectTool}
        onSelectFormulaView={() => handleSelectView('formulas')}
      />
    </div>
  );
}
