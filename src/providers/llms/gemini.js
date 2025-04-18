export default class GeminiProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoint =
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";
  }

  async checkGrammar(text) {
    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Please check this text for grammar and suggest improvements: "${text}"`,
              },
            ],
          },
        ],
      }),
    });

    return await response.json();
  }

  async generateReply(context) {
    const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: context,
              },
            ],
          },
        ],
      }),
    });
    let res = await response.json();
    console.log("Gemini response:", res);
    if (res.error) {
      throw new Error(res.error.message);
    }
    return res?.candidates[0]?.content?.parts[0]?.text;
  }
}
