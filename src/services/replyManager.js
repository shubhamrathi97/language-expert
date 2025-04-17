export default class ReplyManager {
  constructor() {
    this.autoReplyPanel = null;
    this.autoReplyPanelModel = null;
    this.activeTextField = null;
  }

  init(autoReplyPanel, autoReplyPanelModel, activeTextField) {
    this.autoReplyPanel = autoReplyPanel;
    this.autoReplyPanelModel = autoReplyPanelModel;
    this.activeTextField = activeTextField;
  }

  showAutoReplyPanel(reply, isReply = false) {
    if (!this.autoReplyPanelModel || !this.activeTextField) return;

    this.autoReplyPanelModel.innerHTML = "";

    if (isReply) {
      const replyContent = document.createElement("div");
      replyContent.className = "reply-content";
      replyContent.textContent = reply;

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "reply-buttons";

      const useButton = document.createElement("button");
      useButton.className = "use-reply-button";
      useButton.textContent = "Use This Reply";
      useButton.addEventListener("click", () => {
        this.setTextInField(this.activeTextField, reply);
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
}
