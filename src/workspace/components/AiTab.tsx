import React, { useState, useEffect } from 'react';
import { ElectroKitProject, AiConfig, AiReviewResult, AiReviewAction, CalculationSnapshot } from '../types';
import { loadAiConfig, saveAiConfig, removeAiCredentials } from '../storage';
import { runEngineeringAiReview } from '../ai-intelligence';
import {
  Sparkles,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';

interface AiTabProps {
  project: ElectroKitProject;
  activeSnapshot?: CalculationSnapshot;
}

export const AiTab: React.FC<AiTabProps> = ({ project, activeSnapshot }) => {
  const [config, setConfig] = useState<AiConfig>({
    provider: 'offline',
    isEnabled: false,
    model: 'gemini-2.5-flash',
  });
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AiReviewResult[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadAiConfig();
    setConfig(loaded);
  }, []);

  const handleSaveConfig = (updates: Partial<AiConfig>) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    saveAiConfig(updated);
  };

  const activeCase =
    project.designCases.find((c) => c.id === project.activeCaseId) || project.designCases[0];
  const snapshots = activeCase?.calculationSnapshots || [];

  const targetSnapshot =
    snapshots.find((s) => s.id === selectedSnapshotId) || activeSnapshot || snapshots[0];

  const handleRunAction = async (action: AiReviewAction) => {
    setLoading(true);
    try {
      const res = await runEngineeringAiReview({
        action,
        project,
        targetSnapshot,
        configOverride: config,
      });
      setResults((prev) => [res, ...prev]);
    } catch (err) {
      console.error('AI Review Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* BYO AI Provider Settings Card */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Bring-Your-Own-AI (BYO AI) Intelligence Layer
            </h3>
            <p className="text-xs text-slate-400">
              Optional client-side AI peer reviewer. Deterministic engines calculate; AI explains and critiques.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Enable AI Assistance:</span>
            <button
              onClick={() => handleSaveConfig({ isEnabled: !config.isEnabled })}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                config.isEnabled ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  config.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Provider Configuration Form */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <label className="text-slate-400 block mb-1">Provider</label>
            <select
              value={config.provider}
              onChange={(e) => {
                const prov = e.target.value as any;
                let defaultModel = config.model;
                if (prov === 'gemini') defaultModel = 'gemini-2.5-flash';
                else if (prov === 'openai') defaultModel = 'gpt-4o-mini';
                else if (prov === 'anthropic') defaultModel = 'claude-3-5-sonnet-20241022';
                else if (prov === 'ollama') defaultModel = 'llama3.2';
                handleSaveConfig({ provider: prov, model: defaultModel });
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            >
              <option value="offline">Offline Rule-Based (Zero-Network)</option>
              <option value="gemini">Google Gemini (Client API Key)</option>
              <option value="openai">OpenAI (Client API Key)</option>
              <option value="anthropic">Anthropic Claude (Client API Key)</option>
              <option value="ollama">Ollama / Local LLM (Localhost URL)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Model Name</label>
            <input
              type="text"
              value={config.model || ''}
              onChange={(e) => handleSaveConfig({ model: e.target.value })}
              placeholder="e.g. gemini-2.5-flash"
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            />
          </div>

          {config.provider !== 'offline' && config.provider !== 'ollama' && (
            <div>
              <label className="text-slate-400 block mb-1">Client API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.apiKey || ''}
                  onChange={(e) => handleSaveConfig({ apiKey: e.target.value })}
                  placeholder="Paste your key here..."
                  className="w-full px-2.5 py-1.5 pr-8 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {config.apiKey && (
                <button
                  type="button"
                  onClick={() => {
                    removeAiCredentials();
                    setConfig(loadAiConfig());
                  }}
                  className="mt-1 text-[10px] text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
                >
                  Purge &amp; Delete Saved Key
                </button>
              )}
            </div>
          )}

          {config.provider === 'ollama' && (
            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Ollama Base URL</label>
              <input
                type="text"
                value={config.endpoint || 'http://localhost:11434/api/generate'}
                onChange={(e) => handleSaveConfig({ endpoint: e.target.value })}
                placeholder="http://localhost:11434/api/generate"
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 mb-1.5"
              />
              <p className="text-[10px] text-amber-400/90 font-mono">
                CORS Note: Browser direct access requires Ollama started with CORS origins enabled (e.g. <code className="text-cyan-300">OLLAMA_ORIGINS="*" ollama serve</code>). If blocked, ElectroKit automatically engages the deterministic offline engine review.
              </p>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>100% Client-Side Privacy:</strong> API keys are saved exclusively in your browser's LocalStorage and sent only to the provider you select. ElectroKit has no backend server or telemetry.
          </span>
        </div>
      </div>

      {/* Interactive Review Actions Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Launch Engineering Peer Review
            </h3>
            <p className="text-xs text-slate-400">
              Select a target calculation snapshot or review the entire active project case.
            </p>
          </div>

          {snapshots.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Target:</span>
              <select
                value={selectedSnapshotId || (targetSnapshot ? targetSnapshot.id : '')}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            disabled={loading}
            onClick={() => handleRunAction('explain')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500 text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Explain Physics</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Physical principles governing the calculated numbers and sensitivity factors.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => handleRunAction('critique')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500 text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
              <AlertTriangle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Critique Assumptions</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Identify unmodeled parasitic elements, temperature derating, and component risks.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => handleRunAction('test-plan')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500 text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
              <Cpu className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Bench Test Plan</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Lab oscilloscope, electronic load, and probe test procedures for validation.
            </p>
          </button>

          <button
            disabled={loading}
            onClick={() => handleRunAction('review-synthesis')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all group cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>Peer Review Synthesis</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Comprehensive peer review summary assessing margin compliance and prototyping readiness.
            </p>
          </button>
        </div>

        {loading && (
          <div className="mt-4 p-4 text-center text-xs font-mono text-cyan-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Analyzing deterministic engineering results...</span>
          </div>
        )}
      </div>

      {/* Review Results Stream */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">
            Analysis & Review History ({results.length})
          </h3>
          {results.map((res) => (
            <div
              key={res.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md transition-all space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100">{res.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                    {res.providerUsed}
                  </span>
                  {res.offlineFallback && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Deterministic Offline
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(res.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <button
                    onClick={() => handleCopy(res.id, res.content)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                    title="Copy Review Text"
                  >
                    {copiedId === res.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                {res.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
