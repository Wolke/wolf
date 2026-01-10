/**
 * 決策生成器
 * @module services/ai/DecisionMaker
 */

import { Player } from '@/core/types/player';
import { RoleType } from '@/core/types/role';
import { promptJSON } from './openai';
import { getVoteSystemPrompt, getVoteUserPrompt } from './prompts/vote';
import {
    getWerewolfKillSystemPrompt,
    getWerewolfKillUserPrompt,
    getSeerCheckSystemPrompt,
    getSeerCheckUserPrompt,
} from './prompts/night';

/** 決策回應格式 */
interface DecisionResponse {
    targetId: string;
    reason: string;
}

/**
 * 生成投票決策
 */
export async function generateVoteDecision(
    player: Player,
    gameContext: string,
    candidates: { id: string; name: string }[],
    werewolfTeammates?: string[]
): Promise<DecisionResponse> {
    if (!player.character) {
        throw new Error('玩家沒有角色設定');
    }

    const systemPrompt = getVoteSystemPrompt(player.character, player.role);
    const userPrompt = getVoteUserPrompt(gameContext, candidates, werewolfTeammates);

    return promptJSON<DecisionResponse>(systemPrompt, userPrompt, {
        temperature: 0.7,
    });
}

/**
 * 生成狼人殺人決策
 */
export async function generateWerewolfKillDecision(
    player: Player,
    gameContext: string,
    targets: { id: string; name: string }[],
    teammates: string[]
): Promise<DecisionResponse> {
    if (!player.character) {
        throw new Error('玩家沒有角色設定');
    }

    const systemPrompt = getWerewolfKillSystemPrompt(player.character);
    const userPrompt = getWerewolfKillUserPrompt(gameContext, targets, teammates);

    return promptJSON<DecisionResponse>(systemPrompt, userPrompt, {
        temperature: 0.7,
    });
}

/**
 * 生成預言家查驗決策
 */
export async function generateSeerCheckDecision(
    player: Player,
    gameContext: string,
    targets: { id: string; name: string }[],
    previousChecks: { name: string; isWerewolf: boolean }[] = []
): Promise<DecisionResponse> {
    if (!player.character) {
        throw new Error('玩家沒有角色設定');
    }

    const systemPrompt = getSeerCheckSystemPrompt(player.character, previousChecks);
    const userPrompt = getSeerCheckUserPrompt(gameContext, targets);

    return promptJSON<DecisionResponse>(systemPrompt, userPrompt, {
        temperature: 0.7,
    });
}

/**
 * 決策生成器類
 */
export class DecisionMaker {
    /** 預言家查驗歷史 */
    private seerCheckHistory: Map<string, { name: string; isWerewolf: boolean }[]> = new Map();

    /**
     * 生成投票決策
     */
    async vote(
        player: Player,
        discussionHistory: string,
        candidates: Player[],
        allPlayers: Player[]
    ): Promise<{ targetId: string; reason: string }> {
        const candidateList = candidates.map((c) => ({
            id: c.id,
            name: c.displayName,
        }));

        // 找出狼人隊友（如果是狼人）
        let werewolfTeammates: string[] | undefined;
        if (player.role === RoleType.WEREWOLF) {
            werewolfTeammates = allPlayers
                .filter((p) => p.role === RoleType.WEREWOLF && p.id !== player.id)
                .map((p) => p.displayName);
        }

        const decision = await generateVoteDecision(
            player,
            discussionHistory,
            candidateList,
            werewolfTeammates
        );

        // 驗證並修正選擇的目標
        const validatedTargetId = this.validateAndResolveTargetId(
            decision.targetId,
            candidates
        );

        return { targetId: validatedTargetId, reason: decision.reason };
    }

    /**
     * 驗證並解析目標 ID
     * 如果 AI 回傳名字而非 ID，嘗試轉換
     */
    private validateAndResolveTargetId(
        targetId: string,
        candidates: Player[]
    ): string {
        // 先檢查是否是有效的 ID
        const directMatch = candidates.find((c) => c.id === targetId);
        if (directMatch) {
            return targetId;
        }

        // 嘗試用名字匹配
        const nameMatch = candidates.find(
            (c) => c.displayName === targetId || c.displayName.includes(targetId)
        );
        if (nameMatch) {
            console.log(`⚠️ AI 回傳名字「${targetId}」，已轉換為 ID「${nameMatch.id}」`);
            return nameMatch.id;
        }

        // 無法匹配時，隨機選擇
        if (candidates.length > 0) {
            const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
            console.log(`⚠️ 目標「${targetId}」不在存活玩家中（可能已死亡），改投給「${randomTarget.displayName}」`);
            return randomTarget.id;
        }

        throw new Error('沒有可投票的目標');
    }

    /**
     * 生成狼人殺人決策
     */
    async werewolfKill(
        player: Player,
        gameContext: string,
        targets: Player[],
        allPlayers: Player[]
    ): Promise<{ targetId: string; reason: string }> {
        const targetList = targets.map((t) => ({
            id: t.id,
            name: t.displayName,
        }));

        const teammates = allPlayers
            .filter((p) => p.role === RoleType.WEREWOLF && p.id !== player.id)
            .map((p) => p.displayName);

        const decision = await generateWerewolfKillDecision(
            player,
            gameContext,
            targetList,
            teammates
        );

        // 驗證選擇的目標是否有效
        const isValid = targets.some((t) => t.id === decision.targetId);
        if (!isValid && targets.length > 0) {
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            return { targetId: randomTarget.id, reason: decision.reason };
        }

        return decision;
    }

    /**
     * 生成預言家查驗決策
     */
    async seerCheck(
        player: Player,
        gameContext: string,
        targets: Player[]
    ): Promise<{ targetId: string; reason: string }> {
        const targetList = targets.map((t) => ({
            id: t.id,
            name: t.displayName,
        }));

        const previousChecks = this.seerCheckHistory.get(player.id) || [];

        const decision = await generateSeerCheckDecision(
            player,
            gameContext,
            targetList,
            previousChecks
        );

        // 驗證選擇的目標是否有效
        const isValid = targets.some((t) => t.id === decision.targetId);
        if (!isValid && targets.length > 0) {
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            return { targetId: randomTarget.id, reason: decision.reason };
        }

        return decision;
    }

    /**
     * 記錄預言家查驗結果
     */
    recordSeerCheck(
        seerId: string,
        check: { name: string; isWerewolf: boolean }
    ): void {
        const history = this.seerCheckHistory.get(seerId) || [];
        history.push(check);
        this.seerCheckHistory.set(seerId, history);
    }

    /**
     * 清空歷史記錄
     */
    clearHistory(): void {
        this.seerCheckHistory.clear();
    }
}
