/**
 * 村民角色
 * @module core/roles/Villager
 */

import { BaseRole, IGameStateReader } from './BaseRole';
import { RoleType, Team, RoleAbility } from '../types/role';
import { Player } from '../types/player';
import { ActionResult } from '../types/action';

/**
 * 村民角色類別
 * - 沒有特殊能力
 * - 靠觀察和討論找出狼人
 * - 村民陣營
 */
export class Villager extends BaseRole {
    readonly type = RoleType.VILLAGER;
    readonly team = Team.VILLAGER;
    readonly displayName = '村民';
    readonly description = '普通村民，沒有特殊能力。靠著觀察和討論來找出隱藏在人群中的狼人。';
    readonly canActAtNight = false;

    readonly abilities: RoleAbility[] = [];

    /**
     * 村民沒有夜晚行動
     */
    executeNightAction(
        _actor: Player,
        _target: Player,
        _state: IGameStateReader
    ): ActionResult {
        return {
            success: false,
            message: '村民沒有夜晚行動能力',
        };
    }

    /**
     * 村民沒有可選目標
     */
    getValidTargets(_actor: Player, _state: IGameStateReader): Player[] {
        return [];
    }
}

/** 村民角色實例（單例）*/
export const villagerRole = new Villager();
