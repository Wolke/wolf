/**
 * 玩家相關型別定義
 * @module core/types/player
 */

import { RoleType } from './role';

/** NPC 角色個性設定 */
export interface NpcCharacter {
    /** 名字 */
    name: string;
    /** 年齡 */
    age: number;
    /** 職業（真實生活職業，如：討債小弟、夜市攤販、直播主等）*/
    profession: string;
    /** 個性描述 */
    personality: string;
    /** 說話風格（如：8+9 風格、文青風、台語腔等）*/
    speechStyle: string;
    /** 口音/語調風格（用於 OpenAI Speech API，如：低沉沙啞、高亢尖銳、慵懶拖長音等）*/
    voiceStyle: string;
    /** 外貌描述（用於 DALL-E 生成大頭貼）*/
    appearance: string;
    /** 口頭禪（可選）*/
    catchphrase?: string;
    /** 大頭貼 URL */
    avatarUrl?: string;
}

/** 玩家狀態 */
export enum PlayerStatus {
    /** 存活 */
    ALIVE = 'ALIVE',
    /** 死亡 */
    DEAD = 'DEAD',
    /** 被狼人殺死 */
    KILLED_BY_WEREWOLF = 'KILLED_BY_WEREWOLF',
    /** 被投票處決 */
    EXECUTED = 'EXECUTED',
}

/** 玩家資料 */
export interface Player {
    /** 玩家 ID */
    id: string;
    /** 座位號（1-6）*/
    seatNumber: number;
    /** 顯示名稱 */
    displayName: string;
    /** 角色類型 */
    role: RoleType;
    /** 是否為人類玩家 */
    isHuman: boolean;
    /** 玩家狀態 */
    status: PlayerStatus;
    /** NPC 角色設定（僅 NPC）*/
    character?: NpcCharacter;
}

/** 創建玩家參數 */
export interface CreatePlayerParams {
    id: string;
    seatNumber: number;
    role: RoleType;
    isHuman: boolean;
    character?: NpcCharacter;
}

/**
 * 創建玩家
 */
export function createPlayer(params: CreatePlayerParams): Player {
    const { id, seatNumber, role, isHuman, character } = params;

    return {
        id,
        seatNumber,
        displayName: character?.name || `玩家${seatNumber}`,
        role,
        isHuman,
        status: PlayerStatus.ALIVE,
        character,
    };
}

/**
 * 檢查玩家是否存活
 */
export function isPlayerAlive(player: Player): boolean {
    return player.status === PlayerStatus.ALIVE;
}
