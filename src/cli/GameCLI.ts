/**
 * 遊戲文字介面 (CLI)
 * @module cli/GameCLI
 * 
 * 這是 Phase 1 的純文字介面，用於在瀏覽器 Console 或終端機中進行遊戲。
 * Phase 2 將會替換為完整的 Web UI。
 */

import { GameEngine } from '@/core/engine/GameEngine';
import { GamePhase, GameConfig, DEFAULT_GAME_CONFIG } from '@/core/types/game';
import { Player, NpcCharacter, isPlayerAlive } from '@/core/types/player';
import { RoleType, ROLE_DISPLAY_NAMES } from '@/core/types/role';
import { ActionType, createAction, SpeechAction } from '@/core/types/action';
import { initializeOpenAI, isOpenAIInitialized } from '@/services/ai/openai';
import { generateMultipleCharacters } from '@/services/ai/CharacterGenerator';
import { SpeechGenerator } from '@/services/ai/SpeechGenerator';
import { DecisionMaker } from '@/services/ai/DecisionMaker';
import { generateDefaultNpcCharacters } from '@/core/utils/roleDistribution';

/**
 * 遊戲 CLI 控制器
 */
export class GameCLI {
    private engine: GameEngine;
    private speechGenerator: SpeechGenerator;
    private decisionMaker: DecisionMaker;
    private useAI: boolean = false;

    constructor() {
        this.engine = new GameEngine();
        this.speechGenerator = new SpeechGenerator();
        this.decisionMaker = new DecisionMaker();
    }

    /**
     * 初始化 AI（需要 API Key）
     */
    initializeAI(apiKey: string): void {
        initializeOpenAI({ apiKey });
        this.useAI = true;
        this.log('✅ AI 已初始化');
    }

    /**
     * 開始新遊戲
     */
    async startGame(playerName: string = '你'): Promise<void> {
        this.log('\n========================================');
        this.log('🐺 歡迎來到狼人殺遊戲！');
        this.log('========================================\n');

        // 生成 NPC 角色
        let npcCharacters: NpcCharacter[];

        if (this.useAI && isOpenAIInitialized()) {
            this.log('🎭 正在使用 AI 生成 NPC 角色...');
            try {
                npcCharacters = await generateMultipleCharacters(5);
                this.log('✅ NPC 角色生成完成！\n');
            } catch (error) {
                this.log('⚠️ AI 生成失敗，使用預設角色');
                npcCharacters = generateDefaultNpcCharacters(5);
            }
        } else {
            this.log('📋 使用預設 NPC 角色');
            npcCharacters = generateDefaultNpcCharacters(5);
        }

        // 顯示 NPC 角色
        this.log('【本局玩家】');
        this.log(`1. ${playerName}（你）`);
        npcCharacters.forEach((c, i) => {
            this.log(`${i + 2}. ${c.name}（${c.profession}，${c.age}歲）`);
        });
        this.log('');

        // 初始化遊戲
        this.engine.initialize(DEFAULT_GAME_CONFIG, 'human_player', npcCharacters);

        // 顯示人類玩家的角色
        const humanPlayer = this.engine.getState().getHumanPlayer();
        if (humanPlayer) {
            this.log(`\n🎴 你的身份是：【${ROLE_DISPLAY_NAMES[humanPlayer.role]}】`);
            this.showRoleInfo(humanPlayer.role);
        }

        // 開始遊戲循環
        await this.gameLoop();
    }

    /**
     * 遊戲主循環
     */
    private async gameLoop(): Promise<void> {
        while (true) {
            // 進入下一階段
            const phaseResult = this.engine.nextPhase();
            this.log(`\n📢 ${phaseResult.message}`);

            // 檢查遊戲是否結束
            const gameResult = this.engine.checkGameEnd();
            if (gameResult) {
                this.showGameResult();
                break;
            }

            // 根據階段執行
            const phase = this.engine.getState().getPhase();
            await this.handlePhase(phase);
        }
    }

