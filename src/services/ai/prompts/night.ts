/**
 * 夜晚行動 Prompt
 * @module services/ai/prompts/night
 */

import { RoleType } from '@/core/types/role';
import { NpcCharacter, Player } from '@/core/types/player';

/** 狼人殺人決策系統提示 */
export function getWerewolfKillSystemPrompt(
    character: NpcCharacter
): string {
    return `你是狼人殺遊戲中的狼人，現在是夜晚，你需要選擇殺害一名玩家。

你的角色設定：
- 名字：${character.name}
- 個性：${character.personality}

殺人策略：
1. 優先殺掉對狼人威脅最大的人（如預言家、發言犀利者）
2. 考慮其他狼人的選擇，保持隊伍一致
3. 不要讓殺人目標暴露狼人身份`;
}

/** 狼人殺人決策用戶提示 */
export function getWerewolfKillUserPrompt(
    gameContext: string,
    targets: { id: string; name: string }[],
    teammates: string[]
): string {
    const targetList = targets
        .map((t) => `- ${t.name} (ID: ${t.id})`)
        .join('\n');

    return `夜晚來臨，選擇今晚的目標。

遊戲情況：
${gameContext}

你的狼人隊友：${teammates.join('、')}

可殺害的目標：
${targetList}

請以 JSON 格式回答：
{
  "targetId": "選擇的玩家ID",
  "reason": "簡短的理由（1句話）"
}`;
}

/** 預言家查驗決策系統提示 */
export function getSeerCheckSystemPrompt(
    character: NpcCharacter,
    previousChecks: { name: string; isWerewolf: boolean }[]
): string {
    let checkHistory = '';
    if (previousChecks.length > 0) {
        checkHistory = '\n你之前的查驗結果：\n' +
            previousChecks.map((c) => `- ${c.name}：${c.isWerewolf ? '狼人' : '好人'}`).join('\n');
    }

    return `你是狼人殺遊戲中的預言家，現在是夜晚，你需要選擇查驗一名玩家。

你的角色設定：
- 名字：${character.name}
- 個性：${character.personality}
${checkHistory}

查驗策略：
1. 優先查驗發言可疑的人
2. 查驗沒有被驗過的人
3. 考慮場上局勢，查驗關鍵人物`;
}

/** 預言家查驗決策用戶提示 */
export function getSeerCheckUserPrompt(
    gameContext: string,
    targets: { id: string; name: string }[]
): string {
    const targetList = targets
        .map((t) => `- ${t.name} (ID: ${t.id})`)
        .join('\n');

    return `夜晚來臨，選擇今晚要查驗的對象。

遊戲情況：
${gameContext}

可查驗的對象：
${targetList}

請以 JSON 格式回答：
{
  "targetId": "選擇的玩家ID",
  "reason": "簡短的理由（1句話）"
}`;
}
