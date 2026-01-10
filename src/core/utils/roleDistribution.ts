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
            name: '張獨行',
            age: 35,
            profession: '討債小弟',
            personality: '沉著冷靜，思維敏捷，眼神銳利不輕信他人',
            speechStyle: '8+9 風格，說話帶點台語，常「幹」字開頭',
            voiceStyle: '低沉沙啞，語速慢但有威脅感，偶爾停頓增加壓迫感',
            appearance: '35歲台灣男性，平頭，眉毛粗黑，眼神凌厲，左臉有一道淺疤，穿黑色polo衫，脖子掛金鏈',
            catchphrase: '欠錢的人，逃得過初一逃不過十五',
        },
        {
            name: '林美麗',
            age: 26,
            profession: '檳榔西施',
            personality: '潑辣直爽，八面玲瓏，心思靈活',
            speechStyle: '嗲聲嗲氣但帶刺，說話夾雜台語跟流行語',
            voiceStyle: '甜美但帶點沙啞，音調偏高，語速快',
            appearance: '26歲台灣女性，濃妝豔抹，染金色長髮，穿低胸小可愛，配亮片短裙，指甲彩繪',
            catchphrase: '帥哥，吃檳榔嗎？',
        },
        {
            name: '阿龍',
            age: 42,
            profession: '機車行老闆',
            personality: '講義氣、重感情、脾氣火爆',
            speechStyle: '台客風格，喜歡講「兄弟」「拜託」',
            voiceStyle: '洪亮高亢，說話像在吵架，常拖長尾音',
            appearance: '42歲台灣男性，中年微胖，穿舊T恤配工作褲，手指有機油漬，手臂有龍紋刺青',
            catchphrase: '兄弟挺兄弟，天經地義！',
        },
        {
            name: '小安',
            age: 22,
            profession: '直播主',
            personality: '話多活潑，虛榮愛面子，其實有點單純',
            speechStyle: '網紅語氣，常用流行語和梗，語速超快',
            voiceStyle: '年輕活潑，音調高，語速極快，常誇張驚嘆',
            appearance: '22歲台灣男性，韓系髮型染漸層色，戴美瞳，穿oversize潮牌衣服，手拿自拍棒',
            catchphrase: '家人們！這真的不能不分享！',
        },
        {
            name: '花姐',
            age: 48,
            profession: '夜市攤販',
            personality: '精明算計、嘴硬心軟、愛八卦',
            speechStyle: '婆婆媽媽風格，愛碎碎念，消息靈通',
            voiceStyle: '中年婦女嗓音，偏高亢，語速中等但停不下來',
            appearance: '48歲台灣女性，燙捲短髮，臉頰富態，穿花襯衫配圍裙，手上戴玉鐲',
            catchphrase: '唉唷，這種事情我早就知道了啦！',
        },
        {
            name: '阿泰',
            age: 29,
            profession: '刺青師',
            personality: '酷酷的外表下其實很細心，藝術家脾氣',
            speechStyle: '話少但精準，偶爾冒出一句哲學金句',
            voiceStyle: '低沉平穩，語速慢，每個字都像在斟酌',
            appearance: '29歲台灣男性，兩側剃光中間長髮束成髮髻，全身刺青，穿黑色背心，戴耳環',
            catchphrase: '人心比皮膚更難看穿',
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
