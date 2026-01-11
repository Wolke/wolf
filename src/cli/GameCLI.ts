/**
 * 遊戲文字介面 (CLI)
 * @module cli/GameCLI
 * 
 * 這是 Phase 1 的純文字介面，用於在瀏覽器 Console 或終端機中進行遊戲。
 * Phase 2 將會替換為完整的 Web UI。
 */

import { GameEngine } from '@/core/engine/GameEngine';
import { GamePhase, GameConfig, DEFAULT_GAME_CONFIG, PLAYER_COUNT_CONFIGS } from '@/core/types/game';
import { Player, NpcCharacter, isPlayerAlive } from '@/core/types/player';
import { RoleType, ROLE_DISPLAY_NAMES } from '@/core/types/role';
import { ActionType, createAction, SpeechAction } from '@/core/types/action';
import { initializeOpenAI, isOpenAIInitialized } from '@/services/ai/openai';
import { generateMultipleCharacters } from '@/services/ai/CharacterGenerator';
import { SpeechGenerator } from '@/services/ai/SpeechGenerator';
import { DecisionMaker } from '@/services/ai/DecisionMaker';
import { generateDefaultNpcCharacters } from '@/core/utils/roleDistribution';
import { requestChoice, requestTextInput } from '@/lib/playerInput';

/**
 * 遊戲 CLI 控制器
 */
export class GameCLI {
    private engine: GameEngine;
    private speechGenerator: SpeechGenerator;
    private decisionMaker: DecisionMaker;
    private useAI: boolean = false;
    private isSimulation: boolean = false;
    private customLogger?: (message: string) => void;

