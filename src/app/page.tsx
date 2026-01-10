'use client';

import { useEffect, useState } from 'react';
import { GameCLI, createGameCLI } from '@/cli/GameCLI';
import { initializeOpenAI } from '@/services/ai/openai';
import { useSettingsStore } from '@/stores/settingsStore';

export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const { gasWebAppUrl } = useSettingsStore();

  // 初始化 AI
  useEffect(() => {
    async function init() {
      if (!gasWebAppUrl) return;

      try {
        setLogs(prev => [...prev, '🔄 正在從 GAS 取得 API Key...']);
        const response = await fetch(gasWebAppUrl);
        const data = await response.json();

        if (data.success && data.apiKey) {
          initializeOpenAI({ apiKey: data.apiKey });
          setApiKey(data.apiKey);
          setLogs(prev => [...prev, '✅ API Key 取得成功！']);
          setIsReady(true);
        } else {
          setLogs(prev => [...prev, '❌ 取得 API Key 失敗：' + (data.error || '未知錯誤')]);
        }
      } catch (error) {
        setLogs(prev => [...prev, '❌ 連線錯誤：' + (error as Error).message]);
      }
    }

    init();
  }, [gasWebAppUrl]);

  const startGame = async () => {
    if (!isReady || !apiKey) return;

    setIsLoading(true);
    setLogs(['🎮 遊戲開始！', '']);

    // 覆蓋 console.log 來捕捉輸出
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
      originalLog(...args);
      setLogs(prev => [...prev, args.join(' ')]);
    };
    console.error = (...args) => {
      originalError(...args);
      setLogs(prev => [...prev, '❌ ' + args.join(' ')]);
    };

    try {
      const cli = createGameCLI();
      // 使用已取得的 API Key 初始化
      cli.initializeAI(apiKey);
      await cli.startGame('玩家');
    } catch (error) {
      setLogs(prev => [...prev, '❌ 遊戲錯誤：' + (error as Error).message]);
      originalError('Game error:', error);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      setIsLoading(false);
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
      <h1 style={{ color: '#e94560' }}>🐺 狼人殺遊戲 - Phase 1 純文字版</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={startGame}
          disabled={!isReady || isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isReady ? '#e94560' : '#666',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}
        >
          {isLoading ? '遊戲進行中...' : isReady ? '🎮 開始遊戲' : '⏳ 初始化中...'}
        </button>
      </div>

      <div style={{
        backgroundColor: '#0f0f23',
        padding: '20px',
        borderRadius: '8px',
        height: '70vh',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        lineHeight: '1.6',
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
}
