(function () {
  const USERNAME = 'clementezeusgabriel01-iswrtg';
  const GITHUB_TOKEN = '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';

  function githubHeaders() {
    return GITHUB_TOKEN ? { Authorization: `Bearer ${GITHUB_TOKEN}` } : {};
  }

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

  function renderTotals(repos) {
    const repoCount = document.getElementById('total-repos');
    const starCount = document.getElementById('total-stars');
    const forkCount = document.getElementById('total-forks');
    if (!repoCount || !starCount || !forkCount) return;

    const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const forks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);

    repoCount.textContent = repos.length;
    starCount.textContent = stars;
    forkCount.textContent = forks;
  }

  function sortRepos(repos, sortBy) {
    const sorted = repos.slice();
    switch (sortBy) {
      case 'stars':
        return sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
      case 'forks':
        return sorted.sort((a, b) => b.forks_count - a.forks_count);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
  }

  function renderRepoList(repos) {
    const container = document.getElementById('repos-list');
    container.innerHTML = '';

    if (!Array.isArray(repos) || repos.length === 0) {
      container.innerHTML = `<div class="repo-empty">No public repositories found.</div>`;
      return;
    }

    repos.forEach(repo => container.appendChild(renderRepoCard(repo)));
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

  function relativeTime(dateString) {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  }

  function renderCommitItem(commit) {
    const item = document.createElement('div');
    item.className = 'commit-item';
    item.innerHTML = `
      <div class="commit-main">
        <a href="${commit.url}" target="_blank" rel="noopener" class="commit-message">${commit.message}</a>
        <span class="commit-repo">${commit.repo}</span>
      </div>
      <span class="commit-time">${relativeTime(commit.date)}</span>
    `;
    return item;
  }

  function renderCommitList(commits) {
    const container = document.getElementById('commits-list');
    if (!container) return;
    container.innerHTML = '';

    if (!Array.isArray(commits) || commits.length === 0) {
      container.innerHTML = `<div class="commit-empty">No recent commits found.</div>`;
      return;
    }

    commits.forEach(commit => container.appendChild(renderCommitItem(commit)));
  }

  async function fetchRecentCommits() {
    const container = document.getElementById('commits-list');
    if (!container) return;

    try {
      const res = await fetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=30`, {
        headers: githubHeaders()
      });

      if (res.status === 401) {
        container.innerHTML = `<div class="commit-error">GitHub token is invalid or expired.</div>`;
        return;
      }
      if (res.status === 403) {
        container.innerHTML = `<div class="commit-error">GitHub API rate limit reached. Try again in a few minutes.</div>`;
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch commits');

      const events = await res.json();
      if (!Array.isArray(events)) throw new Error('Unexpected response');

      const commits = [];
      events
        .filter(event => event.type === 'PushEvent' && event.payload && Array.isArray(event.payload.commits))
        .forEach(event => {
          event.payload.commits.forEach(commit => {
            commits.push({
              message: commit.message.split('\n')[0],
              repo: event.repo.name,
              date: event.created_at,
              url: `https://github.com/${event.repo.name}/commit/${commit.sha}`
            });
          });
        });

      renderCommitList(commits.slice(0, 8));

    } catch (err) {
      container.innerHTML = `<div class="commit-error">Unable to load recent commits.</div>`;
    }
  }

  async function fetchGitHubRepos() {
    const container = document.getElementById('repos-list');
    const sortSelect = document.getElementById('repo-sort');

    try {
      const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=30`, {
        headers: githubHeaders()
      });

      if (res.status === 401) {
        container.innerHTML = `<div class="repo-error">GitHub token is invalid or expired.</div>`;
        renderTotals([]);
        return;
      }
      if (res.status === 403) {
        container.innerHTML = `<div class="repo-error">GitHub API rate limit reached. Try again in a few minutes.</div>`;
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch repositories');

      const repos = await res.json();
      if (!Array.isArray(repos)) throw new Error('Unexpected response');

      if (!Array.isArray(repos) || repos.length === 0) {
        container.innerHTML = `<div class="repo-empty">No public repositories found.</div>`;
        renderTotals([]);
        return;
      }

      renderTotals(repos);
      renderRepoList(sortRepos(repos, sortSelect ? sortSelect.value : 'updated'));

      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          renderRepoList(sortRepos(repos, sortSelect.value));
        });
      }

    } catch (err) {
      container.innerHTML = `<div class="repo-error">Unable to load public repositories.</div>`;
    }
  }

  async function loadDashboard() {
    const loadStart = Date.now();

    await Promise.all([fetchGitHubRepos(), fetchRecentCommits()]);

    setFooterTimestamp();
    const remaining = 3000 - (Date.now() - loadStart);
    setTimeout(hideLoadingScreen, Math.max(remaining, 0));
  }

  document.addEventListener('DOMContentLoaded', loadDashboard);
})();
      
