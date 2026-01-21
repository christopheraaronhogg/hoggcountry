<script>
    import { onMount } from 'svelte';

    // Background generator runs with fixed defaults (no UI).
    const seed = 'hogg-country';
    const noiseScale = 98;
    const gridSize = 184;
    const contourLevels = 28;
    const falloff = 3.8;
    const colorScheme = 'hogg-country';

    // Versioned cache key so old "customized" backgrounds won't override defaults.
    const SVG_CACHE_KEY = 'hc-bg-svg-default-v1';

    let currentSvgContent = '';

    function applyBackgroundSvg(svgText) {
        const encoded = btoa(svgText);
        const dataUri = `url('data:image/svg+xml;base64,${encoded}')`;
        document.body.style.backgroundImage = dataUri;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center center';
    }

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

        currentSvgContent = svgContent;
        try {
            localStorage.setItem(SVG_CACHE_KEY, currentSvgContent);
        } catch (_) { /* ignore quota errors */ }

        applyBackgroundSvg(svgContent);
    }

    // Generate on mount, using a cached default SVG when available.
    onMount(() => {
        try {
            const savedSvg = localStorage.getItem(SVG_CACHE_KEY);
            if (savedSvg) {
                currentSvgContent = savedSvg;
                applyBackgroundSvg(savedSvg);
                return;
            }
        } catch (_) { /* ignore */ }

        fetch('/default-background.svg')
            .then(response => {
                if (!response.ok) throw new Error('Failed to fetch default background SVG');
                return response.text();
            })
            .then(defaultSvg => {
                currentSvgContent = defaultSvg;
                try {
                    localStorage.setItem(SVG_CACHE_KEY, defaultSvg);
                } catch (_) { /* ignore quota errors */ }
                applyBackgroundSvg(defaultSvg);
            })
            .catch(() => {
                // Fallback: generate on client if server default fails
                try {
                    generateMap();
                } catch (_) { /* ignore */ }
            });
    });
</script>
