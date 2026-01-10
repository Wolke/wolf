/**
 * LocalStorage 封裝
 * @module lib/storage
 */

const STORAGE_PREFIX = 'werewolf_';

/**
 * 儲存資料到 localStorage
 */
export function saveToStorage<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;

    try {
        const serialized = JSON.stringify(data);
        localStorage.setItem(`${STORAGE_PREFIX}${key}`, serialized);
    } catch (error) {
        console.error(`儲存 ${key} 失敗:`, error);
    }
}

/**
 * 從 localStorage 讀取資料
 */
export function loadFromStorage<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;

    try {
        const serialized = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
        if (!serialized) return null;
        return JSON.parse(serialized) as T;
    } catch (error) {
        console.error(`讀取 ${key} 失敗:`, error);
        return null;
    }
}

/**
 * 從 localStorage 刪除資料
 */
export function removeFromStorage(key: string): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (error) {
        console.error(`刪除 ${key} 失敗:`, error);
    }
}

/**
 * 清空所有遊戲相關資料
 */
export function clearAllGameData(): void {
    if (typeof window === 'undefined') return;

    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
        console.error('清空資料失敗:', error);
    }
}

// 預定義的儲存鍵
export const STORAGE_KEYS = {
    SETTINGS: 'settings',
    GAME_STATE: 'game_state',
    GAME_HISTORY: 'game_history',
    PLAYER_NAME: 'player_name',
} as const;
