import OpenAIProvider from "./llms/openai.js";
import GeminiProvider from "./llms/gemini.js";

export class LLMProvider {
  static create(provider, apiKey) {
    switch (provider) {
      case "openai":
        return new OpenAIProvider(apiKey);
      case "gemini":
        return new GeminiProvider(apiKey);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}