    /**
     * 處理各階段
     */
    private async handlePhase(phase: GamePhase): Promise<void> {
        switch (phase) {
            case GamePhase.NIGHT_START:
                this.log('🌙 夜幕降臨...\n');
                break;

            case GamePhase.WEREWOLF_TURN:
                await this.handleWerewolfTurn();
                break;

            case GamePhase.SEER_TURN:
                await this.handleSeerTurn();
                break;

            case GamePhase.DAY_START:
                this.showNightResult();
                break;

            case GamePhase.DISCUSSION:
                await this.handleDiscussion();
                break;

            case GamePhase.VOTE:
                await this.handleVote();
                break;

            case GamePhase.EXECUTION:
                this.handleExecution();
                break;
        }
    }

    /**
     * 狼人回合
     */
    private async handleWerewolfTurn(): Promise<void> {
        const humanPlayer = this.engine.getState().getHumanPlayer();
        const alivePlayers = this.engine.getAlivePlayers();
        const werewolves = alivePlayers.filter(p => p.role === RoleType.WEREWOLF);

        // 處理人類玩家（如果是狼人）
        if (humanPlayer?.role === RoleType.WEREWOLF && isPlayerAlive(humanPlayer)) {
            const teammates = werewolves.filter(w => w.id !== humanPlayer.id);
            if (teammates.length > 0) {
                this.log(`\n🐺 你的狼人隊友：${teammates.map(t => t.displayName).join('、')}`);
            }

            const targets = this.engine.getValidTargetsForHuman();
            this.log('\n選擇今晚要殺的目標：');
            targets.forEach((t, i) => {
                this.log(`  ${i + 1}. ${t.displayName}`);
            });

            // 在真實遊戲中這裡會等待玩家輸入
            // Phase 1 簡化版：模擬玩家選擇第一個目標
            const choice = 0;
            const targetId = targets[choice]?.id;

            if (targetId) {
                this.engine.executeAction(
                    createAction(ActionType.WEREWOLF_KILL, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
                );
                this.log(`\n你選擇了 ${targets[choice].displayName}`);
            }
        }

        // 處理 NPC 狼人
        const npcWerewolves = werewolves.filter(w => !w.isHuman && isPlayerAlive(w));
        for (const werewolf of npcWerewolves) {
            const targets = alivePlayers.filter(p => p.role !== RoleType.WEREWOLF);

            if (this.useAI && isOpenAIInitialized()) {
                try {
                    const context = this.engine.getGameSummaryForPlayer(werewolf.id);
                    const decision = await this.decisionMaker.werewolfKill(
                        werewolf,
                        context,
                        targets,
                        alivePlayers
                    );
                    this.engine.executeAction(
                        createAction(ActionType.WEREWOLF_KILL, werewolf.id, this.engine.getCurrentRound(), { targetId: decision.targetId })
                    );
                } catch {
                    // 失敗時隨機選擇
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    if (randomTarget) {
                        this.engine.executeAction(
                            createAction(ActionType.WEREWOLF_KILL, werewolf.id, this.engine.getCurrentRound(), { targetId: randomTarget.id })
                        );
                    }
                }
            } else {
                // 不使用 AI 時隨機選擇
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                if (randomTarget) {
                    this.engine.executeAction(
                        createAction(ActionType.WEREWOLF_KILL, werewolf.id, this.engine.getCurrentRound(), { targetId: randomTarget.id })
                    );
                }
            }
        }
    }

    /**
     * 預言家回合
     */
    private async handleSeerTurn(): Promise<void> {
        const humanPlayer = this.engine.getState().getHumanPlayer();
        const alivePlayers = this.engine.getAlivePlayers();

        if (humanPlayer?.role === RoleType.SEER && isPlayerAlive(humanPlayer)) {
            const targets = this.engine.getValidTargetsForHuman();
            this.log('\n🔮 選擇要查驗的對象：');
            targets.forEach((t, i) => {
                this.log(`  ${i + 1}. ${t.displayName}`);
            });

            // Phase 1 簡化版：模擬選擇第一個目標
            const choice = 0;
            const targetId = targets[choice]?.id;

            if (targetId) {
                const result = this.engine.executeAction(
                    createAction(ActionType.SEER_CHECK, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
                );
                this.log(`\n${result.message}`);
            }
        }

        // 處理 NPC 預言家
        const npcSeers = alivePlayers.filter(p => p.role === RoleType.SEER && !p.isHuman);
        for (const seer of npcSeers) {
            const targets = alivePlayers.filter(p => p.id !== seer.id);

            if (this.useAI && isOpenAIInitialized()) {
                try {
                    const context = this.engine.getGameSummaryForPlayer(seer.id);
                    const decision = await this.decisionMaker.seerCheck(seer, context, targets);
                    const result = this.engine.executeAction(
                        createAction(ActionType.SEER_CHECK, seer.id, this.engine.getCurrentRound(), { targetId: decision.targetId })
                    );
                    // 記錄查驗結果供後續使用
                    const target = alivePlayers.find(p => p.id === decision.targetId);
                    if (target && result.data) {
                        this.decisionMaker.recordSeerCheck(seer.id, {
                            name: target.displayName,
                            isWerewolf: result.data.isWerewolf as boolean,
                        });
                    }
                } catch {
                    // 失敗時隨機選擇
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    if (randomTarget) {
                        this.engine.executeAction(
                            createAction(ActionType.SEER_CHECK, seer.id, this.engine.getCurrentRound(), { targetId: randomTarget.id })
                        );
                    }
                }
            } else {
                const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                if (randomTarget) {
                    this.engine.executeAction(
                        createAction(ActionType.SEER_CHECK, seer.id, this.engine.getCurrentRound(), { targetId: randomTarget.id })
                    );
                }
            }
        }
    }

    /**
     * 顯示夜晚結果
     */
    private showNightResult(): void {
        const deaths = this.engine.getState().getLastDeaths();

        if (deaths.length === 0) {
            this.log('\n☀️ 昨晚是平安夜，沒有人死亡。\n');
        } else {
            const deadNames = deaths
                .map(id => this.engine.getState().getPlayer(id)?.displayName)
                .filter(Boolean)
                .join('、');
            this.log(`\n☀️ 昨晚 ${deadNames} 被狼人殺害了。\n`);
        }
    }

    /**
     * 討論階段
     */
    private async handleDiscussion(): Promise<void> {
        const alivePlayers = this.engine.getAlivePlayers();
        const humanPlayer = this.engine.getState().getHumanPlayer();
        const gameContext = this.engine.getGameSummaryForPlayer(humanPlayer?.id || '');
        const deathInfo = this.engine.getNightResultMessage();

        this.log('\n【討論階段】每位玩家輪流發言\n');

        // 追蹤發言順序
        let speakerIndex = 0;

        for (const player of alivePlayers) {
            if (player.isHuman) {
                // 人類玩家發言
                this.log(`\n輪到你發言（輸入發言內容）：`);
                // Phase 1 簡化版：模擬發言
                const speech = '我覺得需要多觀察一下...';
                this.engine.executeAction(
                    createAction<SpeechAction>(
                        ActionType.SPEECH,
                        player.id,
                        this.engine.getCurrentRound(),
                        { content: speech }
                    )
                );
                this.log(`\n${player.displayName}：${speech}`);
                speakerIndex++;
            } else {
                // NPC 發言
                let speech: string;

                if (this.useAI && isOpenAIInitialized()) {
                    try {
                        // 取得之前的發言記錄
                        const previousSpeeches = this.engine.getDiscussionContext(speakerIndex);

                        speech = await this.speechGenerator.generateForPlayer(player, gameContext, {
                            speakingOrder: speakerIndex + 1,
                            totalPlayers: alivePlayers.length,
                            previousSpeeches,
                            deathInfo,
                        });
                    } catch {
                        speech = '......（沉默不語）';
                    }
                } else {
                    // 不使用 AI 時的預設發言
                    const defaultSpeeches = [
                        '我覺得需要多觀察一下。',
                        '昨晚的情況很可疑...',
                        '我相信自己的判斷。',
                        '大家冷靜分析一下。',
                        '有些人的發言讓我起疑。',
                    ];
                    speech = defaultSpeeches[Math.floor(Math.random() * defaultSpeeches.length)];
                }

                this.engine.executeAction(
                    createAction<SpeechAction>(
                        ActionType.SPEECH,
                        player.id,
                        this.engine.getCurrentRound(),
                        { content: speech }
                    )
                );
                this.log(`\n${player.displayName}：${speech}`);
                speakerIndex++;

                // 模擬發言間隔
                await this.sleep(500);
            }
        }
    }

    /**
     * 投票階段
     */
    private async handleVote(): Promise<void> {
        const alivePlayers = this.engine.getAlivePlayers();
        const humanPlayer = this.engine.getState().getHumanPlayer();

        this.log('\n【投票階段】請選擇要投票的對象\n');

        // 顯示候選人
        const candidates = alivePlayers;
        candidates.forEach((c, i) => {
            this.log(`  ${i + 1}. ${c.displayName}${c.isHuman ? '（你）' : ''}`);
        });
        this.log(`  0. 棄票`);

        // 處理人類玩家投票
        if (humanPlayer && isPlayerAlive(humanPlayer)) {
            // Phase 1 簡化版：隨機投票
            const choice = Math.floor(Math.random() * candidates.length);
            const targetId = candidates[choice]?.id || undefined;

            this.engine.executeAction(
                createAction(ActionType.VOTE, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
            );
            this.log(`\n你投票給了 ${candidates[choice]?.displayName || '棄票'}`);
        }

        // 處理 NPC 投票
        const npcPlayers = alivePlayers.filter(p => !p.isHuman);

        // 取得完整的討論記錄
        const discussionHistory = this.engine.getFullDiscussionForVoting();

        for (const npc of npcPlayers) {
            const otherPlayers = candidates.filter(c => c.id !== npc.id);

            if (this.useAI && isOpenAIInitialized()) {
                try {
                    // 使用完整的討論記錄來決策
                    const decision = await this.decisionMaker.vote(npc, discussionHistory, otherPlayers, alivePlayers);
                    this.engine.executeAction(
                        createAction(ActionType.VOTE, npc.id, this.engine.getCurrentRound(), { targetId: decision.targetId })
                    );
                } catch {
                    // 失敗時隨機選擇
                    const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                    this.engine.executeAction(
                        createAction(ActionType.VOTE, npc.id, this.engine.getCurrentRound(), { targetId: randomTarget?.id })
                    );
                }
            } else {
                // 不使用 AI 時隨機投票
                const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                this.engine.executeAction(
                    createAction(ActionType.VOTE, npc.id, this.engine.getCurrentRound(), { targetId: randomTarget?.id })
                );
            }
        }

        // 結算投票
        const result = this.engine.resolveVote();

        this.log('\n【投票結果】');
        for (const [id, count] of result.voteCounts) {
            const player = this.engine.getState().getPlayer(id);
            this.log(`  ${player?.displayName}: ${count} 票`);
        }
        this.log(`\n${result.message}`);
    }

    /**
     * 處決階段
     */
    private handleExecution(): void {
        // 投票結果已在 handleVote 中處理
        // 這裡只是過渡階段
    }

    /**
     * 顯示遊戲結果
     */
    private showGameResult(): void {
        const result = this.engine.checkGameEnd();
        if (!result) return;

        this.log('\n========================================');
        this.log('🎮 遊戲結束！');
        this.log('========================================\n');

        this.log(`🏆 ${result.winner === 'WEREWOLF' ? '狼人' : '村民'}陣營獲勝！\n`);
        this.log(result.summary);

        // 顯示所有玩家身份
        this.log('\n【玩家身份揭曉】');
        const players = this.engine.getPlayers();
        for (const player of players) {
            const status = isPlayerAlive(player) ? '✅ 存活' : '❌ 死亡';
            this.log(`  ${player.displayName}: ${ROLE_DISPLAY_NAMES[player.role]} ${status}`);
        }

        // 顯示完整歷史
        this.log('\n【完整遊戲歷史】');
        const history = this.engine.getFullHistory();
        history.forEach(event => {
            this.log(`  [${event.type}] ${JSON.stringify(event.data)}`);
        });
    }

    /**
     * 顯示角色資訊
     */
    private showRoleInfo(role: RoleType): void {
        switch (role) {
            case RoleType.WEREWOLF:
                this.log('你是狼人！夜晚可以與同伴選擇殺害一名玩家。');
                this.log('目標：消滅所有村民。');
                break;
            case RoleType.VILLAGER:
                this.log('你是村民，沒有特殊能力。');
                this.log('目標：通過投票找出並處決狼人。');
                break;
            case RoleType.SEER:
                this.log('你是預言家！夜晚可以查驗一名玩家的身份。');
                this.log('目標：帶領村民找出狼人。');
                break;
        }
    }

    /**
     * 輸出日誌
     */
    private log(message: string): void {
        console.log(message);
    }

    /**
     * 延遲
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * 創建遊戲 CLI 實例
 */
export function createGameCLI(): GameCLI {
    return new GameCLI();
}
