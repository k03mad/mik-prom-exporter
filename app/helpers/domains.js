import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {string} domain
 */
export const getMainDomain = domain => {
    const parts = domain.split('.');
    return `${parts.at(-2)}.${parts.at(-1)}`;
};

/**
 * @param {object} options
 * @param {string[]} options.allDomains
 * @param {Map<string, string[]>} options.domainGroups
 * @returns {string}
 */
export const generateDomainsHtml = ({allDomains, domainGroups}) => {
    const AUTO_COLLAPSE_THRESHOLD = 50;

    const lastUpdate = new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Domains</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>👽</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', 'Consolas', monospace;
            background-color: #1e1e1e;
            min-height: 100vh;
            padding: 20px;
            color: #e0e0e0;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: #2d2d2d;
            border-radius: 4px;
            border: 1px solid #404040;
            overflow: hidden;
        }

        .header {
            background-color: #2d2d2d;
            color: #e0e0e0;
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #404040;
        }

        .header h1 {
            font-size: 1.5em;
            margin-bottom: 10px;
            font-weight: normal;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }

        .stat-item {
            background: #1e1e1e;
            padding: 10px 20px;
            border-radius: 4px;
            border: 1px solid #404040;
            min-width: 150px;
            text-align: center;
        }

        .stat-number {
            font-size: 1.3em;
            font-weight: normal;
            display: block;
            color: #2d7a3e;
        }

        .stat-label {
            font-size: 0.75em;
            color: #999;
        }

        .controls {
            padding: 15px 20px;
            background: #2d2d2d;
            border-bottom: 1px solid #404040;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }

        .search-box {
            flex: 1;
            min-width: 250px;
            position: relative;
        }

        .search-box input {
            width: 100%;
            padding: 10px 35px 10px 12px;
            border: 1px solid #404040;
            border-radius: 4px;
            font-size: 0.9em;
            transition: all 0.3s;
            background: #1e1e1e;
            color: #e0e0e0;
            font-family: 'Courier New', 'Consolas', monospace;
        }

        .search-box input:focus {
            outline: none;
            border-color: #2d7a3e;
        }

        .search-box input::placeholder {
            color: #666;
        }

        .search-clear {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 4px 8px;
            font-size: 1.2em;
            line-height: 1;
            display: none;
        }

        .search-clear:hover {
            color: #e0e0e0;
        }

        .search-clear.visible {
            display: block;
        }

        .view-toggle {
            display: flex;
            gap: 5px;
        }

        .view-toggle button {
            padding: 10px 20px;
            border: none;
            background: #2d7a3e;
            cursor: pointer;
            border-radius: 4px;
            transition: all 0.3s;
            font-weight: normal;
            color: #e0e0e0;
            font-size: 0.9em;
            font-family: 'Courier New', 'Consolas', monospace;
        }

        .view-toggle button:hover {
            background: #3a9b4f;
        }

        .view-toggle button.active {
            background: #3a9b4f;
        }

        .view-toggle button:disabled {
            background: #3d3d3d;
            color: #666;
            cursor: not-allowed;
        }

        .content {
            padding: 20px;
            background: #2d2d2d;
        }

        .domain-group {
            margin-bottom: 20px;
            animation: fadeIn 0.5s;
        }

        .group-header {
            background: #1e1e1e;
            color: #e0e0e0;
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid #404040;
        }

        .group-header:hover {
            background: #252525;
        }

        .group-header.collapsed {
            background: #252525;
            border-color: #2d7a3e;
            margin-bottom: 0;
        }

        .group-header.collapsed .group-title {
            color: #2d7a3e;
        }

        .group-title {
            font-size: 0.9em;
            font-weight: normal;
        }

        .group-count {
            background: #2d7a3e;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 0.75em;
            color: #e0e0e0;
        }

        .domain-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding-left: 15px;
        }

        .domain-item {
            padding: 8px 12px;
            background: #1e1e1e;
            border-radius: 4px;
            border: 1px solid #404040;
            transition: all 0.2s;
            font-family: 'Courier New', 'Consolas', monospace;
            font-size: 0.8em;
            color: #e0e0e0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .domain-item::before {
            content: attr(data-local-index) ". ";
        }

        .domain-item:hover {
            background: #252525;
            border-color: #2d7a3e;
        }

        .domain-item.hidden {
            display: none;
        }

        .list-view .domain-list {
            display: block;
            padding-left: 0;
        }

        .list-view .domain-item {
            background: transparent;
            border: none;
            border-radius: 0;
            padding: 6px 0;
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
        }

        .list-view .domain-item::before {
            content: attr(data-global-index) ". ";
        }

        .list-view .domain-item:hover {
            background: transparent;
            border-color: transparent;
            color: #2d7a3e;
        }

        .list-view .domain-group {
            border-bottom: 1px solid #404040;
            padding-bottom: 15px;
            margin-bottom: 15px;
        }

        .list-view .domain-group:last-child {
            border-bottom: none;
        }

        .list-view .group-header {
            display: none;
        }

        .list-view .domain-list {
            display: block !important;
        }

        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }

        .no-results-icon {
            font-size: 3em;
            margin-bottom: 20px;
        }

        .footer {
            padding: 15px 20px;
            background: #2d2d2d;
            border-top: 1px solid #404040;
            text-align: center;
            color: #999;
            font-size: 0.75em;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @media (max-width: 1200px) {
            .domain-list {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.3em;
            }

            .stats {
                gap: 10px;
            }

            .stat-item {
                padding: 8px 12px;
            }

            .stat-number {
                font-size: 1.1em;
            }

            .domain-list {
                grid-template-columns: 1fr;
            }

            .controls {
                flex-direction: column;
            }

            .search-box {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="stats">
            <div class="stat-item">
                <span class="stat-number">${allDomains.length}</span>
                <span class="stat-label">Всего доменов</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${domainGroups.size}</span>
                <span class="stat-label">Основных доменов</span>
            </div>
        </div>

        <div class="controls">
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Поиск доменов..." autocomplete="off">
                <button class="search-clear" id="searchClear">×</button>
            </div>
            <div class="view-toggle">
                <button class="active" data-view="grid">Сетка</button>
                <button data-view="list">Список</button>
            </div>
        </div>

        <div class="content" id="content">
            ${(() => {
                let globalIndex = 0;
                return [...domainGroups.entries()]
                    .map(([mainDomain, groupDomains]) => {
                        const shouldCollapse = groupDomains.length >= AUTO_COLLAPSE_THRESHOLD;
                        return `
                            <div class="domain-group">
                                <div class="group-header${shouldCollapse ? ' collapsed' : ''}">
                                    <span class="group-title">${mainDomain}</span>
                                    <span class="group-count">${groupDomains.length}</span>
                                </div>
                                <div class="domain-list"${shouldCollapse ? ' style="display: none;"' : ''}>
                ${groupDomains.map((domain, localIndex) => {
                    globalIndex++;
                    return `<div class="domain-item" data-domain="${domain}" data-global-index="${globalIndex}" data-local-index="${localIndex + 1}">${domain}</div>`;
                }).join('\n')}
                                </div>
                            </div>
                        `;
                    })
                    .join('\n');
            })()}
        </div>

        <div class="footer">
            Последнее обновление: ${lastUpdate}
        </div>
    </div>

    <script>
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        const content = document.getElementById('content');
        const viewButtons = document.querySelectorAll('.view-toggle button');
        const originalContent = content.innerHTML;

        function performSearch() {
            const query = searchInput.value.toLowerCase();
            searchClear.classList.toggle('visible', query.length > 0);

            if (!query) {
                content.innerHTML = originalContent;
                initGroupHeaders();
                return;
            }

            const domainItems = document.querySelectorAll('.domain-item');
            const groups = document.querySelectorAll('.domain-group');
            let visibleCount = 0;

            groups.forEach(group => {
                const items = group.querySelectorAll('.domain-item');
                let groupVisible = false;

                items.forEach(item => {
                    const domain = item.dataset.domain.toLowerCase();
                    if (domain.includes(query)) {
                        item.classList.remove('hidden');
                        groupVisible = true;
                        visibleCount++;
                    } else {
                        item.classList.add('hidden');
                    }
                });

                group.style.display = groupVisible ? 'block' : 'none';
            });

            const noResults = document.querySelector('.no-results');
            if (noResults) noResults.remove();

            if (visibleCount === 0) {
                content.innerHTML = \`
                    <div class="no-results">
                        <div class="no-results-icon">🔍</div>
                        <h2>Ничего не найдено</h2>
                        <p>Попробуйте изменить поисковый запрос</p>
                    </div>
                \`;
            }
        }

        function initGroupHeaders() {
            document.querySelectorAll('.group-header').forEach(header => {
                header.addEventListener('click', () => {
                    const list = header.nextElementSibling;
                    const isCollapsed = list.style.display === 'none';

                    list.style.display = isCollapsed ? 'grid' : 'none';
                    header.classList.toggle('collapsed', !isCollapsed);
                });
            });
        }

        searchInput.addEventListener('input', performSearch);

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        });

        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const view = button.dataset.view;
                if (view === 'list') {
                    content.classList.add('list-view');
                } else {
                    content.classList.remove('list-view');
                }
            });
        });

        initGroupHeaders();
    </script>
</body>
</html>`;
};

/**
 * @param {Set<string>} domains
 * @param {string} file
 */
export const saveDomainsHtml = async (domains, file) => {
    let currentContentArr = [];

    try {
        const currentContent = await fs.readFile(file, {encoding: 'utf8'});
        const domainMatches = currentContent.matchAll(/data-domain="([^"]+)"/g);
        currentContentArr = Array.from(domainMatches, match => match[1]);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    const allDomains = [...new Set([...currentContentArr, ...domains])];

    const sortedDomains = allDomains.toSorted((a, b) => {
        const aParts = a.split('.').toReversed();
        const bParts = b.split('.').toReversed();

        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aPart = aParts[i] || '';
            const bPart = bParts[i] || '';
            const comparison = aPart.localeCompare(bPart);

            if (comparison !== 0) {
                return comparison;
            }
        }

        return 0;
    });

    const domainGroups = new Map();

    sortedDomains.forEach(domain => {
        const mainDomain = getMainDomain(domain);

        if (!domainGroups.has(mainDomain)) {
            domainGroups.set(mainDomain, []);
        }

        domainGroups.get(mainDomain).push(domain);
    });

    const html = generateDomainsHtml({
        allDomains,
        domainGroups,
    });

    await fs.mkdir(path.dirname(file), {recursive: true});
    await fs.writeFile(file, html);
};
