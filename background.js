import { LLMFactory } from './services/llm-factory.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkGrammar') {
    handleGrammarCheck(request.text, sendResponse);
    return true;
  }
  
  if (request.action === 'generateReply') {
    handleReplyGeneration(request.context, sendResponse);
    return true;
  }
});

async function handleGrammarCheck(text, sendResponse) {
  try {
    const llm = await getLLMProvider();
    const suggestions = await llm.checkGrammar(text);
    sendResponse({ success: true, suggestions });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleReplyGeneration(context, sendResponse) {
  try {
    const llm = await getLLMProvider();
    const reply = await llm.generateReply(context);
    sendResponse({ success: true, reply });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function getLLMProvider() {
  const { llmProvider, apiKey } = await chrome.storage.sync.get(['llmProvider', 'apiKey']);
  return LLMFactory.create(llmProvider, apiKey);
}
