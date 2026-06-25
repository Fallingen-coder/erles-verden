export const gameState = {
  screen: 'menu',
  location: null,
  player: {
    name: 'Spiller',
    gold: 0,
    food: 0,
    xp: 0,
    level: 1,
    rank: 'Nybegynner',
  },
  home: {
    level: 1,
    name: 'Hjemmet ditt',
  },
  animals: [],
  buildings: [],
  tasks: [],
  day: 1,
};

export const RANKS = [
  { level: 1,  xp: 0,    name: 'Nybegynner' },
  { level: 2,  xp: 100,  name: 'Bonde' },
  { level: 3,  xp: 300,  name: 'Gårdseier' },
  { level: 4,  xp: 600,  name: 'Landsbyleder' },
  { level: 5,  xp: 1000, name: 'Mester' },
  { level: 6,  xp: 1500, name: 'Stormann' },
  { level: 7,  xp: 2200, name: 'Jarl' },
  { level: 8,  xp: 3000, name: 'Høvding' },
];

export function addXP(amount) {
  gameState.player.xp += amount;
  const currentRank = [...RANKS].reverse().find(r => r.xp <= gameState.player.xp);
  if (currentRank) {
    gameState.player.level = currentRank.level;
    gameState.player.rank = currentRank.name;
  }
}

export function initGame(location) {
  gameState.location = location;
  gameState.screen = 'game';
  gameState.player.gold = location.startGold;
  gameState.player.food = location.startFood;
  gameState.player.xp = 0;
  gameState.player.level = 1;
  gameState.player.rank = 'Nybegynner';
  gameState.home.level = 1;
  gameState.home.name = 'Hjemmet ditt';
  gameState.animals = [];
  gameState.buildings = [];
  gameState.day = 1;
  gameState.tasks = generateTasks();
}

// Hver oppgave har en posisjon i verden og et interaksjons-objekt
export function generateTasks() {
  return [
    {
      id: 'ved',
      name: 'Samle ved',
      hint: 'Gå til vedhaugen og trykk E',
      xp: 20, gold: 10,
      emoji: '🪵',
      done: false,
      pos: { x: 8, z: 2 },
      objectType: 'woodpile',
    },
    {
      id: 'vann',
      name: 'Hent vann',
      hint: 'Gå til brønnen og trykk E',
      xp: 15, gold: 5,
      emoji: '💧',
      done: false,
      pos: { x: -7, z: 3 },
      objectType: 'well',
    },
    {
      id: 'hage',
      name: 'Plant grønnsaker',
      hint: 'Gå til hagebedet og trykk E',
      xp: 30, gold: 15,
      emoji: '🥕',
      done: false,
      pos: { x: 4, z: 6 },
      objectType: 'garden',
    },
    {
      id: 'mat',
      name: 'Lag mat',
      hint: 'Gå til bålplassen og trykk E',
      xp: 25, gold: 0,
      emoji: '🍲',
      done: false,
      pos: { x: -4, z: 6 },
      objectType: 'campfire',
    },
    {
      id: 'reparere',
      name: 'Reparer hjemmet',
      hint: 'Gå til den skadede veggen og trykk E',
      xp: 50, gold: 25,
      emoji: '🔨',
      done: false,
      pos: { x: 3.5, z: -4.8 },
      objectType: 'repair',
    },
  ];
}
