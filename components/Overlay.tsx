
import React, { useEffect, useState, useRef } from 'react';
import { AppState } from '../types';

interface OverlayProps {
  data: AppState;
}

const ASSETS = "assets/";
const PLACEHOLDERS = { 
  blue: "assets/PheroB.png", 
  red: "assets/PheroR.png", 
  ban: "assets/Pban.png",
  logo: "assets/logo.png",
  gradient: "assets/gradient.png",
  union1: "assets/union1.png",
  union2: "assets/union11.png"
};

const PickSlot: React.FC<{ 
  pick: string; 
  name: string; 
  side: 'blue' | 'red'; 
  index: number;
  delay?: string;
}> = ({ pick, name, side, index, delay }) => {
  const [animating, setAnimating] = useState(false);
  const prevPickRef = useRef(pick);

  useEffect(() => {
    if (pick && pick !== prevPickRef.current) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 1000);
      prevPickRef.current = pick;
      return () => clearTimeout(timer);
    }
    prevPickRef.current = pick;
  }, [pick]);

  const isReset = (!pick || pick.trim() === "" || pick.trim() === "0");
  const imgSrc = isReset ? PLACEHOLDERS[side] : `${ASSETS}hero/${pick}.png`;
  const barColor = side === 'blue' ? '#71C1B9' : '#C17171';
  const fallbackImg = side === 'blue' ? '0c2e48' : 'd50200';

  return (
    <div 
      className={`w-[127px] h-[259px] relative overflow-hidden ${animating ? 'hero-container-glow' : ''} ${delay ? 'intro-item' : ''}`}
      style={delay ? { animationDelay: delay } : {}}
    >
      <img 
        key={pick}
        className={`absolute w-full h-[207px] top-0 left-0 object-cover bg-[#222] ${!isReset ? 'animate-hero-pick' : ''}`} 
        src={imgSrc} 
        onError={(e) => { e.currentTarget.src = `https://placehold.co/127x207/${fallbackImg}/ffffff?text=${pick || 'HERO'}`; }}
      />
      <div className="absolute w-full h-[46px] top-[213px]" style={{ backgroundColor: barColor }}></div>
      <div className="absolute w-full h-[46px] top-[213px] font-lilita text-[24px] flex items-center justify-center text-center px-1 truncate pointer-events-none">
        {name || `PLAYER ${index + 1}`}
      </div>
    </div>
  );
};

