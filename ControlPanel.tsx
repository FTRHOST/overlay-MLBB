
import React, { useEffect, useRef } from 'react';
import AdminPanel from './components/AdminPanel';
import Overlay from './components/Overlay';
import { AppState } from './types';

interface ControlPanelProps {
  state: AppState;
  updateState: (newState: AppState | ((prev: AppState) => AppState)) => void;
  resetState: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ state, updateState, resetState }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      updateState(prev => {
        if (!prev.game.isGameControlEnabled || prev.game.timer <= 0) return prev;
        return {
          ...prev,
          game: {
            ...prev.game,
            timer: prev.game.timer - 1
          }
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [updateState]);

  useEffect(() => {
    if (state.game.isIntroActive) {
      const timer = setTimeout(() => {
        updateState(prev => ({
          ...prev,
          game: { ...prev.game, isIntroActive: false }
        }));
      }, 9500);
      return () => clearTimeout(timer);
    }
  }, [state.game.isIntroActive, updateState]);

  useEffect(() => {
    const scaleUI = () => {
      if (!previewRef.current) return;
      const containerWidth = previewRef.current.clientWidth;
      const containerHeight = previewRef.current.clientHeight;
      const s = Math.min(containerWidth / 1920, containerHeight / 1080);
      const overlay = previewRef.current.querySelector('#overlay-preview') as HTMLElement;
      if (overlay) {
        overlay.style.transform = `scale(${s})`;
      }
    };
    window.addEventListener('resize', scaleUI);
    scaleUI();
    return () => window.removeEventListener('resize', scaleUI);
  }, [state]);

  return (
    <div className="flex flex-col h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      {/* Top Preview Section */}
      <div className="h-[45vh] bg-black/40 flex flex-col border-b border-slate-700 shadow-2xl relative">
        <div className="absolute top-2 left-4 z-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">Live Monitor</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <div 
            ref={previewRef} 
            className="w-full h-full max-w-[1280px] aspect-video bg-[#00FF00]/10 border border-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden rounded-lg"
          >
            <div id="overlay-preview" className="origin-center w-[1920px] h-[1080px]">
              <Overlay data={state} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls Section */}
      <div className="flex-1 overflow-hidden relative">
         <AdminPanel state={state} setState={updateState} resetState={resetState} />
      </div>
    </div>
  );
};

export default ControlPanel;
