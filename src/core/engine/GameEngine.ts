/**
 * 遊戲主引擎
 * @module core/engine/GameEngine
 */

import { GameConfig, GamePhase, GameResult, DEFAULT_GAME_CONFIG } from '../types/game';
import { Player, PlayerStatus, NpcCharacter, isPlayerAlive } from '../types/player';
import { RoleType, Team, ROLE_TEAM_MAP } from '../types/role';
import { Action, ActionType, ActionResult, SpeechAction, createAction } from '../types/action';
import {
    GameEvent,
    EventType,
    createEvent,
    PUBLIC_VISIBILITY,
    createPrivateVisibility,
    createTeamVisibility,
} from '../types/event';
import { GameState } from '../state/GameState';
import { HistoryManager } from '../state/HistoryManager';
import { PhaseManager, PhaseTransitionResult } from './PhaseManager';
import { VoteManager, VoteResult } from './VoteManager';
import { ActionResolver, NightResolutionResult } from './ActionResolver';
import { WinConditionChecker } from './WinCondition';
import { distributeRoles, generateDefaultNpcCharacters, validateGameConfig } from '../utils/roleDistribution';
import { IGameStateReader } from '../roles/BaseRole';

/** 遊戲引擎介面 */
export interface IGameEngine extends IGameStateReader {
    initialize(config: GameConfig, humanPlayerId: string, npcCharacters?: NpcCharacter[]): void;
    getState(): GameState;
    getHistoryForPlayer(playerId: string): GameEvent[];
    getFullHistory(): GameEvent[];
    executeAction(action: Action): ActionResult;
    nextPhase(): PhaseTransitionResult;
    checkGameEnd(): GameResult | null;
}

/**
 * 遊戲主引擎
 */
export class GameEngine implements IGameEngine {
    private state: GameState;
    private history: HistoryManager;
    private phaseManager: PhaseManager;
    private voteManager: VoteManager;
    private actionResolver: ActionResolver;
    private winChecker: WinConditionChecker;

    constructor() {
        this.state = new GameState();
        this.history = new HistoryManager();
        this.phaseManager = new PhaseManager();
        this.voteManager = new VoteManager();
        this.actionResolver = new ActionResolver();
        this.winChecker = new WinConditionChecker();
    }

    // ======== IGameStateReader 實作 ========

    getPlayers(): Player[] {
        return this.state.getPlayers();
    }

    getAlivePlayers(): Player[] {
        return this.state.getAlivePlayers();
    }

    getCurrentRound(): number {
        return this.state.getCurrentRound();
    }

    // ======== 初始化 ========

    /**
     * 初始化遊戲
     * @param forcedHumanRole - 強制指定人類玩家的角色（測試用）
     */
    initialize(
        config: GameConfig = DEFAULT_GAME_CONFIG,
        humanPlayerId: string = 'human_player',
        npcCharacters?: NpcCharacter[],
        forcedHumanRole?: RoleType
    ): void {
        // 驗證配置
        const validation = validateGameConfig(config);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // 初始化狀態
        this.state = new GameState(config);
        this.history = new HistoryManager();

        // 生成 NPC 角色（如未提供則使用預設）
        const characters = npcCharacters || generateDefaultNpcCharacters(config.playerCount - 1);

        // 分配角色
        const players = distributeRoles(config.playerCount, config, humanPlayerId, characters, forcedHumanRole);
        this.state.setPlayers(players);

        // 記錄遊戲開始事件
        this.history.addEvent(
            createEvent({
                type: EventType.GAME_START,
                phase: GamePhase.INIT,
                round: 0,
                data: {
                    playerCount: config.playerCount,
                    players: players.map((p) => ({
                        id: p.id,
                        name: p.displayName,
                        seatNumber: p.seatNumber,
                    })),
                },
                visibility: PUBLIC_VISIBILITY,
            })
        );

        // 向狼人公開隊友身份
        const werewolves = players.filter((p) => p.role === RoleType.WEREWOLF);
        if (werewolves.length > 1) {
            this.history.addEvent(
                createEvent({
                    type: EventType.WEREWOLF_CHAT,
                    phase: GamePhase.INIT,
                    round: 0,
                    data: {
                        message: '狼人隊友',
                        teammates: werewolves.map((w) => ({
                            id: w.id,
                            name: w.displayName,
                        })),
                    },
                    visibility: createTeamVisibility([Team.WEREWOLF]),
                })
            );
        }
    }

