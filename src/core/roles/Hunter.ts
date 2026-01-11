/**
 * 獵人角色
 * @module core/roles/Hunter
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility } from '../types/role';
import { Player, isPlayerAlive } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 獵人角色類別
 * - 死亡時可開槍帶走一人
 * - 如果是被女巫毒死，不能開槍
 */
export class Hunter extends BaseRole {
    readonly type = RoleType.HUNTER;
    readonly team = Team.VILLAGER;
    readonly displayName = '獵人';
    readonly description = '死亡時可開槍帶走一名玩家';
    readonly canActAtNight = false;

    readonly abilities: RoleAbility[] = [
        {
            name: '開槍',
            description: '死亡時帶走一名玩家',
            isNightAction: false,
            requiresTarget: true,
            usageLimit: 1,
        },
    ];

    executeNightAction(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult {
        // 獵人沒有夜晚行動
        return {
            success: false,
            message: '獵人沒有夜晚行動',
        };
    }

    /**
     * 開槍（死亡時觸發）
     */
    executeDeathShot(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult {
        if (!isPlayerAlive(target)) {
            return {
                success: false,
                message: `${target.displayName} 已經死亡，無法選擇`,
            };
        }

        return {
            success: true,
            message: `獵人開槍帶走了 ${target.displayName}`,
            data: {
                targetId: target.id,
                actionType: 'HUNTER_SHOT',
            },
        };
    }

    getValidTargets(actor: Player, state: IGameStateReader): Player[] {
        return [];
    }

    /**
     * 取得開槍的有效目標（所有存活玩家）
     */
    getDeathShotTargets(actor: Player, state: IGameStateReader): Player[] {
        return state.getAlivePlayers().filter((p) => p.id !== actor.id);
    }
}

export const hunterRole = new Hunter();
