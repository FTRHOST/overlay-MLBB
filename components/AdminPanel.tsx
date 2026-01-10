
import React, { useState, useEffect } from 'react';
import { AppState, TeamData, AdConfig } from '../types';

interface AdminPanelProps {
  state: AppState;
  setState: (newState: AppState | ((prev: AppState) => AppState)) => void;
  resetState: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, resetState }) => {
  // Local state for draft changes
  const [draft, setDraft] = useState<AppState>(state);

  // Sync draft with live state only if external change occurs (like reset)
  useEffect(() => {
    setDraft(state);
  }, [state.assets]); // Assets remain live for simplicity or sync on reset

  // Shortcut Ctrl + Enter to Apply All
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        applyAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [draft]);

  const updateDraftTeam = (side: 'blue' | 'red', field: string, value: string | string[], index?: number) => {
    setDraft(prev => {
      const newDraft = { ...prev };
      const team = { ...newDraft[side] };
      
      if (index !== undefined && Array.isArray(team[field as keyof TeamData])) {
        const arr = [...(team[field as keyof TeamData] as string[])];
        arr[index] = value as string;
        (team[field as keyof TeamData] as string[]) = arr;
      } else {
        (team[field as keyof TeamData] as any) = value;
      }
      
      newDraft[side] = team;
      return newDraft;
    });
  };

  const handleDraftLogoUpload = (side: 'blue' | 'red', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => updateDraftTeam(side, 'logo', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateDraftAdConfig = (field: keyof AdConfig, value: any) => {
    setDraft(prev => ({
      ...prev,
      adConfig: { ...prev.adConfig, [field]: value }
    }));
  };

  const applyTeamChanges = (side: 'blue' | 'red') => {
    setState(prev => ({
      ...prev,
      [side]: draft[side]
    }));
  };

  const applyAdChanges = () => {
    setState(prev => ({
      ...prev,
      adConfig: draft.adConfig,
      ads: draft.ads
    }));
  };

  const applyAll = () => {
    setState(draft);
  };

  // Immediate controls (Real-time)
  const updateLiveGame = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      game: { ...prev.game, [field]: value }
    }));
    // Sync draft so it doesn't get overwritten by old game state later
    setDraft(prev => ({
      ...prev,
      game: { ...prev.game, [field]: value }
    }));
  };

  const isTeamDirty = (side: 'blue' | 'red') => JSON.stringify(state[side]) !== JSON.stringify(draft[side]);
  const isAdsDirty = () => JSON.stringify(state.adConfig) !== JSON.stringify(draft.adConfig) || JSON.stringify(state.ads) !== JSON.stringify(draft.ads);

  const isEnabled = state.game.isGameControlEnabled;

  return (
    <div className="fixed left-0 top-0 w-80 h-full bg-slate-900 text-white p-4 z-[100] overflow-y-auto border-r border-slate-700 font-sans text-sm shadow-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-400">Admin Control</h2>
        <button onClick={resetState} className="text-[10px] bg-red-900/50 hover:bg-red-600 px-2 py-1 rounded transition-colors uppercase font-bold">
          Reset
        </button>
      </div>
      
      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setState(prev => ({ ...prev, game: { ...prev.game, isIntroActive: true }}))}
          disabled={state.game.isIntroActive}
          className={`flex-1 p-2 rounded font-bold text-[10px] uppercase tracking-wider transition-all ${state.game.isIntroActive ? 'bg-slate-700 opacity-50' : 'bg-indigo-600 hover:bg-indigo-500'}`}
        >
          {state.game.isIntroActive ? 'Intro...' : '▶ Intro'}
        </button>
        <button 
          onClick={applyAll}
          className="flex-1 bg-green-600 hover:bg-green-500 p-2 rounded font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-green-900/20"
          title="Shortcut: Ctrl + Enter"
        >
          Publish All
        </button>
      </div>

      {/* Real-time Game Controls */}
      <div className={`mb-6 p-3 rounded transition-all duration-300 ${isEnabled ? 'bg-slate-800' : 'bg-slate-950/50 border border-slate-800'}`}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-700/50">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Live Logic</label>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => updateLiveGame('isGameControlEnabled', !state.game.isGameControlEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${isEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <div className={`space-y-3 transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[10px] text-slate-500">PHASE</label>
              <select 
                value={state.game.phase}
                onChange={(e) => updateLiveGame('phase', e.target.value)}
                className="w-full bg-slate-700 p-2 rounded text-xs"
              >
                <option>BANNING</option>
                <option>PICKING</option>
                <option>PREPARING</option>
                <option>STARTING</option>
              </select>
            </div>
            <div className="w-20">
              <label className="block text-[10px] text-slate-500">TIMER</label>
              <input 
                type="number"
                value={state.game.timer}
                onChange={(e) => updateLiveGame('timer', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-700 p-2 rounded text-center text-xs"
              />
            </div>
          </div>
          <div>
            <div className="flex gap-2">
              <button 
                onClick={() => updateLiveGame('turn', 'blue')}
                className={`flex-1 p-1 rounded text-[10px] font-bold ${state.game.turn === 'blue' ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                BLUE TURN
              </button>
              <button 
                onClick={() => updateLiveGame('turn', 'red')}
                className={`flex-1 p-1 rounded text-[10px] font-bold ${state.game.turn === 'red' ? 'bg-red-600' : 'bg-slate-700'}`}
              >
                RED TURN
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ads Section (Draftable) */}
      <div className={`mb-6 p-3 rounded bg-slate-800 border ${isAdsDirty() ? 'border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'border-transparent'}`}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Ads & Sponsor</h3>
          {isAdsDirty() && (
            <button onClick={applyAdChanges} className="bg-amber-600 hover:bg-amber-500 text-[9px] px-2 py-0.5 rounded font-bold animate-pulse">
              APPLY
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <select 
              value={draft.adConfig.type}
              onChange={(e) => updateDraftAdConfig('type', e.target.value as any)}
              className="flex-1 bg-slate-700 p-1 rounded text-xs"
            >
              <option value="images">Logos</option>
              <option value="text">Text</option>
            </select>
            <select 
              value={draft.adConfig.effect}
              onChange={(e) => updateDraftAdConfig('effect', e.target.value as any)}
              className="flex-1 bg-slate-700 p-1 rounded text-xs"
            >
              <option value="scroll">Scroll</option>
              <option value="fade">Fade</option>
            </select>
          </div>
          {draft.adConfig.type === 'text' ? (
            <textarea 
              value={draft.adConfig.text}
              onChange={(e) => updateDraftAdConfig('text', e.target.value)}
              className="w-full bg-slate-700 p-2 rounded text-xs h-12"
            />
          ) : (
            <input 
              value={draft.ads.join(', ')}
              onChange={(e) => setDraft(prev => ({ ...prev, ads: e.target.value.split(',').map(s => s.trim()) }))}
              className="w-full bg-slate-700 p-1 rounded text-xs"
              placeholder="logo1, logo2..."
            />
          )}
        </div>
      </div>

      <div className="space-y-8 pb-10">
        {/* Blue Team (Draftable) */}
        <div className={`p-3 rounded bg-slate-800 border ${isTeamDirty('blue') ? 'border-blue-500/50 shadow-[0_0_10px_rgba(37,99,235,0.1)]' : 'border-transparent'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-blue-400 font-bold uppercase">Blue Team</h3>
            {isTeamDirty('blue') && (
              <button onClick={() => applyTeamChanges('blue')} className="bg-blue-600 hover:bg-blue-500 text-[9px] px-2 py-0.5 rounded font-bold">
                APPLY
              </button>
            )}
          </div>
          <input 
            type="file" accept="image/*" 
            onChange={(e) => handleDraftLogoUpload('blue', e)} 
            className="text-[10px] w-full mb-2" 
          />
          <input 
            value={draft.blue.name}
            onChange={(e) => updateDraftTeam('blue', 'name', e.target.value)}
            className="w-full bg-slate-700 p-2 rounded mb-4 font-bold outline-none focus:ring-1 ring-blue-500"
            placeholder="Team Name"
          />
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold">PICKS & PLAYERS</label>
            {draft.blue.picks.map((p, i) => (
              <div key={i} className="flex gap-1">
                <input placeholder="Hero" value={p} onChange={(e) => updateDraftTeam('blue', 'picks', e.target.value, i)} className="w-1/3 bg-slate-700 p-1 text-[10px] rounded" />
                <input placeholder="Name" value={draft.blue.pNames[i]} onChange={(e) => updateDraftTeam('blue', 'pNames', e.target.value, i)} className="w-2/3 bg-slate-700 p-1 text-[10px] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Red Team (Draftable) */}
        <div className={`p-3 rounded bg-slate-800 border ${isTeamDirty('red') ? 'border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.1)]' : 'border-transparent'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-red-400 font-bold uppercase">Red Team</h3>
            {isTeamDirty('red') && (
              <button onClick={() => applyTeamChanges('red')} className="bg-red-600 hover:bg-red-500 text-[9px] px-2 py-0.5 rounded font-bold">
                APPLY
              </button>
            )}
          </div>
          <input 
            type="file" accept="image/*" 
            onChange={(e) => handleDraftLogoUpload('red', e)} 
            className="text-[10px] w-full mb-2" 
          />
          <input 
            value={draft.red.name}
            onChange={(e) => updateDraftTeam('red', 'name', e.target.value)}
            className="w-full bg-slate-700 p-2 rounded mb-4 font-bold outline-none focus:ring-1 ring-red-500"
            placeholder="Team Name"
          />
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold">PICKS & PLAYERS</label>
            {draft.red.picks.map((p, i) => (
              <div key={i} className="flex gap-1">
                <input placeholder="Hero" value={p} onChange={(e) => updateDraftTeam('red', 'picks', e.target.value, i)} className="w-1/3 bg-slate-700 p-1 text-[10px] rounded" />
                <input placeholder="Name" value={draft.red.pNames[i]} onChange={(e) => updateDraftTeam('red', 'pNames', e.target.value, i)} className="w-2/3 bg-slate-700 p-1 text-[10px] rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
