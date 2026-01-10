/**
 * 投票管理器
 * @module core/engine/VoteManager
 */

import { GameState } from '../state/GameState';
import { Player, PlayerStatus } from '../types/player';

/** 投票結果 */
export interface VoteResult {
    /** 是否有人被投出 */
    hasElimination: boolean;
    /** 被投出的玩家 ID（如有）*/
    eliminatedPlayerId: string | null;
    /** 被投出的玩家名稱 */
    eliminatedPlayerName: string | null;
    /** 是否平票 */
    isTie: boolean;
    /** 票數統計 */
    voteCounts: Map<string, number>;
    /** 詳細訊息 */
    message: string;
}

/**
 * 投票管理器
 */
export class VoteManager {
    /**
     * 收集投票
     */
    castVote(state: GameState, voterId: string, targetId: string | null): boolean {
        const voter = state.getPlayer(voterId);
        if (!voter || voter.status !== PlayerStatus.ALIVE) {
            return false;
        }

        // 如果投票目標不是 null，檢查目標是否存活
        if (targetId) {
            const target = state.getPlayer(targetId);
            if (!target || target.status !== PlayerStatus.ALIVE) {
                return false;
            }
        }

        state.castVote(voterId, targetId);
        return true;
    }

    /**
     * 檢查所有存活玩家是否都已投票
     */
    hasAllPlayersVoted(state: GameState): boolean {
        const alivePlayers = state.getAlivePlayers();
        const votes = state.getVotes();
        return alivePlayers.every((p) => votes.has(p.id));
    }

    /**
     * 計算投票結果
     */
    calculateResult(state: GameState): VoteResult {
        const voteCounts = state.getVoteCount();

        if (voteCounts.size === 0) {
            return {
                hasElimination: false,
                eliminatedPlayerId: null,
                eliminatedPlayerName: null,
                isTie: false,
                voteCounts,
                message: '無人投票',
            };
        }

        // 找出最高票
        let maxVotes = 0;
        let topCandidates: string[] = [];

        for (const [playerId, count] of voteCounts) {
            if (count > maxVotes) {
                maxVotes = count;
                topCandidates = [playerId];
            } else if (count === maxVotes) {
                topCandidates.push(playerId);
            }
        }

        // 檢查是否平票
        if (topCandidates.length > 1) {
            return {
                hasElimination: false,
                eliminatedPlayerId: null,
                eliminatedPlayerName: null,
                isTie: true,
                voteCounts,
                message: `平票！${topCandidates.length} 人各得 ${maxVotes} 票，無人被處決`,
            };
        }

        // 處決最高票玩家
        const eliminatedId = topCandidates[0];
        const eliminatedPlayer = state.getPlayer(eliminatedId);

        return {
            hasElimination: true,
            eliminatedPlayerId: eliminatedId,
            eliminatedPlayerName: eliminatedPlayer?.displayName || null,
            isTie: false,
            voteCounts,
            message: `${eliminatedPlayer?.displayName} 以 ${maxVotes} 票被投出！`,
        };
    }

    /**
     * 執行投票結果（處決玩家）
     */
    executeVoteResult(state: GameState, result: VoteResult): void {
        if (result.hasElimination && result.eliminatedPlayerId) {
            state.killPlayer(result.eliminatedPlayerId, PlayerStatus.EXECUTED);
        }
        state.clearVotes();
    }

    /**
     * 取得投票摘要
     */
    getVoteSummary(state: GameState): string {
        const votes = state.getVotes();
        const lines: string[] = [];

        for (const [voterId, targetId] of votes) {
            const voter = state.getPlayer(voterId);
            const target = targetId ? state.getPlayer(targetId) : null;
            const targetName = target?.displayName || '棄票';
            lines.push(`${voter?.displayName} → ${targetName}`);
        }

        return lines.join('\n');
    }
}
