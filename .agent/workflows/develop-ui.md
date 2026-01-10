---
description: 開發 UI 元件和 CLI 介面
---

# Agent C: UI Components 開發流程

此工作流程用於開發 `src/components/` 和 `src/cli/` 目錄。

## 負責範圍

- `src/components/ui/` - 基礎 UI 元件
- `src/components/screens/` - 畫面元件
- `src/components/game/` - 遊戲專用元件
- `src/cli/GameCLI.ts` - 文字介面（Phase 1）
- `src/styles/` - 樣式

## 重要原則

1. **狀態分離**：UI 不直接操作遊戲邏輯，透過 stores 通訊
2. **可重用**：基礎元件應該高度可重用
3. **響應式**：支援不同螢幕尺寸
4. **無障礙**：考慮鍵盤操作和螢幕閱讀器

## 開發順序

// turbo-all

1. 實作基礎 UI 元件
```bash
# 檢查元件結構
ls -la src/components/ui/
```

2. 實作畫面元件
```bash
# 編譯檢查
npx tsc --noEmit src/components/**/*.tsx
```

3. 開發伺服器測試
```bash
npm run dev
```

## 從 Store 讀取狀態

```typescript
import { useGameStore } from '@/stores/gameStore';

const { 
  getPhase, 
  getPlayers, 
  executePlayerAction 
} = useGameStore();
```

## 注意事項

- Phase 1 使用純文字介面（CLI）
- Phase 2 才開發完整 Web UI
- 所有元件使用繁體中文
