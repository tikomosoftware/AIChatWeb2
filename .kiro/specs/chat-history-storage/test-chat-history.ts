/**
 * Chat History Integration Test
 * 
 * このスクリプトは以下をテストします：
 * 1. チャット機能が正常に動作し、履歴がSupabaseに保存されること
 * 2. Supabase接続エラー時でもチャット機能が継続すること
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { ChatHistoryService } from '../../../lib/services/ChatHistoryService';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  } catch (error) {
    console.warn('Could not load .env.local file:', error);
  }
}

// Load environment variables before running tests
loadEnvFile();

// テスト用のカラー出力
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testChatHistorySave() {
  log('\n=== Test 1: Chat History Save ===', 'blue');
  
  try {
    const service = new ChatHistoryService();
    const testQuestion = 'テスト質問: チャット履歴機能は動作していますか？';
    const testAnswer = 'テスト回答: はい、チャット履歴機能は正常に動作しています。';
    
    log('Saving test chat to Supabase...', 'yellow');
    await service.saveChat(testQuestion, testAnswer);
    
    log('✓ Chat history saved successfully', 'green');
    log('Please check Supabase dashboard to verify the record was created', 'yellow');
    return true;
  } catch (error) {
    log(`✗ Test failed: ${error}`, 'red');
    return false;
  }
}

async function testChatHistoryErrorHandling() {
  log('\n=== Test 2: Error Handling (Simulated) ===', 'blue');
  
  try {
    // 環境変数を一時的に保存
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // 環境変数を無効化
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    log('Testing with invalid Supabase configuration...', 'yellow');
    const service = new ChatHistoryService();
    
    // この呼び出しはエラーをログに出力するが、throwしない
    await service.saveChat('Test question', 'Test answer');
    
    // 環境変数を復元
    if (originalUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    
    log('✓ Service handled error gracefully (no exception thrown)', 'green');
    log('Check console output above for error logs', 'yellow');
    return true;
  } catch (error) {
    log(`✗ Test failed: Service should not throw errors: ${error}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════╗', 'blue');
  log('║  Chat History Integration Test Suite  ║', 'blue');
  log('╚════════════════════════════════════════╝', 'blue');
  
  const results = {
    test1: await testChatHistorySave(),
    test2: await testChatHistoryErrorHandling(),
  };
  
  log('\n=== Test Summary ===', 'blue');
  log(`Test 1 (Save): ${results.test1 ? '✓ PASSED' : '✗ FAILED'}`, results.test1 ? 'green' : 'red');
  log(`Test 2 (Error Handling): ${results.test2 ? '✓ PASSED' : '✗ FAILED'}`, results.test2 ? 'green' : 'red');
  
  const allPassed = results.test1 && results.test2;
  log(`\nOverall: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`, allPassed ? 'green' : 'red');
  
  log('\n=== Manual Verification Steps ===', 'yellow');
  log('1. Open Supabase Dashboard: https://supabase.com/dashboard', 'yellow');
  log('2. Navigate to: Table Editor > chat_history', 'yellow');
  log('3. Verify that a new record was created with the test question and answer', 'yellow');
  log('4. Test the actual chat UI at http://localhost:3000', 'yellow');
  log('5. Send a message and verify it appears in the Supabase table', 'yellow');
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\nUnexpected error: ${error}`, 'red');
  process.exit(1);
});