    constructor(customLogger?: (message: string) => void) {
        this.engine = new GameEngine();
        this.speechGenerator = new SpeechGenerator();
        this.decisionMaker = new DecisionMaker();
        this.customLogger = customLogger;
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
     * @param forcedRole - 強制指定的角色（測試用）
     * @param gameConfig - 遊戲配置（人數等）
     */
    async startGame(
        playerName: string = '你',
        isSimulation: boolean = false,
        forcedRole?: RoleType,
        gameConfig: GameConfig = DEFAULT_GAME_CONFIG
    ): Promise<void> {
        this.isSimulation = isSimulation;

        const configInfo = PLAYER_COUNT_CONFIGS[gameConfig.playerCount];

        this.log('\n========================================');
        this.log('🐺 歡迎來到狼人殺遊戲！');
        this.log(`🎮 模式：${isSimulation ? '模擬模式' : '玩家模式'}`);
        this.log(`👥 人數：${configInfo?.description || `${gameConfig.playerCount}人局`}`);
        if (forcedRole) {
            this.log(`🎯 指定角色：${ROLE_DISPLAY_NAMES[forcedRole]}`);
        }
        this.log('========================================\n');

        // 生成 NPC 角色（根據人數）
        const npcCount = gameConfig.playerCount - 1;
        let npcCharacters: NpcCharacter[];

        if (this.useAI && isOpenAIInitialized()) {
            this.log('🎭 正在使用 AI 生成 NPC 角色...');
            try {
                npcCharacters = await generateMultipleCharacters(npcCount);
                this.log('✅ NPC 角色生成完成！\n');
            } catch (error) {
                this.log('⚠️ AI 角色生成失敗，使用預設角色');
                npcCharacters = generateDefaultNpcCharacters(npcCount);
            }
        } else {
            npcCharacters = generateDefaultNpcCharacters(npcCount);
        }

        // 初始化遊戲（傳入指定角色）
        this.engine.initialize(gameConfig, 'human_player', npcCharacters, forcedRole);

        // 設定人類玩家名稱
        const humanPlayer = this.engine.getState().getHumanPlayer();
        if (humanPlayer) {
            humanPlayer.displayName = playerName;
        }

        // 顯示遊戲資訊
        this.showGameInfo();

        // 顯示玩家角色
        if (humanPlayer) {
            this.log(`\n🎴 你的身份是：【${ROLE_DISPLAY_NAMES[humanPlayer.role]}】`);
            this.showRoleInfo(humanPlayer.role);
        }

        // 遊戲主迴圈
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

            if (this.isSimulation) {
                // 模擬模式：隨機選擇
                const choice = Math.floor(Math.random() * targets.length);
                const targetId = targets[choice]?.id;
                if (targetId) {
                    this.engine.executeAction(
                        createAction(ActionType.WEREWOLF_KILL, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
                    );
                    this.log(`\n你選擇了 ${targets[choice].displayName}`);
                }
            } else {
                // 玩家模式：等待輸入
                const options = targets.map(t => ({ id: t.id, label: t.displayName }));
                const selectedId = await requestChoice('🐺 選擇今晚要殺的目標：', options);

                this.engine.executeAction(
                    createAction(ActionType.WEREWOLF_KILL, humanPlayer.id, this.engine.getCurrentRound(), { targetId: selectedId })
                );
                const selectedTarget = targets.find(t => t.id === selectedId);
                this.log(`\n你選擇了 ${selectedTarget?.displayName}`);
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
                    const randomTarget = targets[Math.floor(Math.random() * targets.length)];
                    if (randomTarget) {
                        this.engine.executeAction(
                            createAction(ActionType.WEREWOLF_KILL, werewolf.id, this.engine.getCurrentRound(), { targetId: randomTarget.id })
                        );
                    }
                }
            } else {
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

            if (this.isSimulation) {
                // 模擬模式：隨機選擇
                const choice = Math.floor(Math.random() * targets.length);
                const targetId = targets[choice]?.id;

                if (targetId) {
                    const result = this.engine.executeAction(
                        createAction(ActionType.SEER_CHECK, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
                    );
                    this.log(`\n${result.message}`);
                    if (result.data?.isWerewolf !== undefined) {
                        this.log(result.data.isWerewolf ? '🐺 是狼人！' : '👤 是好人');
                    }
                }
            } else {
                // 玩家模式：等待輸入
                const options = targets.map(t => ({ id: t.id, label: t.displayName }));
                const selectedId = await requestChoice('🔮 選擇要查驗的對象：', options);

                const result = this.engine.executeAction(
                    createAction(ActionType.SEER_CHECK, humanPlayer.id, this.engine.getCurrentRound(), { targetId: selectedId })
                );
                this.log(`\n${result.message}`);
                if (result.data?.isWerewolf !== undefined) {
                    this.log(result.data.isWerewolf ? '🐺 是狼人！' : '👤 是好人');
                }
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
                    // 記錄查驗結果
                    if (result.data?.isWerewolf !== undefined) {
                        this.decisionMaker.recordSeerCheck(seer.id, {
                            name: String(result.data.targetName || ''),
                            isWerewolf: Boolean(result.data.isWerewolf),
                        });
                    }
                } catch {
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
                .map((id: string) => this.engine.getState().getPlayer(id)?.displayName)
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

        let speakerIndex = 0;

        for (const player of alivePlayers) {
            if (player.isHuman) {
                // 人類玩家發言
                let speech: string;

                if (this.isSimulation) {
                    speech = '我覺得需要多觀察一下...';
                } else {
                    speech = await requestTextInput('💬 輪到你發言：');
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
            } else {
                // NPC 發言
                let speech: string;

                if (this.useAI && isOpenAIInitialized()) {
                    try {
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

        const candidates = alivePlayers;

        // 處理人類玩家投票
        if (humanPlayer && isPlayerAlive(humanPlayer)) {
            const otherCandidates = candidates.filter(c => c.id !== humanPlayer.id);

            if (this.isSimulation) {
                // 模擬模式：隨機投票
                const choice = Math.floor(Math.random() * otherCandidates.length);
                const targetId = otherCandidates[choice]?.id;

                this.engine.executeAction(
                    createAction(ActionType.VOTE, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
                );
                this.log(`你投票給了 ${otherCandidates[choice]?.displayName || '棄票'}`);
            } else {
                // 玩家模式：等待輸入
                const options = otherCandidates.map(c => ({ id: c.id, label: c.displayName }));
                options.push({ id: 'ABSTAIN', label: '棄票' });

                const selectedId = await requestChoice('🗳️ 請選擇要投票的對象：', options);
                const targetId = selectedId === 'ABSTAIN' ? undefined : selectedId;

                this.engine.executeAction(
                    createAction(ActionType.VOTE, humanPlayer.id, this.engine.getCurrentRound(), { targetId })
                );

                const selectedTarget = candidates.find(c => c.id === selectedId);
                this.log(`你投票給了 ${selectedTarget?.displayName || '棄票'}`);
            }
        }

        // 處理 NPC 投票
        const npcPlayers = alivePlayers.filter(p => !p.isHuman);
        const discussionHistory = this.engine.getFullDiscussionForVoting();

        for (const npc of npcPlayers) {
            const otherPlayers = candidates.filter(c => c.id !== npc.id);

            if (this.useAI && isOpenAIInitialized()) {
                try {
                    const decision = await this.decisionMaker.vote(npc, discussionHistory, otherPlayers, alivePlayers);
                    this.engine.executeAction(
                        createAction(ActionType.VOTE, npc.id, this.engine.getCurrentRound(), { targetId: decision.targetId })
                    );
                } catch {
                    const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                    this.engine.executeAction(
                        createAction(ActionType.VOTE, npc.id, this.engine.getCurrentRound(), { targetId: randomTarget?.id })
                    );
                }
            } else {
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
        // 處決已在 resolveVote 中處理
    }

    /**
     * 顯示遊戲資訊
     */
    private showGameInfo(): void {
        const players = this.engine.getState().getPlayers();

        this.log('【本局玩家】');
        players.forEach((p, i) => {
            const characterInfo = p.character
                ? `${p.character.profession}，${p.character.age}歲`
                : '';
            this.log(`${i + 1}. ${p.displayName}${p.isHuman ? '（你）' : `（${characterInfo}）`}`);
        });
    }

    /**
     * 顯示遊戲結果
     */
    private showGameResult(): void {
        const result = this.engine.checkGameEnd();
        if (!result) return;

        this.log('\n🎮 遊戲結束！');
        this.log(`🏆 ${result.winner === 'WEREWOLF' ? '狼人陣營' : '村民陣營'}獲勝！`);
        this.log(result.summary);

        // 揭曉所有玩家身份
        const players = this.engine.getState().getPlayers();
        this.log('\n【玩家身份揭曉】');
        for (const player of players) {
            const status = player.status === 'ALIVE' ? '✅ 存活' : '❌ 死亡';
            this.log(`  ${player.displayName}: ${ROLE_DISPLAY_NAMES[player.role]} ${status}`);
        }

        // 顯示完整歷史
        const history = this.engine.getFullHistory();
        this.log('\n【完整遊戲歷史】');
        for (const event of history) {
            this.log(`  [${event.type}] ${JSON.stringify(event.data)}`);
        }
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
                this.log('你是村民！你沒有特殊能力。');
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
        if (this.customLogger) {
            this.customLogger(message);
        }
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
export function createGameCLI(customLogger?: (message: string) => void): GameCLI {
    return new GameCLI(customLogger);
}
