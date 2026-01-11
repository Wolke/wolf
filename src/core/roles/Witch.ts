/**
 * 女巫角色
 * @module core/roles/Witch
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility } from '../types/role';
import { Player, isPlayerAlive } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 女巫角色類別
 * - 有解藥和毒藥各一瓶
 * - 解藥可以救當晚被狼人殺害的玩家
 * - 毒藥可以毒死一名玩家
 */
export class Witch extends BaseRole {
    readonly type = RoleType.WITCH;
    readonly team = Team.VILLAGER;
    readonly displayName = '女巫';
    readonly description = '擁有解藥和毒藥各一瓶';
    readonly canActAtNight = true;

    readonly abilities: RoleAbility[] = [
        {
            name: '解藥',
            description: '救活當晚被狼人殺害的玩家',
            isNightAction: true,
            requiresTarget: false,
            usageLimit: 1,
        },
        {
            name: '毒藥',
            description: '毒殺一名玩家',
            isNightAction: true,
            requiresTarget: true,
            usageLimit: 1,
        },
    ];

    /**
     * 使用解藥
     */
    useAntidote(
        actor: Player,
        targetId: string,
        state: IGameStateReader
    ): ActionResult {
        return {
            success: true,
            message: `女巫使用解藥救活了當晚的死者`,
            data: {
                targetId,
                actionType: 'WITCH_SAVE',
            },
        };
    }

    /**
     * 使用毒藥
     */
    usePoison(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult {
        if (!isPlayerAlive(target)) {
            return {
                success: false,
                message: `${target.displayName} 已經死亡`,
            };
        }

        if (target.id === actor.id) {
            return {
                success: false,
                message: '不能毒自己',
            };
        }

        return {
            success: true,
            message: `女巫使用毒藥毒殺了 ${target.displayName}`,
            data: {
                targetId: target.id,
                actionType: 'WITCH_POISON',
            },
        };
    }

    executeNightAction(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult {
        // 女巫的夜晚行動由專門的 useAntidote 和 usePoison 方法處理
        return {
            success: false,
            message: '請使用專門的解藥或毒藥方法',
        };
    }

    getValidTargets(actor: Player, state: IGameStateReader): Player[] {
        // 毒藥可選目標：所有存活玩家（除了自己）
        return state.getAlivePlayers().filter((p) => p.id !== actor.id);
    }
}

export const witchRole = new Witch();
