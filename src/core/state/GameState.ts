/**
 * 遊戲狀態容器
 * @module core/state/GameState
 */

import { GamePhase, GameConfig, DEFAULT_GAME_CONFIG } from '../types/game';
import { Player, PlayerStatus, isPlayerAlive } from '../types/player';
import { RoleType, Team, ROLE_TEAM_MAP } from '../types/role';
import { VoteAction, NightAction } from '../types/action';

/** 夜晚行動收集 */
export interface NightActions {
    /** 狼人選擇的目標 */
    werewolfTarget: string | null;
    /** 狼人投票記錄 */
    werewolfVotes: Map<string, string>;
    /** 預言家查驗目標 */
    seerTarget: string | null;
    /** 預言家查驗結果 */
    seerResult: { targetId: string; isWerewolf: boolean } | null;
}

/** 遊戲狀態 */
export interface GameStateData {
    /** 遊戲配置 */
    config: GameConfig;
    /** 當前階段 */
    phase: GamePhase;
    /** 當前回合 */
    round: number;
    /** 玩家列表 */
    players: Player[];
    /** 當前投票記錄 */
    votes: Map<string, string | null>;
    /** 夜晚行動記錄 */
    nightActions: NightActions;
    /** 遊戲開始時間 */
    startedAt: number;
    /** 上一次死亡的玩家（用於公告）*/
    lastDeaths: string[];
}

/**
 * 遊戲狀態類別
 */
export class GameState {
    private data: GameStateData;

    constructor(config: GameConfig = DEFAULT_GAME_CONFIG) {
        this.data = {
            config,
            phase: GamePhase.INIT,
            round: 0,
            players: [],
            votes: new Map(),
            nightActions: this.createEmptyNightActions(),
            startedAt: Date.now(),
            lastDeaths: [],
        };
    }

    /** 創建空的夜晚行動記錄 */
    private createEmptyNightActions(): NightActions {
        return {
            werewolfTarget: null,
            werewolfVotes: new Map(),
            seerTarget: null,
            seerResult: null,
        };
    }

    // ======== Getters ========

    getConfig(): GameConfig {
        return this.data.config;
    }

    getPhase(): GamePhase {
        return this.data.phase;
    }

    getRound(): number {
        return this.data.round;
    }

    getCurrentRound(): number {
        return this.data.round;
    }

    getPlayers(): Player[] {
        return [...this.data.players];
    }

    getAlivePlayers(): Player[] {
        return this.data.players.filter(isPlayerAlive);
    }

    getPlayer(playerId: string): Player | undefined {
        return this.data.players.find((p) => p.id === playerId);
    }

    getPlayersByRole(role: RoleType): Player[] {
        return this.data.players.filter((p) => p.role === role);
    }

    getPlayersByTeam(team: Team): Player[] {
        return this.data.players.filter((p) => ROLE_TEAM_MAP[p.role] === team);
    }

    getAlivePlayersByTeam(team: Team): Player[] {
        return this.getAlivePlayers().filter((p) => ROLE_TEAM_MAP[p.role] === team);
    }

    getHumanPlayer(): Player | undefined {
        return this.data.players.find((p) => p.isHuman);
    }

    getNpcPlayers(): Player[] {
        return this.data.players.filter((p) => !p.isHuman);
    }

    getAliveNpcPlayers(): Player[] {
        return this.getAlivePlayers().filter((p) => !p.isHuman);
    }

    getVotes(): Map<string, string | null> {
        return new Map(this.data.votes);
    }

    getNightActions(): NightActions {
        return { ...this.data.nightActions };
    }

    getLastDeaths(): string[] {
        return [...this.data.lastDeaths];
    }

    // ======== Setters ========

    setPhase(phase: GamePhase): void {
        this.data.phase = phase;
    }

    setRound(round: number): void {
        this.data.round = round;
    }

    incrementRound(): void {
        this.data.round += 1;
    }

    setPlayers(players: Player[]): void {
        this.data.players = players;
    }

    updatePlayer(playerId: string, updates: Partial<Player>): void {
        const index = this.data.players.findIndex((p) => p.id === playerId);
        if (index !== -1) {
            this.data.players[index] = {
                ...this.data.players[index],
                ...updates,
            };
        }
    }

    killPlayer(playerId: string, status: PlayerStatus): void {
        this.updatePlayer(playerId, { status });
        this.data.lastDeaths.push(playerId);
    }

    // ======== Vote Management ========

    castVote(voterId: string, targetId: string | null): void {
        this.data.votes.set(voterId, targetId);
    }

    clearVotes(): void {
        this.data.votes.clear();
    }

    getVoteCount(): Map<string, number> {
        const counts = new Map<string, number>();
        for (const targetId of this.data.votes.values()) {
            if (targetId) {
                counts.set(targetId, (counts.get(targetId) || 0) + 1);
            }
        }
        return counts;
    }

    // ======== Night Action Management ========

    setWerewolfVote(werewolfId: string, targetId: string): void {
        this.data.nightActions.werewolfVotes.set(werewolfId, targetId);
    }

    setWerewolfTarget(targetId: string | null): void {
        this.data.nightActions.werewolfTarget = targetId;
    }

    setSeerAction(targetId: string, isWerewolf: boolean): void {
        this.data.nightActions.seerTarget = targetId;
        this.data.nightActions.seerResult = { targetId, isWerewolf };
    }

    resetNightActions(): void {
        this.data.nightActions = this.createEmptyNightActions();
    }

    clearLastDeaths(): void {
        this.data.lastDeaths = [];
    }

    // ======== Serialization ========

    toJSON(): string {
        return JSON.stringify({
            ...this.data,
            votes: Array.from(this.data.votes.entries()),
            nightActions: {
                ...this.data.nightActions,
                werewolfVotes: Array.from(this.data.nightActions.werewolfVotes.entries()),
            },
        });
    }

    static fromJSON(json: string): GameState {
        const data = JSON.parse(json);
        const state = new GameState(data.config);
        state.data = {
            ...data,
            votes: new Map(data.votes),
            nightActions: {
                ...data.nightActions,
                werewolfVotes: new Map(data.nightActions.werewolfVotes),
            },
        };
        return state;
    }
}
