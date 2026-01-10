/**
 * GAS (Google Apps Script) 整合
 * @module lib/gas
 */

/** GAS 配置 */
export interface GasConfig {
    /** GAS Web App URL */
    webAppUrl: string;
}

/** API Key 回應格式 */
interface ApiKeyResponse {
    success: boolean;
    apiKey?: string;
    error?: string;
}

/** GAS 配置實例 */
let gasConfig: GasConfig | null = null;

/**
 * 初始化 GAS 配置
 */
export function initializeGas(config: GasConfig): void {
    gasConfig = config;
}

/**
 * 取得 GAS 配置
 */
export function getGasConfig(): GasConfig | null {
    return gasConfig;
}

/**
 * 從 GAS 取得 OpenAI API Key
 */
export async function getApiKeyFromGas(): Promise<string> {
    if (!gasConfig) {
        throw new Error('GAS 尚未初始化，請先呼叫 initializeGas');
    }

    try {
        const response = await fetch(gasConfig.webAppUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`GAS 請求失敗: ${response.status}`);
        }

        const data: ApiKeyResponse = await response.json();

        if (!data.success || !data.apiKey) {
            throw new Error(data.error || 'GAS 返回無效回應');
        }

        return data.apiKey;
    } catch (error) {
        console.error('從 GAS 取得 API Key 失敗:', error);
        throw error;
    }
}

/**
 * 測試 GAS 連線
 */
export async function testGasConnection(): Promise<boolean> {
    if (!gasConfig) {
        return false;
    }

    try {
        const response = await fetch(gasConfig.webAppUrl, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
}