    // ======== 狀態存取 ========

    getState(): GameState {
        return this.state;
    }

    getHistoryManager(): HistoryManager {
        return this.history;
    }

    getHistoryForPlayer(playerId: string): GameEvent[] {
        const player = this.state.getPlayer(playerId);
        if (!player) return [];
        return this.history.getEventsForPlayer(player);
    }

    getFullHistory(): GameEvent[] {
        return this.history.getAllEvents();
    }

    /**
     * 取得玩家視角的遊戲摘要（適合傳給 AI）
     */
    getGameSummaryForPlayer(playerId: string): string {
        const player = this.state.getPlayer(playerId);
        if (!player) return '';
        return this.history.generateSummaryForPlayer(player);
    }

    // ======== 遊戲流程 ========

    /**
     * 進入下一階段
     */
    nextPhase(): PhaseTransitionResult {
        const result = this.phaseManager.transitionToNextPhase(this.state);

        // 記錄階段變更事件
        this.history.addEvent(
            createEvent({
                type: EventType.PHASE_CHANGE,
                phase: result.newPhase,
                round: this.state.getRound(),
                data: { phase: result.newPhase, message: result.message },
                visibility: PUBLIC_VISIBILITY,
            })
        );

        // 如果是白天開始，結算夜晚結果
        if (result.newPhase === GamePhase.DAY_START) {
            this.resolveNightAndAnnounce();
        }

        return result;
    }

    /**
     * 結算夜晚並公告結果
     */
    private resolveNightAndAnnounce(): void {
        const resolution = this.actionResolver.resolveNight(this.state);

        // 記錄夜晚結果（公開）
        this.history.addEvent(
            createEvent({
                type: EventType.NIGHT_RESULT,
                phase: GamePhase.DAY_START,
                round: this.state.getRound(),
                data: {
                    deaths: resolution.deaths,
                    message: resolution.message,
                },
                visibility: PUBLIC_VISIBILITY,
            })
        );

        // 記錄死亡事件
        for (const deathId of resolution.deaths) {
            const deadPlayer = this.state.getPlayer(deathId);
            if (deadPlayer) {
                this.history.addEvent(
                    createEvent({
                        type: EventType.PLAYER_DEATH,
                        phase: GamePhase.DAY_START,
                        round: this.state.getRound(),
                        data: {
                            playerId: deathId,
                            playerName: deadPlayer.displayName,
                            cause: 'WEREWOLF_KILL',
                        },
                        visibility: PUBLIC_VISIBILITY,
                    })
                );
            }
        }
    }

    // ======== 動作執行 ========

    /**
     * 執行動作
     */
    executeAction(action: Action): ActionResult {
        switch (action.type) {
            case ActionType.WEREWOLF_KILL:
                return this.handleWerewolfKill(action);

            case ActionType.SEER_CHECK:
                return this.handleSeerCheck(action);

            case ActionType.VOTE:
                return this.handleVote(action);

            case ActionType.SPEECH:
                return this.handleSpeech(action as SpeechAction);

            default:
                return { success: false, message: '未知的動作類型' };
        }
    }

