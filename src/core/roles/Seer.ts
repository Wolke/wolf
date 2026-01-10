/**
 * 預言家角色
 * @module core/roles/Seer
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility, ROLE_TEAM_MAP } from '../types/role';
import { Player, isPlayerAlive } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 預言家角色類別
 * - 每個夜晚可以查驗一名玩家的身份
 * - 村民陣營
 */
export class Seer extends BaseRole {
    readonly type = RoleType.SEER;
    readonly team = Team.VILLAGER;
    readonly displayName = '預言家';
    readonly description = '每個夜晚，預言家可以查驗一名玩家，得知他是好人還是狼人。';
    readonly canActAtNight = true;

    readonly abilities: RoleAbility[] = [
        {
            name: '查驗',
            description: '夜晚選擇一名玩家，查看他的身份',
            isNightAction: true,
            requiresTarget: true,
        },
    ];

    /**
     * 執行查驗行動
     */
    executeNightAction(
        actor: Player,
        target: Player,
        _state: IGameStateReader
    ): ActionResult {
        // 檢查目標是否存活
        if (!isPlayerAlive(target)) {
            return {
                success: false,
                message: `${target.displayName} 已經死亡，無法查驗`,
            };
        }

        // 不能查驗自己
        if (target.id === actor.id) {
            return {
                success: false,
                message: '不能查驗自己',
            };
        }

        // 判斷目標是否為狼人
        const isWerewolf = target.role === RoleType.WEREWOLF;
        const team = ROLE_TEAM_MAP[target.role];

        return {
            success: true,
            message: `你查驗了 ${target.displayName}，他是【${isWerewolf ? '狼人' : '好人'}】`,
            data: {
                targetId: target.id,
                targetName: target.displayName,
                isWerewolf,
                team,
                actionType: 'SEER_CHECK',
            },
        };
    }

    /**
     * 取得預言家可查驗的目標（所有存活的其他玩家）
     */
    getValidTargets(actor: Player, state: IGameStateReader): Player[] {
        return state.getAlivePlayers().filter((p) => p.id !== actor.id);
    }
}

/** 預言家角色實例（單例）*/
export const seerRole = new Seer();
