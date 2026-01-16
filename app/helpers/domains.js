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
            font-family: 'Roboto', -apple-system, sans-serif;
            background-color: #121212;
            min-height: 100vh;
            padding: 0;
            margin: 0;
            color: #e0e0e0;
        }

        .toolbar {
            background: #1e1e1e;
            padding: 15px 20px;
            border-bottom: 1px solid #2d2d2d;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }

        .stats {
            display: flex;
            gap: 30px;
            font-size: 1em;
        }

        .stat {
            color: #b0b0b0;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }

        .stat strong {
            color: #4caf50;
            font-weight: 500;
        }

        .stat.clickable {
            cursor: pointer;
            user-select: none;
            transition: all 0.2s;
            padding: 6px 12px;
            margin: -6px -12px;
            border-radius: 4px;
            border: 1px solid #2d2d2d;
            background: #1e1e1e;
        }

        .stat.clickable:hover {
            color: #e0e0e0;
            background: rgba(76, 175, 80, 0.15);
            border-color: #4caf50;
        }

        .stat.clickable.active {
            background: rgba(76, 175, 80, 0.1);
            border-color: #4caf50;
        }

        .search-box {
            position: relative;
            flex: 1;
            min-width: 300px;
            max-width: 400px;
        }

        .search-box input {
            border: 1px solid #2d2d2d;
            padding: 8px 35px 8px 12px;
            border-radius: 4px;
            width: 100%;
            background: #2d2d2d;
            color: #e0e0e0;
            font-size: 0.9em;
            transition: all 0.2s;
        }

        .search-box input:focus {
            outline: none;
            border-color: #4caf50;
            background: #1e1e1e;
        }

        .search-box input::placeholder {
            color: #666;
        }

        .search-clear {
            position: absolute;
            right: 8px;
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


        .content {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .domain-group {
            background: #1e1e1e;
            margin-bottom: 15px;
            border-radius: 4px;
            border: 1px solid #2d2d2d;
            overflow: hidden;
        }

        .group-header {
            background: #252525;
            padding: 12px 15px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            font-weight: 500;
            border-bottom: 1px solid #2d2d2d;
            transition: background 0.2s;
        }

        .group-header:hover {
            background: #2d2d2d;
        }

        .group-header.collapsed {
            border-bottom: none;
        }

        .group-header.collapsed .group-title {
            color: #4caf50;
        }

        .group-title {
            font-size: 0.95em;
            color: #e0e0e0;
        }

        .badge {
            background: #4caf50;
            color: white;
            padding: 3px 10px;
            border-radius: 3px;
            font-size: 0.8em;
            font-weight: normal;
        }

        .domain-table {
            width: 100%;
            border-collapse: collapse;
        }

        .domain-table td {
            padding: 10px 15px;
            border-bottom: 1px solid #252525;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 0.85em;
            color: #b0b0b0;
        }

        .domain-table tr:last-child td {
            border-bottom: none;
        }

        .domain-table tr:hover {
            background: #252525;
        }

        .domain-table tr:hover td {
            color: #e0e0e0;
        }

        .domain-num {
            color: #666;
            width: 60px;
            text-align: right;
            padding-right: 15px;
        }

        .domain-table tr:hover .domain-num {
            color: #4caf50;
        }

        .list-view .domain-group {
            background: transparent;
            border: none;
            border-radius: 0;
            margin-bottom: 0;
            padding: 15px 0;
            border-bottom: 1px solid #2d2d2d;
        }

        .list-view .domain-group:first-child {
            padding-top: 0;
        }

        .list-view .domain-group:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }

        .list-view .group-header {
            display: none;
        }

        .list-view .domain-table {
            display: table !important;
        }

        .list-view .domain-table td {
            border-bottom: none;
            padding: 8px 15px;
        }

        .list-view .domain-table tr {
            border-bottom: none;
        }

        .list-view .domain-num {
            font-size: 0;
        }

        .list-view .domain-num::after {
            content: attr(data-global-index);
            color: #666;
            font-size: 0.85rem;
        }

        .list-view .domain-table tr:hover .domain-num::after {
            color: #4caf50;
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
            background: #1e1e1e;
            border-top: 1px solid #2d2d2d;
            text-align: center;
            color: #666;
            font-size: 0.75em;
        }

        @media (max-width: 768px) {
            .toolbar {
                flex-direction: column;
                align-items: stretch;
            }

            .stats {
                justify-content: center;
                gap: 20px;
            }

            .search-box {
                max-width: none;
            }

            .view-toggle {
                justify-content: center;
            }

            .domain-num {
                width: 40px;
                padding-right: 10px;
            }

            .domain-table td {
                padding: 8px 10px;
                font-size: 0.8em;
            }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <div class="stats">
            <div class="stat">Total: <strong>${allDomains.length}</strong></div>
            <div class="stat clickable" id="groupsToggle">Groups: <strong>${domainGroups.size}</strong></div>
        </div>
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="Filter..." autocomplete="off">
            <button class="search-clear" id="searchClear">×</button>
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
                                <span class="badge">${groupDomains.length}</span>
                            </div>
                            <table class="domain-table"${shouldCollapse ? ' style="display: none;"' : ''}>
            ${groupDomains.map((domain, localIndex) => {
                globalIndex++;
                return `<tr data-domain="${domain}" data-global-index="${globalIndex}" data-local-index="${localIndex + 1}">
                                    <td class="domain-num" data-global-index="${globalIndex}">${localIndex + 1}</td>
                                    <td>${domain}</td>
                                </tr>`;
            }).join('\n')}
                            </table>
                        </div>
                    `;
                })
                .join('\n');
        })()}
    </div>

    <div class="footer">
        Last update: ${lastUpdate}
    </div>

    <script>
        const searchInput = document.getElementById('searchInput');
        const searchClear = document.getElementById('searchClear');
        const content = document.getElementById('content');
        const groupsToggle = document.getElementById('groupsToggle');
        const originalContent = content.innerHTML;

        function performSearch() {
            const query = searchInput.value.toLowerCase();
            searchClear.classList.toggle('visible', query.length > 0);

            if (!query) {
                content.innerHTML = originalContent;
                initGroupHeaders();
                const savedView = localStorage.getItem('domainsView') || 'groups';
                if (savedView === 'list') {
                    content.classList.add('list-view');
                    groupsToggle.classList.remove('active');
                } else {
                    content.classList.remove('list-view');
                    groupsToggle.classList.add('active');
                }
                return;
            }

            const domainRows = document.querySelectorAll('.domain-table tr');
            const groups = document.querySelectorAll('.domain-group');
            let visibleCount = 0;

            groups.forEach(group => {
                const rows = group.querySelectorAll('.domain-table tr');
                let groupVisible = false;

                rows.forEach(row => {
                    const domain = row.dataset.domain.toLowerCase();
                    if (domain.includes(query)) {
                        row.style.display = '';
                        groupVisible = true;
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
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
                        <h2>Nothing found</h2>
                        <p>Try a different search query</p>
                    </div>
                \`;
            }
        }

        function initGroupHeaders() {
            document.querySelectorAll('.group-header').forEach(header => {
                header.addEventListener('click', () => {
                    const table = header.nextElementSibling;
                    const isCollapsed = table.style.display === 'none';

                    table.style.display = isCollapsed ? '' : 'none';
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

        function setView(view) {
            if (view === 'list') {
                content.classList.add('list-view');
                groupsToggle.classList.remove('active');
            } else {
                content.classList.remove('list-view');
                groupsToggle.classList.add('active');
            }
            localStorage.setItem('domainsView', view);
        }

        groupsToggle.addEventListener('click', () => {
            const currentView = localStorage.getItem('domainsView') || 'groups';
            const newView = currentView === 'list' ? 'groups' : 'list';
            setView(newView);
        });

        const savedView = localStorage.getItem('domainsView') || 'groups';
        setView(savedView);

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
