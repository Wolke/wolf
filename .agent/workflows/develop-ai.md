---
description: 開發 AI 服務層
---

# Agent B: AI Services 開發流程

此工作流程用於開發 `src/services/ai/` 目錄下的 AI 整合服務。

## 負責範圍

- `src/services/ai/openai.ts` - OpenAI 客戶端封裝
- `src/services/ai/prompts/` - Prompt 模板
- `src/services/ai/CharacterGenerator.ts` - NPC 角色生成
- `src/services/ai/SpeechGenerator.ts` - 發言生成
- `src/services/ai/DecisionMaker.ts` - 決策生成

## 重要原則

1. **封裝 API**：所有 OpenAI API 呼叫都應該封裝
2. **錯誤處理**：必須處理 API 錯誤和超時
3. **Prompt 分離**：Prompt 模板獨立檔案管理
4. **回應驗證**：驗證 AI 回應的格式

## 開發順序

// turbo-all

1. 定義或更新 Prompt 模板
```bash
# 檢查 Prompt 模板
cat src/services/ai/prompts/*.ts
```

2. 實作 AI 服務
```bash
# 編譯檢查
npx tsc --noEmit src/services/ai/*.ts
```

3. 測試 AI 回應格式
```bash
# 執行 AI 服務測試
npm run test -- --filter ai
```

## 依賴型別

從 `@/core/types` 導入：
- `NpcCharacter`
- `Player`
- `RoleType`
- `Team`

## 注意事項

- API Key 由 GAS 模組提供
- 所有 AI 服務都應該有 fallback 機制
- 回應長度應該有合理限制
