/**
 * 設定狀態 Store
 * @module stores/settingsStore
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PlayMode } from '@/core/types/gameMode';

/** 可用的 OpenAI 模型 */
export const AVAILABLE_MODELS = [
    // GPT-4.1 系列（2025 最新）
    { id: 'gpt-4.1', name: 'GPT-4.1（最新通用模型）' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini（平衡）' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano（最快）' },
    // GPT-4o 系列
    { id: 'gpt-4o', name: 'GPT-4o（多模態）' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini（推薦）' },
    // o 系列（推理模型）
    { id: 'o3', name: 'o3（強推理）' },
    { id: 'o4-mini', name: 'o4-mini（高效推理）' },
    // 舊模型
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo（舊版）' },
] as const;

export type OpenAIModel = typeof AVAILABLE_MODELS[number]['id'];

/** 設定狀態介面 */
interface SettingsState {
    /** GAS Web App URL */
    gasWebAppUrl: string;
    /** OpenAI API Key（從 GAS 取得後暫存）*/
    openaiApiKey: string;
    /** OpenAI 模型 */
    openaiModel: OpenAIModel;
    /** 玩家名稱 */
    playerName: string;
    /** 是否啟用 AI */
    enableAI: boolean;
    /** 遊玩模式 */
    playMode: PlayMode;
    /** 是否在 UI 上顯示 debug 訊息 */
    showDebugInUI: boolean;
    /** 是否已初始化 */
    isInitialized: boolean;
}

/** 設定動作介面 */
interface SettingsActions {
    setGasWebAppUrl: (url: string) => void;
    setOpenaiApiKey: (key: string) => void;
    setOpenaiModel: (model: OpenAIModel) => void;
    setPlayerName: (name: string) => void;
    setEnableAI: (enable: boolean) => void;
    setPlayMode: (mode: PlayMode) => void;
    setShowDebugInUI: (show: boolean) => void;
    setInitialized: (initialized: boolean) => void;
    reset: () => void;
}

/** 初始狀態 */
const initialState: SettingsState = {
    gasWebAppUrl: 'https://script.google.com/macros/s/AKfycbzu-DNKTtGJUnSRBB7-_pcyQZMztIdagy3wfg-JOoN-tm-vFm6Pb06NggX-A-puJ6rNsA/exec',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
    playerName: '',
    enableAI: true,
    playMode: PlayMode.PLAYER,
    showDebugInUI: false,
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
            setOpenaiModel: (model) => set({ openaiModel: model }),
            setPlayerName: (name) => set({ playerName: name }),
            setEnableAI: (enable) => set({ enableAI: enable }),
            setPlayMode: (mode) => set({ playMode: mode }),
            setShowDebugInUI: (show) => set({ showDebugInUI: show }),
            setInitialized: (initialized) => set({ isInitialized: initialized }),

            reset: () => set(initialState),
        }),
        {
            name: 'werewolf-settings',
            partialize: (state) => ({
                gasWebAppUrl: state.gasWebAppUrl,
                playerName: state.playerName,
                enableAI: state.enableAI,
                playMode: state.playMode,
                showDebugInUI: state.showDebugInUI,
                openaiModel: state.openaiModel,
            }),
        }
    )
);
