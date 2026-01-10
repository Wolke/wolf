/**
 * 設定狀態 Store
 * @module stores/settingsStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 設定狀態介面 */
interface SettingsState {
    /** GAS Web App URL */
    gasWebAppUrl: string;
    /** OpenAI API Key（從 GAS 取得後暫存）*/
    openaiApiKey: string;
    /** 玩家名稱 */
    playerName: string;
    /** 是否啟用 AI */
    enableAI: boolean;
    /** 是否已初始化 */
    isInitialized: boolean;
}

/** 設定動作介面 */
interface SettingsActions {
    setGasWebAppUrl: (url: string) => void;
    setOpenaiApiKey: (key: string) => void;
    setPlayerName: (name: string) => void;
    setEnableAI: (enable: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    reset: () => void;
}

/** 初始狀態 */
const initialState: SettingsState = {
    gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbzu-DNKTtGJUnSRBB7-_pcyQZMztIdagy3wfg-JOoN-tm-vFm6Pb06NggX-A-puJ6rNsA/exec',
    openaiApiKey: '',
    playerName: '',
    enableAI: true,
    isInitialized: false,
};

/**
 * 設定 Store
 */
export const useSettingsStore = create<SettingsState & SettingsActions>()(
    persist(
        (set) => ({
            ...initialState,

            setGasWebAppUrl: (url) => set({ gasWebAppUrl: url }),
            setOpenaiApiKey: (key) => set({ openaiApiKey: key }),
            setPlayerName: (name) => set({ playerName: name }),
            setEnableAI: (enable) => set({ enableAI: enable }),
            setInitialized: (initialized) => set({ isInitialized: initialized }),

            reset: () => set(initialState),
        }),
        {
            name: 'werewolf-settings',
            partialize: (state) => ({
                gasWebAppUrl: state.gasWebAppUrl,
                playerName: state.playerName,
                enableAI: state.enableAI,
            }),
        }
    )
);
