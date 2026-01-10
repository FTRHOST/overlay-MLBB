
import React, { useState, useEffect, useCallback } from 'react';
import Overlay from './components/Overlay';
import AdminPanel from './components/AdminPanel';
import { AppState } from './types';
import { syncService } from './services/SyncService';

const INITIAL_STATE: AppState = {
  blue: {
    name: 'BLUE TEAM',
    logo: '',
    picks: ['', '', '', '', ''],
    pNames: ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4', 'PLAYER 5'],
    pRoles: [0, 0, 0, 0, 0],
    bans: ['', '', '', '', '']
  },
  red: {
    name: 'RED TEAM',
    logo: '',
    picks: ['', '', '', '', ''],
    pNames: ['PLAYER 1', 'PLAYER 2', 'PLAYER 3', 'PLAYER 4', 'PLAYER 5'],
    pRoles: [0, 0, 0, 0, 0],
    bans: ['', '', '', '', '']
  },
  game: {
    phase: 'BANNING',
    timer: 30,
    turn: 'blue',
    isIntroActive: false,
    isGameControlEnabled: true
  },
  ads: ['AD 1', 'AD 2', 'AD 3'],
  adConfig: {
    type: 'images',
    effect: 'scroll',
    text: 'WELCOME TO THE TOURNAMENT!',
    speed: 25
  },
  assets: {
    union1: '',
    union2: '',
    logo: '',
    gradient: ''
  },
  apiConfig: {
    url: 'http://localhost:8080/data.json',
    isEnabled: false,
    interval: 2000
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    return syncService.loadState() || INITIAL_STATE;
  });
  
  const [showAdmin, setShowAdmin] = useState(false);
  const [isOverlayOnly, setIsOverlayOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'overlay') {
      setIsOverlayOnly(true);
    }
  }, []);

  const updateState = useCallback((newState: AppState | ((prev: AppState) => AppState)) => {
    setState(prev => {
      const updated = typeof newState === 'function' ? newState(prev) : newState;
      syncService.saveState(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    syncService.onUpdate((remoteState) => {
      setState(remoteState);
    });
  }, []);

  useEffect(() => {
    const scaleUI = () => {
      const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const container = document.getElementById('overlay-main');
      if (container) container.style.transform = `scale(${s})`;
    };
    window.addEventListener('resize', scaleUI);
    scaleUI();
    return () => window.removeEventListener('resize', scaleUI);
  }, []);

  // Timer Logic
  useEffect(() => {
    const interval = setInterval(() => {
      updateState(prev => {
        if (!prev.game.isGameControlEnabled || prev.game.timer <= 0 || prev.apiConfig.isEnabled) return prev;
        return {
          ...prev,
          game: { ...prev.game, timer: prev.game.timer - 1 }
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [updateState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#00FF00]">
      {!isOverlayOnly && (
        <button 
          onClick={() => setShowAdmin(!showAdmin)}
          className="fixed bottom-4 right-4 z-[110] bg-gray-800 text-white p-2 rounded opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2"
        >
          {showAdmin ? '✕ Close Admin' : '⚙ Open Controls'}
        </button>
      )}

      {showAdmin && !isOverlayOnly && (
        <AdminPanel state={state} setState={updateState} resetState={() => updateState(INITIAL_STATE)} />
      )}

      <div id="overlay-main" className="origin-top-left w-[1920px] h-[1080px]">
        <Overlay data={state} />
      </div>
    </div>
  );
};

export default App;