    private handleWerewolfKill(action: Action): ActionResult {
        if (!action.targetId) {
            return { success: false, message: '必須選擇目標' };
        }

        const result = this.actionResolver.handleWerewolfAction(
            this.state,
            action.playerId,
            action.targetId
        );

        if (result.success) {
            // 檢查是否所有狼人都已投票
            const finalTarget = this.actionResolver.finalizeWerewolfTarget(this.state);

            // 記錄狼人行動（僅狼人可見）
            this.history.addEvent(
                createEvent({
                    type: EventType.WEREWOLF_KILL,
                    phase: this.state.getPhase(),
                    round: this.state.getRound(),
                    data: {
                        werewolfId: action.playerId,
                        targetId: action.targetId,
                        targetName: result.data?.targetName,
                        finalTarget,
                    },
                    visibility: createTeamVisibility([Team.WEREWOLF]),
                })
            );
        }

        return result;
    }

    private handleSeerCheck(action: Action): ActionResult {
        if (!action.targetId) {
            return { success: false, message: '必須選擇目標' };
        }

        const result = this.actionResolver.handleSeerAction(
            this.state,
            action.playerId,
            action.targetId
        );

        if (result.success) {
            // 記錄預言家查驗（僅預言家可見）
            this.history.addEvent(
                createEvent({
                    type: EventType.SEER_CHECK,
                    phase: this.state.getPhase(),
                    round: this.state.getRound(),
                    data: {
                        seerId: action.playerId,
                        targetId: action.targetId,
                        targetName: result.data?.targetName,
                        isWerewolf: result.data?.isWerewolf,
                    },
                    visibility: createPrivateVisibility([action.playerId]),
                })
            );
        }

        return result;
    }

    private handleVote(action: Action): ActionResult {
        const success = this.voteManager.castVote(
            this.state,
            action.playerId,
            action.targetId || null
        );

        if (!success) {
            return { success: false, message: '投票失敗' };
        }

        const voter = this.state.getPlayer(action.playerId);
        const target = action.targetId ? this.state.getPlayer(action.targetId) : null;

        // 記錄投票事件（公開）
        this.history.addEvent(
            createEvent({
                type: EventType.VOTE_CAST,
                phase: this.state.getPhase(),
                round: this.state.getRound(),
                data: {
                    voterId: action.playerId,
                    voterName: voter?.displayName,
                    targetId: action.targetId,
                    targetName: target?.displayName || '棄票',
                },
                visibility: PUBLIC_VISIBILITY,
            })
        );

        return {
            success: true,
            message: `${voter?.displayName} 投票給 ${target?.displayName || '棄票'}`,
        };
    }

    private handleSpeech(action: SpeechAction): ActionResult {
        const speaker = this.state.getPlayer(action.playerId);
        if (!speaker) {
            return { success: false, message: '玩家不存在' };
        }

        // 記錄發言事件（公開）
        this.history.addEvent(
            createEvent({
                type: EventType.PUBLIC_SPEECH,
                phase: this.state.getPhase(),
                round: this.state.getRound(),
                data: {
                    speakerId: action.playerId,
                    speakerName: speaker.displayName,
                    content: action.content,
                },
                visibility: PUBLIC_VISIBILITY,
            })
        );

        return {
            success: true,
            message: `${speaker.displayName} 發言完畢`,
        };
    }

    // ======== 投票結算 ========

    /**
     * 檢查是否所有人都已投票
     */
    hasAllPlayersVoted(): boolean {
        return this.voteManager.hasAllPlayersVoted(this.state);
    }

    /**
     * 結算投票
     */
    resolveVote(): VoteResult {
        const result = this.voteManager.calculateResult(this.state);

        // 記錄投票結果
        this.history.addEvent(
            createEvent({
                type: EventType.VOTE_RESULT,
                phase: this.state.getPhase(),
                round: this.state.getRound(),
                data: {
                    hasElimination: result.hasElimination,
                    eliminatedId: result.eliminatedPlayerId,
                    eliminatedName: result.eliminatedPlayerName,
                    isTie: result.isTie,
                    voteCounts: Array.from(result.voteCounts.entries()),
                },
                visibility: PUBLIC_VISIBILITY,
            })
        );

        // 執行處決
        this.voteManager.executeVoteResult(this.state, result);

        // 如果有人被處決，記錄死亡事件
        if (result.hasElimination && result.eliminatedPlayerId) {
            const deadPlayer = this.state.getPlayer(result.eliminatedPlayerId);
            if (deadPlayer) {
                this.history.addEvent(
                    createEvent({
                        type: EventType.PLAYER_DEATH,
                        phase: this.state.getPhase(),
                        round: this.state.getRound(),
                        data: {
                            playerId: result.eliminatedPlayerId,
                            playerName: deadPlayer.displayName,
                            cause: 'EXECUTED',
                        },
                        visibility: PUBLIC_VISIBILITY,
                    })
                );
            }
        }

        return result;
    }

