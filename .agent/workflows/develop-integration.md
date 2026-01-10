---
description: 開發整合層（Stores、Hooks、API 路由）
---

# Agent D: Integration 開發流程

此工作流程用於開發整合層程式碼。

## 負責範圍

- `src/stores/` - Zustand 狀態管理
- `src/hooks/` - React Hooks
- `src/lib/` - 工具庫（GAS、Storage）
- `src/app/` - Next.js 路由

## 重要原則

1. **橋接角色**：Integration 層連接 Core、AI、UI
2. **狀態同步**：確保 Store 狀態與遊戲引擎同步
3. **錯誤處理**：統一處理錯誤並提供友善訊息

## 開發順序

// turbo-all

1. 實作 Store
```bash
# 檢查 Store 結構
cat src/stores/gameStore.ts
```

2. 實作 Hooks
```bash
# 編譯檢查
npx tsc --noEmit src/hooks/*.ts
```

3. 實作路由
```bash
# 檢查路由
ls -la src/app/
```

4. 測試整合
```bash
npm run dev
```

## Store 設計原則

```typescript
// gameStore.ts
interface GameStoreState {
  engine: GameEngine | null;  // 遊戲引擎實例
  currentScreen: GameScreen;  // 當前畫面
  isLoading: boolean;         // 載入狀態
  error: string | null;       // 錯誤訊息
}
```

## GAS 整合

```typescript
// 從 GAS 取得 API Key
import { getApiKeyFromGas, initializeGas } from '@/lib/gas';

initializeGas({ webAppUrl: 'YOUR_GAS_URL' });
const apiKey = await getApiKeyFromGas();
```

## 注意事項

- Store 需要處理 SSR（Next.js）
- API Key 不要直接寫在程式碼中
- 所有外部服務都需要錯誤處理
