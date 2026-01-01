let engines = {};

// Transform factory
const transformMap = {
  none: q => encodeURIComponent(q),
  dash: q => encodeURIComponent(q.trim().replace(/\s+/g, '-')),
  plus: q => encodeURIComponent(q.trim().replace(/\s+/g, '+')),
  percent20: q => encodeURIComponent(q.trim().replace(/\s+/g, '%20'))
};

// Load config and build engines
async function loadEngines() {
  try {
    const response = await fetch(chrome.runtime.getURL('config/engines.json'));
    const config = await response.json();
    
    engines = {};
    config.forEach(engineConfig => {
      const transform = transformMap[engineConfig.transform] || transformMap.none;
      engines[engineConfig.name] = {
        template: engineConfig.template,
        transform
      };
    });
  } catch (error) {
    console.error('Failed to load engines:', error);
    // Fallback engines
    engines = {};
  }
}

// Initialize on startup
loadEngines();

chrome.omnibox.onInputStarted.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({ 
    description: "Search enabled engines..." 
  });
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  suggest([
    { content: text, description: `Search "${text}" in enabled engines` }
  ]);
});

chrome.omnibox.onInputEntered.addListener((text, disposition) => {
  chrome.storage.local.get(['enabledEngines'], (result) => {
    const enabledIds = result.enabledEngines || ['google', 'ddg', 'perplexity', 'youtube'];
    
    enabledIds.forEach(id => {
      const engine = engines[id];
      if (engine) {
        const transformed = engine.transform(text);
        const url = engine.template.replace('%s', transformed);
        chrome.tabs.create({ url, active: false });
      }
    });
  });
});
