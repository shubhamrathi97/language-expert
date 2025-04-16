// content.js - Injects UI elements and handles text field interactions
(function() {
    // Detected text fields on the page
    let textFields = [];
    // Current active text field
    let activeTextField = null;
    // Grammar suggestion overlay
    let suggestionOverlay = null;
    // Auto-reply panel
    let autoReplyPanel = null;
    
    // Initialize the extension
    function init() {
      // Find all editable text fields
      findTextFields();
      
      // Listen for DOM changes to find new text fields
      const observer = new MutationObserver(onMutation);
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Listen for user interactions
      document.addEventListener('focus', onFocus, true);
      document.addEventListener('blur', onBlur, true);
      document.addEventListener('input', onInput, true);
      document.addEventListener('keydown', onKeyDown, true);
      
      // Create UI elements
      createUIElements();
    }
    
    // Find all editable text fields on the page
    function findTextFields() {
      const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea, [contenteditable="true"]');
      inputs.forEach(field => {
        if (!textFields.includes(field)) {
          textFields.push(field);
          addFieldListeners(field);
        }
      });
    }
    
    // Add listeners to individual text fields
    function addFieldListeners(field) {
      field.addEventListener('focus', () => {
        activeTextField = field;
        positionUIElements();
      });
    }
    
    // Handle DOM mutations to find new text fields
    function onMutation(mutations) {
      let shouldRefresh = false;
      
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          shouldRefresh = true;
        }
      });
      
      if (shouldRefresh) {
        findTextFields();
      }
    }
    
    // Handle focus events
    function onFocus(event) {
      const target = event.target;
      if (isTextField(target)) {
        activeTextField = target;
        positionUIElements();
      }
    }
    
    // Handle blur events
    function onBlur(event) {
      // Short delay to allow checking if focus went to one of our UI elements
      setTimeout(() => {
        if (!isOurUIElement(document.activeElement)) {
          hideSuggestionOverlay();
        }
      }, 100);
    }
    
    // Handle input events
    function onInput(event) {
      const target = event.target;
      if (isTextField(target) && target === activeTextField) {
        // Check if grammar checking is enabled
        chrome.storage.sync.get('grammarCheck', function(data) {
          if (data.grammarCheck !== false) {
            // Delay to avoid frequent API calls while typing
            debounce(checkGrammar, 1000)();
          }
        });
      }
    }
    
    // Handle keyboard events
    function onKeyDown(event) {
      // If text field has focus and user presses Ctrl+Space, show auto-reply
      if (isTextField(event.target) && event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        
        chrome.storage.sync.get('autoReply', function(data) {
          if (data.autoReply !== false) {
            generateAutoReply();
          }
        });
      }
      
      // If Escape is pressed, hide UI elements
      if (event.key === 'Escape') {
        hideSuggestionOverlay();
        hideAutoReplyPanel();
      }
    }
    
    // Create UI elements for suggestions and auto-reply
    function createUIElements() {
      // Create grammar suggestion overlay
      suggestionOverlay = document.createElement('div');
      suggestionOverlay.className = 'grammar-suggestion-overlay';
      suggestionOverlay.style.display = 'none';
      document.body.appendChild(suggestionOverlay);
      
      // Create auto-reply panel
      autoReplyPanel = document.createElement('div');
      autoReplyPanel.className = 'auto-reply-panel';
      autoReplyPanel.style.display = 'none';
      document.body.appendChild(autoReplyPanel);
    }
    
    // Position UI elements relative to active text field
    function positionUIElements() {
      if (!activeTextField) return;
      
      const rect = activeTextField.getBoundingClientRect();
      
      // Position suggestion overlay
      if (suggestionOverlay) {
        suggestionOverlay.style.top = `${rect.bottom + window.scrollY}px`;
        suggestionOverlay.style.left = `${rect.left + window.scrollX}px`;
      }
      
      // Position auto-reply panel
      if (autoReplyPanel) {
        autoReplyPanel.style.top = `${rect.bottom + window.scrollY + 5}px`;
        autoReplyPanel.style.left = `${rect.left + window.scrollX}px`;
        autoReplyPanel.style.width = `${Math.max(300, rect.width)}px`;
      }
    }
    
    // Check if element is a text field
    function isTextField(element) {
      if (!element) return false;
      
      const tagName = element.tagName.toLowerCase();
      return (
        (tagName === 'input' && 
         (element.type === 'text' || element.type === 'email')) ||
        tagName === 'textarea' ||
        element.getAttribute('contenteditable') === 'true'
      );
    }
    
    // Check if element is one of our UI elements
    function isOurUIElement(element) {
      if (!element) return false;
      
      return (
        element === suggestionOverlay ||
        suggestionOverlay.contains(element) ||
        element === autoReplyPanel ||
        autoReplyPanel.contains(element)
      );
    }
    
    // Check grammar of text in active field
    function checkGrammar() {
      if (!activeTextField) return;
      
      const text = getTextFromField(activeTextField);
      if (!text || text.trim().length === 0) return;
      
      // Get the configured LLM provider and API key
      chrome.storage.sync.get(['llmProvider', 'openaiKey', 'anthropicKey', 'geminiKey', 'deepseekKey', 'grokKey'], function(data) {
        const provider = data.llmProvider || 'openai';
        const apiKey = data[`${provider}Key`];
        
        if (!apiKey) {
          console.error(`No API key configured for ${provider}`);
          return;
        }
        
        // Send message to background script for API call
        chrome.runtime.sendMessage({
          action: 'checkGrammar',
          text: text,
          provider: provider,
          apiKey: apiKey
        }, function(response) {
          if (response && response.suggestions) {
            showSuggestions(response.suggestions);
          }
        });
      });
    }
    
    // Generate auto-reply based on context
    function generateAutoReply() {
      if (!activeTextField) return;
      
      // Get context from the page - this is a simplified approach
      // In a real implementation, you'd need more sophisticated context gathering
      let context = '';
      
      // Try to find conversation history
      const possibleContextElements = document.querySelectorAll('.conversation, .thread, .message-container, .email-body');
      if (possibleContextElements.length > 0) {
        // Use the first found element as context
        context = possibleContextElements[0].textContent;
      }
      
      // If no context found, use the current text field as context
      if (!context) {
        context = getTextFromField(activeTextField);
      }
      
      if (!context || context.trim().length === 0) {
        showAutoReplyPanel('No context found to generate a reply.');
        return;
      }
      
      // Get the configured LLM provider and API key
      chrome.storage.sync.get(['llmProvider', 'openaiKey', 'anthropicKey', 'geminiKey', 'deepseekKey', 'grokKey'], function(data) {
        const provider = data.llmProvider || 'openai';
        const apiKey = data[`${provider}Key`];
        
        if (!apiKey) {
          showAutoReplyPanel(`No API key configured for ${provider}. Please add your API key in the extension settings.`);
          return;
        }
        
        // Show loading state
        showAutoReplyPanel('Generating response...');
        
        // Send message to background script for API call
        chrome.runtime.sendMessage({
          action: 'generateReply',
          context: context,
          provider: provider,
          apiKey: apiKey
        }, function(response) {
          if (response && response.reply) {
            showAutoReplyPanel(response.reply, true);
          } else {
            showAutoReplyPanel('Failed to generate a response. Please try again.');
          }
        });
      });
    }
    
    // Show grammar suggestions in the overlay
    function showSuggestions(suggestions) {
      if (!suggestionOverlay || !activeTextField || suggestions.length === 0) return;
      
      // Clear previous suggestions
      suggestionOverlay.innerHTML = '';
      
      // Create suggestion elements
      suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'suggestion-item';
        
        // Original text with highlight
        const originalSpan = document.createElement('span');
        originalSpan.className = 'original-text';
        originalSpan.textContent = suggestion.original;
        
        // Correction
        const correctionSpan = document.createElement('span');
        correctionSpan.className = 'correction-text';
        correctionSpan.textContent = suggestion.correction;
        
        // Apply correction button
        const applyButton = document.createElement('button');
        applyButton.className = 'apply-button';
        applyButton.textContent = 'Apply';
        applyButton.addEventListener('click', () => {
          applySuggestion(suggestion);
        });
        
        // Assemble the suggestion element
        suggestionElement.appendChild(originalSpan);
        suggestionElement.appendChild(document.createTextNode(' → '));
        suggestionElement.appendChild(correctionSpan);
        suggestionElement.appendChild(applyButton);
        
        suggestionOverlay.appendChild(suggestionElement);
      });
      
      // Show the overlay
      suggestionOverlay.style.display = 'block';
      positionUIElements();
    }
    
    // Apply a grammar suggestion
    function applySuggestion(suggestion) {
      if (!activeTextField) return;
      
      const text = getTextFromField(activeTextField);
      const newText = text.replace(suggestion.original, suggestion.correction);
      
      setTextInField(activeTextField, newText);
      hideSuggestionOverlay();
    }
    
    // Show auto-reply panel with generated reply
    function showAutoReplyPanel(reply, isReply = false) {
      if (!autoReplyPanel || !activeTextField) return;
      
      // Clear previous content
      autoReplyPanel.innerHTML = '';
      
      if (isReply) {
        // Create reply content
        const replyContent = document.createElement('div');
        replyContent.className = 'reply-content';
        replyContent.textContent = reply;
        
        // Create buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'reply-buttons';
        
        const useButton = document.createElement('button');
        useButton.className = 'use-reply-button';
        useButton.textContent = 'Use This Reply';
        useButton.addEventListener('click', () => {
          setTextInField(activeTextField, reply);
          hideAutoReplyPanel();
        });
        
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'regenerate-button';
        regenerateButton.textContent = 'Regenerate';
        regenerateButton.addEventListener('click', () => {
          generateAutoReply();
        });
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
          hideAutoReplyPanel();
        });
        
        buttonContainer.appendChild(useButton);
        buttonContainer.appendChild(regenerateButton);
        buttonContainer.appendChild(closeButton);
        
        // Assemble the panel
        autoReplyPanel.appendChild(replyContent);
        autoReplyPanel.appendChild(buttonContainer);
      } else {
        // Just show a message
        const messageElement = document.createElement('div');
        messageElement.className = 'reply-message';
        messageElement.textContent = reply;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'Close';
        closeButton.addEventListener('click', () => {
          hideAutoReplyPanel();
        });
        
        autoReplyPanel.appendChild(messageElement);
        autoReplyPanel.appendChild(closeButton);
      }
      
      // Show the panel
      autoReplyPanel.style.display = 'block';
      positionUIElements();
    }
    
    // Hide suggestion overlay
    function hideSuggestionOverlay() {
      if (suggestionOverlay) {
        suggestionOverlay.style.display = 'none';
      }
    }
    
    // Hide auto-reply panel
    function hideAutoReplyPanel() {
      if (autoReplyPanel) {
        autoReplyPanel.style.display = 'none';
      }
    }
    
    // Get text from field based on its type
    function getTextFromField(field) {
      if (field.tagName.toLowerCase() === 'textarea' || 
          (field.tagName.toLowerCase() === 'input' && 
           (field.type === 'text' || field.type === 'email'))) {
        return field.value;
      } else if (field.getAttribute('contenteditable') === 'true') {
        return field.textContent;
      }
      return '';
    }
    
    // Set text in field based on its type
    function setTextInField(field, text) {
      if (field.tagName.toLowerCase() === 'textarea' || 
          (field.tagName.toLowerCase() === 'input' && 
           (field.type === 'text' || field.type === 'email'))) {
        field.value = text;
      } else if (field.getAttribute('contenteditable') === 'true') {
        field.textContent = text;
      }
      
      // Trigger input event to notify any listening scripts
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Debounce function to prevent frequent API calls
    function debounce(func, wait) {
      let timeout;
      return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
      };
    }
    
    // Initialize when the content script is injected
    init();
    
    let currentEmailText = '';

    // Observer to detect when compose window opens
    const observer = new MutationObserver((mutations) => {
      const composeBox = document.querySelector('[role="textbox"][aria-label*="Message"]');
      if (composeBox && !composeBox.dataset.assisted) {
        setupAssistantButtons(composeBox);
      }
    });

    function setupAssistantButtons(composeBox) {
      composeBox.dataset.assisted = 'true';
      
      const buttonContainer = document.createElement('div');
      buttonContainer.innerHTML = `
        <button class="grammar-check">Check Grammar</button>
        <button class="generate-reply">Generate Reply</button>
      `;
      
      composeBox.parentElement.insertBefore(buttonContainer, composeBox);
      
      buttonContainer.querySelector('.grammar-check').addEventListener('click', () => {
        checkGrammar(composeBox.innerText);
      });
      
      buttonContainer.querySelector('.generate-reply').addEventListener('click', () => {
        generateReply(getEmailContext());
      });
    }

    function checkGrammar(text) {
      chrome.runtime.sendMessage({
        action: 'checkGrammar',
        text: text
      });
    }

    function generateReply(context) {
      chrome.runtime.sendMessage({
        action: 'generateReply',
        context: context
      });
    }

    function getEmailContext() {
      // Extract previous email content from Gmail
      const emailThread = document.querySelector('.gmail_quote');
      return emailThread ? emailThread.innerText : '';
    }

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  })();
