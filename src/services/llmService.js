class LLMService {
  static async checkGrammar(text) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          "llmProvider",
          "openaiKey",
          "anthropicKey",
          "geminiKey",
          "deepseekKey",
          "grokKey",
        ],
        function (data) {
          const provider = data.llmProvider || "openai";
          const apiKey = data[`${provider}Key`];

          if (!apiKey) {
            console.error(`No API key configured for ${provider}`);
            resolve(null);
            return;
          }

          chrome.runtime.sendMessage(
            {
              action: "checkGrammar",
              text: text,
              provider: provider,
              apiKey: apiKey,
            },
            resolve
          );
        }
      );
    });
  }

  static async generateReply(context) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(
        [
          "llmProvider",
          "openaiKey",
          "anthropicKey",
          "geminiKey",
          "deepseekKey",
          "grokKey",
        ],
        function (data) {
          const provider = data.llmProvider || "openai";
          const apiKey = data[`${provider}Key`];

          if (!apiKey) {
            resolve({ error: `No API key configured for ${provider}` });
            return;
          }

          chrome.runtime.sendMessage(
            {
              action: "generateReply",
              context: context,
              provider: provider,
              apiKey: apiKey,
            },
            resolve
          );
        }
      );
    });
  }
}

export default LLMService;
