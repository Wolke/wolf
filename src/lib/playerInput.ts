/**
 * 玩家輸入處理器
 * @module lib/playerInput
 * 
 * 提供一個回調機制，讓 GameCLI 可以等待瀏覽器中的玩家輸入
 */

/** 輸入類型 */
export enum InputType {
    /** 文字輸入（名字、發言）*/
    TEXT = 'TEXT',
    /** 選擇輸入（殺人目標、投票、查驗）*/
    CHOICE = 'CHOICE',
}

/** 選項 */
export interface InputOption {
    id: string;
    label: string;
}

/** 輸入請求 */
export interface InputRequest {
    type: InputType;
    prompt: string;
    options?: InputOption[];
    allowEmpty?: boolean;
    placeholder?: string;
}

/** 輸入處理器 */
export type InputHandler = (request: InputRequest) => Promise<string>;

/** 全域輸入處理器 */
let globalInputHandler: InputHandler | null = null;

/**
 * 設定全域輸入處理器
 */
export function setInputHandler(handler: InputHandler): void {
    globalInputHandler = handler;
}

/**
 * 清除輸入處理器
 */
export function clearInputHandler(): void {
    globalInputHandler = null;
}

/**
 * 請求玩家輸入（文字）
 */
export async function requestTextInput(prompt: string, placeholder?: string): Promise<string> {
    if (!globalInputHandler) {
        throw new Error('沒有設定輸入處理器');
    }

    return globalInputHandler({
        type: InputType.TEXT,
        prompt,
        placeholder,
    });
}

/**
 * 請求玩家選擇
 */
export async function requestChoice(prompt: string, options: InputOption[]): Promise<string> {
    if (!globalInputHandler) {
        throw new Error('沒有設定輸入處理器');
    }

    return globalInputHandler({
        type: InputType.CHOICE,
        prompt,
        options,
    });
}
