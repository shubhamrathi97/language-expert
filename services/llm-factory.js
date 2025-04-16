import OpenAIProvider from './providers/openai.js';
import GeminiProvider from './providers/gemini.js';

export class LLMFactory {
  static create(provider, apiKey) {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      case 'gemini':
        return new GeminiProvider(apiKey);
      default:
        throw new Error('Unsupported LLM provider');
    }
  }
}
