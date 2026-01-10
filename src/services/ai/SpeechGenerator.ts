/**
 * 發言生成器
 * @module services/ai/SpeechGenerator
 */

import { Player, NpcCharacter } from '@/core/types/player';
import { RoleType } from '@/core/types/role';
import { prompt } from './openai';
import {
    getSpeechSystemPrompt,
    getSpeechUserPrompt,
    getFirstRoundSpeechPrompt,
} from './prompts/speech';

/**
 * 生成 NPC 發言（包含之前的發言脈絡）
 */
export async function generateSpeech(
    player: Player,
    gameContext: string,
    speakingOrder: number,
    totalPlayers: number,
    previousSpeeches: string[] = [],
    deathInfo?: string
): Promise<string> {
    if (!player.character) {
        throw new Error('玩家沒有角色設定');
    }

    const systemPrompt = getSpeechSystemPrompt(
        player.character,
        player.role,
        player.status === 'ALIVE'
    );

    // 決定使用哪種 user prompt
    let userPrompt: string;
    if (speakingOrder === 1 && previousSpeeches.length === 0) {
        // 第一個發言者
        userPrompt = getFirstRoundSpeechPrompt(deathInfo);
    } else {
        // 後續發言者，傳入之前的發言
        userPrompt = getSpeechUserPrompt(
            gameContext,
            speakingOrder,
            totalPlayers,
            previousSpeeches
        );
    }

    const speech = await prompt(systemPrompt, userPrompt, {
        temperature: 0.8,
        maxTokens: 200,
    });

    return speech.trim();
}

/**
 * 發言生成器類
 */
export class SpeechGenerator {
    /**
     * 為 NPC 生成發言（包含對話脈絡）
     */
    async generateForPlayer(
        player: Player,
        gameContext: string,
        options?: {
            speakingOrder?: number;
            totalPlayers?: number;
            previousSpeeches?: string[];
            deathInfo?: string;
        }
    ): Promise<string> {
        return generateSpeech(
            player,
            gameContext,
            options?.speakingOrder ?? 1,
            options?.totalPlayers ?? 6,
            options?.previousSpeeches ?? [],
            options?.deathInfo
        );
    }

    /**
     * 為所有存活 NPC 生成發言（按順序，累積對話脈絡）
     */
    async generateForAllNpcs(
        players: Player[],
        gameContext: string,
        deathInfo?: string
    ): Promise<Map<string, string>> {
        const speeches = new Map<string, string>();
        const npcPlayers = players.filter((p) => !p.isHuman && p.status === 'ALIVE');
        const previousSpeeches: string[] = [];

        let order = 1;
        for (const player of npcPlayers) {
            try {
                const speech = await this.generateForPlayer(player, gameContext, {
                    speakingOrder: order,
                    totalPlayers: npcPlayers.length,
                    previousSpeeches: [...previousSpeeches],
                    deathInfo,
                });
                speeches.set(player.id, speech);

                // 將這次發言加入歷史，供下一個人參考
                previousSpeeches.push(`${player.displayName}：${speech}`);
                order++;
            } catch (error) {
                console.error(`生成 ${player.displayName} 發言失敗:`, error);
                speeches.set(player.id, '......（沉默不語）');
            }
        }

        return speeches;
    }
}
