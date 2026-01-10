/**
 * 狼人角色
 * @module core/roles/Werewolf
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility } from '../types/role';
import { Player, isPlayerAlive } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 狼人角色類別
 * - 夜晚可以選擇一名玩家擊殺
 * - 可以看到其他狼人的身份
 * - 狼人陣營
 */
export class Werewolf extends BaseRole {
    readonly type = RoleType.WEREWOLF;
    readonly team = Team.WEREWOLF;
    readonly displayName = '狼人';
    readonly description = '每個夜晚，狼人們可以共同選擇一名玩家擊殺。狼人的目標是消滅所有好人。';
    readonly canActAtNight = true;

    readonly abilities: RoleAbility[] = [
        {
            name: '狼人殺人',
            description: '夜晚選擇一名玩家擊殺',
            isNightAction: true,
            requiresTarget: true,
        },
    ];

    /**
     * 執行狼人殺人行動
     */
    executeNightAction(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult {
        // 檢查目標是否存活
        if (!isPlayerAlive(target)) {
            return {
                success: false,
                message: `${target.displayName} 已經死亡，無法選擇`,
            };
        }

        // 狼人不能殺自己的隊友
        if (target.role === RoleType.WEREWOLF) {
            return {
                success: false,
                message: '不能殺害同為狼人的玩家',
            };
        }

        // 執行殺人
        return {
            success: true,
            message: `狼人選擇了 ${target.displayName} 作為今晚的目標`,
            data: {
                targetId: target.id,
                actionType: 'WEREWOLF_KILL',
            },
        };
    }

    /**
     * 取得狼人可選擇的目標（所有存活的非狼人玩家）
     */
    getValidTargets(actor: Player, state: IGameStateReader): Player[] {
        return state.getAlivePlayers().filter(
            (p) => p.role !== RoleType.WEREWOLF
        );
    }

    /**
     * 取得所有狼人隊友
     */
    getWerewolfTeammates(state: IGameStateReader): Player[] {
        return state.getAlivePlayers().filter(
            (p) => p.role === RoleType.WEREWOLF
        );
    }
}

/** 狼人角色實例（單例）*/
export const werewolfRole = new Werewolf();
