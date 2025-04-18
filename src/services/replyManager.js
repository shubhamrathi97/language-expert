import LLMService from "./llmService.js";
import UIComponents from "../components/UIComponents.js";

export default class ReplyManager {
  constructor() {
    this.autoReplyPanel = null;
    this.autoReplyPanelModel = null;
  }

  init(autoReplyPanel, autoReplyPanelModel, activeTextField) {
    this.autoReplyPanel = autoReplyPanel;
    this.autoReplyPanelModel = autoReplyPanelModel;
  }

  showAutoReplyPanel(reply, field, isReply = false) {
    console.log("showAutoReplyPanel: ", reply, isReply);
    if (!this.autoReplyPanelModel || !field) return;

    this.autoReplyPanelModel.innerHTML = "";

    if (isReply) {
      const replyContent = document.createElement("div");
      replyContent.className = "reply-content";
      replyContent.textContent = reply;
      replyContent.contentEditable = "true";

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "reply-buttons";

      const useButton = document.createElement("button");
      useButton.className = "use-reply-button";
      useButton.textContent = "Use This Reply";
      useButton.addEventListener("click", () => {
        this.setTextInField(field, replyContent.textContent);
        this.hideAutoReplyPanel();
      });

      const regenerateButton = document.createElement("button");
      regenerateButton.className = "regenerate-button";
      regenerateButton.textContent = "Regenerate";
      regenerateButton.addEventListener("click", () => {
        this.generateAutoReply();
      });

      const closeButton = document.createElement("button");
      closeButton.className = "close-button";
      closeButton.textContent = "Close";
      closeButton.addEventListener("click", () => {
        this.hideAutoReplyPanel();
      });

      buttonContainer.appendChild(useButton);
      buttonContainer.appendChild(regenerateButton);
      buttonContainer.appendChild(closeButton);

      this.autoReplyPanelModel.appendChild(replyContent);
      this.autoReplyPanelModel.appendChild(buttonContainer);
      console.log("showAutoReplyPanel: adding use button");
    } else {
      const messageElement = document.createElement("div");
      messageElement.className = "reply-message";
      messageElement.textContent = reply;

      const closeButton = document.createElement("button");
      closeButton.className = "close-button";
      closeButton.textContent = "Close";
      closeButton.addEventListener("click", () => {
        this.hideAutoReplyPanel();
      });

      this.autoReplyPanelModel.appendChild(messageElement);
      this.autoReplyPanelModel.appendChild(closeButton);
    }

    this.autoReplyPanel.style.display = "flex";
    console.log(
      "showAutoReplyPanel: autoReplyPanel.style.display: ",
      this.autoReplyPanel.style.display
    );
  }

  hideAutoReplyPanel() {
    if (this.autoReplyPanel) {
      this.autoReplyPanel.style.display = "none";
    }
  }

  setTextInField(field, text) {
    if (
      field.tagName.toLowerCase() === "textarea" ||
      (field.tagName.toLowerCase() === "input" &&
        (field.type === "text" || field.type === "email"))
    ) {
      field.value = text;
    } else if (field.getAttribute("contenteditable") === "true") {
      field.textContent = text;
    }
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }

  handleReplyGeneration(selectedText, contextText, activeField, website) {
    this.autoReplyPanelModel.innerHTML =
      UIComponents.createContextForm(website);
    this.autoReplyPanel.style.display = "flex";

    const actionContextInput =
      this.autoReplyPanelModel.querySelector("#actionContext");
    const contextBackgroundInput =
      this.autoReplyPanelModel.querySelector("#contextBackground");
    const websiteInput = this.autoReplyPanelModel.querySelector("#website");
    const actionInput = this.autoReplyPanelModel.querySelector("#action");
    const toneInput = this.autoReplyPanelModel.querySelector("#tone");
    const generateBtn = this.autoReplyPanelModel.querySelector("#generateBtn");

    // Adding action details for selected text.
    actionContextInput.value = selectedText;

    // Adding background/ previous conversation details for AI.
    contextBackgroundInput.value = contextText;

    // Submit button
    const loader = generateBtn.querySelector(".loader");
    const btnText = generateBtn.querySelector("span");

    generateBtn.addEventListener("click", async () => {
      const action = actionInput.value;
      const actionContext = actionContextInput.value;
      const tone = toneInput.value;
      const backgroundContext = contextBackgroundInput.value;
      const website = websiteInput.value;

      if (!action || !tone) {
        alert("Please select both action and tone");
        return;
      }

      // Show loading state
      loader.style.display = "block";
      btnText.style.display = "none";
      generateBtn.disabled = true;

      try {
        const response = await LLMService.generateReply(
          this.generatePrompt(
            action,
            actionContext,
            backgroundContext,
            website,
            tone
          )
        );

        if (response?.reply) {
          this.showAutoReplyPanel(response.reply, activeField, true);
        }
      } catch (error) {
        console.error("Error generating reply:", error);
        alert("Failed to generate reply. Please try again.");
      } finally {
        // Hide loading state
        loader.style.display = "none";
        btnText.style.display = "block";
        generateBtn.disabled = false;
      }
    });
  }

  generatePrompt(action, actionContext, contextText, website, tone) {
    let prompt = `You are a helpful writer assistant. Help in Generating the ${action} response for the following input: "${actionContext}"`;
    if (contextText) {
      prompt += `\n\nBackground Context for generating the input : "${contextText}"`;
    }
    if (website) {
      prompt += `\n\nResponse format should follow guideline of website: "${website}"`;
    }
    if (tone) {
      prompt += `\n\nTone: "${tone}"`;
    }
    return prompt;
  }
}
