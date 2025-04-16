export default class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
  }

  async checkGrammar(text) {
    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Please check this text for grammar and suggest improvements: "${text}"`
          }]
        }]
      })
    });

    return await response.json();
  }

  async generateReply(context) {
    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate a professional reply to this email: "${context}"`
          }]
        }]
      })
    });

    return await response.json();
  }
}
