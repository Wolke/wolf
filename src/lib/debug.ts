/**
 * Debug 日誌工具
 * @module lib/debug
 * 
 * 根據設定決定是否在 UI 上顯示 debug 訊息
 * - showDebugInUI = true: 同時輸出到 console 和 UI
 * - showDebugInUI = false: 只輸出到 console
 */

/** Debug 設定 */
let debugConfig = {
    showDebugInUI: false,
};

/**
 * 設定 debug 配置
 */
export function setDebugConfig(config: { showDebugInUI: boolean }): void {
    debugConfig = { ...debugConfig, ...config };
}

/**
 * 檢查是否在 UI 上顯示 debug
 */
export function shouldShowDebugInUI(): boolean {
    return debugConfig.showDebugInUI;
}

/**
 * Debug 日誌（只在 console 輸出，不在 UI 顯示）
 */
export function debugLog(...args: unknown[]): void {
    console.log(...args);
}

/**
 * Debug 警告
 */
export function debugWarn(...args: unknown[]): void {
    console.warn(...args);
}

/**
 * Debug 錯誤
 */
export function debugError(...args: unknown[]): void {
    console.error(...args);
}

/**
 * API 請求日誌
 */
export function logApiRequest(model: string, messages: { role: string; content: unknown }[]): void {
    console.log('\n📤 ======== OpenAI API Request ========');
    console.log('📌 Model:', model);
    console.log('📝 Messages:');
    messages.forEach((msg, i) => {
        const content = typeof msg.content === 'string'
            ? (msg.content.length > 200 ? msg.content.substring(0, 200) + '...' : msg.content)
            : msg.content;
        console.log(`  [${i}] ${msg.role}:`, content);
    });
    console.log('========================================\n');
}

/**
 * API 回應日誌
 */
export function logApiResponse(content: string | null, usage?: unknown): void {
    console.log('\n📥 ======== OpenAI API Response ========');
    console.log('📦 Content:', content);
    if (usage) {
        console.log('📊 Usage:', usage);
    }
    console.log('=========================================\n');
}
