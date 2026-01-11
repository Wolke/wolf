/**
 * 遊戲相關型別定義
 * @module core/types/game
 */

import { GameMode } from './gameMode';
import { RoleType } from './role';

/** 遊戲階段 */
export enum GamePhase {
  /** 遊戲初始化 */
  INIT = 'INIT',
  /** 夜晚開始 */
  NIGHT_START = 'NIGHT_START',
  /** 守衛回合 */
  GUARD_TURN = 'GUARD_TURN',
  /** 狼人回合 */
  WEREWOLF_TURN = 'WEREWOLF_TURN',
  /** 女巫回合 */
  WITCH_TURN = 'WITCH_TURN',
  /** 預言家回合 */
  SEER_TURN = 'SEER_TURN',
  /** 白天開始 */
  DAY_START = 'DAY_START',
  /** 獵人/狼王開槍（死亡觸發）*/
  DEATH_SHOT = 'DEATH_SHOT',
  /** 討論階段 */
  DISCUSSION = 'DISCUSSION',
  /** 投票階段 */
  VOTE = 'VOTE',
  /** 處決階段 */
  EXECUTION = 'EXECUTION',
  /** 遊戲結束 */
  GAME_END = 'GAME_END',
}

/** 角色配置 */
export interface RoleConfig {
  role: RoleType;
  count: number;
}

/** 遊戲配置 */
export interface GameConfig {
  /** 玩家總數 */
  playerCount: number;
  /** 狼人數量 */
  werewolfCount: number;
  /** 狼王數量 */
  wolfKingCount?: number;
  /** 村民數量 */
  villagerCount: number;
  /** 預言家數量 */
  seerCount: number;
  /** 女巫數量 */
  witchCount?: number;
  /** 獵人數量 */
  hunterCount?: number;
  /** 守衛數量 */
  guardCount?: number;
  /** 是否啟用 AI */
  enableAI: boolean;
  /** 遊戲模式 */
  gameMode: GameMode;
  /** 發言時間限制（秒）*/
  discussionTimeLimit?: number;
}

/** 遊戲結果 */
export interface GameResult {
  /** 獲勝陣營 */
  winner: 'WEREWOLF' | 'VILLAGER';
  /** 遊戲總回合數 */
  totalRounds: number;
  /** 遊戲摘要 */
  summary: string;
  /** 存活玩家 */
  survivors: string[];
  /** 死亡玩家 */
  deceased: string[];
}

/** 板子類型（預設角色組合） */
export interface BoardConfig {
  id: string;
  name: string;
  description: string;
  playerCount: number;
  roles: RoleConfig[];
}

/** 預設板子配置 */
export const BOARD_CONFIGS: BoardConfig[] = [
  // 基礎局（無神職）
  {
    id: 'basic_6',
    name: '6人基礎局',
    description: '2狼 3民 1預',
    playerCount: 6,
    roles: [
      { role: RoleType.WEREWOLF, count: 2 },
      { role: RoleType.VILLAGER, count: 3 },
      { role: RoleType.SEER, count: 1 },
    ],
  },
  // 獵人局
  {
    id: 'hunter_7',
    name: '7人獵人局',
    description: '2狼 3民 1預 1獵',
    playerCount: 7,
    roles: [
      { role: RoleType.WEREWOLF, count: 2 },
      { role: RoleType.VILLAGER, count: 3 },
      { role: RoleType.SEER, count: 1 },
      { role: RoleType.HUNTER, count: 1 },
    ],
  },
  // 女巫局
  {
    id: 'witch_8',
    name: '8人女巫局',
    description: '2狼 4民 1預 1女巫',
    playerCount: 8,
    roles: [
      { role: RoleType.WEREWOLF, count: 2 },
      { role: RoleType.VILLAGER, count: 4 },
      { role: RoleType.SEER, count: 1 },
      { role: RoleType.WITCH, count: 1 },
    ],
  },
  // 守衛局
  {
    id: 'guard_8',
    name: '8人守衛局',
    description: '2狼 4民 1預 1守衛',
    playerCount: 8,
    roles: [
      { role: RoleType.WEREWOLF, count: 2 },
      { role: RoleType.VILLAGER, count: 4 },
      { role: RoleType.SEER, count: 1 },
      { role: RoleType.GUARD, count: 1 },
    ],
  },
  // 狼王局
  {
    id: 'wolfking_9',
    name: '9人狼王局',
    description: '2狼 1狼王 4民 1預 1獵',
    playerCount: 9,
    roles: [
      { role: RoleType.WEREWOLF, count: 2 },
      { role: RoleType.WOLF_KING, count: 1 },
      { role: RoleType.VILLAGER, count: 4 },
      { role: RoleType.SEER, count: 1 },
      { role: RoleType.HUNTER, count: 1 },
    ],
  },
  // 標準9人局
  {
    id: 'standard_9',
    name: '9人標準局',
    description: '3狼 3民 1預 1女巫 1獵',
    playerCount: 9,
    roles: [
      { role: RoleType.WEREWOLF, count: 3 },
      { role: RoleType.VILLAGER, count: 3 },
      { role: RoleType.SEER, count: 1 },
      { role: RoleType.WITCH, count: 1 },
      { role: RoleType.HUNTER, count: 1 },
    ],
  },
  // 完整12人局
  {
    id: 'full_12',
    name: '12人完整局',
    description: '3狼 1狼王 4民 1預 1女巫 1獵 1守衛',
    playerCount: 12,
    roles: [
      { role: RoleType.WEREWOLF, count: 3 },
      { role: RoleType.WOLF_KING, count: 1 },
      { role: RoleType.VILLAGER, count: 4 },
      { role: RoleType.SEER, count: 1 },
      { role: RoleType.WITCH, count: 1 },
      { role: RoleType.HUNTER, count: 1 },
      { role: RoleType.GUARD, count: 1 },
    ],
  },
];

