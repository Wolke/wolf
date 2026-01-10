/**
 * 角色分配工具
 * @module core/utils/roleDistribution
 */

import { GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { RoleType } from '../types/role';
import { Player, CreatePlayerParams, createPlayer, NpcCharacter } from '../types/player';

/**
 * 根據配置生成角色列表
 */
export function generateRoleList(config: GameConfig): RoleType[] {
    const roles: RoleType[] = [];

    // 添加狼人
    for (let i = 0; i < config.werewolfCount; i++) {
        roles.push(RoleType.WEREWOLF);
    }

    // 添加預言家
    for (let i = 0; i < config.seerCount; i++) {
        roles.push(RoleType.SEER);
    }

    // 添加村民
    for (let i = 0; i < config.villagerCount; i++) {
        roles.push(RoleType.VILLAGER);
    }

    return roles;
}

/**
 * 洗牌算法（Fisher-Yates）
 */
export function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * 分配角色給玩家
 */
export function distributeRoles(
    playerCount: number,
    config: GameConfig,
    humanPlayerId: string,
    npcCharacters: NpcCharacter[]
): Player[] {
    const roles = generateRoleList(config);
    const shuffledRoles = shuffle(roles);
    const players: Player[] = [];

    // 隨機決定人類玩家的座位
    const humanSeatNumber = Math.floor(Math.random() * playerCount) + 1;

    let npcIndex = 0;

    for (let seatNumber = 1; seatNumber <= playerCount; seatNumber++) {
        const role = shuffledRoles[seatNumber - 1];
        const isHuman = seatNumber === humanSeatNumber;

        const params: CreatePlayerParams = {
            id: isHuman ? humanPlayerId : `npc_${seatNumber}`,
            seatNumber,
            role,
            isHuman,
        };

        if (!isHuman && npcCharacters[npcIndex]) {
            params.character = npcCharacters[npcIndex];
            npcIndex++;
        }

        players.push(createPlayer(params));
    }

    return players;
}

/**
 * 生成預設 NPC 角色（用於沒有 AI 生成時的備用）
 */
export function generateDefaultNpcCharacters(count: number): NpcCharacter[] {
    const defaultCharacters: NpcCharacter[] = [
        {
            name: '王大明',
            age: 35,
            profession: '務農',
            personality: '老實憨厚、不善言辭',
            speechStyle: '說話簡短直接，常用「俺」自稱',
        },
        {
            name: '李小美',
            age: 28,
            profession: '教師',
            personality: '聰明機警、觀察力強',
            speechStyle: '說話條理清晰，喜歡分析',
        },
        {
            name: '張大牛',
            age: 45,
            profession: '鐵匠',
            personality: '脾氣火爆、直來直往',
            speechStyle: '說話大嗓門，常拍桌子',
        },
        {
            name: '陳阿花',
            age: 50,
            profession: '村長夫人',
            personality: '八卦愛管事、熱心腸',
            speechStyle: '說話絮絮叨叨，喜歡打聽',
        },
        {
            name: '林小寶',
            age: 18,
            profession: '學徒',
            personality: '天真單純、容易相信人',
            speechStyle: '說話有點結巴，常說「那個...」',
        },
        {
            name: '周老三',
            age: 60,
            profession: '獵人',
            personality: '經驗豐富、深沉寡言',
            speechStyle: '說話慢條斯理，常講故事',
        },
    ];

    return defaultCharacters.slice(0, count);
}

/**
 * 驗證遊戲配置是否有效
 */
export function validateGameConfig(config: GameConfig): { valid: boolean; error?: string } {
    const { playerCount, werewolfCount, villagerCount, seerCount } = config;

    const totalRoles = werewolfCount + villagerCount + seerCount;

    if (totalRoles !== playerCount) {
        return {
            valid: false,
            error: `角色總數 (${totalRoles}) 與玩家數 (${playerCount}) 不符`,
        };
    }

    if (werewolfCount < 1) {
        return { valid: false, error: '至少需要 1 名狼人' };
    }

    if (werewolfCount >= playerCount / 2) {
        return { valid: false, error: '狼人數量不能超過玩家數的一半' };
    }

    if (seerCount > 1) {
        return { valid: false, error: '預言家最多 1 名' };
    }

    return { valid: true };
}
