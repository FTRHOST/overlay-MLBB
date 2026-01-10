
export interface TeamData {
  name: string;
  logo?: string;
  picks: string[];
  pNames: string[];
  bans: string[];
}

export interface GameState {
  phase: string;
  timer: number;
  turn: 'blue' | 'red';
  isIntroActive: boolean;
  isGameControlEnabled: boolean;
}

export interface AppAssets {
  union1: string;
  union2: string;
  logo: string;
  gradient: string;
}

export interface AdConfig {
  type: 'images' | 'text';
  effect: 'scroll' | 'fade';
  text: string;
  speed: number;
}

export interface AppState {
  blue: TeamData;
  red: TeamData;
  game: GameState;
  ads: string[];
  adConfig: AdConfig;
  assets: AppAssets;
}
