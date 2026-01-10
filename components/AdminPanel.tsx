
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, TeamData, AdConfig, ApiConfig } from '../types';

interface AdminPanelProps {
  state: AppState;
  setState: (newState: AppState | ((prev: AppState) => AppState)) => void;
  resetState: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, resetState }) => {
  const [draft, setDraft] = useState<AppState>(state);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(state);
  }, [state.assets, state.apiConfig]);

  // Logic to Fetch and Map API
  const fetchApiData = useCallback(async () => {
    if (!state.apiConfig.url) return;
    try {
      const response = await fetch(state.apiConfig.url);
      const json = await response.json();
      
      const players = json.room_info?.players || [];
      const banPick = json.ban_pick || {};
      
      setDraft(prev => {
        const next = { ...prev };
        
        // Map Blue Team (iCamp: 1)
        const bluePlayers = players.filter((p: any) => p.iCamp === 1).slice(0, 5);
        bluePlayers.forEach((p: any, i: number) => {
          next.blue.pNames[i] = p._sName || 'EMPTY';
          next.blue.picks[i] = String(p.heroid || '');
          next.blue.pRoles[i] = p.iRoad || 0;
        });

        // Map Red Team (iCamp: 2)
        const redPlayers = players.filter((p: any) => p.iCamp === 2).slice(0, 5);
        redPlayers.forEach((p: any, i: number) => {
          next.red.pNames[i] = p._sName || 'EMPTY';
          next.red.picks[i] = String(p.heroid || '');
          next.red.pRoles[i] = p.iRoad || 0;
        });

        // Map Bans
        if (banPick.ban_list) {
          // Asumsi ban_list adalah array heroId
          const blueBans = banPick.ban_list.filter((_: any, i: number) => i % 2 === 0).slice(0, 5);
          const redBans = banPick.ban_list.filter((_: any, i: number) => i % 2 !== 0).slice(0, 5);
          next.blue.bans = blueBans.map(String);
          next.red.bans = redBans.map(String);
        }

        // Live Logic Sync (Timer & Phase)
        // Map banPick.state ke Phase String jika dibutuhkan
        const phaseMap: Record<number, string> = { 0: 'WAITING', 1: 'BANNING', 2: 'PICKING', 6: 'STARTING' };
        next.game.phase = phaseMap[json.debug?.game_state] || 'MATCH';
        
        // Timer dari ban_pick.timers (contoh: pick_time)
        const activeTimer = banPick.timers?.pick_time || banPick.timers?.ban_time || 0;
        next.game.timer = activeTimer;

        return next;
      });

      setApiError(null);
      
      // If Auto-Sync is on, apply immediately
      if (state.apiConfig.isEnabled) {
        setState(prev => ({
          ...prev,
          blue: draft.blue,
          red: draft.red,
          game: { ...prev.game, timer: draft.game.timer, phase: draft.game.phase }
        }));
      }
    } catch (err) {
      setApiError("API Fetch Failed");
      console.error(err);
    }
  }, [state.apiConfig, draft, setState]);

  // Polling Effect
  useEffect(() => {
    if (state.apiConfig.isEnabled) {
      const interval = setInterval(fetchApiData, state.apiConfig.interval);
      return () => clearInterval(interval);
    }
  }, [state.apiConfig.isEnabled, state.apiConfig.interval, fetchApiData]);

  const updateDraftTeam = (side: 'blue' | 'red', field: string, value: any, index?: number) => {
    setDraft(prev => {
      const newDraft = { ...prev };
      const team = { ...newDraft[side] };
      if (index !== undefined && Array.isArray(team[field as keyof TeamData])) {
        const arr = [...(team[field as keyof TeamData] as any[])];
        arr[index] = value;
        (team[field as keyof TeamData] as any) = arr;
      } else {
        (team[field as keyof TeamData] as any) = value;
      }
      newDraft[side] = team;
      return newDraft;
    });
  };

  const applyAll = () => setState(draft);
  const isTeamDirty = (side: 'blue' | 'red') => JSON.stringify(state[side]) !== JSON.stringify(draft[side]);

  return (
    <div className="fixed left-0 top-0 w-80 h-full bg-slate-900 text-white p-4 z-[100] overflow-y-auto border-r border-slate-700 font-sans text-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-blue-400 uppercase">Admin</h2>
        <button onClick={resetState} className="text-[10px] bg-red-900/50 px-2 py-1 rounded font-bold">RESET</button>
      </div>

      {/* API INTEGRATION SECTION */}
      <div className="mb-6 p-3 bg-indigo-950/40 border border-indigo-500/30 rounded">
        <h3 className="text-[10px] font-bold text-indigo-300 uppercase mb-2">API Integration (Real-time)</h3>
        <div className="space-y-2">
          <input 
            value={state.apiConfig.url}
            onChange={(e) => setState(prev => ({ ...prev, apiConfig: { ...prev.apiConfig, url: e.target.value }}))}
            className="w-full bg-slate-800 p-1.5 rounded text-[10px] outline-none border border-slate-700 focus:border-indigo-500"
            placeholder="http://api-url/data.json"
          />
          <div className="flex gap-2">
            <button 
              onClick={fetchApiData}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded font-bold text-[9px] uppercase"
            >
              Fetch Data
            </button>
            <button 
              onClick={() => setState(prev => ({ ...prev, apiConfig: { ...prev.apiConfig, isEnabled: !prev.apiConfig.isEnabled }}))}
              className={`flex-1 p-1.5 rounded font-bold text-[9px] uppercase ${state.apiConfig.isEnabled ? 'bg-green-600' : 'bg-slate-700'}`}
            >
              {state.apiConfig.isEnabled ? 'Auto Sync ON' : 'Auto Sync OFF'}
            </button>
          </div>
          {apiError && <p className="text-[9px] text-red-400 mt-1">⚠️ {apiError}</p>}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={applyAll} className="flex-1 bg-green-600 hover:bg-green-500 p-2 rounded font-bold text-[10px] uppercase">Publish All</button>
      </div>

      {/* Live Logic Indicators */}
      <div className="mb-6 p-3 bg-slate-800 rounded">
        <label className="block text-[10px] text-slate-500 font-bold mb-2">GAME STATE</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-700 p-1.5 rounded text-center">
            <span className="block text-[8px] text-slate-400">PHASE</span>
            <span className="font-bold text-xs">{state.game.phase}</span>
          </div>
          <div className="bg-slate-700 p-1.5 rounded text-center">
            <span className="block text-[8px] text-slate-400">TIMER</span>
            <span className="font-bold text-xs">{state.game.timer}s</span>
          </div>
        </div>
      </div>

      {/* Teams Sections */}
      {/* Changed side to be typed as 'blue' | 'red' for proper property access on draft */}
      {(['blue', 'red'] as const).map((side) => (
        <div key={side} className={`mb-6 p-3 rounded bg-slate-800 border ${isTeamDirty(side) ? 'border-amber-500/40' : 'border-transparent'}`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className={`font-bold uppercase ${side === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{side} Team</h3>
            {isTeamDirty(side) && (
              <button onClick={() => setState(prev => ({ ...prev, [side]: draft[side] }))} className="bg-amber-600 text-[8px] px-2 py-0.5 rounded font-bold">APPLY</button>
            )}
          </div>
          <input 
            value={draft[side].name}
            onChange={(e) => updateDraftTeam(side, 'name', e.target.value)}
            className="w-full bg-slate-700 p-2 rounded mb-3 text-xs font-bold"
          />
          <div className="space-y-2">
            {draft[side].picks.map((p, i) => (
              <div key={i} className="flex gap-1 items-center">
                <select 
                  value={draft[side].pRoles[i]}
                  onChange={(e) => updateDraftTeam(side, 'pRoles', parseInt(e.target.value), i)}
                  className="bg-slate-900 text-[9px] p-1 rounded w-16"
                >
                  <option value={0}>NONE</option>
                  <option value={1}>EXP</option>
                  <option value={2}>MID</option>
                  <option value={3}>ROAM</option>
                  <option value={4}>JNG</option>
                  <option value={5}>GOLD</option>
                </select>
                <input placeholder="HeroID" value={p} onChange={(e) => updateDraftTeam(side, 'picks', e.target.value, i)} className="w-12 bg-slate-700 p-1 text-[10px] rounded" />
                <input placeholder="Name" value={draft[side].pNames[i]} onChange={(e) => updateDraftTeam(side, 'pNames', e.target.value, i)} className="flex-1 bg-slate-700 p-1 text-[10px] rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminPanel;