const AdContent: React.FC<{ data: AppState }> = ({ data }) => {
  const { adConfig, ads } = data;
  const [fadeIndex, setFadeIndex] = useState(0);

  useEffect(() => {
    if (adConfig.effect === 'fade') {
      const interval = setInterval(() => {
        if (adConfig.type === 'images' && ads.length > 0) {
          setFadeIndex(prev => (prev + 1) % ads.length);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [adConfig.effect, adConfig.type, ads.length]);

  // Seamless Marquee Helper: Duplikasi konten untuk loop sempurna
  const renderMarquee = (children: React.ReactNode) => (
    <div 
      className="marquee-container h-full items-center" 
      style={{ '--speed': `${adConfig.speed}s` } as any}
    >
      <div className="flex items-center gap-[100px] pr-[100px]">{children}</div>
      <div className="flex items-center gap-[100px] pr-[100px]">{children}</div>
    </div>
  );

  if (adConfig.type === 'text') {
    if (adConfig.effect === 'scroll') {
      return renderMarquee(
        <span className="font-gothic text-[40px] uppercase tracking-wide">
          {adConfig.text}
        </span>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center font-gothic text-[40px] animate-fade uppercase tracking-wide">
          {adConfig.text}
        </div>
      );
    }
  }

  // Type === 'images'
  if (adConfig.effect === 'scroll') {
    return renderMarquee(
      ads.map((ad, idx) => (
        <img 
          key={idx}
          src={`${ASSETS}${ad}.png`} 
          className="h-[45px] w-auto object-contain" 
          onError={(e) => { e.currentTarget.src = `https://placehold.co/150x45/18252C/ffffff?text=${ad}`; }}
        />
      ))
    );
  } else {
    const activeAd = ads[fadeIndex] || ads[0];
    return (
      <div className="w-full h-full flex items-center justify-center">
        {activeAd && (
          <img 
            key={activeAd}
            src={`${ASSETS}${activeAd}.png`} 
            className="h-[48px] w-auto object-contain animate-fade" 
            onError={(e) => { e.currentTarget.src = `https://placehold.co/150x45/18252C/ffffff?text=${activeAd}`; }}
          />
        )}
      </div>
    );
  }
};

const TurnIndicator: React.FC<{ turn: 'blue' | 'red' }> = ({ turn }) => {
  const isRed = turn === 'red';
  const rot = isRed ? '9deg' : '189deg';
  const style = {
    '--rot': rot,
    '--start-x': isRed ? '-20px' : '20px',
    '--end-x': isRed ? '20px' : '-20px',
  } as React.CSSProperties;

  return (
    <div className="flex items-center justify-center gap-2 h-full w-full opacity-80" style={style}>
      <div className="animate-arrow-1 text-[40px] leading-none">▶</div>
      <div className="animate-arrow-2 text-[40px] leading-none">▶</div>
      <div className="animate-arrow-3 text-[40px] leading-none">▶</div>
    </div>
  );
};

const Overlay: React.FC<OverlayProps> = ({ data }) => {
  const getAsset = (key: keyof AppState['assets'], fallback: string) => {
    return data.assets[key] || fallback;
  };

  const isIntro = data.game.isIntroActive;
  const isRedTurn = data.game.turn === 'red';
  const isControlEnabled = data.game.isGameControlEnabled;

  return (
    <div className="relative w-[1920px] h-[1080px] text-white overflow-hidden pointer-events-none">
      
      {/* --- INTRO VS LAYER --- */}
      {isIntro && (
        <div className="intro-vs absolute left-1/2 flex items-center justify-center gap-20">
            <div className="flex flex-col items-center gap-4">
               {data.blue.logo && <img src={data.blue.logo} className="w-32 h-32 object-contain" />}
               <div className="text-6xl font-gothic">{data.blue.name}</div>
            </div>
            <div className="text-9xl font-londrina">VS</div>
            <div className="flex flex-col items-center gap-4">
               {data.red.logo && <img src={data.red.logo} className="w-32 h-32 object-contain" />}
               <div className="text-6xl font-gothic">{data.red.name}</div>
            </div>
        </div>
      )}

      {/* --- DEKORASI --- */}
      <img 
        className={`absolute w-[454px] h-[199px] left-[733px] top-[763px] object-cover ${isIntro ? 'intro-item' : ''}`} 
        style={isIntro ? { animationDelay: '6s' } : {}}
        src={getAsset('gradient', PLACEHOLDERS.gradient)} 
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/454x199/black/black'; }}
      />
      
      {/* Background Boxes for Phase/Timer - ALWAYS VISIBLE */}
      <div 
        className={`absolute w-[455px] h-[46px] left-[732px] top-[968px] bg-[#0C2E48] ${isIntro ? 'intro-item' : ''}`}
        style={isIntro ? { animationDelay: '6.2s' } : {}}
      ></div>
      <div 
        className={`absolute w-[51px] h-[46px] left-[938px] top-[968px] bg-[#D50200] ${isIntro ? 'intro-item' : ''}`}
        style={isIntro ? { animationDelay: '6.4s' } : {}}
      ></div>
      
      <img 
        className={`absolute w-[80px] h-[111px] left-[920px] top-[672px] object-contain z-50 ${isIntro ? 'intro-logo' : ''}`} 
        src={getAsset('logo', PLACEHOLDERS.logo)} 
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/80x111?text=LOGO'; }}
      />

      {/* --- UNION SIDES (WINGS) --- */}
      <div 
        className={`absolute w-[168px] h-[53px] top-[704px] left-[674px] ${isIntro ? 'intro-item' : ''}`}
        style={isIntro ? { animationDelay: '6.6s' } : {}}
      >
        <img className="w-full h-full object-contain" src={getAsset('union1', PLACEHOLDERS.union1)} />
      </div>
      <div 
        className={`absolute w-[168px] h-[53px] top-[704px] left-[1078px] ${isIntro ? 'intro-item' : ''}`}
        style={isIntro ? { animationDelay: '6.6s' } : {}}
      >
        <img className="w-full h-full object-contain scale-x-[-1]" src={getAsset('union1', PLACEHOLDERS.union1)} />
      </div>

      {/* --- UNION CENTER --- */}
      <div 
        className={`absolute w-[87px] h-[41px] top-[715px] left-[1020px] ${isIntro ? 'intro-item' : ''}`}
        style={isIntro ? { animationDelay: '6.8s' } : {}}
      >
        <img className="w-full h-full object-contain" src={getAsset('union2', PLACEHOLDERS.union2)} />
      </div>
      <div 
        className={`absolute w-[87px] h-[41px] top-[715px] left-[813px] ${isIntro ? 'intro-item' : ''}`}
        style={isIntro ? { animationDelay: '6.8s' } : {}}
      >
        <img className="w-full h-full object-contain scale-x-[-1]" src={getAsset('union2', PLACEHOLDERS.union2)} />
      </div>

      {/* --- IKLAN BERJALAN --- */}
      <div 
        className={`absolute w-[1837px] h-[58px] left-[42px] top-[1022px] bg-[#18252C] overflow-hidden ${isIntro ? 'intro-bottom' : ''}`}
        style={isIntro ? { animationDelay: '8.5s' } : {}}
      >
        <AdContent data={data} />
      </div>

      {!isIntro && (
        <div className="absolute w-[101px] h-[79px] left-[908px] top-[817px] font-londrina font-light text-[96px] flex items-center justify-center leading-none animate-fade">
          vs
        </div>
      )}

      {/* Blue Team Info */}
      <div className={`${isIntro ? 'intro-item' : ''}`} style={isIntro ? { animationDelay: '7.5s' } : {}}>
          {data.blue.logo && (
            <img className="absolute w-[60px] h-[60px] top-[820px] left-[790px] object-contain" src={data.blue.logo} />
          )}
          <div className="absolute w-[150px] h-[24px] top-[886px] left-[745px] font-gothic text-[32px] flex items-center justify-center text-center uppercase tracking-wider">
            {data.blue.name}
          </div>
      </div>

      {/* Red Team Info */}
      <div className={`${isIntro ? 'intro-item' : ''}`} style={isIntro ? { animationDelay: '7.5s' } : {}}>
          {data.red.logo && (
            <img className="absolute w-[60px] h-[60px] top-[820px] left-[1066px] object-contain" src={data.red.logo} />
          )}
          <div className="absolute w-[150px] h-[24px] top-[886px] left-[1021px] font-gothic text-[32px] flex items-center justify-center text-center uppercase tracking-wider">
            {data.red.name}
          </div>
      </div>

      {/* TIMER & PHASE - Content is HIDDEN if controls disabled, but wrappers stay for animations */}
      <div className={`${isIntro ? 'intro-item' : ''}`} style={isIntro ? { animationDelay: '7s' } : {}}>
          {isControlEnabled && (
            <>
              <div className="absolute w-[51px] h-[46px] left-[938px] top-[968px] font-gothic text-[32px] flex items-center justify-center z-10">
                {data.game.timer}
              </div>
              <div 
                className="absolute w-[208px] h-[46px] top-[968px] font-gothic text-[32px] flex items-center justify-center transition-all duration-500"
                style={{ left: isRedTurn ? '730px' : '989px' }}
              >
                {data.game.phase}
              </div>
              <div 
                className="absolute w-[208px] h-[46px] top-[968px] transition-all duration-500"
                style={{ left: isRedTurn ? '989px' : '730px' }}
              >
                <TurnIndicator turn={data.game.turn} />
              </div>
            </>
          )}
      </div>

      {/* --- HERO PICKS --- */}
      <div className="absolute top-[755px] left-[42px] flex gap-[10px]">
        {data.blue.picks.map((pick, i) => (
          <PickSlot 
            key={i} 
            index={i} 
            side="blue" 
            pick={pick} 
            name={data.blue.pNames[i]} 
            delay={isIntro ? `${7.8 + (i * 0.1)}s` : undefined} 
          />
        ))}
      </div>

      <div className="absolute top-[755px] left-[1204px] flex gap-[10px]">
        {data.red.picks.map((pick, i) => (
          <PickSlot 
            key={i} 
            index={i} 
            side="red" 
            pick={pick} 
            name={data.red.pNames[i]} 
            delay={isIntro ? `${7.8 + (i * 0.1)}s` : undefined} 
          />
        ))}
      </div>

      {/* --- BANS --- */}
      <div className={`absolute top-[676px] left-[51px] w-[392px] flex gap-[20px] ${isIntro ? 'intro-item' : ''}`} style={isIntro ? { animationDelay: '8.2s' } : {}}>
        {data.blue.bans.map((ban, i) => {
          const isReset = (!ban || ban.trim() === "" || ban.trim() === "0");
          const imgSrc = isReset ? PLACEHOLDERS.ban : `${ASSETS}hero-icon/${ban}.png`;
          return (
            <div key={`bb-${i}`} className="flex-1 flex justify-center items-center">
              <img className="w-[60px] h-[60px] rounded-full object-cover bg-black grayscale" src={imgSrc} />
            </div>
          );
        })}
      </div>

      <div className={`absolute top-[676px] left-[1483px] w-[392px] flex gap-[20px] ${isIntro ? 'intro-item' : ''}`} style={isIntro ? { animationDelay: '8.2s' } : {}}>
        {data.red.bans.map((ban, i) => {
          const isReset = (!ban || ban.trim() === "" || ban.trim() === "0");
          const imgSrc = isReset ? PLACEHOLDERS.ban : `${ASSETS}hero-icon/${ban}.png`;
          return (
            <div key={`rb-${i}`} className="flex-1 flex justify-center items-center">
              <img className="w-[60px] h-[60px] rounded-full object-cover bg-black grayscale" src={imgSrc} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Overlay;
