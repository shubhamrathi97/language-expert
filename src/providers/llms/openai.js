export default class OpenAIProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async checkGrammar(text) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Please check this text for grammar and suggest improvements: "${text}"`
        }]
      })
    });

    return await response.json();
  }

  async generateReply(context) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'user',
          content: `Generate a professional reply to this email: "${context}"`
        }]
      })
    });

    return await response.json();
  }
}
