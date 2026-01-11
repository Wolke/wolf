/**
 * 遊戲模式型別定義
 * @module core/types/gameMode
 */

/** 遊戲模式 */
export enum GameMode {
    /** 現代都市 - 黑道風格 */
    MODERN_GANGSTER = 'MODERN_GANGSTER',
    /** 傳統村莊 */
    CLASSIC_VILLAGE = 'CLASSIC_VILLAGE',
    /** 校園風格 */
    CAMPUS = 'CAMPUS',
    /** 辦公室風格 */
    OFFICE = 'OFFICE',
}

/** 遊戲模式設定 */
export interface GameModeConfig {
    /** 模式 ID */
    mode: GameMode;
    /** 模式名稱 */
    displayName: string;
    /** 模式描述 */
    description: string;
    /** 背景設定（用於 AI 生成） */
    backgroundSetting: string;
    /** 預設角色職業列表（用於隨機選擇） */
    defaultProfessions: string[];
}

/** 遊戲模式配置列表 */
export const GAME_MODE_CONFIGS: Record<GameMode, GameModeConfig> = {
    [GameMode.MODERN_GANGSTER]: {
        mode: GameMode.MODERN_GANGSTER,
        displayName: '現代都市 - 黑道風',
        description: '8+9 風格的現代社會，充滿各種底層人物',
        backgroundSetting: '現代台灣都市，充滿了各行各業的底層人物，有討債的、賣直播的、夜市擺攤的、刺青師等。說話風格要接地氣，符合台灣 8+9 文化',
        defaultProfessions: [
            '討債小弟',
            '夜市攤販',
            '直播主',
            '刺青師',
            '檳榔西施',
            '八大行業從業者',
            '機車行老闆',
            '鴿舍老闆',
            '代書助理',
            '當鋪小開',
        ],
    },
    [GameMode.CLASSIC_VILLAGE]: {
        mode: GameMode.CLASSIC_VILLAGE,
        displayName: '傳統村莊',
        description: '經典狼人殺村莊背景',
        backgroundSetting: '傳統的中世紀歐洲村莊，有農夫、鐵匠、教師等各種職業',
        defaultProfessions: [
            '務農',
            '鐵匠',
            '教師',
            '獵人',
            '村長',
            '麵包師傅',
        ],
    },
    [GameMode.CAMPUS]: {
        mode: GameMode.CAMPUS,
        displayName: '校園風格',
        description: '大學校園裡的明爭暗鬥',
        backgroundSetting: '台灣的大學校園，有各系的學生、教授、助教等',
        defaultProfessions: [
            '資工系宅男',
            '商學院系花',
            '體育系學長',
            '社團幹部',
            '研究生助教',
            '交換生',
        ],
    },
    [GameMode.OFFICE]: {
        mode: GameMode.OFFICE,
        displayName: '辦公室風格',
        description: '職場上的爾虞我詐',
        backgroundSetting: '科技公司的辦公室，有工程師、PM、HR 等各種職位',
        defaultProfessions: [
            '菜鳥工程師',
            '資深 PM',
            'HR 姐姐',
            '行銷企劃',
            '財務會計',
            '業務主管',
        ],
    },
};

/** 獲取遊戲模式配置 */
export function getGameModeConfig(mode: GameMode): GameModeConfig {
    return GAME_MODE_CONFIGS[mode];
}

/** 遊玩模式（玩家操作 vs 模擬） */
export enum PlayMode {
    /** 玩家模式：人類玩家可以輸入發言和做選擇 */
    PLAYER = 'PLAYER',
    /** 模擬模式：所有行動自動進行 */
    SIMULATION = 'SIMULATION',
}

/** 遊玩模式設定 */
export interface PlayModeConfig {
    /** 遊玩模式 */
    playMode: PlayMode;
    /** 是否在 UI 上顯示 debug 訊息（關閉時只 console.log）*/
    showDebugInUI: boolean;
}

/** 預設遊玩模式設定 */
export const DEFAULT_PLAY_MODE_CONFIG: PlayModeConfig = {
    playMode: PlayMode.PLAYER,
    showDebugInUI: false,
};
