/**
 * 投票決策 Prompt
 * @module services/ai/prompts/vote
 */

import { RoleType, Team, ROLE_TEAM_MAP } from '@/core/types/role';
import { NpcCharacter, Player } from '@/core/types/player';

/** 投票決策系統提示 */
export function getVoteSystemPrompt(
    character: NpcCharacter,
    role: RoleType
): string {
    const team = ROLE_TEAM_MAP[role];

    let strategy: string;
    if (role === RoleType.WEREWOLF) {
        strategy = `作為狼人，你的目標是：
- 不要投票給自己的狼人隊友
- 選擇投票給對狼人威脅最大的人（如可能的預言家）
- 如果能跟風投票不要太突出
- 試圖把票集中到村民身上`;
    } else if (role === RoleType.SEER) {
        strategy = `作為預言家，你的目標是：
- 根據你的查驗結果投票
- 如果查到狼人，積極推動投票
- 保護自己，同時引導村民`;
    } else {
        strategy = `作為村民，你的目標是：
- 根據發言分析誰最可疑
- 觀察誰在帶節奏
- 投票給你認為最可能是狼人的人`;
    }

    return `你是狼人殺遊戲中的一個角色，現在是投票階段。

你的角色設定：
- 名字：${character.name}
- 個性：${character.personality}

你的真實身份：${role === RoleType.WEREWOLF ? '狼人' : role === RoleType.SEER ? '預言家' : '村民'}

${strategy}

⚠️ 重要規則：你只能投給目前還存活的玩家！已死亡的玩家不能投票。
請根據討論內容和遊戲情況做出投票決策。`;
}

/** 投票決策用戶提示（包含完整討論記錄）*/
export function getVoteUserPrompt(
    discussionHistory: string,
    candidates: { id: string; name: string }[],
    werewolfTeammates?: string[]
): string {
    const candidateList = candidates
        .map((c, i) => `${i + 1}. ${c.name}（ID: ${c.id}）`)
        .join('\n');

    let extraInfo = '';
    if (werewolfTeammates && werewolfTeammates.length > 0) {
        extraInfo = `\n⚠️ 注意：你的狼人隊友是：${werewolfTeammates.join('、')}，絕對不要投給他們！`;
    }

    return `現在是投票階段，請根據討論內容決定投票給誰。

【討論記錄】
${discussionHistory}
${extraInfo}

【存活玩家 - 只能從這些人中選擇】
${candidateList}

⚠️⚠️⚠️ 絕對禁止投給不在上面列表中的人！
- 已死亡的玩家不會出現在列表中
- 你必須從上面的存活玩家列表中選擇一個 ID
- targetId 必須是括號中的 ID（例如 "npc_2" 或 "human_player"）

請以 JSON 格式回答：
{
  "targetId": "從上面列表選擇一個存活玩家的 ID",
  "reason": "投票理由（1句話）"
}`;
}
