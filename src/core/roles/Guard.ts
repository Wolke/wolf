/**
 * 守衛角色
 * @module core/roles/Guard
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility } from '../types/role';
import { Player, isPlayerAlive } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 守衛角色類別
 * - 每晚可以保護一名玩家免受狼人攻擊
 * - 不能連續兩晚保護同一人
 */
export class Guard extends BaseRole {
    readonly type = RoleType.GUARD;
    readonly team = Team.VILLAGER;
    readonly displayName = '守衛';
    readonly description = '每晚可保護一名玩家免受狼人攻擊';
    readonly canActAtNight = true;

    readonly abilities: RoleAbility[] = [
        {
            name: '守護',
            description: '保護一名玩家（不能連續兩晚保護同一人）',
            isNightAction: true,
            requiresTarget: true,
        },
    ];

    executeNightAction(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult {
        if (!isPlayerAlive(target)) {
            return {
                success: false,
                message: `${target.displayName} 已經死亡，無法保護`,
            };
        }

        return {
            success: true,
            message: `守衛今晚保護了 ${target.displayName}`,
            data: {
                targetId: target.id,
                actionType: 'GUARD_PROTECT',
            },
        };
    }

    getValidTargets(actor: Player, state: IGameStateReader): Player[] {
        // 可以保護任何存活玩家（包括自己）
        // 注意：實際邏輯需要過濾掉昨晚保護的玩家，這會在 GameEngine 處理
        return state.getAlivePlayers();
    }
}

export const guardRole = new Guard();
