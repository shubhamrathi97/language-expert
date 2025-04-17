import { LLMProvider } from "./providers/llmProvider.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const llm = LLMProvider.create(request.provider, request.apiKey);
  try {
    if (request.action === "checkGrammar") {
      handleGrammarCheck(llm, request.text, sendResponse);
      return true;
    }

    if (request.action === "generateReply") {
      handleReplyGeneration(llm, request.context, sendResponse);
      return true;
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
    console.log("Error in background script:", error);
  }
});

async function handleGrammarCheck(llm, text, sendResponse) {
  try {
    const suggestions = await llm.checkGrammar(text);
    sendResponse({ success: true, suggestions });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function handleReplyGeneration(llm, context, sendResponse) {
  try {
    const reply = await llm.generateReply(context);
    sendResponse({ success: true, reply });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}
