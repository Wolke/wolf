/**
 * 階段管理器
 * @module core/engine/PhaseManager
 */

import { GamePhase } from '../types/game';
import { GameState } from '../state/GameState';
import { RoleType } from '../types/role';

/** 階段轉換結果 */
export interface PhaseTransitionResult {
    /** 是否成功轉換 */
    success: boolean;
    /** 新階段 */
    newPhase: GamePhase;
    /** 訊息 */
    message: string;
}

/**
 * 階段管理器
 * 控制遊戲階段的流轉
 */
export class PhaseManager {
    /**
     * 取得下一個階段
     */
    getNextPhase(currentPhase: GamePhase, state: GameState): GamePhase {
        switch (currentPhase) {
            case GamePhase.INIT:
                return GamePhase.NIGHT_START;

            case GamePhase.NIGHT_START:
                return GamePhase.WEREWOLF_TURN;

            case GamePhase.WEREWOLF_TURN:
                // 檢查是否有預言家存活
                const aliveSeer = state.getAlivePlayers().find(
                    (p) => p.role === RoleType.SEER
                );
                return aliveSeer ? GamePhase.SEER_TURN : GamePhase.DAY_START;

            case GamePhase.SEER_TURN:
                return GamePhase.DAY_START;

            case GamePhase.DAY_START:
                return GamePhase.DISCUSSION;

            case GamePhase.DISCUSSION:
                return GamePhase.VOTE;

            case GamePhase.VOTE:
                return GamePhase.EXECUTION;

            case GamePhase.EXECUTION:
                // 執行後回到夜晚開始新回合
                return GamePhase.NIGHT_START;

            case GamePhase.GAME_END:
                return GamePhase.GAME_END;

            default:
                return currentPhase;
        }
    }

    /**
     * 轉換到下一階段
     */
    transitionToNextPhase(state: GameState): PhaseTransitionResult {
        const currentPhase = state.getPhase();
        const nextPhase = this.getNextPhase(currentPhase, state);

        if (nextPhase === currentPhase) {
            return {
                success: false,
                newPhase: currentPhase,
                message: '無法轉換階段',
            };
        }

        // 執行階段轉換
        state.setPhase(nextPhase);

        // 特殊處理
        if (nextPhase === GamePhase.NIGHT_START) {
            state.incrementRound();
            state.resetNightActions();
            state.clearVotes();
            state.clearLastDeaths();
        }

        return {
            success: true,
            newPhase: nextPhase,
            message: this.getPhaseMessage(nextPhase, state.getRound()),
        };
    }

    /**
     * 取得階段顯示訊息
     */
    getPhaseMessage(phase: GamePhase, round: number): string {
        switch (phase) {
            case GamePhase.NIGHT_START:
                return `第 ${round} 夜降臨，請閉眼...`;
            case GamePhase.WEREWOLF_TURN:
                return '狼人請睜眼，選擇今晚的目標...';
            case GamePhase.SEER_TURN:
                return '預言家請睜眼，選擇要查驗的對象...';
            case GamePhase.DAY_START:
                return '天亮了，請睜眼...';
            case GamePhase.DISCUSSION:
                return '開始討論，請各位發表意見...';
            case GamePhase.VOTE:
                return '討論結束，開始投票...';
            case GamePhase.EXECUTION:
                return '投票結束，處決結果...';
            case GamePhase.GAME_END:
                return '遊戲結束！';
            default:
                return '';
        }
    }

    /**
     * 檢查是否為夜晚階段
     */
    isNightPhase(phase: GamePhase): boolean {
        return [
            GamePhase.NIGHT_START,
            GamePhase.WEREWOLF_TURN,
            GamePhase.SEER_TURN,
        ].includes(phase);
    }

    /**
     * 檢查是否為白天階段
     */
    isDayPhase(phase: GamePhase): boolean {
        return [
            GamePhase.DAY_START,
            GamePhase.DISCUSSION,
            GamePhase.VOTE,
            GamePhase.EXECUTION,
        ].includes(phase);
    }

    /**
     * 取得當前階段需要行動的角色
     */
    getActiveRoleForPhase(phase: GamePhase): RoleType | null {
        switch (phase) {
            case GamePhase.WEREWOLF_TURN:
                return RoleType.WEREWOLF;
            case GamePhase.SEER_TURN:
                return RoleType.SEER;
            default:
                return null;
        }
    }
}
