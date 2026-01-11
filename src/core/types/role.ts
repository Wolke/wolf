/**
 * 角色相關型別定義
 * @module core/types/role
 */

/** 角色類型 */
export enum RoleType {
    // ====== 狼人陣營 ======
    /** 狼人 */
    WEREWOLF = 'WEREWOLF',
    /** 狼王 - 死亡時可帶走一人 */
    WOLF_KING = 'WOLF_KING',

    // ====== 村民陣營 - 神職 ======
    /** 預言家 - 每晚查驗一人身份 */
    SEER = 'SEER',
    /** 女巫 - 有解藥和毒藥各一瓶 */
    WITCH = 'WITCH',
    /** 獵人 - 死亡時可開槍帶走一人 */
    HUNTER = 'HUNTER',
    /** 守衛 - 每晚保護一人 */
    GUARD = 'GUARD',

    // ====== 村民陣營 - 平民 ======
    /** 村民 */
    VILLAGER = 'VILLAGER',
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
    /** 使用次數限制（-1 為無限）*/
    usageLimit?: number;
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
    [RoleType.WOLF_KING]: Team.WEREWOLF,
    [RoleType.SEER]: Team.VILLAGER,
    [RoleType.WITCH]: Team.VILLAGER,
    [RoleType.HUNTER]: Team.VILLAGER,
    [RoleType.GUARD]: Team.VILLAGER,
    [RoleType.VILLAGER]: Team.VILLAGER,
};

/** 角色顯示名稱對應 */
export const ROLE_DISPLAY_NAMES: Record<RoleType, string> = {
    [RoleType.WEREWOLF]: '狼人',
    [RoleType.WOLF_KING]: '狼王',
    [RoleType.SEER]: '預言家',
    [RoleType.WITCH]: '女巫',
    [RoleType.HUNTER]: '獵人',
    [RoleType.GUARD]: '守衛',
    [RoleType.VILLAGER]: '村民',
};

/** 角色是否為狼人陣營 */
export function isWerewolfTeam(role: RoleType): boolean {
    return ROLE_TEAM_MAP[role] === Team.WEREWOLF;
}

/** 角色是否有「死亡帶人」能力 */
export function hasDeathShot(role: RoleType): boolean {
    return role === RoleType.HUNTER || role === RoleType.WOLF_KING;
}

/** 角色詳細資訊 */
export const ROLE_INFO: Record<RoleType, RoleInfo> = {
    [RoleType.WEREWOLF]: {
        type: RoleType.WEREWOLF,
        displayName: '狼人',
        team: Team.WEREWOLF,
        description: '每晚與同伴選擇殺害一名玩家',
        abilities: [{
            name: '狼人殺',
            description: '夜晚與同伴選擇一名玩家殺害',
            isNightAction: true,
            requiresTarget: true,
        }],
    },
    [RoleType.WOLF_KING]: {
        type: RoleType.WOLF_KING,
        displayName: '狼王',
        team: Team.WEREWOLF,
        description: '狼人首領，死亡時可帶走一人（包括隊友）',
        abilities: [
            {
                name: '狼人殺',
                description: '夜晚與同伴選擇一名玩家殺害',
                isNightAction: true,
                requiresTarget: true,
            },
            {
                name: '狼王遺言',
                description: '死亡時可開槍帶走一名玩家',
                isNightAction: false,
                requiresTarget: true,
                usageLimit: 1,
            },
        ],
    },
    [RoleType.SEER]: {
        type: RoleType.SEER,
        displayName: '預言家',
        team: Team.VILLAGER,
        description: '每晚可查驗一名玩家的身份',
        abilities: [{
            name: '查驗',
            description: '夜晚查看一名玩家是否為狼人',
            isNightAction: true,
            requiresTarget: true,
        }],
    },
    [RoleType.WITCH]: {
        type: RoleType.WITCH,
        displayName: '女巫',
        team: Team.VILLAGER,
        description: '擁有解藥和毒藥各一瓶',
        abilities: [
            {
                name: '解藥',
                description: '救活當晚被狼人殺害的玩家',
                isNightAction: true,
                requiresTarget: false,
                usageLimit: 1,
            },
            {
                name: '毒藥',
                description: '毒殺一名玩家',
                isNightAction: true,
                requiresTarget: true,
                usageLimit: 1,
            },
        ],
    },
    [RoleType.HUNTER]: {
        type: RoleType.HUNTER,
        displayName: '獵人',
        team: Team.VILLAGER,
        description: '死亡時可開槍帶走一名玩家',
        abilities: [{
            name: '開槍',
            description: '死亡時帶走一名玩家',
            isNightAction: false,
            requiresTarget: true,
            usageLimit: 1,
        }],
    },
    [RoleType.GUARD]: {
        type: RoleType.GUARD,
        displayName: '守衛',
        team: Team.VILLAGER,
        description: '每晚可保護一名玩家免受狼人攻擊',
        abilities: [{
            name: '守護',
            description: '保護一名玩家（不能連續兩晚保護同一人）',
            isNightAction: true,
            requiresTarget: true,
        }],
    },
    [RoleType.VILLAGER]: {
        type: RoleType.VILLAGER,
        displayName: '村民',
        team: Team.VILLAGER,
        description: '普通村民，沒有特殊能力',
        abilities: [],
    },
};
