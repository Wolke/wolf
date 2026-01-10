/**
 * 歷史紀錄管理器（含視角過濾）
 * @module core/state/HistoryManager
 */

import { GameEvent, EventType, VisibilityRule } from '../types/event';
import { Player } from '../types/player';
import { RoleType, Team, ROLE_TEAM_MAP } from '../types/role';

/**
 * 歷史紀錄管理器
 * 負責記錄遊戲事件，並提供視角過濾功能
 */
export class HistoryManager {
    private events: GameEvent[] = [];
    private isGameEnded: boolean = false;

    /**
     * 新增事件
     */
    addEvent(event: GameEvent): void {
        this.events.push(event);
    }

    /**
     * 取得所有事件（僅遊戲結束後使用）
     */
    getAllEvents(): GameEvent[] {
        return [...this.events];
    }

    /**
     * 取得特定玩家視角的事件
     * @param player - 玩家
     * @returns 該玩家可見的事件列表
     */
    getEventsForPlayer(player: Player): GameEvent[] {
        return this.events.filter((event) =>
            this.canPlayerSeeEvent(player, event)
        );
    }

    /**
     * 檢查玩家是否可以看到特定事件
     */
    private canPlayerSeeEvent(player: Player, event: GameEvent): boolean {
        const { visibility } = event;

        // 遊戲結束後，如果事件設定為結束後公開，則所有人可見
        if (this.isGameEnded && visibility.revealOnGameEnd) {
            return true;
        }

        switch (visibility.type) {
            case 'public':
                return true;

            case 'private':
                return visibility.allowedPlayers?.includes(player.id) ?? false;

            case 'team-based':
                const playerTeam = ROLE_TEAM_MAP[player.role];
                return visibility.allowedTeams?.includes(playerTeam) ?? false;

            case 'role-based':
                return visibility.allowedRoles?.includes(player.role) ?? false;

            default:
                return false;
        }
    }

    /**
     * 設置遊戲結束狀態
     */
    setGameEnded(ended: boolean): void {
        this.isGameEnded = ended;
    }

    /**
     * 取得特定類型的事件
     */
    getEventsByType(type: EventType): GameEvent[] {
        return this.events.filter((e) => e.type === type);
    }

    /**
     * 取得特定回合的事件
     */
    getEventsByRound(round: number): GameEvent[] {
        return this.events.filter((e) => e.round === round);
    }

    /**
     * 取得特定回合、特定玩家視角的事件
     */
    getEventsForPlayerByRound(player: Player, round: number): GameEvent[] {
        return this.getEventsForPlayer(player).filter((e) => e.round === round);
    }

    /**
     * 取得最後 N 個事件（特定玩家視角）
     */
    getLastEventsForPlayer(player: Player, count: number): GameEvent[] {
        const playerEvents = this.getEventsForPlayer(player);
        return playerEvents.slice(-count);
    }

    /**
     * 清空所有事件
     */
    clear(): void {
        this.events = [];
        this.isGameEnded = false;
    }

    /**
     * 取得事件數量
     */
    getEventCount(): number {
        return this.events.length;
    }

    /**
     * 序列化
     */
    toJSON(): string {
        return JSON.stringify({
            events: this.events,
            isGameEnded: this.isGameEnded,
        });
    }

    /**
     * 反序列化
     */
    static fromJSON(json: string): HistoryManager {
        const data = JSON.parse(json);
        const manager = new HistoryManager();
        manager.events = data.events;
        manager.isGameEnded = data.isGameEnded;
        return manager;
    }

    /**
     * 生成遊戲摘要（適合傳給 AI）
     */
    generateSummaryForPlayer(player: Player): string {
        const visibleEvents = this.getEventsForPlayer(player);
        const lines: string[] = [];

        for (const event of visibleEvents) {
            const line = this.formatEventForDisplay(event);
            if (line) {
                lines.push(line);
            }
        }

        return lines.join('\n');
    }

    /**
     * 格式化事件為顯示文字
     */
    private formatEventForDisplay(event: GameEvent): string {
        const { type, data, round } = event;

        switch (type) {
            case EventType.GAME_START:
                return `【遊戲開始】${data.playerCount} 位玩家加入遊戲`;

            case EventType.PHASE_CHANGE:
                return `【階段變更】進入 ${data.phase}`;

            case EventType.PUBLIC_SPEECH:
                return `【發言】${data.speakerName}: ${data.content}`;

            case EventType.VOTE_CAST:
                return `【投票】${data.voterName} 投票給 ${data.targetName || '棄票'}`;

            case EventType.VOTE_RESULT:
                return `【投票結果】${data.eliminatedName || '無人'} 被投票出局`;

            case EventType.PLAYER_DEATH:
                return `【死亡】${data.playerName} 死亡`;

            case EventType.NIGHT_RESULT:
                return `【夜晚結果】${data.message}`;

            case EventType.WEREWOLF_KILL:
                return `【狼人行動】狼人選擇了 ${data.targetName}`;

            case EventType.SEER_CHECK:
                return `【查驗結果】${data.targetName} 是 ${data.isWerewolf ? '狼人' : '好人'}`;

            case EventType.GAME_END:
                return `【遊戲結束】${data.winner === 'WEREWOLF' ? '狼人' : '村民'} 陣營獲勝！`;

            default:
                return '';
        }
    }

    /**
     * 取得目前討論的發言記錄（用於發言時的脈絡）
     * @param currentSpeakerIndex - 目前發言者的順序（從 0 開始）
     * @returns 之前所有人的發言記錄
     */
    getDiscussionContext(currentSpeakerIndex: number): string[] {
        const speeches: string[] = [];
        const speechEvents = this.events.filter(
            e => e.type === EventType.PUBLIC_SPEECH
        );

        // 只取到目前發言者之前的發言
        const previousSpeeches = speechEvents.slice(0, currentSpeakerIndex);

        for (const event of previousSpeeches) {
            speeches.push(`${event.data.speakerName}：${event.data.content}`);
        }

        return speeches;
    }

    /**
     * 取得完整的討論記錄（用於投票決策）
     * @returns 所有發言的完整記錄
     */
    getFullDiscussionForVoting(): string {
        const speechEvents = this.events.filter(
            e => e.type === EventType.PUBLIC_SPEECH
        );

        if (speechEvents.length === 0) {
            return '（尚無發言記錄）';
        }

        const lines = speechEvents.map(
            e => `${e.data.speakerName}：${e.data.content}`
        );

        return lines.join('\n\n');
    }

    /**
     * 取得目前回合的關鍵事件摘要（死亡、投票結果等）
     */
    getCurrentRoundSummary(round: number): string {
        const roundEvents = this.getEventsByRound(round);
        const lines: string[] = [];

        for (const event of roundEvents) {
            switch (event.type) {
                case EventType.NIGHT_RESULT:
                    lines.push(`昨晚死亡：${event.data.message}`);
                    break;
                case EventType.VOTE_RESULT:
                    if (event.data.hasElimination) {
                        lines.push(`投票處決：${event.data.eliminatedName}`);
                    }
                    break;
            }
        }

        return lines.join('\n');
    }
}

