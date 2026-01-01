let engines = {};

async function loadEngines() {
  try {
    const response = await fetch(chrome.runtime.getURL('config/engines.json'));
    const config = await response.json();
    
    engines = {};
    config.forEach(engineConfig => {
      engines[engineConfig.name] = { 
        name: engineConfig.displayName,
        id: engineConfig.name 
      };
    });
  } catch (error) {
    console.error('Failed to load engines:', error);
  }
}

function renderCheckboxes() {
  const container = document.getElementById('checkbox-container');
  container.innerHTML = ''; // Clear existing

  Object.values(engines).forEach(engine => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" id="${engine.id}"> ${engine.name}`;
    label.style.display = 'block';
    container.appendChild(label);
  });
}

function loadSettings() {
  chrome.storage.local.get(['enabledEngines'], (result) => {
    const enabled = result.enabledEngines || ['google', 'ddg', 'perplexity', 'youtube'];
    Object.values(engines).forEach(engine => {
      const checkbox = document.getElementById(engine.id);
      if (checkbox) {
        checkbox.checked = enabled.includes(engine.id);
      }
    });
  });
}

function saveSettings() {
  const enabled = Object.values(engines)
    .filter(engine => document.getElementById(engine.id)?.checked)
    .map(engine => engine.id);
  chrome.storage.local.set({ enabledEngines: enabled });
}

async function init() {
  await loadEngines();
  renderCheckboxes();
  loadSettings();
  
  // Add event listeners after rendering
  Object.values(engines).forEach(engine => {
    const checkbox = document.getElementById(engine.id);
    if (checkbox) {
      checkbox.addEventListener('change', saveSettings);
    }
  });
}

init();
