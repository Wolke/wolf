/**
 * 夜晚動作解析器
 * @module core/engine/ActionResolver
 */

import { GameState } from '../state/GameState';
import { Player, PlayerStatus, isPlayerAlive } from '../types/player';
import { RoleType } from '../types/role';
import { ActionResult } from '../types/action';
import { getRoleInstance } from '../roles';

/** 夜晚結算結果 */
export interface NightResolutionResult {
    /** 死亡的玩家 ID 列表 */
    deaths: string[];
    /** 預言家查驗結果（如有）*/
    seerResult: { targetId: string; targetName: string; isWerewolf: boolean } | null;
    /** 結算訊息 */
    message: string;
}

/**
 * 夜晚動作解析器
 */
export class ActionResolver {
    /**
     * 處理狼人殺人行動
     */
    handleWerewolfAction(
        state: GameState,
        werewolfId: string,
        targetId: string
    ): ActionResult {
        const werewolf = state.getPlayer(werewolfId);
        const target = state.getPlayer(targetId);

        if (!werewolf || !target) {
            return { success: false, message: '玩家不存在' };
        }

        if (werewolf.role !== RoleType.WEREWOLF) {
            return { success: false, message: '只有狼人可以執行此行動' };
        }

        if (!isPlayerAlive(target)) {
            return { success: false, message: '目標已死亡' };
        }

        if (target.role === RoleType.WEREWOLF) {
            return { success: false, message: '不能殺害同陣營玩家' };
        }

        // 記錄狼人投票
        state.setWerewolfVote(werewolfId, targetId);

        return {
            success: true,
            message: `你選擇了 ${target.displayName} 作為目標`,
            data: { targetId, targetName: target.displayName },
        };
    }

    /**
     * 確認狼人最終目標（當所有狼人都投票後）
     */
    finalizeWerewolfTarget(state: GameState): string | null {
        const nightActions = state.getNightActions();
        const werewolfVotes = nightActions.werewolfVotes;
        const aliveWerewolves = state.getAlivePlayers().filter(
            (p) => p.role === RoleType.WEREWOLF
        );

        // 檢查是否所有狼人都已投票
        const allVoted = aliveWerewolves.every((w) => werewolfVotes.has(w.id));
        if (!allVoted) {
            return null;
        }

        // 統計票數
        const voteCounts = new Map<string, number>();
        for (const targetId of werewolfVotes.values()) {
            voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
        }

        // 找出最高票（如平票則隨機選一個）
        let maxVotes = 0;
        let topTargets: string[] = [];
        for (const [targetId, count] of voteCounts) {
            if (count > maxVotes) {
                maxVotes = count;
                topTargets = [targetId];
            } else if (count === maxVotes) {
                topTargets.push(targetId);
            }
        }

        const finalTarget = topTargets[Math.floor(Math.random() * topTargets.length)];
        state.setWerewolfTarget(finalTarget);
        return finalTarget;
    }

    /**
     * 處理預言家查驗行動
     */
    handleSeerAction(
        state: GameState,
        seerId: string,
        targetId: string
    ): ActionResult {
        const seer = state.getPlayer(seerId);
        const target = state.getPlayer(targetId);

        if (!seer || !target) {
            return { success: false, message: '玩家不存在' };
        }

        if (seer.role !== RoleType.SEER) {
            return { success: false, message: '只有預言家可以執行此行動' };
        }

        if (!isPlayerAlive(target)) {
            return { success: false, message: '目標已死亡' };
        }

        if (seerId === targetId) {
            return { success: false, message: '不能查驗自己' };
        }

        const isWerewolf = target.role === RoleType.WEREWOLF;
        state.setSeerAction(targetId, isWerewolf);

        return {
            success: true,
            message: `你查驗了 ${target.displayName}，他是【${isWerewolf ? '狼人' : '好人'}】`,
            data: {
                targetId,
                targetName: target.displayName,
                isWerewolf,
            },
        };
    }

    /**
     * 結算夜晚結果
     */
    resolveNight(state: GameState): NightResolutionResult {
        const nightActions = state.getNightActions();
        const deaths: string[] = [];

        // 處理狼人殺人
        if (nightActions.werewolfTarget) {
            const target = state.getPlayer(nightActions.werewolfTarget);
            if (target && isPlayerAlive(target)) {
                state.killPlayer(target.id, PlayerStatus.KILLED_BY_WEREWOLF);
                deaths.push(target.id);
            }
        }

        // 準備預言家查驗結果
        let seerResult: NightResolutionResult['seerResult'] = null;
        if (nightActions.seerResult) {
            const target = state.getPlayer(nightActions.seerResult.targetId);
            if (target) {
                seerResult = {
                    targetId: target.id,
                    targetName: target.displayName,
                    isWerewolf: nightActions.seerResult.isWerewolf,
                };
            }
        }

        // 生成結算訊息
        let message: string;
        if (deaths.length === 0) {
            message = '昨晚是平安夜，沒有人死亡。';
        } else {
            const deadNames = deaths
                .map((id) => state.getPlayer(id)?.displayName)
                .filter(Boolean)
                .join('、');
            message = `昨晚 ${deadNames} 死亡了。`;
        }

        return { deaths, seerResult, message };
    }
}
