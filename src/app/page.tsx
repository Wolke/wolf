'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { GameCLI, createGameCLI } from '@/cli/GameCLI';
import { initializeOpenAI, setCurrentModel } from '@/services/ai/openai';
import { useSettingsStore, AVAILABLE_MODELS, OpenAIModel } from '@/stores/settingsStore';
import { PlayMode } from '@/core/types/gameMode';
import { RoleType, ROLE_DISPLAY_NAMES } from '@/core/types/role';
import { BOARD_CONFIGS, createGameConfigFromBoard, BoardConfig } from '@/core/types/game';
import {
  setInputHandler,
  clearInputHandler,
  InputRequest,
  InputType,
  InputOption
} from '@/lib/playerInput';

export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<RoleType | ''>(''); // 空字串表示隨機
  const [selectedBoard, setSelectedBoard] = useState<string>('basic_6'); // 預設 6 人基礎局
  const [isGameStarted, setIsGameStarted] = useState(false);

  // 輸入狀態
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputType, setInputType] = useState<InputType>(InputType.TEXT);
  const [inputOptions, setInputOptions] = useState<InputOption[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputResolveRef = useRef<((value: string) => void) | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const {
    gasWebAppUrl,
    playMode, setPlayMode,
    showDebugInUI, setShowDebugInUI,
    openaiModel, setOpenaiModel
  } = useSettingsStore();

  // 自動滾動到底部
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // 初始化 AI
  useEffect(() => {
    async function init() {
      if (!gasWebAppUrl) return;

      try {
        addLog('🔄 正在從 GAS 取得 API Key...');
        const response = await fetch(gasWebAppUrl);
        const data = await response.json();

        if (data.success && data.apiKey) {
          initializeOpenAI({ apiKey: data.apiKey });
          setApiKey(data.apiKey);
          addLog('✅ API Key 取得成功！');
          setIsReady(true);
        } else {
          addLog('❌ 取得 API Key 失敗：' + (data.error || '未知錯誤'));
        }
      } catch (error) {
        addLog('❌ 連線錯誤：' + (error as Error).message);
      }
    }

    init();
  }, [gasWebAppUrl]);

  // 新增日誌到 UI
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, message]);
  }, []);

  // 處理玩家輸入請求
  const handleInputRequest = useCallback((request: InputRequest): Promise<string> => {
    return new Promise((resolve) => {
      setWaitingForInput(true);
      setInputPrompt(request.prompt);
      setInputType(request.type);
      setInputOptions(request.options || []);
      setInputValue('');
      inputResolveRef.current = resolve;
    });
  }, []);

  // 提交輸入
  const submitInput = useCallback((value: string) => {
    if (inputResolveRef.current) {
      inputResolveRef.current(value);
      inputResolveRef.current = null;
    }
    setWaitingForInput(false);
    setInputPrompt('');
    setInputOptions([]);
    setInputValue('');
  }, []);

  // 處理選項點擊
  const handleOptionClick = useCallback((optionId: string) => {
    submitInput(optionId);
  }, [submitInput]);

  // 處理文字提交
  const handleTextSubmit = useCallback(() => {
    if (inputValue.trim()) {
      submitInput(inputValue.trim());
    }
  }, [inputValue, submitInput]);

  // 開始遊戲
  const startGame = async () => {
    if (!isReady || !apiKey || !playerName.trim()) {
      if (!playerName.trim()) {
        alert('請輸入你的名字！');
        return;
      }
      return;
    }

    setIsLoading(true);
    setIsGameStarted(true);
    setLogs(['🎮 遊戲開始！', '']);

    // 建立自訂的 log 函數給 GameCLI 使用
    const gameLog = (message: string) => {
      // 過濾掉 debug 訊息
      if (!showDebugInUI) {
        if (message.startsWith('📤') ||
          message.startsWith('📥') ||
          message.startsWith('📌') ||
          message.startsWith('📝') ||
          message.startsWith('📦') ||
          message.startsWith('📊') ||
          message.includes('========')) {
          return;
        }
      }
      addLog(message);
    };

    // 設定輸入處理器
    setInputHandler(handleInputRequest);

    try {
      // 設定 AI 模型
      setCurrentModel(openaiModel);

      const cli = createGameCLI(gameLog);
      cli.initializeAI(apiKey);

      const isSimulation = playMode === PlayMode.SIMULATION;
      const forcedRole = selectedRole ? selectedRole as RoleType : undefined;
      const gameConfig = createGameConfigFromBoard(selectedBoard);
      await cli.startGame(playerName.trim(), isSimulation, forcedRole, gameConfig);
    } catch (error) {
      addLog('❌ 遊戲錯誤：' + (error as Error).message);
      console.error('Game error:', error);
    } finally {
      clearInputHandler();
      setIsLoading(false);
      setIsGameStarted(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#1a1a2e',
      color: '#eee',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <h1 style={{ color: '#e94560' }}>🐺 狼人殺遊戲 - 8+9 台客風</h1>

      {/* 遊戲設定區 */}
      {!isGameStarted && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 玩家名字輸入 */}
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="輸入你的名字..."
            style={{
              padding: '12px 16px',
              fontSize: '16px',
              backgroundColor: '#2d2d44',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '8px',
              width: '200px',
            }}
          />

          <button
            onClick={startGame}
            disabled={!isReady || isLoading || !playerName.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isReady && playerName.trim() ? '#e94560' : '#666',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isReady && playerName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading ? '遊戲進行中...' : isReady ? '🎮 開始遊戲' : '⏳ 初始化中...'}
          </button>

          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#2d2d44',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            {BOARD_CONFIGS.map(board => (
              <option key={board.id} value={board.id}>
                {board.name} - {board.description}
              </option>
            ))}
          </select>

          <select
            value={playMode}
            onChange={(e) => setPlayMode(e.target.value as PlayMode)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#2d2d44',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            <option value={PlayMode.PLAYER}>🎮 玩家模式</option>
            <option value={PlayMode.SIMULATION}>🤖 模擬模式</option>
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as RoleType | '')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#2d2d44',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            <option value="">🎲 隨機角色</option>
            <option value={RoleType.WEREWOLF}>🐺 狼人</option>
            <option value={RoleType.SEER}>🔮 預言家</option>
            <option value={RoleType.VILLAGER}>👤 村民</option>
          </select>

          <select
            value={openaiModel}
            onChange={(e) => setOpenaiModel(e.target.value as OpenAIModel)}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#2d2d44',
              color: '#eee',
              border: '1px solid #444',
              borderRadius: '4px',
            }}
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showDebugInUI}
              onChange={(e) => setShowDebugInUI(e.target.checked)}
            />
            顯示 Debug 訊息
          </label>
        </div>
      )}

      {/* 遊戲日誌 */}
      <div
        ref={logContainerRef}
        style={{
          backgroundColor: '#0f0f23',
          padding: '20px',
          borderRadius: '8px',
          height: waitingForInput ? '50vh' : '70vh',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          lineHeight: '1.6',
        }}
      >
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {/* 玩家輸入區 */}
      {waitingForInput && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#2d2d44',
          borderRadius: '8px',
          border: '2px solid #e94560',
        }}>
          <div style={{ marginBottom: '15px', fontSize: '18px', color: '#e94560' }}>
            {inputPrompt}
          </div>

          {inputType === InputType.CHOICE ? (
            // 選項按鈕
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {inputOptions.map((option, i) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  style={{
                    padding: '12px 20px',
                    fontSize: '14px',
                    backgroundColor: '#3d3d5c',
                    color: '#eee',
                    border: '1px solid #666',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#e94560';
                    e.currentTarget.style.borderColor = '#e94560';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3d3d5c';
                    e.currentTarget.style.borderColor = '#666';
                  }}
                >
                  {i + 1}. {option.label}
                </button>
              ))}
            </div>
          ) : (
            // 文字輸入
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleTextSubmit();
                  }
                }}
                placeholder="輸入發言內容..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  fontSize: '16px',
                  backgroundColor: '#1a1a2e',
                  color: '#eee',
                  border: '1px solid #666',
                  borderRadius: '6px',
                }}
              />
              <button
                onClick={handleTextSubmit}
                disabled={!inputValue.trim()}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: inputValue.trim() ? '#e94560' : '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                送出
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