    // ======== 勝負判定 ========

    /**
     * 檢查遊戲是否結束
     */
    checkGameEnd(): GameResult | null {
        const result = this.winChecker.checkGameEnd(this.state);

        if (result) {
            this.state.setPhase(GamePhase.GAME_END);
            this.history.setGameEnded(true);

            // 記錄遊戲結束事件
            this.history.addEvent(
                createEvent({
                    type: EventType.GAME_END,
                    phase: GamePhase.GAME_END,
                    round: this.state.getRound(),
                    data: {
                        winner: result.winner,
                        totalRounds: result.totalRounds,
                        summary: result.summary,
                        survivors: result.survivors,
                        deceased: result.deceased,
                    },
                    visibility: PUBLIC_VISIBILITY,
                })
            );
        }

        return result;
    }

    // ======== 討論記錄取得 ========

    /**
     * 取得目前討論的發言記錄（用於發言時的脈絡）
     * @param currentSpeakerIndex - 目前發言者的順序（從 0 開始）
     */
    getDiscussionContext(currentSpeakerIndex: number): string[] {
        return this.history.getDiscussionContext(currentSpeakerIndex);
    }

    /**
     * 取得完整的討論記錄（用於投票決策）
     */
    getFullDiscussionForVoting(): string {
        return this.history.getFullDiscussionForVoting();
    }

    /**
     * 取得夜晚結果訊息
     */
    getNightResultMessage(): string {
        return this.history.getCurrentRoundSummary(this.state.getRound());
    }

    // ======== 輔助方法 ========

    /**
     * 取得當前階段需要行動的角色
     */
    getActiveRoleForCurrentPhase(): RoleType | null {
        return this.phaseManager.getActiveRoleForPhase(this.state.getPhase());
    }

    /**
     * 取得需要行動的玩家列表
     */
    getPlayersNeedingAction(): Player[] {
        const phase = this.state.getPhase();
        const alivePlayers = this.state.getAlivePlayers();

        switch (phase) {
            case GamePhase.WEREWOLF_TURN:
                return alivePlayers.filter((p) => p.role === RoleType.WEREWOLF);

            case GamePhase.SEER_TURN:
                return alivePlayers.filter((p) => p.role === RoleType.SEER);

            case GamePhase.DISCUSSION:
            case GamePhase.VOTE:
                return alivePlayers;

            default:
                return [];
        }
    }

    /**
     * 取得人類玩家的有效目標
     */
    getValidTargetsForHuman(): Player[] {
        const humanPlayer = this.state.getHumanPlayer();
        if (!humanPlayer) return [];

        const phase = this.state.getPhase();
        const alivePlayers = this.state.getAlivePlayers();

        switch (phase) {
            case GamePhase.WEREWOLF_TURN:
                if (humanPlayer.role !== RoleType.WEREWOLF) return [];
                return alivePlayers.filter((p) => p.role !== RoleType.WEREWOLF);

            case GamePhase.SEER_TURN:
                if (humanPlayer.role !== RoleType.SEER) return [];
                return alivePlayers.filter((p) => p.id !== humanPlayer.id);

            case GamePhase.VOTE:
                return alivePlayers.filter((p) => p.id !== humanPlayer.id);

            default:
                return [];
        }
    }
}
