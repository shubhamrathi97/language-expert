class UIComponents {
  static createFloatingButtons(onGrammarClick, onReplyClick) {
    const floatingButtons = document.createElement("div");
    floatingButtons.className = "floating-buttons";

    const grammarButton = document.createElement("button");
    grammarButton.className = "icon-button grammar-check";
    grammarButton.innerHTML = "✓";
    grammarButton.addEventListener("click", onGrammarClick);

    const replyButton = document.createElement("button");
    replyButton.className = "icon-button generate-reply";
    replyButton.innerHTML = "↺";
    replyButton.addEventListener("click", onReplyClick);

    floatingButtons.appendChild(replyButton);
    return floatingButtons;
  }

  static createSuggestionOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "grammar-suggestion-overlay";
    overlay.style.display = "none";
    return overlay;
  }

  static createAutoReplyPanel() {
    const autoReplyPanel = document.createElement("div");
    autoReplyPanel.className = "auto-reply-panel";

    const model = document.createElement("div");
    model.className = "auto-reply-panel-model";

    autoReplyPanel.appendChild(model);
    return { autoReplyPanel, model };
  }

  // static createContextForm(onSubmit) {
  //   const form = document.createElement("div");
  //   form.className = "context-form";
  //   form.innerHTML = `
  //     <div style="margin-bottom: 10px;">Please provide context for generating a reply:</div>
  //     <textarea style="width: 100%; height: 100px; margin-bottom: 10px;"></textarea>
  //     <div style="display: flex; justify-content: space-between;">
  //       <button class="submit-btn">Generate Reply</button>
  //     </div>
  //   `;

  //   const submitBtn = form.querySelector(".submit-btn");
  //   submitBtn.addEventListener("click", () => {
  //     const context = form.querySelector("textarea").value.trim();
  //     onSubmit(context);
  //   });

  //   return form;
  // }

  static createContextForm = (website = "") => {
    return `
        <select id="action" required>
            <option value="reply" default>Reply</option>
            <option value="compose">Compose New</option>
            <option value="improve">Improve Existing</option>
        </select>
        <textarea id="actionContext" placeholder="Instructions for generating response" rows="3"></textarea>
        <textarea id="contextBackground" placeholder="Background context/knowledge for the generating response" rows="3"></textarea>
        <input type="text" id="website" value="${website}" placeholder="Website" readonly>
        <select id="tone" required>
            <option value="professional" default>Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
        </select>
        <button id="generateBtn" class="generate-btn">
            <span>Generate</span>
            <div class="loader" style="display: none;"></div>
        </button>
    `;
  };
}

export default UIComponents;
