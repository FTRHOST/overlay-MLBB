
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, TeamData, AdConfig } from '../types';

interface AdminPanelProps {
  state: AppState;
  setState: (newState: AppState | ((prev: AppState) => AppState)) => void;
  resetState: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, resetState }) => {
  const [draft, setDraft] = useState<AppState>(state);
  const [activeTab, setActiveTab] = useState<'teams' | 'ads'>('teams');

  useEffect(() => {
    setDraft(state);
  }, [state.assets, state.blue, state.red, state.adConfig, state.ads]);

  const handleApplyAll = useCallback(() => {
    setState(draft);
  }, [draft, setState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        handleApplyAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApplyAll]);

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

  const handleImageUpload = (side: 'blue' | 'red' | 'ads', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (side === 'blue' || side === 'red') {
        updateDraftTeam(side, 'logo', base64);
      } else if (side === 'ads') {
        setDraft(prev => ({
          ...prev,
          ads: [...prev.ads, base64]
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAd = (index: number) => {
    setDraft(prev => ({
      ...prev,
      ads: prev.ads.filter((_, i) => i !== index)
    }));
  };

  const updateDraftAdConfig = (field: keyof AdConfig, value: any) => {
    setDraft(prev => ({
      ...prev,
      adConfig: { ...prev.adConfig, [field]: value }
    }));
  };

  const updateLiveGame = (field: string, value: any) => {
    setState(prev => ({
      ...prev,
      game: { ...prev.game, [field]: value }
    }));
    setDraft(prev => ({
      ...prev,
      game: { ...prev.game, [field]: value }
    }));
  };

  const applyTeamChanges = (side: 'blue' | 'red') => {
    setState(prev => ({ ...prev, [side]: draft[side] }));
  };

  const applyAdChanges = () => {
    setState(prev => ({
      ...prev,
      adConfig: draft.adConfig,
      ads: draft.ads
    }));
  };

  const isTeamDirty = (side: 'blue' | 'red') => JSON.stringify(state[side]) !== JSON.stringify(draft[side]);
  const isAdsDirty = () => JSON.stringify(state.adConfig) !== JSON.stringify(draft.adConfig) || JSON.stringify(state.ads) !== JSON.stringify(draft.ads);

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-6 gap-6 overflow-hidden">
      {/* Top Bar Controls - Fixed */}
      <div className="flex flex-wrap items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phase</span>
            <select 
              value={state.game.phase}
              onChange={(e) => updateLiveGame('phase', e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 ring-blue-500 transition-all"
            >
              <option>BANNING</option>
              <option>PICKING</option>
              <option>PREPARING</option>
              <option>STARTING</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Timer</span>
            <input 
              type="number"
              value={state.game.timer}
              onChange={(e) => updateLiveGame('timer', parseInt(e.target.value) || 0)}
              className="w-20 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-bold text-center"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Turn</span>
            <div className="flex bg-slate-900 rounded border border-slate-700 p-0.5">
              <button 
                onClick={() => updateLiveGame('turn', 'blue')}
                className={`px-4 py-1 rounded text-[10px] font-black transition-all ${state.game.turn === 'blue' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                BLUE
              </button>
              <button 
                onClick={() => updateLiveGame('turn', 'red')}
                className={`px-4 py-1 rounded text-[10px] font-black transition-all ${state.game.turn === 'red' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                RED
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setState(prev => ({ ...prev, game: { ...prev.game, isIntroActive: true }}))}
            disabled={state.game.isIntroActive}
            className={`px-4 py-2 rounded-lg font-black text-[10px] tracking-widest uppercase transition-all ${state.game.isIntroActive ? 'bg-slate-700 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'}`}
          >
            {state.game.isIntroActive ? 'Intro Running' : 'Start Intro'}
          </button>
          <button 
            onClick={handleApplyAll}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-black text-[10px] tracking-widest uppercase shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            Publish All <span className="opacity-50 text-[8px] bg-black/20 px-1 rounded">CTRL+ENTER</span>
          </button>
          <button onClick={resetState} className="ml-2 p-2 text-slate-500 hover:text-red-400 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/50">
        <button 
          onClick={() => setActiveTab('teams')}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'teams' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Teams & Players
        </button>
        <button 
          onClick={() => setActiveTab('ads')}
          className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'ads' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Ads & Sponsors
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'teams' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blue Team Card */}
            <div className={`flex flex-col bg-slate-800/30 rounded-2xl border transition-all duration-300 ${isTeamDirty('blue') ? 'border-blue-500/50 shadow-lg shadow-blue-500/5' : 'border-slate-700/50'}`}>
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-6 bg-blue-500 rounded-full" />
                  <div className="relative group/logo">
                    {draft.blue.logo ? (
                      <img src={draft.blue.logo} className="w-8 h-8 object-contain rounded bg-black/20" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-[8px] text-slate-500">LOGO</div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload('blue', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <input 
                    value={draft.blue.name}
                    onChange={(e) => updateDraftTeam('blue', 'name', e.target.value)}
                    className="bg-transparent text-base font-black uppercase tracking-tight focus:outline-none placeholder:text-slate-600 w-full"
                    placeholder="BLUE TEAM NAME"
                  />
                </div>
                {isTeamDirty('blue') && (
                  <button onClick={() => applyTeamChanges('blue')} className="text-[9px] font-black bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full hover:bg-blue-500 hover:text-white transition-all whitespace-nowrap">
                    APPLY
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                 <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-slate-500 font-bold uppercase">Bans</label>
                   <div className="grid grid-cols-5 gap-1">
                      {draft.blue.bans.map((ban, i) => (
                        <input key={i} placeholder={`Ban ${i+1}`} value={ban} onChange={(e) => updateDraftTeam('blue', 'bans', e.target.value, i)} className="bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] rounded focus:border-blue-500 uppercase text-center" />
                      ))}
                   </div>
                 </div>
                <div className="grid gap-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Picks & Players</label>
                  {draft.blue.pNames.map((name, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input 
                        placeholder="Hero" 
                        value={draft.blue.picks[i]} 
                        onChange={(e) => updateDraftTeam('blue', 'picks', e.target.value, i)} 
                        className="w-20 bg-slate-900 border border-slate-700/50 p-2 text-[10px] rounded focus:border-blue-500 transition-all uppercase font-semibold" 
                      />
                      <input 
                        placeholder="Player Name" 
                        value={name} 
                        onChange={(e) => updateDraftTeam('blue', 'pNames', e.target.value, i)} 
                        className="flex-1 bg-slate-900 border border-slate-700/50 p-2 text-[10px] rounded focus:border-blue-500 transition-all uppercase font-semibold" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Red Team Card */}
            <div className={`flex flex-col bg-slate-800/30 rounded-2xl border transition-all duration-300 ${isTeamDirty('red') ? 'border-red-500/50 shadow-lg shadow-red-500/5' : 'border-slate-700/50'}`}>
              <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-6 bg-red-500 rounded-full" />
                  <div className="relative group/logo">
                    {draft.red.logo ? (
                      <img src={draft.red.logo} className="w-8 h-8 object-contain rounded bg-black/20" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-[8px] text-slate-500">LOGO</div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload('red', e)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <input 
                    value={draft.red.name}
                    onChange={(e) => updateDraftTeam('red', 'name', e.target.value)}
                    className="bg-transparent text-base font-black uppercase tracking-tight focus:outline-none placeholder:text-slate-600 w-full"
                    placeholder="RED TEAM NAME"
                  />
                </div>
                {isTeamDirty('red') && (
                  <button onClick={() => applyTeamChanges('red')} className="text-[9px] font-black bg-red-500/20 text-red-400 px-3 py-1 rounded-full hover:bg-red-500 hover:text-white transition-all whitespace-nowrap">
                    APPLY
                  </button>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] text-slate-500 font-bold uppercase">Bans</label>
                   <div className="grid grid-cols-5 gap-1">
                      {draft.red.bans.map((ban, i) => (
                        <input key={i} placeholder={`Ban ${i+1}`} value={ban} onChange={(e) => updateDraftTeam('red', 'bans', e.target.value, i)} className="bg-slate-900 border border-slate-700/50 p-1.5 text-[10px] rounded focus:border-red-500 uppercase text-center" />
                      ))}
                   </div>
                 </div>
                <div className="grid gap-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Picks & Players</label>
                  {draft.red.pNames.map((name, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input 
                        placeholder="Hero" 
                        value={draft.red.picks[i]} 
                        onChange={(e) => updateDraftTeam('red', 'picks', e.target.value, i)} 
                        className="w-20 bg-slate-900 border border-slate-700/50 p-2 text-[10px] rounded focus:border-red-500 transition-all uppercase font-semibold" 
                      />
                      <input 
                        placeholder="Player Name" 
                        value={name} 
                        onChange={(e) => updateDraftTeam('red', 'pNames', e.target.value, i)} 
                        className="flex-1 bg-slate-900 border border-slate-700/50 p-2 text-[10px] rounded focus:border-red-500 transition-all uppercase font-semibold" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Ads Tab */
          <div className={`bg-slate-800/30 rounded-2xl border p-6 transition-all duration-300 ${isAdsDirty() ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-slate-700/50'}`}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-amber-400 font-black uppercase tracking-widest">Ad Configuration</h3>
                {isAdsDirty() && (
                  <button onClick={applyAdChanges} className="text-[10px] font-black bg-amber-500 text-white px-4 py-1.5 rounded-full hover:bg-amber-400 transition-all shadow-lg">
                    APPLY CHANGES
                  </button>
                )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Display Type</label>
                    <select 
                      value={draft.adConfig.type}
                      onChange={(e) => updateDraftAdConfig('type', e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-bold"
                    >
                      <option value="images">Logos / Images</option>
                      <option value="text">Custom Text</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Transition Effect</label>
                    <select 
                      value={draft.adConfig.effect}
                      onChange={(e) => updateDraftAdConfig('effect', e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-bold"
                    >
                      <option value="scroll">Smooth Scroll</option>
                      <option value="fade">Cross Fade</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Scroll Speed (seconds)</label>
                    <input 
                      type="number"
                      value={draft.adConfig.speed}
                      onChange={(e) => updateDraftAdConfig('speed', parseInt(e.target.value) || 0)}
                      className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {draft.adConfig.type === 'text' ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Marquee Text</label>
                      <textarea 
                        value={draft.adConfig.text}
                        onChange={(e) => updateDraftAdConfig('text', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded p-3 text-xs font-semibold h-32 focus:border-amber-500 transition-all"
                        placeholder="Enter your ad text here..."
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Ad Images</label>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {draft.ads.map((ad, i) => (
                          <div key={i} className="relative group aspect-video bg-black/40 rounded border border-slate-700 overflow-hidden">
                            <img 
                              src={ad.startsWith('data:') ? ad : `assets/${ad}.png`} 
                              className="w-full h-full object-contain" 
                              onError={(e) => { e.currentTarget.src = `https://placehold.co/100x50/18252C/ffffff?text=${ad}`; }}
                            />
                            <button 
                              onClick={() => removeAd(i)}
                              className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            >
                              <span className="text-[8px] font-bold">REMOVE</span>
                            </button>
                          </div>
                        ))}
                        <label className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                          <span className="text-lg">+</span>
                          <span className="text-[8px] font-bold">UPLOAD</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload('ads', e)} 
                          />
                        </label>
                      </div>
                      <p className="text-[9px] text-slate-600 italic">Upload custom images for your ads carousel.</p>
                    </div>
                  )}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
