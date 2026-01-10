/**
 * 事件與視角相關型別定義
 * @module core/types/event
 */

import { GamePhase } from './game';
import { RoleType, Team } from './role';

/** 事件類型 */
export enum EventType {
    /** 遊戲開始 */
    GAME_START = 'GAME_START',
    /** 階段變更 */
    PHASE_CHANGE = 'PHASE_CHANGE',
    /** 狼人殺人 */
    WEREWOLF_KILL = 'WEREWOLF_KILL',
    /** 預言家查驗 */
    SEER_CHECK = 'SEER_CHECK',
    /** 公開發言 */
    PUBLIC_SPEECH = 'PUBLIC_SPEECH',
    /** 投票 */
    VOTE_CAST = 'VOTE_CAST',
    /** 投票結果 */
    VOTE_RESULT = 'VOTE_RESULT',
    /** 玩家死亡 */
    PLAYER_DEATH = 'PLAYER_DEATH',
    /** 遊戲結束 */
    GAME_END = 'GAME_END',
    /** 夜晚結果公告 */
    NIGHT_RESULT = 'NIGHT_RESULT',
    /** 狼人內部討論（僅狼人可見）*/
    WEREWOLF_CHAT = 'WEREWOLF_CHAT',
}

/** 視角類型 */
export type VisibilityType = 'public' | 'private' | 'team-based' | 'role-based';

/** 視角規則 */
export interface VisibilityRule {
    /** 視角類型 */
    type: VisibilityType;
    /** 允許看到的玩家 ID（private 時使用）*/
    allowedPlayers?: string[];
    /** 允許看到的角色（role-based 時使用）*/
    allowedRoles?: RoleType[];
    /** 允許看到的陣營（team-based 時使用）*/
    allowedTeams?: Team[];
    /** 遊戲結束後是否公開 */
    revealOnGameEnd: boolean;
}

/** 遊戲事件 */
export interface GameEvent {
    /** 事件 ID */
    id: string;
    /** 事件類型 */
    type: EventType;
    /** 發生階段 */
    phase: GamePhase;
    /** 回合數 */
    round: number;
    /** 時間戳 */
    timestamp: number;
    /** 事件資料 */
    data: Record<string, unknown>;
    /** 視角規則 */
    visibility: VisibilityRule;
}

/** 創建事件參數 */
export interface CreateEventParams {
    type: EventType;
    phase: GamePhase;
    round: number;
    data: Record<string, unknown>;
    visibility: VisibilityRule;
}

/**
 * 創建事件
 */
export function createEvent(params: CreateEventParams): GameEvent {
    return {
        id: `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        timestamp: Date.now(),
        ...params,
    };
}

/** 預設公開視角 */
export const PUBLIC_VISIBILITY: VisibilityRule = {
    type: 'public',
    revealOnGameEnd: true,
};

/** 創建私人視角 */
export function createPrivateVisibility(playerIds: string[]): VisibilityRule {
    return {
        type: 'private',
        allowedPlayers: playerIds,
        revealOnGameEnd: true,
    };
}

/** 創建陣營視角 */
export function createTeamVisibility(teams: Team[]): VisibilityRule {
    return {
        type: 'team-based',
        allowedTeams: teams,
        revealOnGameEnd: true,
    };
}

/** 創建角色視角 */
export function createRoleVisibility(roles: RoleType[]): VisibilityRule {
    return {
        type: 'role-based',
        allowedRoles: roles,
        revealOnGameEnd: true,
    };
}
