/**
 * 角色相關型別定義
 * @module core/types/role
 */

/** 角色類型 */
export enum RoleType {
    /** 狼人 */
    WEREWOLF = 'WEREWOLF',
    /** 村民 */
    VILLAGER = 'VILLAGER',
    /** 預言家 */
    SEER = 'SEER',
}

/** 陣營 */
export enum Team {
    /** 狼人陣營 */
    WEREWOLF = 'WEREWOLF',
    /** 村民陣營 */
    VILLAGER = 'VILLAGER',
}

/** 角色能力介面 */
export interface RoleAbility {
    /** 能力名稱 */
    name: string;
    /** 能力描述 */
    description: string;
    /** 是否為夜晚能力 */
    isNightAction: boolean;
    /** 是否可選擇目標 */
    requiresTarget: boolean;
}

/** 角色基本資訊 */
export interface RoleInfo {
    /** 角色類型 */
    type: RoleType;
    /** 角色名稱 */
    displayName: string;
    /** 所屬陣營 */
    team: Team;
    /** 角色描述 */
    description: string;
    /** 角色能力列表 */
    abilities: RoleAbility[];
}

/** 角色到陣營的對應映射 */
export const ROLE_TEAM_MAP: Record<RoleType, Team> = {
    [RoleType.WEREWOLF]: Team.WEREWOLF,
    [RoleType.VILLAGER]: Team.VILLAGER,
    [RoleType.SEER]: Team.VILLAGER,
};

/** 角色顯示名稱對應 */
export const ROLE_DISPLAY_NAMES: Record<RoleType, string> = {
    [RoleType.WEREWOLF]: '狼人',
    [RoleType.VILLAGER]: '村民',
    [RoleType.SEER]: '預言家',
};
