import LLMService from "./services/llmService.js";
import UIComponents from "./components/UIComponents.js";
import SuggestionManager from "./services/suggestionManager.js";
import ReplyManager from "./services/replyManager.js";

(function () {
  let textFields = [];
  let activeTextField = null;
  let suggestionManager;
  let replyManager;

  const suggestionOverlay = UIComponents.createSuggestionOverlay();
  const { autoReplyPanel, model } = UIComponents.createAutoReplyPanel();

  function init() {
    findTextFields();

    const observer = new MutationObserver(onMutation);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    document.addEventListener("focus", onFocus, true);
    document.addEventListener("blur", onBlur, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKeyDown, true);

    createUIElements();
  }

  function findTextFields() {
    const inputs = document.querySelectorAll(
      'input[type="text"], input[type="email"], textarea, [contenteditable="true"]'
    );
    inputs.forEach((field) => {
      if (!textFields.includes(field)) {
        if (!isOurUIElement(field)) {
          textFields.push(field);
          addFieldListeners(field);
        }
      }
    });
  }

  function addFieldListeners(field) {
    field.addEventListener("focus", () => {
      if (!isOurUIElement(field)) {
        activeTextField = field;
        positionUIElements();
      }
    });
  }

  function onMutation(mutations) {
    let shouldRefresh = false;

    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldRefresh = true;
      }
    });

    if (shouldRefresh) {
      findTextFields();
    }
  }

  function onFocus(event) {
    const target = event.target;
    if (isTextField(target) && !isOurUIElement(target)) {
      activeTextField = target;
      positionUIElements();
    }
  }

  function onBlur(event) {
    setTimeout(() => {
      if (!isOurUIElement(document.activeElement)) {
        hideSuggestionOverlay();
      }
    }, 100);
  }

  function onInput(event) {
    const target = event.target;
    if (isTextField(target) && target === activeTextField) {
      chrome.storage.sync.get("grammarCheck", function (data) {
        if (data.grammarCheck !== false) {
          debounce(checkGrammar, 1000)();
        }
      });
    }
  }

  function onKeyDown(event) {
    if (isTextField(event.target) && event.ctrlKey && event.code === "Space") {
      event.preventDefault();

      chrome.storage.sync.get("autoReply", function (data) {
        if (data.autoReply !== false) {
          generateAutoReply();
        }
      });
    }

    if (event.key === "Escape") {
      hideSuggestionOverlay();
      hideAutoReplyPanel();
    }
  }

  function createUIElements() {
    const floatingButtons = UIComponents.createFloatingButtons(
      handleGrammarCheck,
      handleReplyGeneration
    );
    document.body.appendChild(floatingButtons);

    document.body.appendChild(suggestionOverlay);

    document.body.appendChild(autoReplyPanel);

    suggestionManager = new SuggestionManager();
    suggestionManager.init(suggestionOverlay, activeTextField);

    replyManager = new ReplyManager();
    replyManager.init(autoReplyPanel, model, activeTextField);
  }

  async function handleGrammarCheck() {
    const text =
      window.getSelection().toString() || getTextFromField(activeTextField);
    if (!text) return;

    const response = await LLMService.checkGrammar(text);
    if (response?.suggestions) {
      showSuggestions(response.suggestions);
    }
  }

  async function handleReplyGeneration() {
    const text =
      window.getSelection().toString() || getTextFromField(activeTextField);
    if (!text) return;

    const response = await LLMService.generateReply(text);
    if (response?.reply) {
      showAutoReplyPanel(response.reply, true);
    }
  }

  function positionUIElements() {
    if (!activeTextField && !window.getSelection().toString()) return;

    const floatingButtons = document.querySelector(".floating-buttons");
    if (!floatingButtons) return;

    let rect;
    const selection = window.getSelection();

    if (selection.toString()) {
      rect = selection.getRangeAt(0).getBoundingClientRect();
    } else if (activeTextField) {
      rect = activeTextField.getBoundingClientRect();
    }

    if (rect) {
      floatingButtons.style.display = "flex";
      floatingButtons.style.top = `${rect.bottom + window.scrollY}px`;
      floatingButtons.style.left = `${rect.right + window.scrollX}px`;
    } else {
      floatingButtons.style.display = "none";
    }

    if (!activeTextField) return;

    rect = activeTextField.getBoundingClientRect();

    if (suggestionOverlay) {
      suggestionOverlay.style.top = `${rect.bottom + window.scrollY}px`;
      suggestionOverlay.style.left = `${rect.left + window.scrollX}px`;
    }
  }

  function isTextField(element) {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();
    return (
      (tagName === "input" &&
        (element.type === "text" || element.type === "email")) ||
      tagName === "textarea" ||
      element.getAttribute("contenteditable") === "true"
    );
  }

  function isOurUIElement(element) {
    if (!element) return false;

    return (
      element === suggestionOverlay ||
      suggestionOverlay?.contains(element) ||
      element === autoReplyPanel ||
      autoReplyPanel?.contains(element)
    );
  }

  function checkGrammar() {
    if (!activeTextField) return;

    const text = getTextFromField(activeTextField);
    if (!text || text.trim().length === 0) return;

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
          return;
        }

        chrome.runtime.sendMessage(
          {
            action: "checkGrammar",
            text: text,
            provider: provider,
            apiKey: apiKey,
          },
          function (response) {
            if (response && response.suggestions) {
              showSuggestions(response.suggestions);
            }
          }
        );
      }
    );
  }

  function generateAutoReply(context = "") {
    if (!activeTextField) return;

    const possibleContextElements = document.querySelectorAll(
      ".conversation, .thread, .message-container, .email-body"
    );
    if (possibleContextElements.length > 0) {
      context = possibleContextElements[0].textContent;
    }

    if (!context) {
      context = getTextFromField(activeTextField);
    }

    if (!context || context.trim().length === 0) {
      const contextForm = document.createElement("div");
      contextForm.className = "context-form";
      contextForm.innerHTML = `
        <div style="margin-bottom: 10px;">Please provide context for generating a reply:</div>
        <textarea style="width: 100%; height: 100px; margin-bottom: 10px;"></textarea>
        <div style="display: flex; justify-content: space-between;">
          <button class="submit-btn">Generate Reply</button>
        </div>
      `;

      showAutoReplyPanel("");
      autoReplyPanelModel.appendChild(contextForm);

      const textarea = contextForm.querySelector("textarea");
      const submitBtn = contextForm.querySelector(".submit-btn");

      submitBtn.addEventListener("click", () => {
        const userContext = textarea.value.trim();
        if (userContext) {
          context = userContext;
        }
        generateAutoReply(context);
        hideAutoReplyPanel();
      });
      return;
    }

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
          showAutoReplyPanel(
            `No API key configured for ${provider}. Please add your API key in the extension settings.`
          );
          return;
        }

        showAutoReplyPanel("Generating response...");

        chrome.runtime.sendMessage(
          {
            action: "generateReply",
            context: context,
            provider: provider,
            apiKey: apiKey,
          },
          function (response) {
            if (response && response.reply) {
              showAutoReplyPanel(response.reply, true);
            } else {
              showAutoReplyPanel(
                "Failed to generate a response. Please try again."
              );
            }
          }
        );
      }
    );
  }

  function showSuggestions(suggestions) {
    suggestionManager.showSuggestions(suggestions);
    positionUIElements();
  }

  function showAutoReplyPanel(reply, isReply = false) {
    replyManager.showAutoReplyPanel(reply, isReply);
    positionUIElements();
  }

  function hideAutoReplyPanel() {
    replyManager.hideAutoReplyPanel();
  }

  function hideSuggestionOverlay() {
    suggestionManager.hideSuggestionOverlay();
  }

  function getTextFromField(field) {
    if (
      field.tagName.toLowerCase() === "textarea" ||
      (field.tagName.toLowerCase() === "input" &&
        (field.type === "text" || field.type === "email"))
    ) {
      return field.value;
    } else if (field.getAttribute("contenteditable") === "true") {
      return field.textContent;
    }
    return "";
  }

  function debounce(func, wait) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  init();

  document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (selection.toString()) {
      positionUIElements();
    } else {
      const floatingButtons = document.querySelector(".floating-buttons");
      if (floatingButtons && !activeTextField) {
        floatingButtons.style.display = "none";
      }
    }
  });
})();
