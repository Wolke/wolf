/**
 * 勝負判定
 * @module core/engine/WinCondition
 */

import { GameResult } from '../types/game';
import { GameState } from '../state/GameState';
import { Team, ROLE_TEAM_MAP, RoleType } from '../types/role';
import { isPlayerAlive } from '../types/player';

/**
 * 勝負判定器
 */
export class WinConditionChecker {
    /**
     * 檢查遊戲是否結束
     * @returns 遊戲結果（如未結束則返回 null）
     */
    checkGameEnd(state: GameState): GameResult | null {
        const alivePlayers = state.getAlivePlayers();

        const aliveWerewolves = alivePlayers.filter(
            (p) => ROLE_TEAM_MAP[p.role] === Team.WEREWOLF
        );
        const aliveVillagers = alivePlayers.filter(
            (p) => ROLE_TEAM_MAP[p.role] === Team.VILLAGER
        );

        // 狼人全滅 -> 村民勝利
        if (aliveWerewolves.length === 0) {
            return this.createGameResult(state, 'VILLAGER');
        }

        // 狼人數量 >= 村民數量 -> 狼人勝利
        if (aliveWerewolves.length >= aliveVillagers.length) {
            return this.createGameResult(state, 'WEREWOLF');
        }

        return null;
    }

    /**
     * 創建遊戲結果
     */
    private createGameResult(
        state: GameState,
        winner: 'WEREWOLF' | 'VILLAGER'
    ): GameResult {
        const players = state.getPlayers();
        const survivors = players.filter(isPlayerAlive).map((p) => p.id);
        const deceased = players.filter((p) => !isPlayerAlive(p)).map((p) => p.id);

        const summary = this.generateSummary(state, winner);

        return {
            winner,
            totalRounds: state.getRound(),
            summary,
            survivors,
            deceased,
        };
    }

    /**
     * 生成遊戲摘要
     */
    private generateSummary(
        state: GameState,
        winner: 'WEREWOLF' | 'VILLAGER'
    ): string {
        const players = state.getPlayers();
        const aliveCount = state.getAlivePlayers().length;
        const totalRounds = state.getRound();

        const winnerTeamName = winner === 'WEREWOLF' ? '狼人' : '村民';

        // 統計各角色存活情況
        const roleStats: string[] = [];
        const roleGroups = new Map<RoleType, { alive: number; dead: number }>();

        for (const player of players) {
            const current = roleGroups.get(player.role) || { alive: 0, dead: 0 };
            if (isPlayerAlive(player)) {
                current.alive++;
            } else {
                current.dead++;
            }
            roleGroups.set(player.role, current);
        }

        for (const [role, stats] of roleGroups) {
            const roleName = this.getRoleDisplayName(role);
            roleStats.push(`${roleName}: ${stats.alive}/${stats.alive + stats.dead} 存活`);
        }

        return `經過 ${totalRounds} 回合的激戰，${winnerTeamName}陣營獲得勝利！\n` +
            `存活玩家: ${aliveCount}/${players.length}\n` +
            `角色統計:\n${roleStats.join('\n')}`;
    }

    /**
     * 取得角色顯示名稱
     */
    private getRoleDisplayName(role: RoleType): string {
        const names: Record<RoleType, string> = {
            [RoleType.WEREWOLF]: '狼人',
            [RoleType.VILLAGER]: '村民',
            [RoleType.SEER]: '預言家',
        };
        return names[role] || role;
    }

    /**
     * 取得勝利條件說明
     */
    getWinConditionDescription(): string {
        return `勝利條件：
• 村民陣營：投票處決所有狼人
• 狼人陣營：當狼人數量 ≥ 村民數量時獲勝`;
    }
}
