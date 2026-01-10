/**
 * 角色模組統一導出
 * @module core/roles
 */

import { RoleType } from '../types/role';
import { BaseRole } from './BaseRole';
import { Werewolf, werewolfRole } from './Werewolf';
import { Villager, villagerRole } from './Villager';
import { Seer, seerRole } from './Seer';

// 導出類別
export { BaseRole } from './BaseRole';
export { Werewolf, werewolfRole } from './Werewolf';
export { Villager, villagerRole } from './Villager';
export { Seer, seerRole } from './Seer';

/** 角色類型到角色實例的映射 */
export const ROLE_INSTANCES: Record<RoleType, BaseRole> = {
    [RoleType.WEREWOLF]: werewolfRole,
    [RoleType.VILLAGER]: villagerRole,
    [RoleType.SEER]: seerRole,
};

/**
 * 根據角色類型取得角色實例
 */
export function getRoleInstance(roleType: RoleType): BaseRole {
    return ROLE_INSTANCES[roleType];
}

/**
 * 取得所有角色實例
 */
export function getAllRoles(): BaseRole[] {
    return Object.values(ROLE_INSTANCES);
}
