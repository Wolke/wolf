/**
 * 角色基底類別
 * @module core/roles/BaseRole
 */

import { RoleType, Team, RoleInfo, RoleAbility } from '../types/role';
import { Player } from '../types/player';
import { ActionResult } from '../types/action';

/** 遊戲狀態介面（避免循環依賴）*/
export interface IGameStateReader {
    getPlayers(): Player[];
    getAlivePlayers(): Player[];
    getCurrentRound(): number;
}

/**
 * 角色基底抽象類別
 * 所有角色都必須繼承此類別
 */
export abstract class BaseRole {
    /** 角色類型 */
    abstract readonly type: RoleType;

    /** 所屬陣營 */
    abstract readonly team: Team;

    /** 角色顯示名稱 */
    abstract readonly displayName: string;

    /** 角色描述 */
    abstract readonly description: string;

    /** 是否有夜晚行動能力 */
    abstract readonly canActAtNight: boolean;

    /** 角色能力列表 */
    abstract readonly abilities: RoleAbility[];

    /**
     * 執行夜晚行動
     * @param actor - 執行者
     * @param target - 目標玩家
     * @param state - 遊戲狀態讀取器
     * @returns 行動結果
     */
    abstract executeNightAction(
        actor: Player,
        target: Player,
        state: IGameStateReader
    ): ActionResult;

    /**
     * 取得可選擇的夜晚行動目標
     * @param actor - 執行者
     * @param state - 遊戲狀態讀取器
     * @returns 可選擇的玩家列表
     */
    abstract getValidTargets(
        actor: Player,
        state: IGameStateReader
    ): Player[];

    /**
     * 取得角色完整資訊
     */
    getRoleInfo(): RoleInfo {
        return {
            type: this.type,
            displayName: this.displayName,
            team: this.team,
            description: this.description,
            abilities: this.abilities,
        };
    }

    /**
     * 檢查玩家是否屬於此角色
     */
    isRole(player: Player): boolean {
        return player.role === this.type;
    }
}
