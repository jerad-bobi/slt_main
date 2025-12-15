document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('mapTrack');
    if (!track) return;

    const nodes = [];
    let levelNumber = 1;

    for (let chapter = 1; chapter <= 8; chapter++) {
        const startLevel = levelNumber;
        const endLevel = levelNumber + 4;

        nodes.push({
            type: 'chapter',
            title: `Chapter ${chapter}`,
            subtitle: `Unlocks Levels ${startLevel}-${endLevel}`,
            badge: 'Milestone',
            chapterNum: chapter,
        });

        for (let i = 0; i < 5; i++) {
            nodes.push({
                type: 'level',
                title: `Level ${levelNumber}`,
                subtitle: 'Practice and progress',
                badge: 'Core Level',
            });
            levelNumber += 1;
        }

        nodes.push({
            type: 'treasure',
            title: `Treasure ${chapter}`,
            subtitle: 'Claim your reward',
            badge: 'Chest',
        });
    }

    nodes.forEach((node, index) => {
        const side = index % 2 === 0 ? 'side-left' : 'side-right';

        const row = document.createElement('div');
        row.className = `node-row ${side}`;
        row.setAttribute('role', 'listitem');

        const dot = document.createElement('div');
        dot.className = 'node-dot';
        dot.setAttribute('aria-hidden', 'true');

        const card = document.createElement('article');
        card.className = `node-card type-${node.type}`;
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${node.title}: ${node.subtitle}`);

        card.innerHTML = `
            <div class="eyebrow">${node.type === 'level' ? 'Level' : node.type === 'chapter' ? 'Chapter' : 'Treasure'}</div>
            <p class="node-title">${node.title}</p>
            <p class="node-sub">${node.subtitle}</p>
            <div class="badge-row">
                <span class="badge">${node.badge}</span>
                <span class="badge">Tap to continue</span>
            </div>
        `;

        if (node.type === 'chapter') {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                window.location.href = `/chapter/${node.chapterNum}/`;
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    window.location.href = `/chapter/${node.chapterNum}/`;
                }
            });
        }

        row.appendChild(dot);
        row.appendChild(card);
        track.appendChild(row);
    });
});
