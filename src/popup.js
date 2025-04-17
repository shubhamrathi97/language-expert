'use strict';

import './popup.css';

document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const saveSettingsBtn = document.getElementById('save-settings');
  const saveKeysBtn = document.getElementById('save-keys');
  
  // Load saved settings
  chrome.storage.sync.get([
    'grammarCheck', 
    'autoReply', 
    'llmProvider',
    'openaiKey',
    'anthropicKey',
    'geminiKey',
    'deepseekKey',
    'grokKey',
  ], function(data) {
    // Set checkboxes
    document.getElementById('grammar-check').checked = 
      data.grammarCheck !== undefined ? data.grammarCheck : true;
    document.getElementById('auto-reply').checked = 
      data.autoReply !== undefined ? data.autoReply : true;
    
    // Set selected LLM provider
    if (data.llmProvider) {
      document.getElementById('llm-provider').value = data.llmProvider;
    }
    
    // Set API keys
    if (data.openaiKey) document.getElementById('openai-key').value = data.openaiKey;
    if (data.anthropicKey) document.getElementById('anthropic-key').value = data.anthropicKey;
    if (data.geminiKey) document.getElementById('gemini-key').value = data.geminiKey;
    if (data.deepseekKey) document.getElementById('deepseek-key').value = data.deepseekKey;
    if (data.grokKey) document.getElementById('grok-key').value = data.grokKey;
  });
  
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons and contents
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  });
  
  // Save settings
  saveSettingsBtn.addEventListener('click', function() {
    const grammarCheck = document.getElementById('grammar-check').checked;
    const autoReply = document.getElementById('auto-reply').checked;
    const llmProvider = document.getElementById('llm-provider').value;
    
    chrome.storage.sync.set({
      grammarCheck: grammarCheck,
      autoReply: autoReply,
      llmProvider: llmProvider,
    }, function() {
      showSaveMessage('Settings saved!');
    });
  });
  
  // Save API keys
  saveKeysBtn.addEventListener('click', function() {
    const openaiKey = document.getElementById('openai-key').value;
    const anthropicKey = document.getElementById('anthropic-key').value;
    const geminiKey = document.getElementById('gemini-key').value;
    const deepseekKey = document.getElementById('deepseek-key').value;
    const grokKey = document.getElementById('grok-key').value;
    
    chrome.storage.sync.set({
      openaiKey: openaiKey,
      anthropicKey: anthropicKey,
      geminiKey: geminiKey,
      deepseekKey: deepseekKey,
      grokKey: grokKey
    }, function() {
      showSaveMessage('API keys saved!');
    });
  });
  
  function showSaveMessage(message) {
    const saveMsg = document.createElement('div');
    saveMsg.textContent = message;
    saveMsg.style.color = '#4CAF50';
    saveMsg.style.marginTop = '10px';
    saveMsg.style.fontSize = '14px';
    saveMsg.style.textAlign = 'center';
    
    document.querySelector('.buttons').appendChild(saveMsg);
    
    setTimeout(() => {
      saveMsg.remove();
    }, 2000);
  }
});