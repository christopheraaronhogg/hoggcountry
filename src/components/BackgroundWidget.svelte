<script>
    import { onMount, onDestroy } from 'svelte';

    let isOpen = $state(false);
    let seed = $state('hogg-country');
    let noiseScale = $state(98);
    let gridSize = $state(184);
    let contourLevels = $state(28);
    let falloff = $state(3.8);
    let colorScheme = $state('hogg-country');
    let currentSvgContent = $state('');

    // --- PERLIN NOISE GENERATOR ---
    const PerlinNoise = new function() {
        this.p = new Uint8Array(512);
        this.init = function(seed) {
            let s = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const random = () => {
                const x = Math.sin(s++) * 10000;
                return x - Math.floor(x);
            };
            let p = new Array(256).fill(0).map((_, i) => i);
            for (let i = p.length - 1; i > 0; i--) {
                const j = Math.floor(random() * (i + 1));
                [p[i], p[j]] = [p[j], p[i]];
            }
            this.p = new Uint8Array(512);
            for (let i = 0; i < 256; i++) {
                this.p[i] = this.p[i + 256] = p[i];
            }
        };
        const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
        const lerp = (t, a, b) => a + t * (b - a);
        const grad = (hash, x, y) => {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        };
        this.noise = function(x, y) {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            x -= Math.floor(x);
            y -= Math.floor(y);
            const u = fade(x);
            const v = fade(y);
            const p = this.p;
            const A = p[X] + Y, B = p[X + 1] + Y;
            return lerp(v,
                lerp(u, grad(p[A], x, y), grad(p[B], x - 1, y)),
                lerp(u, grad(p[A + 1], x, y - 1), grad(p[B + 1], x - 1, y - 1))
            );
        };
    };

    // --- MAP GENERATION LOGIC ---
    function generateMap() {
        PerlinNoise.init(seed);

        const width = 500;
        const height = 500;
        const cellSize = width / gridSize;

        // 1. Create heightmap using Perlin noise
        const heightmap = [];
        for (let y = 0; y <= gridSize; y++) {
            heightmap[y] = [];
            for (let x = 0; x <= gridSize; x++) {
                const nx = 2 * x / gridSize - 1;
                const ny = 2 * y / gridSize - 1;
                const d = Math.sqrt(nx * nx + ny * ny);
                const falloffValue = (1 - Math.pow(d, falloff));
                let noiseVal = (PerlinNoise.noise(x / noiseScale, y / noiseScale) + 1) / 2;
                heightmap[y][x] = noiseVal * Math.max(0, falloffValue);
            }
        }

        // 2. Generate contour lines using Marching Squares
        const contourData = [];
        for (let level = 1 / contourLevels; level < 1; level += 1 / contourLevels) {
            const lines = [];
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    const cellCorners = [heightmap[y][x], heightmap[y][x + 1], heightmap[y + 1][x + 1], heightmap[y + 1][x]];
                    let caseIndex = (cellCorners[0] > level ? 8 : 0) | (cellCorners[1] > level ? 4 : 0) | (cellCorners[2] > level ? 2 : 0) | (cellCorners[3] > level ? 1 : 0);
                    const p = [{ x: x * cellSize, y: y * cellSize, val: cellCorners[0] }, { x: (x + 1) * cellSize, y: y * cellSize, val: cellCorners[1] }, { x: (x + 1) * cellSize, y: (y + 1) * cellSize, val: cellCorners[2] }, { x: x * cellSize, y: (y + 1) * cellSize, val: cellCorners[3] }];
                    const lerpPoint = (p1, p2) => {
                         const t = (level - p1.val) / (p2.val - p1.val);
                         return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
                    };
                    const a = lerpPoint(p[0], p[1]), b = lerpPoint(p[1], p[2]), c = lerpPoint(p[3], p[2]), d = lerpPoint(p[0], p[3]);
                    switch (caseIndex) {
                        case 1: lines.push([d, c]); break; case 2: lines.push([c, b]); break; case 3: lines.push([d, b]); break;
                        case 4: lines.push([a, b]); break; case 5: lines.push([d, a]); lines.push([c, b]); break; case 6: lines.push([a, c]); break;
                        case 7: lines.push([d, a]); break; case 8: lines.push([d, a]); break; case 9: lines.push([a, c]); break;
                        case 10: lines.push([d, c]); lines.push([a, b]); break; case 11: lines.push([a, b]); break; case 12: lines.push([d, b]); break;
                        case 13: lines.push([c, b]); break; case 14: lines.push([d, c]); break;
                    }
                }
            }
            contourData.push({ level, lines });
        }
        
        // 3. Render as SVG and set as background
        renderSVG(contourData, width, height, colorScheme);
    }

    function renderSVG(contourData, width, height, colorScheme) {
        const colors = {
            'hogg-country': ['#f5f2e8', '#f0ede3', '#ebe8dd', '#e6e3d8', '#e1ded2', '#dcd9cd', '#d7d4c7', '#d2cfc2', '#cdcabc', '#c8c5b7'],
            terrain: ['#537A74', '#668F84', '#7AA493', '#8EB9A3', '#A1CEB3', '#B4E3C3', '#C7F8D3', '#DAFFE2', '#EDFFEF', '#FFFFFF'],
            ocean: ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'],
            mono: ['#222222', '#444444', '#666666', '#888888', '#AAAAAA', '#CCCCCC'],
            magma: ['#000004', '#1D1147', '#51127C', '#822581', '#B63679', '#E65164', '#FB8861', '#FEC287', '#FCFDBF'],
            viridis: ['#440154', '#482878', '#3E4A89', '#31688E', '#26828E', '#1F9E89', '#35B779', '#6DCD59', '#B4DE2C', '#FDE725']
        };

        const selectedColors = colors[colorScheme] || colors['hogg-country'];
        const numColors = selectedColors.length;

        let svgContent = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background-color: ${colorScheme === 'mono' ? '#111827' : selectedColors[0]};">`;
        
        contourData.forEach((contour, index) => {
            // For hogg-country theme, use very subtle lines like the existing site
            if (colorScheme === 'hogg-country') {
                // Every 5th line is slightly more visible (index contour)
                const isIndexContour = index % 5 === 0;
                const color = isIndexContour ? 'rgba(77, 89, 74, 0.15)' : 'rgba(77, 89, 74, 0.08)';
                const strokeWidth = isIndexContour ? '1.0' : '0.6';
                let pathData = '';
                contour.lines.forEach(line => {
                    pathData += `M ${line[0].x.toFixed(2)} ${line[0].y.toFixed(2)} L ${line[1].x.toFixed(2)} ${line[1].y.toFixed(2)} `;
                });
                svgContent += `<path d="${pathData}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round" />`;
            } else {
                // For other themes, use the gradient approach
                const colorIndex = Math.floor((contour.level * (numColors - 1)));
                const color = selectedColors[Math.min(numColors - 1, colorIndex + 1)];
                let pathData = '';
                contour.lines.forEach(line => {
                    pathData += `M ${line[0].x.toFixed(2)} ${line[0].y.toFixed(2)} L ${line[1].x.toFixed(2)} ${line[1].y.toFixed(2)} `;
                });
                svgContent += `<path d="${pathData}" stroke="${color}" stroke-width="1.5" fill="none" />`;
            }
        });
        
        svgContent += '</svg>';
        
        // Store raw SVG and set as background
        currentSvgContent = svgContent;
        try {
            localStorage.setItem('hc-bg-svg', currentSvgContent);
        } catch (_) { /* ignore quota errors */ }
        const encodedSvg = btoa(svgContent);
        const dataUri = `url('data:image/svg+xml;base64,${encodedSvg}')`;
        
        document.body.style.backgroundImage = dataUri;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
    }

    function downloadSVG() {
        if (!currentSvgContent) {
            alert('Please generate a map first!');
            return;
        }
        const blob = new Blob([currentSvgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hogg-country-background-${seed}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function toggleWidget() {
        isOpen = !isOpen;
    }

    // Close on Escape for accessibility
    function handleKeydown(e) {
        if (e.key === 'Escape' && isOpen) {
            isOpen = false;
        }
    }

    // Persist settings whenever they change
    $effect(() => {
        try {
            const settings = { seed, noiseScale, gridSize, contourLevels, falloff, colorScheme };
            localStorage.setItem('hc-bg-settings', JSON.stringify(settings));
        } catch (_) { /* ignore */ }
    });

    // Generate on mount, loading saved settings and applying saved SVG if available
    onMount(() => {
        // keyboard listener for Escape
        window.addEventListener('keydown', handleKeydown);
        try {
            const saved = localStorage.getItem('hc-bg-settings');
            if (saved) {
                const s = JSON.parse(saved);
                if (typeof s.seed === 'string') seed = s.seed;
                if (typeof s.noiseScale === 'number') noiseScale = s.noiseScale;
                if (typeof s.gridSize === 'number') gridSize = s.gridSize;
                if (typeof s.contourLevels === 'number') contourLevels = s.contourLevels;
                if (typeof s.falloff === 'number') falloff = s.falloff;
                if (typeof s.colorScheme === 'string') colorScheme = s.colorScheme;
            }
            const savedSvg = localStorage.getItem('hc-bg-svg');
            if (savedSvg) {
                const encoded = btoa(savedSvg);
                const dataUri = `url('data:image/svg+xml;base64,${encoded}')`;
                document.body.style.backgroundImage = dataUri;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                return; // skip regeneration for performance
            } else {
                // First visit - fetch default SVG from server
                fetch('/default-background.svg')
                    .then(response => response.text())
                    .then(defaultSvg => {
                        // Save the default SVG to localStorage for future visits
                        try {
                            localStorage.setItem('hc-bg-svg', defaultSvg);
                        } catch (_) { /* ignore quota errors */ }
                        
                        // Apply the default SVG as background
                        const encoded = btoa(defaultSvg);
                        const dataUri = `url('data:image/svg+xml;base64,${encoded}')`;
                        document.body.style.backgroundImage = dataUri;
                        document.body.style.backgroundSize = 'cover';
                        document.body.style.backgroundPosition = 'center center';
                    })
                    .catch(() => {
                        // Fallback: generate on client if server default fails
                        generateMap();
                    });
                return;
            }
        } catch (_) { /* ignore */ }
        generateMap();
    });

    onDestroy(() => {
        window.removeEventListener('keydown', handleKeydown);
    });
</script>

<!-- Controls Toggle Button -->
<button
    onclick={toggleWidget}
    class="toggle-btn"
    title="Background Generator"
>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996 .608 2.296 .07 2.572-1.065z" />
        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
</button>

{#if isOpen}
  <!-- Click-outside backdrop to close panel -->
  <div class="controls-backdrop" onclick={toggleWidget} aria-hidden="true"></div>
{/if}

<!-- Controls Panel -->
<div class="controls-panel" class:open={isOpen}>
    <div class="panel-header">
        <h3>Background Generator</h3>
        <button onclick={toggleWidget} class="close-btn">×</button>
    </div>

    <div class="panel-content">
        <!-- Controls -->
        <div class="control-group">
            <label for="seed">Seed</label>
            <input type="text" id="seed" bind:value={seed}>
        </div>
        
        <div class="control-group">
            <label for="noiseScale">Noise Scale: {noiseScale}</label>
            <input type="range" id="noiseScale" min="5" max="200" bind:value={noiseScale}>
        </div>
        
        <div class="control-group">
            <label for="gridSize">Grid Detail: {gridSize}</label>
            <input type="range" id="gridSize" min="20" max="250" bind:value={gridSize}>
        </div>
        
        <div class="control-group">
            <label for="contourLevels">Contour Levels: {contourLevels}</label>
            <input type="range" id="contourLevels" min="2" max="50" bind:value={contourLevels}>
        </div>
        
        <div class="control-group">
            <label for="falloff">Island Effect: {falloff}</label>
            <input type="range" id="falloff" min="0" max="5" step="0.1" bind:value={falloff}>
        </div>
        
        <div class="control-group">
            <label for="colorScheme">Color Scheme</label>
            <select id="colorScheme" bind:value={colorScheme}>
                <option value="hogg-country">Hogg Country</option>
                <option value="terrain">Terrain</option>
                <option value="ocean">Ocean</option>
                <option value="mono">Monochrome</option>
                <option value="magma">Magma</option>
                <option value="viridis">Viridis</option>
            </select>
        </div>

        <!-- Buttons -->
        <div class="actions">
            <button onclick={generateMap} class="btn btn-primary">Generate</button>
            <button onclick={downloadSVG} class="btn">Download SVG</button>
        </div>
    </div>
</div>

<style>
    .toggle-btn {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 1000;
        width: 50px;
        height: 50px;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(8px);
        border: 1px solid var(--stone);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--pine);
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .toggle-btn:hover {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 1);
    }

    .controls-panel {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: 320px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(12px);
        border-left: 1px solid var(--border);
        z-index: 999;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        overflow-y: auto;
        box-shadow: -4px 0 20px rgba(0,0,0,0.1);
    }
    
.controls-panel.open {
        transform: translateX(0);
    }

    .controls-backdrop {
        position: fixed;
        inset: 0;
        background: transparent; /* or rgba(0,0,0,0.02) if you want a hint */
        z-index: 998;
    }
    
    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border);
        background: rgba(245, 242, 232, 0.8);
    }
    
    .panel-header h3 {
        margin: 0;
        font-family: 'Oswald', sans-serif;
        color: var(--ink);
        font-size: 1.25rem;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: var(--muted);
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    }
    
    .close-btn:hover {
        background: var(--stone);
    }
    
    .panel-content {
        padding: 1rem;
    }
    
    .control-group {
        margin-bottom: 1rem;
    }
    
    .control-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--pine);
        font-size: 0.875rem;
    }
    
    .control-group input,
    .control-group select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--stone);
        border-radius: 4px;
        background: white;
        color: var(--pine);
        font-size: 0.875rem;
    }
    
    .control-group input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 4px;
        background: var(--stone);
        border-radius: 2px;
        outline: none;
        cursor: pointer;
        padding: 0;
    }
    
    .control-group input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        background: var(--alpine);
        border-radius: 50%;
        cursor: pointer;
    }
    
    .control-group input[type="range"]::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: var(--alpine);
        border-radius: 50%;
        cursor: pointer;
        border: none;
    }
    
    .actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border);
    }
    
    .btn {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid var(--stone);
        background: white;
        color: var(--pine);
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .btn-primary {
        background: var(--alpine);
        color: white;
        border-color: var(--alpine);
    }
    
    .btn-primary:hover {
        background: #98a87c;
    }
</style>
