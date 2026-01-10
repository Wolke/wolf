/**
 * 遊戲相關型別定義
 * @module core/types/game
 */

import { GameMode } from './gameMode';

/** 遊戲階段 */
export enum GamePhase {
  /** 遊戲初始化 */
  INIT = 'INIT',
  /** 夜晚開始 */
  NIGHT_START = 'NIGHT_START',
  /** 狼人回合 */
  WEREWOLF_TURN = 'WEREWOLF_TURN',
  /** 預言家回合 */
  SEER_TURN = 'SEER_TURN',
  /** 白天開始 */
  DAY_START = 'DAY_START',
  /** 討論階段 */
  DISCUSSION = 'DISCUSSION',
  /** 投票階段 */
  VOTE = 'VOTE',
  /** 處決階段 */
  EXECUTION = 'EXECUTION',
  /** 遊戲結束 */
  GAME_END = 'GAME_END',
}

/** 遊戲配置 */
export interface GameConfig {
  /** 玩家總數 */
  playerCount: number;
  /** 狼人數量 */
  werewolfCount: number;
  /** 村民數量 */
  villagerCount: number;
  /** 預言家數量 */
  seerCount: number;
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

/** 預設遊戲配置（6人局） */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  playerCount: 6,
  werewolfCount: 2,
  villagerCount: 3,
  seerCount: 1,
  enableAI: true,
  gameMode: GameMode.MODERN_GANGSTER,
};