/** 預設遊戲配置（6人局） */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  playerCount: 6,
  werewolfCount: 2,
  villagerCount: 3,
  seerCount: 1,
  enableAI: true,
  gameMode: GameMode.MODERN_GANGSTER,
};

/** 舊版配置（向後相容） */
export const PLAYER_COUNT_CONFIGS: Record<number, { werewolfCount: number; villagerCount: number; seerCount: number; description: string }> = {
  5: { werewolfCount: 1, villagerCount: 3, seerCount: 1, description: '5人局（1狼 3民 1預）' },
  6: { werewolfCount: 2, villagerCount: 3, seerCount: 1, description: '6人局（2狼 3民 1預）' },
  7: { werewolfCount: 2, villagerCount: 4, seerCount: 1, description: '7人局（2狼 4民 1預）' },
  8: { werewolfCount: 2, villagerCount: 5, seerCount: 1, description: '8人局（2狼 5民 1預）' },
  9: { werewolfCount: 3, villagerCount: 5, seerCount: 1, description: '9人局（3狼 5民 1預）' },
  10: { werewolfCount: 3, villagerCount: 6, seerCount: 1, description: '10人局（3狼 6民 1預）' },
  12: { werewolfCount: 4, villagerCount: 7, seerCount: 1, description: '12人局（4狼 7民 1預）' },
};

/** 可用的玩家人數列表 */
export const AVAILABLE_PLAYER_COUNTS = Object.keys(PLAYER_COUNT_CONFIGS).map(Number);

/** 根據人數建立遊戲配置 */
export function createGameConfig(playerCount: number): GameConfig {
  const config = PLAYER_COUNT_CONFIGS[playerCount];
  if (!config) {
    throw new Error(`不支援 ${playerCount} 人局`);
  }
  return {
    playerCount,
    werewolfCount: config.werewolfCount,
    villagerCount: config.villagerCount,
    seerCount: config.seerCount,
    enableAI: true,
    gameMode: GameMode.MODERN_GANGSTER,
  };
}

/** 根據板子配置建立遊戲配置 */
export function createGameConfigFromBoard(boardId: string): GameConfig {
  const board = BOARD_CONFIGS.find(b => b.id === boardId);
  if (!board) {
    throw new Error(`找不到板子配置: ${boardId}`);
  }

  const config: GameConfig = {
    playerCount: board.playerCount,
    werewolfCount: 0,
    wolfKingCount: 0,
    villagerCount: 0,
    seerCount: 0,
    witchCount: 0,
    hunterCount: 0,
    guardCount: 0,
    enableAI: true,
    gameMode: GameMode.MODERN_GANGSTER,
  };

  for (const roleConfig of board.roles) {
    switch (roleConfig.role) {
      case RoleType.WEREWOLF:
        config.werewolfCount = roleConfig.count;
        break;
      case RoleType.WOLF_KING:
        config.wolfKingCount = roleConfig.count;
        break;
      case RoleType.VILLAGER:
        config.villagerCount = roleConfig.count;
        break;
      case RoleType.SEER:
        config.seerCount = roleConfig.count;
        break;
      case RoleType.WITCH:
        config.witchCount = roleConfig.count;
        break;
      case RoleType.HUNTER:
        config.hunterCount = roleConfig.count;
        break;
      case RoleType.GUARD:
        config.guardCount = roleConfig.count;
        break;
    }
  }

  return config;
}
