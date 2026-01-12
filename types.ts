
export interface TeamData {
  name: string;
  logo?: string;
  picks: string[];
  pNames: string[];
  bans: string[];
  score: number;
}

export interface GameState {
  phase: string;
  timer: number;
  turn: 'blue' | 'red';
  isIntroActive: boolean;
  isGameControlEnabled: boolean; // Legacy master switch, can be kept or ignored
  bestOf: number;
  visibility: {
    phase: boolean;
    timer: boolean;
    turn: boolean;
    score: boolean;
  };
  isBracketActive: boolean;
}

export interface BracketMatch {
  id: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner?: string; // 'team1' | 'team2' | null
}

export interface AppState {
  blue: TeamData;
  red: TeamData;
  game: GameState;
  ads: string[];
  adConfig: AdConfig;
  assets: AppAssets;
  registry: RegisteredTeam[];
  bracket: {
    semis: [BracketMatch, BracketMatch];
    final: BracketMatch;
    champion: string;
  };
}
