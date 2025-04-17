export default class SuggestionManager {
  constructor() {
    this.suggestionOverlay = null;
    this.activeTextField = null;
  }

  init(suggestionOverlay, activeTextField) {
    this.suggestionOverlay = suggestionOverlay;
    this.activeTextField = activeTextField;
  }

  showSuggestions(suggestions) {
    if (
      !this.suggestionOverlay ||
      !this.activeTextField ||
      suggestions.length === 0
    )
      return;

    this.suggestionOverlay.innerHTML = "";

    suggestions?.forEach((suggestion) => {
      const suggestionElement = document.createElement("div");
      suggestionElement.className = "suggestion-item";

      const originalSpan = document.createElement("span");
      originalSpan.className = "original-text";
      originalSpan.textContent = suggestion.original;

      const correctionSpan = document.createElement("span");
      correctionSpan.className = "correction-text";
      correctionSpan.textContent = suggestion.correction;

      const applyButton = document.createElement("button");
      applyButton.className = "apply-button";
      applyButton.textContent = "Apply";
      applyButton.addEventListener("click", () => {
        this.applySuggestion(suggestion);
      });

      suggestionElement.appendChild(originalSpan);
      suggestionElement.appendChild(document.createTextNode(" → "));
      suggestionElement.appendChild(correctionSpan);
      suggestionElement.appendChild(applyButton);

      this.suggestionOverlay.appendChild(suggestionElement);
    });

    this.suggestionOverlay.style.display = "block";
  }

  applySuggestion(suggestion) {
    if (!this.activeTextField) return;
    const text = this.getTextFromField(this.activeTextField);
    const newText = text.replace(suggestion.original, suggestion.correction);
    this.setTextInField(this.activeTextField, newText);
    this.hideSuggestionOverlay();
  }

  hideSuggestionOverlay() {
    if (this.suggestionOverlay) {
      this.suggestionOverlay.style.display = "none";
    }
  }

  getTextFromField(field) {
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
