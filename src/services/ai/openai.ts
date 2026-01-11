/**
 * OpenAI 客戶端封裝
 * @module services/ai/openai
 */

import OpenAI from 'openai';
import { logApiRequest, logApiResponse } from '@/lib/debug';

/** OpenAI 配置 */
export interface OpenAIConfig {
    apiKey: string;
    model?: string;
}

/** 預設模型 */
export const DEFAULT_MODEL = 'gpt-4o-mini';

/** 當前使用的模型（可由設定覆蓋）*/
let currentModel: string = DEFAULT_MODEL;

/**
 * 設定使用的模型
 */
export function setCurrentModel(model: string): void {
    currentModel = model;
}

/**
 * 取得當前使用的模型
 */
export function getCurrentModel(): string {
    return currentModel;
}

/** OpenAI 客戶端實例（單例）*/
let openaiClient: OpenAI | null = null;
let currentApiKey: string = '';

/**
 * 初始化 OpenAI 客戶端
 */
export function initializeOpenAI(config: OpenAIConfig): OpenAI {
    if (openaiClient && currentApiKey === config.apiKey) {
        return openaiClient;
    }

    openaiClient = new OpenAI({
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true, // 允許前端使用
    });
    currentApiKey = config.apiKey;

    return openaiClient;
}

/**
 * 取得 OpenAI 客戶端
 */
export function getOpenAIClient(): OpenAI | null {
    return openaiClient;
}

/**
 * 檢查 OpenAI 是否已初始化
 */
export function isOpenAIInitialized(): boolean {
    return openaiClient !== null;
}

/**
 * 呼叫 Chat Completion API
 */
export async function chatCompletion(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
): Promise<string> {
    if (!openaiClient) {
        throw new Error('OpenAI 尚未初始化，請先呼叫 initializeOpenAI');
    }

    // Debug 日誌（只在 console）
    const modelToUse = options?.model || currentModel;
    logApiRequest(
        modelToUse,
        messages.map(m => ({ role: m.role, content: m.content }))
    );

    const response = await openaiClient.chat.completions.create({
        model: modelToUse,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 500,
    });

    const content = response.choices[0]?.message?.content;

    // Debug 日誌（只在 console）
    logApiResponse(content ?? null, response.usage);

    if (!content) {
        throw new Error('OpenAI 返回空內容');
    }

    return content;
}

/**
 * 呼叫 Chat Completion API（JSON 模式）
 */
export async function chatCompletionJSON<T>(
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
): Promise<T> {
    if (!openaiClient) {
        throw new Error('OpenAI 尚未初始化，請先呼叫 initializeOpenAI');
    }

    // Debug 日誌（只在 console）
    const modelToUse = options?.model || currentModel;
    logApiRequest(
        modelToUse,
        messages.map(m => ({ role: m.role, content: m.content }))
    );

    const response = await openaiClient.chat.completions.create({
        model: modelToUse,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 500,
        response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;

    // Debug 日誌（只在 console）
    logApiResponse(content ?? null, response.usage);

    if (!content) {
        throw new Error('OpenAI 返回空內容');
    }

    try {
        return JSON.parse(content) as T;
    } catch (error) {
        throw new Error(`OpenAI 返回的 JSON 解析失敗: ${content}`);
    }
}

/**
 * 簡易 Prompt 呼叫
 */
export async function prompt(
    systemPrompt: string,
    userPrompt: string,
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
): Promise<string> {
    return chatCompletion(
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        options
    );
}

/**
 * 簡易 Prompt 呼叫（JSON 模式）
 */
export async function promptJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    options?: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }
): Promise<T> {
    return chatCompletionJSON<T>(
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        options
    );
}
