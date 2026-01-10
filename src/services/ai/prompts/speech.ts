/**
 * 發言生成 Prompt
 * @module services/ai/prompts/speech
 */

import { RoleType, Team, ROLE_TEAM_MAP } from '@/core/types/role';
import { NpcCharacter } from '@/core/types/player';

/** 發言生成系統提示 */
export function getSpeechSystemPrompt(
    character: NpcCharacter,
    role: RoleType,
    isAlive: boolean
): string {
    const team = ROLE_TEAM_MAP[role];
    const teamStrategy = team === Team.WEREWOLF
        ? '你需要隱藏自己的身份，適時把懷疑引向其他人。'
        : '你需要觀察場上情況，找出可疑的狼人。';

    return `你是狼人殺遊戲中的一個角色，請用角色的口吻發言。

你的角色設定：
- 名字：${character.name}
- 年齡：${character.age}歲
- 職業：${character.profession}
- 個性：${character.personality}
- 說話風格：${character.speechStyle}
${character.catchphrase ? `- 口頭禪：${character.catchphrase}` : ''}

你的真實身份：${role === RoleType.WEREWOLF ? '狼人' : role === RoleType.SEER ? '預言家' : '村民'}
${teamStrategy}

發言要求：
1. 完全符合角色的說話風格
2. 發言長度適中（2-4句話）
3. 繁體中文
4. 不要直接透露自己的身份（除非策略需要）
5. 根據遊戲情況提出觀點或懷疑
6. 可以回應之前發言者的觀點`;
}

/** 發言生成用戶提示（包含之前的發言記錄）*/
export function getSpeechUserPrompt(
    gameContext: string,
    speakingOrder: number,
    totalPlayers: number,
    previousSpeeches?: string[]
): string {
    let prompt = `現在是討論階段，你是第 ${speakingOrder}/${totalPlayers} 位發言。

遊戲情況：
${gameContext}
`;

    // 加入之前的發言記錄
    if (previousSpeeches && previousSpeeches.length > 0) {
        prompt += `
【之前的發言】
${previousSpeeches.join('\n\n')}
`;
    }

    prompt += `
請以你的角色身份發言。你可以：
- 回應之前發言者的觀點
- 提出自己的看法和懷疑
- 根據討論內容分析誰最可疑

直接說出發言內容，不需要加引號或角色名。`;

    return prompt;
}

/** 第一輪發言提示（第一個發言者，沒有之前的發言）*/
export function getFirstRoundSpeechPrompt(deathInfo?: string): string {
    return `這是遊戲的第一個白天。
${deathInfo ? `昨晚發生的事：${deathInfo}` : '昨晚有人被狼人殺害。'}

你是第一位發言者，請以你的角色身份發言，可以：
- 表達對死者的看法
- 觀察其他人的反應
- 提出初步的懷疑或觀點

直接說出發言內容。`;
}
