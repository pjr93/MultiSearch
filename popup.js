let engines = {};

async function loadEngines() {
  try {
    const response = await fetch(chrome.runtime.getURL('config/engines.json'));
    const config = await response.json();
    engines = {};
    config.forEach(engineConfig => {
      engines[engineConfig.name] = {
        name: engineConfig.displayName,
        id: engineConfig.name,
        group: engineConfig.group
      };
    });
  } catch (error) {
    console.error('Failed to load engines:', error);
  }
}

function renderCheckboxes() {
  const container = document.getElementById('checkbox-container');
  container.innerHTML = '';
  const visited = new Set();
  const groupContainers = {};

  Object.values(engines).forEach(engine => {
    const group = engine.group;
    if (!visited.has(group)) {
      visited.add(group);
      const groupDiv = document.createElement('div');
      groupDiv.className = 'engine-group';
      const header = document.createElement('div');
      header.className = 'engine-group-header';
      header.style.fontWeight = 'bold';
      header.innerHTML = `
        <label>
          <input type="checkbox" class="group-toggle" data-group="${group}">
          ${group}
        </label>
      `;
      groupDiv.appendChild(header);
      const groupContent = document.createElement('div');
      groupContent.className = 'engine-group-content';
      groupContent.style.marginLeft = '20px';
      groupDiv.appendChild(groupContent);
      groupContainers[group] = groupContent;
      container.appendChild(groupDiv);
    }
  });

  Object.values(engines).forEach(engine => {
    const label = document.createElement('label');
    label.innerHTML = `<input type="checkbox" id="${engine.id}"> ${engine.name}`;
    label.style.display = 'block';
    groupContainers[engine.group].appendChild(label);
  });
}

function loadSettings() {
  chrome.storage.local.get(['enabledEngines'], (result) => {
    const enabled = result.enabledEngines || ['google', 'ddg', 'perplexity', 'youtube'];
    Object.values(engines).forEach(engine => {
      const checkbox = document.getElementById(engine.id);
      if (checkbox) checkbox.checked = enabled.includes(engine.id);
    });
    updateAllGroupToggles();
  });
}

function saveSettings() {
  const enabled = Object.values(engines)
    .filter(engine => document.getElementById(engine.id)?.checked)
    .map(engine => engine.id);
  chrome.storage.local.set({ enabledEngines: enabled });
}

function updateAllGroupToggles() {
  const groups = [...new Set(Object.values(engines).map(e => e.group))];
  groups.forEach(updateGroupToggle);
}

function updateGroupToggle(group) {
  const groupCheckboxes = Array.from(document.querySelectorAll(`.engine-group-content input[type="checkbox"]`))
    .filter(cb => cb.id && engines[cb.id] && engines[cb.id].group === group);
  const header = document.querySelector(`.engine-group-header input.group-toggle[data-group="${group}"]`);
  if (header) {
    const allChecked = groupCheckboxes.every(cb => cb.checked);
    const noneChecked = groupCheckboxes.every(cb => !cb.checked);
    header.checked = allChecked;
    header.indeterminate = !allChecked && !noneChecked;
  }
}

function initEventListeners() {
  Object.values(engines).forEach(engine => {
    const checkbox = document.getElementById(engine.id);
    if (checkbox) {
      checkbox.addEventListener('change', () => {
        saveSettings();
        updateGroupToggle(engine.group);
      });
    }
  });

  document.addEventListener('change', (e) => {
    const target = e.target;
    if (target && target.classList.contains('group-toggle')) {
      const group = target.dataset.group;
      const groupCheckboxes = Array.from(document.querySelectorAll(`.engine-group-content input[type="checkbox"]`))
        .filter(cb => cb.id && engines[cb.id] && engines[cb.id].group === group);
      const newState = target.checked;
      groupCheckboxes.forEach(cb => (cb.checked = newState));
      saveSettings();
    }
  });
}

async function init() {
  await loadEngines();
  renderCheckboxes();
  loadSettings();
  initEventListeners();
}

init();
