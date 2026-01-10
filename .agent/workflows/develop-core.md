---
description: 開發核心遊戲引擎 (Core Engine)
---

# Agent A: Core Engine 開發流程

此工作流程用於開發 `src/core/` 目錄下的遊戲核心邏輯。

## 負責範圍

- `src/core/types/` - 所有型別定義
- `src/core/roles/` - 角色系統
- `src/core/engine/` - 遊戲引擎
- `src/core/state/` - 狀態管理
- `src/core/utils/` - 工具函數

## 重要原則

1. **純邏輯**：core 模組不應有任何 UI 或 API 呼叫
2. **無副作用**：所有函數應該是純函數
3. **型別優先**：先定義型別，再實作邏輯
4. **可測試**：所有邏輯都應該可以單獨測試

## 開發順序

// turbo-all

1. 定義或更新型別
```bash
# 檢查型別定義
cat src/core/types/index.ts
```

2. 實作角色邏輯
```bash
# 檢查角色是否正確導出
npx tsc --noEmit src/core/roles/*.ts
```

3. 實作引擎邏輯
```bash
# 編譯檢查
npx tsc --noEmit
```

4. 執行測試
```bash
npm run test -- --filter core
```

## 注意事項

- 不要修改 `src/services/` 目錄
- 不要修改 `src/components/` 目錄
- 所有對外介面必須在 `index.ts` 中導出
