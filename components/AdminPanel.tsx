import React, { useState, useEffect, useCallback } from 'react';
import { AppState, TeamData, AdConfig, RegisteredTeam, BracketMatch } from '../types';

interface AdminPanelProps {
  state: AppState;
  setState: (newState: AppState | ((prev: AppState) => AppState)) => void;
  resetState: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ state, setState, resetState }) => {
  const [draft, setDraft] = useState<AppState>(state);
  const [activeTab, setActiveTab] = useState<'teams' | 'scores' | 'ads' | 'prepare'>('teams');
  
  // Local state for the Prepare tab form
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLeader, setNewTeamLeader] = useState('');
  const [newTeamLogo, setNewTeamLogo] = useState('');

  useEffect(() => {
    setDraft(state);
  }, [state]);

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

  // --- HELPERS ---

  const checkAndAutoFillTeam = (side: 'blue' | 'red', pNames: string[]) => {
    if (!state.registry) return;
    const foundTeam = state.registry.find(team => pNames.some(p => p.toLowerCase() === team.leaderId.toLowerCase()));
    if (foundTeam) {
       setDraft(prev => ({
         ...prev,
         [side]: { ...prev[side], name: foundTeam.name, logo: foundTeam.logo }
       }));
    }
  };

  const updateDraftTeam = (side: 'blue' | 'red', field: string, value: any, index?: number) => {
    setDraft(prev => {
      const newDraft = { ...prev };
      const team = { ...newDraft[side] };
      if (index !== undefined && Array.isArray(team[field as keyof TeamData])) {
        const arr = [...(team[field as keyof TeamData] as string[])];
        arr[index] = value as string;
        (team[field as keyof TeamData] as string[]) = arr;
        if (field === 'pNames') checkAndAutoFillTeam(side, arr);
      } else {
        (team[field as keyof TeamData] as any) = value;
      }
      newDraft[side] = team;
      return newDraft;
    });
  };

  const updateDraftBracket = (stage: 'semis' | 'final', index: number, field: keyof BracketMatch, value: any) => {
    if (!draft.bracket) return;
    setDraft(prev => {
      const newBracket = { ...prev.bracket! };
      if (stage === 'semis') {
        const matches = [...newBracket.semis];
        matches[index] = { ...matches[index], [field]: value };
        newBracket.semis = matches as [BracketMatch, BracketMatch];
      } else {
        newBracket.final = { ...newBracket.final, [field]: value };
      }
      return { ...prev, bracket: newBracket };
    });
  };

  const updateDraftChampion = (name: string) => {
    if (!draft.bracket) return;
    setDraft(prev => ({ ...prev, bracket: { ...prev.bracket!, champion: name } }));
  };

  const handleGameWin = (winnerSide: 'blue' | 'red') => {
    const winnerName = draft[winnerSide].name;
    const loserSide = winnerSide === 'blue' ? 'red' : 'blue';
    const loserName = draft[loserSide].name;

    const newScore = (draft[winnerSide].score || 0) + 1;
    
    let newBracket = draft.bracket ? { ...draft.bracket } : undefined;
    
    if (newBracket) {
        const updateMatchScoreIfFound = (match: BracketMatch): BracketMatch => {
            const matchTeam1 = match.team1.trim().toLowerCase();
            const matchTeam2 = match.team2.trim().toLowerCase();
            const wName = winnerName.trim().toLowerCase();
            const lName = loserName.trim().toLowerCase();

            if ((matchTeam1 === wName && matchTeam2 === lName) || (matchTeam1 === lName && matchTeam2 === wName)) {
                const isTeam1Winner = matchTeam1 === wName;
                return {
                    ...match,
                    score1: isTeam1Winner ? match.score1 + 1 : match.score1,
                    score2: isTeam1Winner ? match.score2 : match.score2 + 1
                };
            }
            return match;
        };

        newBracket.semis = newBracket.semis.map(updateMatchScoreIfFound) as [BracketMatch, BracketMatch];
        newBracket.final = updateMatchScoreIfFound(newBracket.final);
    }

    const newState = {
        ...draft,
        [winnerSide]: { ...draft[winnerSide], score: newScore },
        bracket: newBracket
    };

    setDraft(newState);
    setState(newState);
  };

  const handleImageUpload = (side: 'blue' | 'red' | 'ads' | 'prepare', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (side === 'blue' || side === 'red') updateDraftTeam(side, 'logo', base64);
      else if (side === 'ads') setDraft(prev => ({ ...prev, ads: [...prev.ads, base64] }));
      else if (side === 'prepare') setNewTeamLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeAd = (index: number) => {
    setDraft(prev => ({ ...prev, ads: prev.ads.filter((_, i) => i !== index) }));
  };
  
  const addTeamToRegistry = () => {
    if (!newTeamName || !newTeamLeader) return;
    const newTeam: RegisteredTeam = { id: Date.now().toString(), name: newTeamName, leaderId: newTeamLeader, logo: newTeamLogo };
    setDraft(prev => ({ ...prev, registry: [...(prev.registry || []), newTeam] }));
    setNewTeamName(''); setNewTeamLeader(''); setNewTeamLogo('');
  };
  
  const removeTeamFromRegistry = (id: string) => {
    setDraft(prev => ({ ...prev, registry: (prev.registry || []).filter(t => t.id !== id) }));
  };

  const updateDraftAdConfig = (field: keyof AdConfig, value: any) => {
    setDraft(prev => ({ ...prev, adConfig: { ...prev.adConfig, [field]: value } }));
  };

  const updateLiveGame = (field: string, value: any) => {
    setState(prev => ({ ...prev, game: { ...prev.game, [field]: value } }));
    setDraft(prev => ({ ...prev, game: { ...prev.game, [field]: value } }));
  };

  const updateVisibility = (field: 'phase' | 'timer' | 'turn' | 'score') => {
    setDraft(prev => {
        const currentVis = prev.game.visibility || { phase: true, timer: true, turn: true, score: true };
        const newVis = { ...currentVis, [field]: !currentVis[field] };
        const newGame = { ...prev.game, visibility: newVis };
        setState(s => ({ ...s, game: newGame }));
        return { ...prev, game: newGame };
    });
  };

  const toggleBracketView = () => {
    setState(prev => ({ ...prev, game: { ...prev.game, isBracketActive: !prev.game.isBracketActive } }));
  };

  const applyTeamChanges = (side: 'blue' | 'red') => setState(prev => ({ ...prev, [side]: draft[side] }));
  const applyAdChanges = () => setState(prev => ({ ...prev, adConfig: draft.adConfig, ads: draft.ads }));
  const applyRegistryChanges = () => setState(prev => ({ ...prev, registry: draft.registry }));
  const applyBracketChanges = () => setState(prev => ({ ...prev, bracket: draft.bracket }));

  const isTeamDirty = (side: 'blue' | 'red') => JSON.stringify(state[side]) !== JSON.stringify(draft[side]);
  const isAdsDirty = () => JSON.stringify(state.adConfig) !== JSON.stringify(draft.adConfig) || JSON.stringify(state.ads) !== JSON.stringify(draft.ads);
  const isRegistryDirty = () => JSON.stringify(state.registry) !== JSON.stringify(draft.registry);
  const isBracketDirty = () => JSON.stringify(state.bracket) !== JSON.stringify(draft.bracket);

  // --- RENDERERS ---

  const renderTeams = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {['blue', 'red'].map((side) => (
        <div key={side} className={`flex flex-col bg-slate-800/30 rounded-2xl border transition-all ${isTeamDirty(side as any) ? `border-${side}-500/50` : 'border-slate-700/50'}`}>
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-2 h-6 bg-${side}-500 rounded-full`} />
              <div className="relative group/logo">
                {draft[side as 'blue' | 'red'].logo ? <img src={draft[side as 'blue' | 'red'].logo} className="w-8 h-8 rounded" /> : <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-[8px]">LOGO</div>}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(side as any, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <input value={draft[side as 'blue' | 'red'].name} onChange={(e) => updateDraftTeam(side as any, 'name', e.target.value)} className="bg-transparent text-base font-black uppercase w-full" placeholder={`${side} TEAM`} />
            </div>
            <button 
              onClick={() => handleGameWin(side as any)}
              className="ml-2 text-[9px] font-black bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="text-xs">🏆</span> END GAME
            </button>
            {isTeamDirty(side as any) && <button onClick={() => applyTeamChanges(side as any)} className="ml-2 text-[9px] font-black bg-white/10 px-3 py-1 rounded-full">APPLY</button>}
          </div>
          <div className="p-4 space-y-3">
             <div className="grid grid-cols-5 gap-1 mb-2">
                {draft[side as 'blue' | 'red'].bans.map((ban, i) => (
                  <input key={i} placeholder={`Ban ${i+1}`} value={ban} onChange={(e) => updateDraftTeam(side as any, 'bans', e.target.value, i)} className="bg-slate-900 border-slate-700 p-1.5 text-[10px] rounded text-center uppercase" />
                ))}
             </div>
             <div className="grid gap-2">
                {draft[side as 'blue' | 'red'].pNames.map((name, i) => (
                  <div key={i} className="flex gap-2"><input value={draft[side as 'blue' | 'red'].picks[i]} onChange={(e) => updateDraftTeam(side as any, 'picks', e.target.value, i)} className="w-20 bg-slate-900 text-[10px] p-2 rounded uppercase" placeholder="Hero"/><input value={name} onChange={(e) => updateDraftTeam(side as any, 'pNames', e.target.value, i)} className="flex-1 bg-slate-900 text-[10px] p-2 rounded uppercase" placeholder="Player"/></div>
                ))}
             </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderScores = () => {
    if (!draft.bracket) return <div className="text-center text-slate-500 mt-10">Initializing Bracket Data...</div>;
    return (
      <div className="flex flex-col gap-8">
         <div className="grid grid-cols-2 gap-6">
            {['blue', 'red'].map(side => (
              <div key={side} className={`bg-slate-800/30 border ${isTeamDirty(side as any) ? `border-${side}-500` : 'border-slate-700'} rounded-2xl p-6 flex flex-col items-center gap-4`}>
                 <h3 className={`text-2xl font-black uppercase text-${side}-500`}>{draft[side as 'blue' | 'red'].name || `${side.toUpperCase()} TEAM`}</h3>
                 <div className="flex items-center gap-6">
                    <button onClick={() => updateDraftTeam(side as any, 'score', Math.max(0, (draft[side as 'blue' | 'red'].score || 0) - 1))} className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-xl font-bold">-</button>
                    <span className="text-6xl font-black font-gothic text-white">{draft[side as 'blue' | 'red'].score || 0}</span>
                    <button onClick={() => updateDraftTeam(side as any, 'score', (draft[side as 'blue' | 'red'].score || 0) + 1)} className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 text-xl font-bold">+</button>
                 </div>
                 {isTeamDirty(side as any) && <button onClick={() => applyTeamChanges(side as any)} className="mt-2 text-xs font-bold bg-white/10 px-4 py-2 rounded">APPLY SCORE</button>}
              </div>
            ))}
         </div>

         <div className={`bg-slate-800/30 rounded-2xl border p-6 ${isBracketDirty() ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5' : 'border-slate-700/50'}`}>
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-emerald-400 font-black uppercase tracking-widest">Tournament Bracket</h3>
               {isBracketDirty() && <button onClick={applyBracketChanges} className="text-[10px] font-black bg-emerald-500 text-white px-4 py-1.5 rounded-full hover:bg-emerald-400 transition-all shadow-lg">APPLY BRACKET</button>}
            </div>
            
            <div className="flex gap-8 items-center justify-center overflow-x-auto p-4">
               <div className="flex flex-col gap-8">
                  {draft.bracket.semis.map((match, idx) => (
                    <div key={match.id} className="w-48 bg-slate-900 border border-slate-700 rounded p-2 flex flex-col gap-1">
                       <div className="text-[10px] text-slate-500 font-bold uppercase text-center mb-1">Semifinal {idx + 1}</div>
                       <div className="flex justify-between items-center bg-slate-800 p-1 rounded"><input value={match.team1} onChange={(e) => updateDraftBracket('semis', idx, 'team1', e.target.value)} className="bg-transparent text-[10px] w-24 font-bold" /><input type="number" value={match.score1} onChange={(e) => updateDraftBracket('semis', idx, 'score1', parseInt(e.target.value)||0)} className="w-8 bg-black/30 text-center text-[10px]" /></div>
                       <div className="flex justify-between items-center bg-slate-800 p-1 rounded"><input value={match.team2} onChange={(e) => updateDraftBracket('semis', idx, 'team2', e.target.value)} className="bg-transparent text-[10px] w-24 font-bold" /><input type="number" value={match.score2} onChange={(e) => updateDraftBracket('semis', idx, 'score2', parseInt(e.target.value)||0)} className="w-8 bg-black/30 text-center text-[10px]" /></div>
                    </div>
                  ))}
               </div>
               <div className="w-8 h-[1px] bg-slate-600"></div>
               <div className="w-56 bg-slate-900 border border-amber-500/30 rounded p-3 flex flex-col gap-2 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded">GRAND FINAL</div>
                    <div className="flex justify-between items-center bg-slate-800 p-2 rounded"><input value={draft.bracket.final.team1} onChange={(e) => updateDraftBracket('final', 0, 'team1', e.target.value)} className="bg-transparent text-xs w-32 font-bold" /><input type="number" value={draft.bracket.final.score1} onChange={(e) => updateDraftBracket('final', 0, 'score1', parseInt(e.target.value)||0)} className="w-8 bg-black/30 text-center text-xs" /></div>
                    <div className="flex justify-between items-center bg-slate-800 p-2 rounded"><input value={draft.bracket.final.team2} onChange={(e) => updateDraftBracket('final', 0, 'team2', e.target.value)} className="bg-transparent text-xs w-32 font-bold" /><input type="number" value={draft.bracket.final.score2} onChange={(e) => updateDraftBracket('final', 0, 'score2', parseInt(e.target.value)||0)} className="w-8 bg-black/30 text-center text-xs" /></div>
               </div>
               <div className="w-8 h-[1px] bg-slate-600"></div>
               <div className="w-40 h-24 bg-gradient-to-br from-amber-500/20 to-purple-600/20 border border-amber-500/50 rounded flex flex-col items-center justify-center gap-2">
                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">CHAMPION</span>
                  <input value={draft.bracket.champion} onChange={(e) => updateDraftChampion(e.target.value)} className="bg-transparent text-center text-lg font-black uppercase text-white w-full focus:outline-none" placeholder="WINNER" />
               </div>
            </div>
         </div>
      </div>
    );
  };

  const renderPrepare = () => (
    <div className={`bg-slate-800/30 rounded-2xl border p-6 transition-all duration-300 ${isRegistryDirty() ? 'border-purple-500/50 shadow-lg shadow-purple-500/5' : 'border-slate-700/50'}`}>
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-purple-400 font-black uppercase tracking-widest">Team Registry & Data</h3>
          {isRegistryDirty() && <button onClick={applyRegistryChanges} className="text-[10px] font-black bg-purple-500 text-white px-4 py-1.5 rounded-full hover:bg-purple-400 transition-all shadow-lg">APPLY CHANGES</button>}
       </div>
       <div className="flex flex-col gap-6">
         <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase">Add New Team</h4>
            <div className="flex flex-wrap gap-4 items-end">
               <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Team Name</label><input value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs font-semibold w-40" placeholder="Ex: EVOS LEGENDS" /></div>
               <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Leader ID / Trigger</label><input value={newTeamLeader} onChange={(e) => setNewTeamLeader(e.target.value)} className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs font-semibold w-40" placeholder="Ex: EVOS.REKT" /></div>
               <div className="flex flex-col gap-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Logo</label><div className="relative group">{newTeamLogo ? <img src={newTeamLogo} className="w-9 h-9 object-contain bg-black/20 rounded border border-slate-600" /> : <div className="w-9 h-9 bg-slate-800 border border-slate-600 rounded flex items-center justify-center text-[8px]">UP</div>}<input type="file" accept="image/*" onChange={(e) => handleImageUpload('prepare', e)} className="absolute inset-0 opacity-0 cursor-pointer" /></div></div>
               <button onClick={addTeamToRegistry} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-black uppercase tracking-wide">Add Team</button>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {(draft.registry || []).map((team) => (
             <div key={team.id} className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center justify-between group">
                <div className="flex items-center gap-3">{team.logo ? <img src={team.logo.startsWith('data:') ? team.logo : `assets/${team.logo}.png`} className="w-10 h-10 object-contain bg-black/20 rounded" /> : <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center text-[8px]">N/A</div>}<div className="flex flex-col"><span className="text-xs font-black text-white">{team.name}</span><span className="text-[9px] text-purple-400 font-bold uppercase">{team.leaderId}</span></div></div>
                <button onClick={() => removeTeamFromRegistry(team.id)} className="text-slate-600 hover:text-red-500 transition-colors p-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
             </div>
           ))}
         </div>
       </div>
    </div>
  );

  const renderAds = () => (
    <div className={`bg-slate-800/30 rounded-2xl border p-6 transition-all duration-300 ${isAdsDirty() ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-slate-700/50'}`}>
       <div className="flex justify-between items-center mb-6"><h3 className="text-amber-400 font-black uppercase tracking-widest">Ad Configuration</h3>{isAdsDirty() && <button onClick={applyAdChanges} className="text-[10px] font-black bg-amber-500 text-white px-4 py-1.5 rounded-full hover:bg-amber-400 transition-all shadow-lg">APPLY CHANGES</button>}</div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex flex-col gap-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Display Type</label><select value={draft.adConfig.type} onChange={(e) => updateDraftAdConfig('type', e.target.value as any)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-bold"><option value="images">Logos / Images</option><option value="text">Custom Text</option></select></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Transition Effect</label><select value={draft.adConfig.effect} onChange={(e) => updateDraftAdConfig('effect', e.target.value as any)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-bold"><option value="scroll">Smooth Scroll</option><option value="fade">Cross Fade</option></select></div>
            <div className="flex flex-col gap-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Scroll Speed (seconds)</label><input type="number" value={draft.adConfig.speed} onChange={(e) => updateDraftAdConfig('speed', parseInt(e.target.value) || 0)} className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs font-bold" /></div>
          </div>
          <div className="space-y-4">
            {draft.adConfig.type === 'text' ? (<div className="flex flex-col gap-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Marquee Text</label><textarea value={draft.adConfig.text} onChange={(e) => updateDraftAdConfig('text', e.target.value)} className="bg-slate-900 border border-slate-700 rounded p-3 text-xs font-semibold h-32 focus:border-amber-500 transition-all" placeholder="Enter your ad text here..." /></div>) : (<div className="flex flex-col gap-1"><label className="text-[10px] text-slate-500 font-bold uppercase">Ad Images</label><div className="grid grid-cols-4 gap-2 mb-2">{draft.ads.map((ad, i) => (<div key={i} className="relative group aspect-video bg-black/40 rounded border border-slate-700 overflow-hidden"><img src={ad.startsWith('data:') ? ad : `assets/${ad}.png`} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = `https://placehold.co/100x50/18252C/ffffff?text=${ad}`; }} /><button onClick={() => removeAd(i)} className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-[8px] font-bold">REMOVE</span></button></div>))}<label className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors"><span className="text-lg">+</span><span className="text-[8px] font-bold">UPLOAD</span><input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload('ads', e)} /></label></div><p className="text-[9px] text-slate-600 italic">Upload custom images for your ads carousel.</p></div>)}
          </div>
       </div>
    </div>
  );

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
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Best Of</span>
            <select 
              value={state.game.bestOf || 3}
              onChange={(e) => updateLiveGame('bestOf', parseInt(e.target.value) || 3)}
              className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 ring-blue-500 transition-all"
            >
              <option value={1}>BO 1</option>
              <option value={3}>BO 3</option>
              <option value={5}>BO 5</option>
            </select>
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
          {/* Visibility Toggles */}
          <div className="flex items-center gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-700/50 mr-2">
             <span className="text-[8px] font-bold text-slate-500 px-1 uppercase">Show:</span>
             <button onClick={() => updateVisibility('phase')} className={`px-2 py-1 rounded text-[9px] font-black uppercase ${state.game.visibility?.phase ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-slate-600 hover:text-slate-400'}`}>Phase</button>
             <button onClick={() => updateVisibility('timer')} className={`px-2 py-1 rounded text-[9px] font-black uppercase ${state.game.visibility?.timer ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-slate-600 hover:text-slate-400'}`}>Timer</button>
             <button onClick={() => updateVisibility('turn')} className={`px-2 py-1 rounded text-[9px] font-black uppercase ${state.game.visibility?.turn ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-slate-600 hover:text-slate-400'}`}>Turn</button>
             <button onClick={() => updateVisibility('score')} className={`px-2 py-1 rounded text-[9px] font-black uppercase ${state.game.visibility?.score ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'text-slate-600 hover:text-slate-400'}`}>Score</button>
          </div>

          <button 
            onClick={toggleBracketView}
            className={`px-4 py-2 rounded-lg font-black text-[10px] tracking-widest uppercase transition-all ${state.game.isBracketActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-700 text-slate-500 hover:text-slate-300'}`}
          >
            {state.game.isBracketActive ? 'Hide Bracket' : 'Show Bracket'}
          </button>

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
        <button onClick={() => setActiveTab('teams')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border-b-2 ${activeTab === 'teams' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Teams & Players</button>
        <button onClick={() => setActiveTab('scores')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border-b-2 ${activeTab === 'scores' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Scores & Bracket</button>
        <button onClick={() => setActiveTab('ads')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border-b-2 ${activeTab === 'ads' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Ads & Sponsors</button>
        <button onClick={() => setActiveTab('prepare')} className={`px-6 py-2 text-xs font-bold uppercase tracking-widest border-b-2 ${activeTab === 'prepare' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Prepare Data</button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'teams' ? renderTeams() :
         activeTab === 'scores' ? renderScores() :
         activeTab === 'ads' ? renderAds() :
         activeTab === 'prepare' ? renderPrepare() : null}
      </div>
    </div>
  );
};

export default AdminPanel;