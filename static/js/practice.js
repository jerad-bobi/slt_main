document.addEventListener('DOMContentLoaded', () => {
    const fromEl = document.getElementById('fromLang');
    const toEl = document.getElementById('toLang');
    const swapBtn = document.getElementById('swapBtn');
    const source = document.getElementById('sourceInput');
    const targetBox = document.getElementById('targetBox');
    const translateBtn = document.getElementById('translateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const sourceLabel = document.getElementById('sourceLabel');
    const sourceHint = document.getElementById('sourceHint');
    const targetLabel = document.getElementById('targetLabel');
    const cameraBox = document.getElementById('cameraBox');

    let mediaStream = null;
    let cameraVideoEl = null;
    let mode = 'text-to-sign';

    function stopCamera() {
        if (cameraVideoEl) {
            cameraVideoEl.srcObject = null;
            cameraVideoEl = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach((t) => t.stop());
            mediaStream = null;
        }
    }

    function renderPlaceholder() {
        stopCamera();
        cameraBox.classList.add('hidden');
        source.classList.remove('hidden');
        sourceHint.classList.remove('hidden');
        targetBox.innerHTML = '<span class="muted" style="color: var(--muted);">Your translation will appear here.</span>';
    }

    async function renderCameraView(message) {
        source.classList.add('hidden');
        sourceHint.classList.add('hidden');
        cameraBox.classList.remove('hidden');
        cameraBox.innerHTML = `
            <div style="color: var(--muted); font-size: 13px;">Camera preview for ASL capture.</div>
            ${message ? `<div style="color: var(--muted); font-size: 12px;">${message}</div>` : ''}
        `;

        cameraVideoEl = document.createElement('video');
        cameraVideoEl.className = 'camera-video';
        cameraVideoEl.setAttribute('playsinline', '');
        cameraVideoEl.setAttribute('autoplay', '');
        cameraVideoEl.muted = true;
        cameraBox.appendChild(cameraVideoEl);

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            cameraBox.innerHTML = '<span class="muted" style="color: var(--muted);">Camera not supported in this browser.</span>';
            return;
        }

        try {
            mediaStream = mediaStream || await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            cameraVideoEl.srcObject = mediaStream;
            await cameraVideoEl.play().catch(() => {});
        } catch (err) {
            cameraBox.innerHTML = `<span class="muted" style="color: var(--muted);">Camera unavailable: ${err.message || err}</span>`;
        }
    }

    function setMode(newMode) {
        mode = newMode;
        if (mode === 'text-to-sign') {
            fromEl.textContent = 'English (Text)';
            toEl.textContent = 'ASL (Sign)';
            source.placeholder = 'Type something to translate';
            sourceLabel.textContent = 'Enter text';
            targetLabel.textContent = 'Sign output';
            renderPlaceholder();
        } else {
            fromEl.textContent = 'ASL (Sign)';
            toEl.textContent = 'English (Text)';
            source.placeholder = 'Describe or paste sign keywords';
            sourceLabel.textContent = 'Show your ASL sign to the camera';
            targetLabel.textContent = 'Text output';
            renderCameraView('Grant camera access to stream your signs.');
        }
    }

    function cleanWords(text) {
        return text
            .split(/\s+/)
            .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
            .filter(Boolean)
            .slice(0, 32);
    }

    function toChips(text) {
        const words = cleanWords(text).slice(0, 12);
        if (!words.length) return '<span class="muted" style="color: var(--muted);">No content to translate.</span>';
        return '<div class="chips">' + words.map((w) => `<span class="chip">${w.toUpperCase()}</span>`).join('') + '</div>';
    }

    function buildPlaylistPlayer(segments) {
        const sources = [];
        segments.forEach((s) => {
            if (s.video) {
                sources.push({ src: s.video, label: s.word });
            } else if (Array.isArray(s.spelling)) {
                s.spelling.forEach((clip, idx) => {
                    if (!clip) return;
                    const letter = s.word && s.word[idx] ? s.word[idx].toUpperCase() : `#${idx + 1}`;
                    sources.push({ src: clip, label: letter });
                });
            }
        });

        if (!sources.length) return null;

        const container = document.createElement('div');
        const labels = sources.map((s) => s.label || '');
        const chipsMarkup = labels.length
            ? `<div class="chips playlist-chips">${labels.map((l, i) => `<span class="chip" data-idx="${i}">${l.toUpperCase()}</span>`).join('')}</div>`
            : '';
        container.innerHTML = `
            <div style="color: var(--muted); font-size: 13px;">SignASL word-by-word playlist:</div>
            <video id="playlistPlayer" controls muted playsinline style="width: 100%; max-height: 360px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background:#000;"></video>
            ${chipsMarkup}
            <div id="nowPlaying" style="color: var(--muted); font-size: 12px;">Sequential playback with minimal gap (spells missing words).</div>
        `;

        const player = container.querySelector('#playlistPlayer');
        const chipEls = Array.from(container.querySelectorAll('.playlist-chips .chip'));
        const nowPlaying = container.querySelector('#nowPlaying');
        let idx = 0;
        let timer = null;

        const playIdx = (i) => {
            idx = i % sources.length;
            player.src = sources[idx].src;
            player.load();
            player.play().catch(() => {});

            chipEls.forEach((c) => c.classList.toggle('active', Number(c.dataset.idx) === idx));
            if (nowPlaying && labels[idx]) {
                nowPlaying.textContent = `Now signing: ${labels[idx]}`;
            }
        };

        const onEnded = () => {
            clearTimeout(timer);
            timer = setTimeout(() => playIdx(idx + 1), 150);
        };

        player.addEventListener('ended', onEnded);
        playIdx(0);

        return container;
    }

    function translate() {
        const value = source.value.trim();
        const cleanedWords = cleanWords(value);
        const wordCount = cleanedWords.length;

        if (!value || !cleanedWords.length) {
            if (mode === 'text-to-sign') {
                renderPlaceholder();
            } else {
                renderCameraView();
                targetBox.innerHTML = '<span class="muted" style="color: var(--muted);">Your text output will appear here.</span>';
            }
            return;
        }

        if (mode === 'text-to-sign') {
            targetBox.innerHTML = `
                <div style="color: var(--muted); font-size: 13px;">Searching SignASL…</div>
                ${toChips(value)}
            `;

            const cleanedPhrase = cleanedWords.join(' ');

            fetch(`/api/asl-video/?q=${encodeURIComponent(cleanedPhrase)}`)
                .then((resp) => (resp.ok ? resp.json() : Promise.reject(resp)))
                .then((data) => {
                    const hasPhrase = data && data.video;
                    const segments = (data && data.segments) || [];
                    const allowPlaylist = !(wordCount === 1 && hasPhrase);

                    if (hasPhrase) {
                        targetBox.innerHTML = `
                            <div style="color: var(--muted); font-size: 13px;">SignASL phrase:</div>
                            <video controls muted playsinline style="width: 100%; max-height: 320px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.12); background:#000;">
                                <source src="${data.video}" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                            <div style="color: var(--muted); font-size: 12px;">Auto-fetched from signasl.org</div>
                        `;
                    } else {
                        targetBox.innerHTML = '';
                    }

                    if (allowPlaylist && segments && segments.length) {
                        const playlist = buildPlaylistPlayer(segments);
                        if (playlist) {
                            targetBox.appendChild(document.createElement('hr'));
                            targetBox.appendChild(playlist);
                        }
                    }
                })
                .catch(() => {
                    targetBox.innerHTML = `
                        <div style="color: var(--muted); font-size: 13px;">Lookup failed.</div>
                        ${toChips(value)}
                    `;
                });
        } else {
            renderCameraView();
            targetBox.innerHTML = `
                <div style="color: var(--muted); font-size: 13px;">Demo translation (sign → text):</div>
                <div>${value}</div>
                <div style="color: var(--muted); font-size: 12px;">Text rendering is a placeholder.</div>
            `;
        }
    }

    swapBtn.addEventListener('click', () => {
        setMode(mode === 'text-to-sign' ? 'sign-to-text' : 'text-to-sign');
        translate();
    });

    translateBtn.addEventListener('click', translate);

    clearBtn.addEventListener('click', () => {
        source.value = '';
        if (mode === 'text-to-sign') {
            renderPlaceholder();
        } else {
            renderCameraView();
            targetBox.innerHTML = '<span class="muted" style="color: var(--muted);">Your text output will appear here.</span>';
        }
        source.focus();
    });

    setMode('text-to-sign');
});
