/**
 * NPC 角色生成器
 * @module services/ai/CharacterGenerator
 */

import { NpcCharacter } from '@/core/types/player';
import { promptJSON } from './openai';
import {
    CHARACTER_SYSTEM_PROMPT,
    CHARACTER_USER_PROMPT,
    getMultipleCharactersPrompt,
} from './prompts/character';

/** 角色生成回應格式 */
interface CharacterResponse {
    name: string;
    age: number;
    profession: string;
    personality: string;
    speechStyle: string;
    voiceStyle: string;
    appearance: string;
    catchphrase?: string;
}

/** 多角色生成回應格式 */
interface MultipleCharactersResponse {
    characters: CharacterResponse[];
}

/**
 * 生成單一 NPC 角色
 */
export async function generateCharacter(): Promise<NpcCharacter> {
    const response = await promptJSON<CharacterResponse>(
        CHARACTER_SYSTEM_PROMPT,
        CHARACTER_USER_PROMPT,
        { temperature: 0.9 }
    );

    return {
        name: response.name,
        age: response.age,
        profession: response.profession,
        personality: response.personality,
        speechStyle: response.speechStyle,
        voiceStyle: response.voiceStyle,
        appearance: response.appearance,
        catchphrase: response.catchphrase,
    };
}

/**
 * 生成多個 NPC 角色
 */
export async function generateMultipleCharacters(
    count: number
): Promise<NpcCharacter[]> {
    try {
        console.log('📤 正在呼叫 OpenAI API 生成角色...');
        const response = await promptJSON<MultipleCharactersResponse>(
            CHARACTER_SYSTEM_PROMPT,
            getMultipleCharactersPrompt(count),
            { temperature: 0.9, maxTokens: 1000 }
        );
        console.log('📥 API 回應:', response);

        if (!response.characters || !Array.isArray(response.characters)) {
            throw new Error('API 回應格式錯誤：缺少 characters 陣列');
        }

        return response.characters.map((c) => ({
            name: c.name,
            age: c.age,
            profession: c.profession,
            personality: c.personality,
            speechStyle: c.speechStyle,
            voiceStyle: c.voiceStyle,
            appearance: c.appearance,
            catchphrase: c.catchphrase,
        }));
    } catch (error) {
        console.error('❌ 生成角色失敗:', error);
        throw error;
    }
}

/**
 * 角色生成器類（包含快取）
 */
export class CharacterGenerator {
    private cache: Map<string, NpcCharacter> = new Map();

    /**
     * 生成並快取角色
     */
    async generate(cacheKey?: string): Promise<NpcCharacter> {
        if (cacheKey && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const character = await generateCharacter();

        if (cacheKey) {
            this.cache.set(cacheKey, character);
        }

        return character;
    }

    /**
     * 批量生成角色
     */
    async generateBatch(count: number): Promise<NpcCharacter[]> {
        return generateMultipleCharacters(count);
    }

    /**
     * 清空快取
     */
    clearCache(): void {
        this.cache.clear();
    }
}
