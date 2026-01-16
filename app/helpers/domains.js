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
    const AUTO_COLLAPSE_THRESHOLD = 20;

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
            margin-bottom: 20px;
        }

        .domain-group:last-child {
            margin-bottom: 0;
        }

        .domain-table {
            width: 100%;
            border-collapse: collapse;
        }

        .domain-table.collapsed {
            display: none;
        }

        .domain-table td {
            padding: 8px 15px;
            font-family: 'Consolas', 'Courier New', monospace;
            font-size: 0.85em;
            color: #b0b0b0;
            cursor: pointer;
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
            font-size: 0;
        }

        .domain-num::after {
            content: attr(data-global-index);
            color: #666;
            font-size: 0.85rem;
        }

        .domain-table tr:hover .domain-num::after {
            color: #4caf50;
        }

        .collapsed-placeholder {
            padding: 10px 15px;
            color: #4caf50;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.2s;
            background: rgba(76, 175, 80, 0.08);
            border-radius: 4px;
        }

        .collapsed-placeholder:hover {
            background: rgba(76, 175, 80, 0.15);
            color: #4caf50;
        }

        .collapsed-placeholder::before {
            content: '▶ ';
            margin-right: 5px;
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
            <div class="stat">Groups: <strong>${domainGroups.size}</strong></div>
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
                    const groupClass = shouldCollapse ? 'domain-group collapsed' : 'domain-group';

                    let html = `<div class="${groupClass}">`;

                    if (shouldCollapse) {
                        html += `<div class="collapsed-placeholder" data-main-domain="${mainDomain}" data-count="${groupDomains.length}">${mainDomain} (${groupDomains.length} domains)</div>`;
                    }

                    html += `<table class="domain-table${shouldCollapse ? ' collapsed' : ''}">`;

                    html += groupDomains.map(domain => {
                        globalIndex++;
                        return `<tr data-domain="${domain}" data-global-index="${globalIndex}">
                                    <td class="domain-num" data-global-index="${globalIndex}"></td>
                                    <td>${domain}</td>
                                </tr>`;
                    }).join('\n');

                    html += '</table></div>';

                    return html;
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
        const originalContent = content.innerHTML;

        function performSearch() {
            const query = searchInput.value.toLowerCase();
            searchClear.classList.toggle('visible', query.length > 0);

            if (!query) {
                content.innerHTML = originalContent;
                initCollapsedPlaceholders();
                initDomainRowClicks();
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

        function initCollapsedPlaceholders() {
            document.querySelectorAll('.collapsed-placeholder').forEach(placeholder => {
                placeholder.addEventListener('click', () => {
                    const group = placeholder.closest('.domain-group');
                    const table = group.querySelector('.domain-table');

                    table.classList.remove('collapsed');
                    group.classList.remove('collapsed');
                    placeholder.remove();

                    initDomainRowClicks();
                });
            });
        }

        function initDomainRowClicks() {
            document.querySelectorAll('.domain-table:not(.collapsed)').forEach(table => {
                const rows = table.querySelectorAll('tr');
                rows.forEach(row => {
                    row.replaceWith(row.cloneNode(true));
                });

                table.querySelectorAll('tr').forEach(row => {
                    row.addEventListener('click', () => {
                        const group = table.closest('.domain-group');

                        table.classList.add('collapsed');
                        group.classList.add('collapsed');

                        const firstDomain = table.querySelector('tr').dataset.domain;
                        const mainDomain = firstDomain.split('.').slice(-2).join('.');
                        const count = table.querySelectorAll('tr').length;

                        const placeholder = document.createElement('div');
                        placeholder.className = 'collapsed-placeholder';
                        placeholder.textContent = \`\${mainDomain} (\${count} domains)\`;
                        placeholder.addEventListener('click', () => {
                            table.classList.remove('collapsed');
                            group.classList.remove('collapsed');
                            placeholder.remove();
                            initDomainRowClicks();
                        });

                        group.insertBefore(placeholder, table);
                    });
                });
            });
        }

        searchInput.addEventListener('input', performSearch);

        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        });

        initCollapsedPlaceholders();
        initDomainRowClicks();
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
