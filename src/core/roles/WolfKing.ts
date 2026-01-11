/**
 * 狼王角色
 * @module core/roles/WolfKing
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility, isWerewolfTeam } from '../types/role';
import { Player, isPlayerAlive } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 狼王角色類別
 * - 夜晚可以與狼人隊友選擇擊殺目標
 * - 死亡時可帶走一人（包括狼人隊友）
 */
export class WolfKing extends BaseRole {
    readonly type = RoleType.WOLF_KING;
    readonly team = Team.WEREWOLF;
    readonly displayName = '狼王';
    readonly description = '狼人首領，死亡時可開槍帶走一人（包括自己的隊友）';
    readonly canActAtNight = true;

    readonly abilities: RoleAbility[] = [
        {
            name: '狼人殺',
            description: '夜晚與同伴選擇一名玩家擊殺',
            isNightAction: true,
            requiresTarget: true,
        },
        {
            name: '狼王遺言',
            description: '死亡時可帶走任意一名玩家',
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
        if (!isPlayerAlive(target)) {
            return {
                success: false,
                message: `${target.displayName} 已經死亡，無法選擇`,
            };
        }

        // 狼王殺人時，不能殺自己的狼人隊友
        if (isWerewolfTeam(target.role)) {
            return {
                success: false,
                message: '不能殺害狼人陣營的玩家',
            };
        }

        return {
            success: true,
            message: `狼王選擇了 ${target.displayName} 作為今晚的目標`,
            data: {
                targetId: target.id,
                actionType: 'WEREWOLF_KILL',
            },
        };
    }

    /**
     * 狼王開槍（死亡時觸發）- 可殺任何人包括隊友
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
            message: `狼王帶走了 ${target.displayName}`,
            data: {
                targetId: target.id,
                actionType: 'WOLF_KING_SHOT',
            },
        };
    }

    getValidTargets(actor: Player, state: IGameStateReader): Player[] {
        // 夜晚：只能選非狼人
        return state.getAlivePlayers().filter(
            (p) => !isWerewolfTeam(p.role)
        );
    }

    /**
     * 取得開槍的有效目標（所有存活玩家，包括隊友）
     */
    getDeathShotTargets(actor: Player, state: IGameStateReader): Player[] {
        return state.getAlivePlayers().filter((p) => p.id !== actor.id);
    }
}

export const wolfKingRole = new WolfKing();
