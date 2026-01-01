let engines = {};

async function loadEngines() {
  try {
    const response = await fetch(chrome.runtime.getURL('config/engines.json'));
    const config = await response.json();
    
    engines = {};
    config.forEach(engineConfig => {
      engines[engineConfig.name] = { name: engineConfig.displayName };
    });
  } catch (error) {
    console.error('Failed to load engines:', error);
  }
}

function loadSettings() {
  chrome.storage.local.get(['enabledEngines'], (result) => {
    const enabled = result.enabledEngines || ['google', 'ddg', 'perplexity', 'youtube'];
    Object.keys(engines).forEach(id => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.checked = enabled.includes(id);
      }
    });
  });
}

function saveSettings() {
  const enabled = Object.keys(engines).filter(id => {
    const checkbox = document.getElementById(id);
    return checkbox && checkbox.checked;
  });
  chrome.storage.local.set({ enabledEngines: enabled });
}

async function init() {
  await loadEngines();
  loadSettings();
  
  Object.keys(engines).forEach(id => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      checkbox.addEventListener('change', saveSettings);
    }
  });
}

init();
