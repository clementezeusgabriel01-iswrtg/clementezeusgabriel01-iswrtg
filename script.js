(function () {
  const USERNAME = 'clementezeusgabriel01-iswrtg';

  function hideLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    if (screen) {
      screen.classList.add('hidden');
    }
  }

  function setFooterTimestamp() {
    const el = document.getElementById('footer-updated');
    if (!el) return;
    const now = new Date();
    el.textContent = `Last checked ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }

  function getLangColor(language) {
    switch (language) {
      case 'C': return '#5b8cff';
      case 'C++': return '#ff79b0';
      case 'Java': return '#e0a63c';
      case 'Python': return '#e0c23c';
      case 'JavaScript': return '#e0d23c';
      case 'TypeScript': return '#5bb8ff';
      case 'HTML': return '#ff9c5b';
      case 'CSS': return '#8c7bff';
      default: return '#8a8fa3';
    }
  }

  function renderRepoCard(repo) {
    const langColor = getLangColor(repo.language);

    const card = document.createElement('div');
    card.className = 'repo-card';
    card.innerHTML = `
      <div>
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="repo-name">
          <span>${repo.name}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:.6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
        <p class="repo-desc">${repo.description || 'No description provided.'}</p>
      </div>
      <div class="repo-meta">
        <span class="repo-lang" style="color:${langColor}; border-color:${langColor}33;">${repo.language || 'Text'}</span>
        <div class="repo-stats">
          <span>★ ${repo.stargazers_count}</span>
          <span>⑂ ${repo.forks_count}</span>
        </div>
      </div>
    `;
    return card;
  }

  async function fetchGitHubRepos() {
    const container = document.getElementById('repos-list');

    try {
      const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=10`);
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const repos = await res.json();

      container.innerHTML = '';

      if (!Array.isArray(repos) || repos.length === 0) {
        container.innerHTML = `<div class="repo-empty">No public repositories found.</div>`;
        return;
      }

      repos.forEach(repo => container.appendChild(renderRepoCard(repo)));

    } catch (err) {
      container.innerHTML = `<div class="repo-error">Unable to load public repositories.</div>`;
    } finally {
      setFooterTimestamp();
      hideLoadingScreen();
    }
  }

  document.addEventListener('DOMContentLoaded', fetchGitHubRepos);
})();
