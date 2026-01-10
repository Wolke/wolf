/**
 * NPC 角色生成 Prompt
 * @module services/ai/prompts/character
 */

/** NPC 角色生成系統提示 */
export const CHARACTER_SYSTEM_PROMPT = `你是一個狼人殺遊戲的 NPC 角色生成器。
你需要生成具有獨特個性的遊戲角色，讓遊戲更有趣。

角色應該具有：
1. 獨特的名字（中文名字，2-3個字）
2. 年齡（18-65歲之間）
3. 職業（符合村莊背景）
4. 個性描述（2-3個特徵）
5. 說話風格（獨特的口吻或口頭禪）

請用繁體中文回答，並確保角色有足夠的特色來區分。`;

/** NPC 角色生成用戶提示 */
export const CHARACTER_USER_PROMPT = `請生成一個狼人殺遊戲的 NPC 角色。

要求：
- 這是一個傳統村莊背景的遊戲
- 角色應該有鮮明的個性
- 說話風格要獨特且一致

請以 JSON 格式回答：
{
  "name": "角色名字",
  "age": 年齡數字,
  "profession": "職業",
  "personality": "個性描述",
  "speechStyle": "說話風格描述",
  "catchphrase": "口頭禪（可選）"
}`;

/** 生成多個角色的用戶提示 */
export function getMultipleCharactersPrompt(count: number): string {
    return `請生成 ${count} 個狼人殺遊戲的 NPC 角色。

要求：
- 這是一個傳統村莊背景的遊戲
- 每個角色應該有鮮明且不同的個性
- 說話風格要獨特且一致
- 角色之間應該有明顯差異

請以 JSON 格式回答：
{
  "characters": [
    {
      "name": "角色名字",
      "age": 年齡數字,
      "profession": "職業",
      "personality": "個性描述",
      "speechStyle": "說話風格描述",
      "catchphrase": "口頭禪（可選）"
    }
  ]
}`;
}
