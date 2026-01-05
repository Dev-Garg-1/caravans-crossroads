export interface Passenger {
  id: string;
  name: string;
  type: 'merchant' | 'cook' | 'scholar' | 'guard';
  bonusText: string;
}

export interface ResourceState {
  food: number;
  gold: number;
  reputation: number;
  journeyCount: number;
  progress: number; // 0 to 100
  lives: number;
  score: number;
  passengers: Passenger[];
}

export interface Choice {
  id: string;
  text: string;
  consequenceText: string;
  reputationCost?: number;
  goldCost?: number;
  foodCost?: number;
  reputationGain?: number;
  goldGain?: number;
  foodGain?: number;
  flagToSet?: string;
  requiredFlag?: string;
  requiredPassengerType?: 'merchant' | 'cook' | 'scholar' | 'guard';
  action?: 'continue_journey' | 'end_journey' | 'remove_passenger';
  color?: string; // Add color for UI punch
}

export interface Encounter {
  id: string;
  title: string;
  description: string;
  icon: string;
  choices: Choice[];
}

export interface NPC {
  id: string;
  x: number;
  y: number;
  type: 'trader' | 'bandit' | 'traveler' | 'mystic' | 'haven' | 'food_cart' | 'person' | 'coin';
  encounterId: string;
  width: number;
  height: number;
  speedMultiplier: number;
  passengerData?: Passenger;
}

export type VictoryType = 'hero' | 'merchant_prince' | 'iron_monger' | 'survivor';

export type GameStatus = 'title' | 'playing' | 'encounter' | 'gameover' | 'victory';
