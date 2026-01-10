/**
 * 狼人殺遊戲 - Google Apps Script
 * 
 * 用途：
 * 1. 安全存放 OpenAI API Key
 * 2. 提供 API 給前端取得 Key
 * 
 * 部署步驟：
 * 1. 在 Google Apps Script 新增專案
 * 2. 貼上此程式碼
 * 3. 設定 Script Properties（專案設定 > 腳本屬性）：
 *    - 新增屬性 `OPENAI_API_KEY`，值為你的 OpenAI API Key
 * 4. 部署為網路應用程式：
 *    - 部署 > 新增部署
 *    - 類型：網路應用程式
 *    - 執行身分：我
 *    - 存取權限：任何人
 * 5. 複製部署後的 Web App URL 給前端使用
 */

/**
 * 處理 GET 請求 - 返回 API Key
 */
function doGet(e) {
  // 設定 CORS 標頭
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // 從 Script Properties 取得 API Key
    const scriptProperties = PropertiesService.getScriptProperties();
    const apiKey = scriptProperties.getProperty('OPENAI_API_KEY');
    
    if (!apiKey) {
      output.setContent(JSON.stringify({
        success: false,
        error: 'API Key 未設定，請在 Script Properties 中設定 OPENAI_API_KEY'
      }));
      return output;
    }
    
    output.setContent(JSON.stringify({
      success: true,
      apiKey: apiKey
    }));
    return output;
    
  } catch (error) {
    output.setContent(JSON.stringify({
      success: false,
      error: error.message
    }));
    return output;
  }
}

/**
 * 處理 OPTIONS 請求 (CORS preflight)
 */
function doOptions(e) {
  const output = ContentService.createTextOutput();
  return output;
}

/**
 * 測試用：手動執行檢查設定
 */
function testApiKey() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty('OPENAI_API_KEY');
  
  if (apiKey) {
    Logger.log('✅ API Key 已設定（長度：' + apiKey.length + '）');
    Logger.log('前 8 字元：' + apiKey.substring(0, 8) + '...');
  } else {
    Logger.log('❌ API Key 未設定');
    Logger.log('請到「專案設定 > 腳本屬性」新增 OPENAI_API_KEY');
  }
}
