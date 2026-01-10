/**
 * 遊戲狀態 Store
 * @module stores/gameStore
 */

import { create } from 'zustand';
import { GameEngine } from '@/core/engine/GameEngine';
import { GameState } from '@/core/state/GameState';
import { GamePhase, GameConfig, GameResult, DEFAULT_GAME_CONFIG } from '@/core/types/game';
import { Player, NpcCharacter, isPlayerAlive } from '@/core/types/player';
import { Action, ActionType, createAction, SpeechAction } from '@/core/types/action';
import { GameEvent } from '@/core/types/event';
import { RoleType } from '@/core/types/role';

/** 遊戲畫面 */
export type GameScreen = 'start' | 'lobby' | 'game' | 'result';

/** 遊戲狀態介面 */
interface GameStoreState {
    /** 遊戲引擎實例 */
    engine: GameEngine | null;
    /** 當前畫面 */
    currentScreen: GameScreen;
    /** 是否載入中 */
    isLoading: boolean;
    /** 錯誤訊息 */
    error: string | null;
    /** NPC 角色列表 */
    npcCharacters: NpcCharacter[];
    /** 遊戲結果 */
    gameResult: GameResult | null;
    /** 對話記錄 */
    chatLog: { id: string; speaker: string; content: string; timestamp: number }[];
}

/** 遊戲動作介面 */
interface GameStoreActions {
    // 初始化
    initializeEngine: () => void;
    setNpcCharacters: (characters: NpcCharacter[]) => void;

    // 畫面控制
    setCurrentScreen: (screen: GameScreen) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // 遊戲流程
    startGame: (config?: GameConfig, humanPlayerId?: string) => void;
    nextPhase: () => void;

    // 動作執行
    executePlayerAction: (type: ActionType, targetId?: string, content?: string) => void;

    // 狀態讀取
    getState: () => GameState | null;
    getPhase: () => GamePhase | null;
    getPlayers: () => Player[];
    getAlivePlayers: () => Player[];
    getHumanPlayer: () => Player | null;
    getCurrentRound: () => number;
    getHistoryForHuman: () => GameEvent[];
    getFullHistory: () => GameEvent[];
    getValidTargets: () => Player[];

    // 對話
    addChatMessage: (speaker: string, content: string) => void;
    clearChatLog: () => void;

    // 遊戲結束
    checkAndHandleGameEnd: () => boolean;
    endGame: () => void;
    resetGame: () => void;
}

/**
 * 遊戲 Store
 */
export const useGameStore = create<GameStoreState & GameStoreActions>()((set, get) => ({
    // 初始狀態
    engine: null,
    currentScreen: 'start',
    isLoading: false,
    error: null,
    npcCharacters: [],
    gameResult: null,
    chatLog: [],

    // ======== 初始化 ========

    initializeEngine: () => {
        const engine = new GameEngine();
        set({ engine });
    },

    setNpcCharacters: (characters) => {
        set({ npcCharacters: characters });
    },

    // ======== 畫面控制 ========

    setCurrentScreen: (screen) => set({ currentScreen: screen }),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    // ======== 遊戲流程 ========

    startGame: (config = DEFAULT_GAME_CONFIG, humanPlayerId = 'human_player') => {
        const { engine, npcCharacters } = get();
        if (!engine) {
            set({ error: '遊戲引擎未初始化' });
            return;
        }

        try {
            engine.initialize(config, humanPlayerId, npcCharacters);
            set({
                currentScreen: 'game',
                error: null,
                gameResult: null,
                chatLog: [],
            });
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    nextPhase: () => {
        const { engine } = get();
        if (!engine) return;

        const result = engine.nextPhase();

        // 每次階段變更後檢查遊戲是否結束
        get().checkAndHandleGameEnd();
    },

    // ======== 動作執行 ========

    executePlayerAction: (type, targetId, content) => {
        const { engine } = get();
        if (!engine) return;

        const humanPlayer = engine.getState().getHumanPlayer();
        if (!humanPlayer) return;

        const round = engine.getCurrentRound();

        let action: Action;
        if (type === ActionType.SPEECH) {
            action = createAction<SpeechAction>(
                ActionType.SPEECH,
                humanPlayer.id,
                round,
                { content: content || '' }
            );
        } else {
            action = createAction(type, humanPlayer.id, round, { targetId });
        }

        const result = engine.executeAction(action);

        if (result.success && type === ActionType.SPEECH) {
            get().addChatMessage(humanPlayer.displayName, content || '');
        }

        if (!result.success) {
            set({ error: result.message });
        }
    },

    // ======== 狀態讀取 ========

    getState: () => {
        const { engine } = get();
        return engine?.getState() || null;
    },

    getPhase: () => {
        const { engine } = get();
        return engine?.getState().getPhase() || null;
    },

    getPlayers: () => {
        const { engine } = get();
        return engine?.getPlayers() || [];
    },

    getAlivePlayers: () => {
        const { engine } = get();
        return engine?.getAlivePlayers() || [];
    },

    getHumanPlayer: () => {
        const { engine } = get();
        return engine?.getState().getHumanPlayer() || null;
    },

    getCurrentRound: () => {
        const { engine } = get();
        return engine?.getCurrentRound() || 0;
    },

    getHistoryForHuman: () => {
        const { engine } = get();
        if (!engine) return [];
        const humanPlayer = engine.getState().getHumanPlayer();
        if (!humanPlayer) return [];
        return engine.getHistoryForPlayer(humanPlayer.id);
    },

    getFullHistory: () => {
        const { engine } = get();
        return engine?.getFullHistory() || [];
    },

    getValidTargets: () => {
        const { engine } = get();
        return engine?.getValidTargetsForHuman() || [];
    },

    // ======== 對話 ========

    addChatMessage: (speaker, content) => {
        set((state) => ({
            chatLog: [
                ...state.chatLog,
                {
                    id: `msg_${Date.now()}`,
                    speaker,
                    content,
                    timestamp: Date.now(),
                },
            ],
        }));
    },

    clearChatLog: () => set({ chatLog: [] }),

    // ======== 遊戲結束 ========

    checkAndHandleGameEnd: () => {
        const { engine } = get();
        if (!engine) return false;

        const result = engine.checkGameEnd();
        if (result) {
            set({
                gameResult: result,
                currentScreen: 'result',
            });
            return true;
        }
        return false;
    },

    endGame: () => {
        const { engine } = get();
        if (engine) {
            const result = engine.checkGameEnd();
            set({
                gameResult: result,
                currentScreen: 'result',
            });
        }
    },

    resetGame: () => {
        set({
            engine: null,
            currentScreen: 'start',
            isLoading: false,
            error: null,
            npcCharacters: [],
            gameResult: null,
            chatLog: [],
        });
    },
}));
