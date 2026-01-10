/**
 * 動作相關型別定義
 * @module core/types/action
 */

/** 動作類型 */
export enum ActionType {
    /** 狼人殺人 */
    WEREWOLF_KILL = 'WEREWOLF_KILL',
    /** 預言家查驗 */
    SEER_CHECK = 'SEER_CHECK',
    /** 投票 */
    VOTE = 'VOTE',
    /** 發言 */
    SPEECH = 'SPEECH',
    /** 跳過 */
    SKIP = 'SKIP',
}

/** 動作基底 */
export interface BaseAction {
    /** 動作 ID */
    id: string;
    /** 動作類型 */
    type: ActionType;
    /** 執行者玩家 ID */
    playerId: string;
    /** 目標玩家 ID（可選）*/
    targetId?: string;
    /** 執行時間戳 */
    timestamp: number;
    /** 回合數 */
    round: number;
}

/** 夜晚動作 */
export interface NightAction extends BaseAction {
    type: ActionType.WEREWOLF_KILL | ActionType.SEER_CHECK;
    /** 目標玩家 ID（必需）*/
    targetId: string;
}

/** 投票動作 */
export interface VoteAction extends BaseAction {
    type: ActionType.VOTE;
    /** 投票目標玩家 ID（棄票時為 undefined）*/
    targetId: string | undefined;
}

/** 發言動作 */
export interface SpeechAction extends BaseAction {
    type: ActionType.SPEECH;
    /** 發言內容 */
    content: string;
}

/** 通用動作類型 */
export type Action = NightAction | VoteAction | SpeechAction | BaseAction;

/** 動作結果 */
export interface ActionResult {
    /** 是否成功 */
    success: boolean;
    /** 結果訊息 */
    message: string;
    /** 返回資料（如預言家查驗結果）*/
    data?: Record<string, unknown>;
}

/**
 * 創建動作
 */
export function createAction<T extends Action>(
    type: T['type'],
    playerId: string,
    round: number,
    extra?: Partial<T>
): T {
    return {
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type,
        playerId,
        timestamp: Date.now(),
        round,
        ...extra,
    } as T;
}
