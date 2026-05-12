
        const masterCanvas = document.getElementById('masterCanvas');
        const mCtx = masterCanvas.getContext('2d', { willReadFrequently: true });
        const editCanvas = document.getElementById('editCanvas');
        const eCtx = editCanvas.getContext('2d', { willReadFrequently: true });
        const gallery = document.getElementById('galleryContainer');
        
        let glyphDataList = []; let isImageLoaded = false;
        let baseEditorCanvas = document.createElement('canvas'); 
        baseEditorCanvas.width = 64; baseEditorCanvas.height = 64;
        let baseCtx = baseEditorCanvas.getContext('2d', { willReadFrequently: true });
        let currentEditGlyph = null; let isDrawing = false; let activeTool = 'brush';
        let mainImage = new Image();

        // 30 COLORS (15 BRIGHT + 15 DARK) + GOLD
        const rankColors = [
            { color: "#FFD700", name: "Gold" }, { color: "#b8860b", name: "Dark Gold" },
            { color: "#55FF55", name: "Lime" }, { color: "#228b22", name: "Dark Green" },
            { color: "#e74c3c", name: "Red" }, { color: "#8b0000", name: "Dark Red" },
            { color: "#3498db", name: "Blue" }, { color: "#00008b", name: "Dark Blue" },
            { color: "#00FFFF", name: "Cyan" }, { color: "#008b8b", name: "Dark Cyan" },
            { color: "#9b59b6", name: "Purple" }, { color: "#4b0082", name: "Dark Purple" },
            { color: "#f1c40f", name: "Yellow" }, { color: "#b8860b", name: "Dark Yellow" },
            { color: "#e67e22", name: "Orange" }, { color: "#d35400", name: "Dark Orange" },
            { color: "#ecf0f1", name: "Silver" }, { color: "#7f8c8d", name: "Gray" },
            { color: "#ff69b4", name: "Pink" }, { color: "#c71585", name: "Dark Pink" },
            { color: "#1abc9c", name: "Turquoise"}, { color: "#16a085", name: "Dark Turq" },
            { color: "#8e44ad", name: "Void" }, { color: "#2c3e50", name: "Midnight" },
            { color: "#ffffff", name: "White" }, { color: "#a9a9a9", name: "Dark White" },
            { color: "#f39c12", name: "Amber" }, { color: "#a67c00", name: "Dark Amber" },
            { color: "#2ecc71", name: "Emerald" }, { color: "#27ae60", name: "Dark Emerald" }
        ];

        const bgStyles = [
            { id: "ranktag", name: "Rank Tag" }, { id: "classic", name: "Classic" }, { id: "shiny", name: "Shiny" }, { id: "glass", name: "Frosted" },
            { id: "encased", name: "Encased" }, { id: "split", name: "Split" }, { id: "bolt", name: "Lightning" },
            { id: "chaos", name: "Chaos" }, { id: "carbon", name: "Carbon" }, { id: "magma", name: "Magma" },
            { id: "scan", name: "Scanline" }, { id: "metal", name: "Metal" }, { id: "dots", name: "Dotted" },
            { id: "bevel", name: "Bevel" }, { id: "inset", name: "Inset" }, { id: "hollow", name: "Hollow" },
            { id: "aura", name: "Aura" }, { id: "ice", name: "Ice" }, { id: "vines", name: "Vines" },
            { id: "cyber", name: "Cyber" }, { id: "ultimate", name: "Ultimate" }
        ];

        const iconList = [
            { id: "none", label: "❌" }, { id: "crown", label: "👑" }, { id: "gem", label: "💎" },
            { id: "star", label: "⭐" }, { id: "shield", label: "🛡️" }, { id: "sword", label: "⚔️" },
            { id: "lightning", label: "⚡" }, { id: "skull", label: "💀" }, { id: "head", label: "👤" },
            { id: "queen", label: "👸" }, { id: "staff", label: "🪄" }, { id: "hammer", label: "🔨" },
            { id: "dragon", label: "🐲" }, { id: "helmet", label: "🪖" }, { id: "bow", label: "🏹" },
            { id: "potion", label: "🧪" }, { id: "book", label: "📖" }, { id: "anvil", label: "⚒️" },
            { id: "fire", label: "🔥" }, { id: "youtube", label: "▶️" }, { id: "wing", label: "🪽" },
            { id: "pickaxe", label: "⛏️" }, { id: "chest", label: "📦" }, { id: "trident", label: "🔱" },
            { id: "heart", label: "❤️" }, { id: "spark", label: "✨" }, { id: "admin", label: "🧿" },
            { id: "leaf", label: "🍃" }
        ];

        let selectedColor = rankColors[0].color; 
        let selectedStyle = 'ranktag'; 
        let selectedIcon = iconList[1].id;

        function initPickers() {
            const cp = document.getElementById('colorPicker'); cp.innerHTML = '';
            rankColors.forEach(c => {
                let div = document.createElement('div'); div.className = 'color-box' + (c.color === selectedColor ? ' active' : '');
                div.style.background = c.color; div.title = c.name;
                div.onclick = () => { document.querySelectorAll('.color-box').forEach(el => el.classList.remove('active')); div.classList.add('active'); selectedColor = c.color; };
                cp.appendChild(div);
            });
            const sp = document.getElementById('stylePicker'); sp.innerHTML = '';
            bgStyles.forEach(st => {
                let btn = document.createElement('div'); btn.className = 'style-btn' + (st.id === selectedStyle ? ' active' : '');
                btn.innerText = st.name; btn.onclick = () => { document.querySelectorAll('.style-btn').forEach(el => el.classList.remove('active')); btn.classList.add('active'); selectedStyle = st.id; };
                sp.appendChild(btn);
            });
            const ip = document.getElementById('iconPicker'); ip.innerHTML = '';
            iconList.forEach(ic => {
                let div = document.createElement('div'); div.className = 'icon-box' + (ic.id === selectedIcon ? ' active' : '');
                div.innerText = ic.label; div.title = ic.id;
                div.onclick = () => { document.querySelectorAll('.icon-box').forEach(el => el.classList.remove('active')); div.classList.add('active'); selectedIcon = ic.id; };
                ip.appendChild(div);
            });
        }

        // --- FULL FONT ENGINES (A-Z, 0-9) ---
        
        // 1. CAPS BOLD (Super Thick & Blocky)
        const capsBoldFont = {
            'A':["1111","1001","1111","1001","1001"], 'B':["1111","1001","1111","1001","1111"], 'C':["1111","1000","1000","1000","1111"], 'D':["1111","1001","1001","1001","1111"], 'E':["1111","1000","1111","1000","1111"], 'F':["1111","1000","1111","1000","1000"], 'G':["1111","1000","1011","1001","1111"], 'H':["1001","1001","1111","1001","1001"], 'I':["1111","0110","0110","0110","1111"], 'J':["0011","0011","0011","1011","0111"], 'K':["1001","1010","1100","1010","1001"], 'L':["1000","1000","1000","1000","1111"], 'M':["10001","11011","11111","10101","10001"], 'N':["1001","1101","1011","1001","1001"], 'O':["1111","1001","1001","1001","1111"], 'P':["1111","1001","1111","1000","1000"], 'Q':["1111","1001","1001","1111","0011"], 'R':["1111","1001","1111","1010","1001"], 'S':["1111","1000","1111","0001","1111"], 'T':["1111","0110","0110","0110","0110"], 'U':["1001","1001","1001","1001","1111"], 'V':["1001","1001","1001","0110","0110"], 'W':["10001","10001","10101","11011","11111"], 'X':["1001","1001","0110","1001","1001"], 'Y':["1001","1001","0110","0110","0110"], 'Z':["1111","0011","0110","1100","1111"], '0':["1111","1001","1001","1001","1111"], '1':["0110","1110","0110","0110","1111"], '2':["1111","0001","1111","1000","1111"], '3':["1111","0001","1111","0001","1111"], '4':["1001","1001","1111","0001","0001"], '5':["1111","1000","1111","0001","1111"], '6':["1111","1000","1111","1001","1111"], '7':["1111","0001","0010","0100","0100"], '8':["1111","1001","1111","1001","1111"], '9':["1111","1001","1111","0001","1111"]
        };

        // 2. MINECRAFT TEN (Original with hollow curves for O, D, R, C)
        const mcTenFont = {
            'A':["0110","1001","1111","1001","1001"], 'B':["1110","1001","1110","1001","1110"], 'C':["0111","1000","1000","1000","0111"], 'D':["1110","1001","1001","1001","1110"], 'E':["1111","1000","1110","1000","1111"], 'F':["1111","1000","1110","1000","1000"], 'G':["0111","1000","1011","1001","0111"], 'H':["1001","1001","1111","1001","1001"], 'I':["111","010","010","010","111"], 'J':["0001","0001","0001","1001","0110"], 'K':["1001","1010","1100","1010","1001"], 'L':["1000","1000","1000","1000","1111"], 'M':["10001","11011","10101","10001","10001"], 'N':["1001","1101","1011","1001","1001"], 'O':["0110","1001","1001","1001","0110"], 'P':["1110","1001","1110","1000","1000"], 'Q':["0110","1001","1001","0110","0001"], 'R':["1110","1001","1110","1010","1001"], 'S':["0111","1000","0110","0001","1110"], 'T':["111","010","010","010","010"], 'U':["1001","1001","1001","1001","0110"], 'V':["10001","10001","01010","01010","00100"], 'W':["10001","10001","10101","11011","10001"], 'X':["10001","01010","00100","01010","10001"], 'Y':["10001","01010","00100","00100","00100"], 'Z':["11111","00010","00100","01000","11111"], '1':["0110","0010","0010","0010","0111"], '2':["0110","1001","0010","0100","1111"], '3':["0110","1001","0011","1001","0110"], '4':["1001","1001","1111","0001","0001"], '5':["1111","1000","1110","0001","1110"], '6':["0111","1000","1110","1001","0110"], '7':["1111","0001","0010","0100","0100"], '8':["0110","1001","0110","1001","0110"], '9':["0110","1001","0111","0001","1110"], '0':["0110","1001","1001","1001","0110"]
        };

        // 3. SMALL CAPS (Thin & Elegant)
        const smallCapsFont = { 
            'A':["010","101","111","101","101"], 'B':["110","101","110","101","110"], 'C':["011","100","100","100","011"], 'D':["110","101","101","101","110"], 'E':["111","100","111","100","111"], 'F':["111","100","110","100","100"], 'G':["011","100","101","101","011"], 'H':["101","101","111","101","101"], 'I':["111","010","010","010","111"], 'J':["001","001","001","101","010"], 'K':["101","110","110","101","101"], 'L':["100","100","100","100","111"], 'M':["10001","11011","10101","10001","10001"], 'N':["1001","1101","1011","1001","1001"], 'O':["010","101","101","101","010"], 'P':["110","101","110","100","100"], 'Q':["010","101","101","011","001"], 'R':["110","101","110","101","101"], 'S':["011","100","010","001","110"], 'T':["111","010","010","010","010"], 'U':["101","101","101","101","011"], 'V':["101","101","101","101","010"], 'W':["10001","10001","10101","11011","10001"], 'X':["101","101","010","101","101"], 'Y':["101","101","010","010","010"], 'Z':["111","001","010","100","111"], '0':["010","101","101","101","010"], '1':["010","110","010","010","111"], '2':["010","101","001","010","111"], '3':["110","001","010","001","110"], '4':["101","101","111","001","001"], '5':["111","100","110","001","110"], '6':["011","100","110","101","010"], '7':["111","001","010","010","010"], '8':["010","101","010","101","010"], '9':["010","101","011","001","110"]
        };

        // 4. REGULAR (Classic 1px)
        const regularFont = smallCapsFont;

        const iconsMatrix = {
            crown:["00100100","01011010","11111111","11111111","01111110"],
            skull:["011110","111111","101101","111111","010010"],
            shield:["011110","111111","111111","011110","001100"],
            check:["000001","000011","100110","111100","011000"],
            head:["01110","11111","11111","01110","11111"],
            queen:["10101","11111","11111","11111","01110"],
            staff:["00100","01110","00100","00100","00100"],
            hammer:["11111","11111","00100","00100","00100"],
            dragon:["01010","11111","11111","01110","10101"],
            youtube:["01111110","11111111","11110111","11111111","01111110"],
            lightning:["00110","01100","11111","00110","01000"],
            sword:["00001","00011","01110","11100","01000"],
            gem:["001100","011110","111111","011110","001100"],
            star:["00100","11111","01110","11111","00100"],
            helmet:["011110","111111","110011","101101","100001"],
            bow:["00110","01010","10010","11000","00000"],
            potion:["001100","001100","011110","111111","011110"],
            book:["110011","111111","111111","111111","110011"],
            anvil:["11111","00100","01110","11111","00000"],
            fire:["00100","01100","11110","11111","01110"],
            wing:["11000","11110","11111","01110","00100"],
            pickaxe:["11111","01100","00100","00100","00100"],
            chest:["11111","10001","11111","10001","11111"],
            trident:["10101","11111","00100","00100","00100"],
            heart:["01010","11111","11111","01110","00100"],
            spark:["00100","10101","01110","10101","00100"],
            admin:["01110","11011","10101","11011","01110"],
            leaf:["00110","01111","11110","11100","01000"]
        };

        function shadeColor(color, percent) {
            let R = parseInt(color.substring(1,3),16); let G = parseInt(color.substring(3,5),16); let B = parseInt(color.substring(5,7),16);
            R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100);
            R = Math.min(255, Math.max(0, R)); G = Math.min(255, Math.max(0, G)); B = Math.min(255, Math.max(0, B));
            return "#"+((R.toString(16).padStart(2,'0')))+((G.toString(16).padStart(2,'0')))+((B.toString(16).padStart(2,'0')));
        }

        function drawMatrixIcon(ctx, icon, boxX, boxY, boxW, boxH, color, useShadow, shadowX, shadowY, shadowColor, useGradient) {
            if(!icon) return;
            const mw = icon[0].length, mh = icon.length;
            let scale = Math.floor(Math.min((boxW - 2) / mw, (boxH - 2) / mh));
            scale = Math.max(1, Math.min(2, scale));
            const drawW = mw * scale, drawH = mh * scale;
            const startX = boxX + Math.floor((boxW - drawW) / 2);
            const startY = boxY + Math.floor((boxH - drawH) / 2);
            const drawPixel = (dx, dy, fill) => { ctx.fillStyle = fill; ctx.fillRect(dx, dy, scale, scale); };
            if(useShadow) {
                for(let r=0; r<mh; r++) for(let c=0; c<mw; c++) if(icon[r][c] === '1') drawPixel(startX + c*scale + shadowX, startY + r*scale + shadowY, shadowColor);
            }
            for(let r=0; r<mh; r++) for(let c=0; c<mw; c++) if(icon[r][c] === '1') {
                const fill = useGradient ? shadeColor(color, Math.max(-35, 18 - (r*14))) : color;
                drawPixel(startX + c*scale, startY + r*scale, fill);
            }
        }

        function createEmptyCanvas() { masterCanvas.width = 1024; masterCanvas.height = 1024; mCtx.clearRect(0,0,1024,1024); isImageLoaded = true; processGlyphs(); }

        document.getElementById('uploadFile').addEventListener('change', (e) => {
            const file = e.target.files[0]; if(!file) return;
            const reader = new FileReader(); reader.onload = (ev) => {
                mainImage.onload = () => { masterCanvas.width = mainImage.width; masterCanvas.height = mainImage.height; mCtx.clearRect(0, 0, masterCanvas.width, masterCanvas.height); mCtx.drawImage(mainImage, 0, 0); isImageLoaded = true; processGlyphs(); }
                mainImage.src = ev.target.result;
            }
            reader.readAsDataURL(file);
        });

        function processGlyphs() {
            if(!isImageLoaded) return alert("Upload dulu, baru klik PISAHKAN!");
            const cell = 64; glyphDataList = []; gallery.innerHTML = ''; 
            const temp = document.createElement('canvas'); temp.width = cell; temp.height = cell; const tCtx = temp.getContext('2d');
            const baseHex = parseInt(document.getElementById('baseHex').value, 16);
            for (let r = 0; r < 16; r++) for (let c = 0; c < 16; c++) {
                const hex = (baseHex + (r * 16) + c).toString(16).toUpperCase();
                tCtx.clearRect(0, 0, cell, cell); tCtx.drawImage(masterCanvas, c*cell, r*cell, cell, cell, 0, 0, cell, cell);
                const obj = { id: `gl_${c}_${r}`, x: c*cell, y: r*cell, hex, char: String.fromCodePoint(baseHex + (r * 16) + c), name: `GLYPH_${hex}`, text: '', imgData: temp.toDataURL() };
                glyphDataList.push(obj);
                const card = document.createElement('div'); card.className = 'glyph-card';
                card.innerHTML = `<img src="${obj.imgData}" class="glyph-img" id="img_${obj.id}"><div class="hex-code">\\u${obj.hex}</div><div id="meta_${obj.id}" style="font-size:11px; color:#fff; text-align:center; word-break:break-word;">${obj.name}</div><div style="font-size:10px; color:#8ad;">${obj.char}</div><div class="card-actions"><button class="btn-warning" onclick="openEditor('${obj.id}')">✏️</button><button class="btn-success" onclick="downloadSingle('${obj.id}')">⬇️</button></div>`;
                gallery.appendChild(card);
            }
        }

        function downloadSingle(id) { const g = glyphDataList.find(x => x.id === id); const a = document.createElement('a'); a.download = `glyph_${g.hex}.png`; a.href = document.getElementById(`img_${id}`).src; a.click(); }

        function openEditor(id) {
            currentEditGlyph = glyphDataList.find(g => g.id === id);
            editCanvas.width = 64; editCanvas.height = 64; baseEditorCanvas.width = 64; baseEditorCanvas.height = 64;
            baseCtx.clearRect(0,0, 64, 64); baseCtx.drawImage(masterCanvas, currentEditGlyph.x, currentEditGlyph.y, 64, 64, 0, 0, 64, 64);
            document.getElementById('glyphName').value = currentEditGlyph.name || '';
            document.getElementById('customText').value = currentEditGlyph.text || currentEditGlyph.name || '';
            previewEditor(); document.getElementById('editorModal').style.display = 'flex';
        }
        function closeEditor() { document.getElementById('editorModal').style.display = 'none'; }

        function slugifyGlyphName(str) {
            return (str || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'GLYPH_' + currentEditGlyph.hex;
        }

        function syncGlyphNameToPreview() {
            const nameInput = document.getElementById('glyphName');
            nameInput.value = slugifyGlyphName(nameInput.value);
        }

        function updateGlyphCardMeta(g) {
            const el = document.getElementById(`meta_${g.id}`);
            if (el) el.textContent = g.name;
        }

        function previewEditor() {
            eCtx.clearRect(0,0, 64, 64); eCtx.drawImage(baseEditorCanvas, 0, 0);
            const txt = document.getElementById('customText').value.toUpperCase();
            if(txt) {
                const tx = parseInt(document.getElementById('textX').value), ty = parseInt(document.getElementById('textY').value), tCol = document.getElementById('textColor').value;
                const fontSelect = document.getElementById('fontStyle').value, hasShadow = document.getElementById('useTextShadow').checked;
                const sx = parseInt(document.getElementById('textShadowX').value), sy = parseInt(document.getElementById('textShadowY').value), sCol = document.getElementById('textShadowColor').value;
                
                let activeFont = mcTenFont;
                if(fontSelect === 'capsbold') activeFont = capsBoldFont;
                if(fontSelect === 'smallcaps') activeFont = smallCapsFont;
                if(fontSelect === 'regular') activeFont = regularFont;

                const drawChar = (char, ox, oy, col) => {
                    const map = activeFont[char] || smallCapsFont[char] || smallCapsFont['A']; 
                    for(let r=0; r<map.length; r++) for(let c=0; c<map[r].length; c++) if(map[r][c]==='1') { eCtx.fillStyle = col; eCtx.fillRect(ox+c, oy+r, 1, 1); }
                    return map[0].length + 1;
                };
                
                if(hasShadow) { let cx = tx; for(let char of txt) { if(char === ' ') { cx += 3; continue; } drawChar(char, cx+sx, ty+sy, sCol); cx += (activeFont[char]?activeFont[char][0].length + 1 : 4); } }
                let cx = tx; for(let char of txt) { if(char === ' ') { cx += 3; continue; } cx += drawChar(char, cx, ty, tCol); }
            }
        }

        function stampText() { baseCtx.drawImage(editCanvas, 0, 0); currentEditGlyph.text = document.getElementById('customText').value.toUpperCase(); previewEditor(); }

        // --- FULL STYLES ENGINE WITH THICK 3D BORDERS & THICK SHINY ---
        function applyTemplate() {
            const baseColor = selectedColor, style = selectedStyle;
            const textWidth = parseInt(document.getElementById('boxWidth').value);
            
            // Outer outline (1px super dark)
            const cOutline = shadeColor(baseColor, -80); 
            // Thick borders: Bright Top/Left, Dark Bottom/Right
            const cBorderTop = shadeColor(baseColor, 40); 
            const cBorderBot = shadeColor(baseColor, -50); 
            
            baseCtx.clearRect(0,0,64,64);
            const bh = selectedStyle === 'ranktag' ? 16 : 14, iw = selectedStyle === 'ranktag' ? 16 : 14, tw = textWidth, gap = 1;
            const sx = Math.floor((64-(iw+gap+tw))/2), sy = selectedStyle === 'ranktag' ? 24 : Math.floor((64-bh)/2);
            
            const drawBox = (x, y, bw) => {
                if(style === 'ranktag') {
                    baseCtx.fillStyle = '#071224'; baseCtx.fillRect(x, y, bw, bh);
                    baseCtx.fillStyle = '#FFFFFF'; baseCtx.fillRect(x+1, y+1, bw-2, bh-2);
                    baseCtx.fillStyle = '#A8F6FF'; baseCtx.fillRect(x+2, y+2, bw-4, bh-4);
                    baseCtx.fillStyle = '#58D9FF'; baseCtx.fillRect(x+3, y+3, bw-6, bh-6);
                    baseCtx.fillStyle = '#D9FEFF'; baseCtx.fillRect(x+3, y+3, bw-6, 2);
                    baseCtx.fillStyle = '#8BEFFF'; baseCtx.fillRect(x+3, y+5, bw-6, 2);
                    baseCtx.fillStyle = '#42C0F4'; baseCtx.fillRect(x+3, y+7, bw-6, 2);
                    baseCtx.fillStyle = '#289CDD'; baseCtx.fillRect(x+3, y+9, bw-6, 2);
                    baseCtx.fillStyle = '#1676C6'; baseCtx.fillRect(x+3, y+11, bw-6, 2);
                    baseCtx.fillStyle = '#0D4C97'; baseCtx.fillRect(x+3, y+13, bw-6, 1);
                    baseCtx.fillStyle = 'rgba(255,255,255,0.55)'; baseCtx.fillRect(x+4, y+4, Math.max(6, Math.floor((bw-8) * 0.55)), 1);
                    baseCtx.fillStyle = '#C5FCFF'; baseCtx.fillRect(x+4, y+6, Math.max(4, Math.floor((bw-8) * 0.35)), 1);
                    return;
                }
                if(style === 'hollow') {
                    baseCtx.fillStyle = 'rgba(0,0,0,0)'; baseCtx.clearRect(x,y,bw,bh);
                    // Hollow has thick border too
                    baseCtx.fillStyle = cBorderTop; baseCtx.fillRect(x,y,bw,2); baseCtx.fillRect(x,y,2,bh);
                    baseCtx.fillStyle = cBorderBot; baseCtx.fillRect(x,y+bh-2,bw,2); baseCtx.fillRect(x+bw-2,y,2,bh);
                    return;
                }
                
                // Outer Black/Darkest outline
                let outColor = cOutline;
                if(style === 'encased') outColor = '#000000';
                baseCtx.fillStyle = outColor; baseCtx.fillRect(x, y, bw, bh);
                
                // Thick 3D Borders (2 pixels thick)
                if(style !== 'flat') {
                    let bTop = cBorderTop; let bBot = cBorderBot;
                    if(style === 'inset') { bTop = cBorderBot; bBot = cBorderTop; } // Reverse for inset
                    // Top & Left
                    baseCtx.fillStyle = bTop; 
                    baseCtx.fillRect(x+1, y+1, bw-2, 2); 
                    baseCtx.fillRect(x+1, y+1, 2, bh-2);
                    // Bottom & Right
                    baseCtx.fillStyle = bBot; 
                    baseCtx.fillRect(x+1, y+bh-3, bw-2, 2); 
                    baseCtx.fillRect(x+bw-3, y+1, 2, bh-2);
                }

                // Inner Background Area (Account for 1px outline + 2px thick border = 3px from each edge)
                const inX = x+3, inY = y+3, inW = bw-6, inH = bh-6;
                baseCtx.fillStyle = baseColor; baseCtx.fillRect(inX, inY, inW, inH);
                
                // Specific 20 Styles Logic (Drawn inside the inner area)
                if(['classic', 'ultimate'].includes(style)) {
                    const grad = baseCtx.createLinearGradient(0, inY, 0, inY+inH); grad.addColorStop(0, shadeColor(baseColor, 15)); grad.addColorStop(1, shadeColor(baseColor, -25));
                    baseCtx.fillStyle = grad; baseCtx.fillRect(inX, inY, inW, inH);
                } 
                if(style === 'shiny') {
                    baseCtx.fillStyle = shadeColor(baseColor, 50);
                    // THICK SHINY LINES (2px and 3px width diagonal)
                    for(let i=0; i<inW; i++) for(let j=0; j<inH; j++) {
                        let diag = i+j;
                        if(diag === 3 || diag === 4 || diag === 8) {
                            baseCtx.fillRect(inX+i, inY+j, 1, 1);
                        }
                    }
                }
                else if(style === 'glass') {
                    baseCtx.fillStyle = 'rgba(255,255,255,0.2)'; baseCtx.fillRect(inX, inY, inW, Math.floor(inH/2));
                }
                else if(style === 'split') {
                    baseCtx.fillStyle = shadeColor(baseColor, 15); baseCtx.fillRect(inX, inY, inW, Math.floor(inH/2));
                    baseCtx.fillStyle = shadeColor(baseColor, -25); baseCtx.fillRect(inX, inY+Math.floor(inH/2), inW, inH-Math.floor(inH/2));
                }
                else if(style === 'bolt') {
                    baseCtx.fillStyle = shadeColor(baseColor, -25); baseCtx.fillRect(inX, inY, inW, inH);
                    baseCtx.fillStyle = shadeColor(baseColor, 60); let lx = Math.floor(inW/2);
                    for(let j=0; j<inH; j++) { baseCtx.fillRect(inX+lx, inY+j, 1, 1); if(j%2===0) lx--; else lx++; }
                }
                else if(style === 'chaos') {
                    for(let i=0; i<inW; i++) for(let j=0; j<inH; j++) {
                        if((i*3+j*7)%5===0) { baseCtx.fillStyle = shadeColor(baseColor, 20); baseCtx.fillRect(inX+i, inY+j, 1, 1); }
                        else if((i*5+j*2)%7===0) { baseCtx.fillStyle = shadeColor(baseColor, -30); baseCtx.fillRect(inX+i, inY+j, 1, 1); }
                    }
                }
                else if(style === 'carbon') {
                    for(let i=0; i<inW; i++) for(let j=0; j<inH; j++) { baseCtx.fillStyle = (i+j)%2===0?shadeColor(baseColor,-15):shadeColor(baseColor,-35); baseCtx.fillRect(inX+i, inY+j, 1, 1); }
                }
                else if(style === 'magma') {
                    baseCtx.fillStyle = shadeColor(baseColor, -30); baseCtx.fillRect(inX, inY, inW, inH);
                    for(let i=0; i<inW; i++) { let hL = 1+((i*2)%3); baseCtx.fillStyle = shadeColor(baseColor, 30); baseCtx.fillRect(inX+i, inY+inH-hL, 1, hL); }
                }
                else if(style === 'scan') {
                    for(let j=0; j<inH; j+=2) { baseCtx.fillStyle = shadeColor(baseColor, -30); baseCtx.fillRect(inX, inY+j, inW, 1); }
                }
                else if(style === 'metal') {
                    const mg = baseCtx.createLinearGradient(inX, 0, inX+inW, 0); 
                    mg.addColorStop(0, shadeColor(baseColor,20)); mg.addColorStop(0.3, shadeColor(baseColor,-20)); 
                    mg.addColorStop(0.7, shadeColor(baseColor,25)); mg.addColorStop(1, shadeColor(baseColor,-15));
                    baseCtx.fillStyle = mg; baseCtx.fillRect(inX, inY, inW, inH);
                }
                else if(style === 'dots') {
                    baseCtx.fillStyle = shadeColor(baseColor, -25);
                    for(let i=0; i<inW; i+=2) for(let j=0; j<inH; j+=2) baseCtx.fillRect(inX+i, inY+j, 1, 1);
                }
                else if(style === 'grid') {
                    baseCtx.fillStyle = shadeColor(baseColor, -25);
                    for(let i=0; i<inW; i+=3) baseCtx.fillRect(inX+i, inY, 1, inH); for(let j=0; j<inH; j+=3) baseCtx.fillRect(inX, inY+j, inW, 1);
                }
                else if(style === 'aura') {
                    const g = baseCtx.createRadialGradient(inX+inW/2, inY+inH/2, 0, inX+inW/2, inY+inH/2, inW/1.5); 
                    g.addColorStop(0, shadeColor(baseColor, 30)); g.addColorStop(1, shadeColor(baseColor, -40));
                    baseCtx.fillStyle = g; baseCtx.fillRect(inX, inY, inW, inH);
                }
                else if(style === 'ice') {
                    baseCtx.fillStyle = shadeColor(baseColor, -10); baseCtx.fillRect(inX, inY, inW, inH);
                    baseCtx.fillStyle = 'rgba(255,255,255,0.4)'; baseCtx.fillRect(inX, inY, inW, 1);
                    for(let i=1; i<inW; i+=3) baseCtx.fillRect(inX+i, inY, 1, Math.floor(inH/2));
                }
                else if(style === 'vines') {
                    baseCtx.fillStyle = shadeColor(baseColor, -30); baseCtx.fillRect(inX, inY, inW, inH); baseCtx.fillStyle = shadeColor(baseColor, 20);
                    for(let i=0; i<inW; i+=3) { baseCtx.fillRect(inX+i, inY, 1, 1+(i%2)); baseCtx.fillRect(inX+i+1, inY+inH-1, 1, 1); }
                }
                else if(style === 'cyber') {
                    baseCtx.fillStyle = shadeColor(baseColor, -60); baseCtx.fillRect(inX, inY, inW, inH);
                    baseCtx.fillStyle = shadeColor(baseColor, 50); baseCtx.fillRect(inX, inY+1, inW, 1); baseCtx.fillRect(inX, inY+inH-2, inW, 1);
                }
                else if(style === 'ultimate') {
                    baseCtx.fillStyle = 'rgba(255,255,255,0.2)'; baseCtx.fillRect(inX, inY, inW, Math.floor(inH/2));
                    baseCtx.fillStyle = shadeColor(baseColor, 50); baseCtx.fillRect(inX, inY, 2, 2); baseCtx.fillRect(inX+inW-2, inY+inH-2, 2, 2);
                }
            };
            drawBox(sx, sy, iw); drawBox(sx+iw+gap, sy, tw);
            
            const icon = iconsMatrix[selectedIcon];
            if(icon) {
                const iCol = document.getElementById('iconColor').value;
                const useIShadow = document.getElementById('useIconShadow').checked;
                const isx = parseInt(document.getElementById('iconShadowX').value), isy = parseInt(document.getElementById('iconShadowY').value), isCol = document.getElementById('iconShadowColor').value;
                drawMatrixIcon(baseCtx, icon, sx, sy, iw, bh, iCol, useIShadow, isx, isy, isCol, document.getElementById('iconGradient').checked);
            }
            previewEditor();
        }

        function setTool(t) { activeTool = t; document.getElementById('btnBrush').style.border = t==='brush'?'2px solid white':'none'; document.getElementById('btnEraser').style.border = t==='eraser'?'2px solid white':'none'; }
        function getEventPos(e) { const r = editCanvas.getBoundingClientRect(); const s = 64/r.width; const cx = e.touches?e.touches[0].clientX:e.clientX, cy = e.touches?e.touches[0].clientY:e.clientY; return { x: Math.floor((cx-r.left)*s), y: Math.floor((cy-r.top)*s) }; }
        const startDraw = (e) => { isDrawing = true; draw(e); };
        const moveDraw = (e) => { if(isDrawing) { e.preventDefault(); draw(e); } };
        const stopDraw = () => { isDrawing = false; };
        function draw(e) {
            const p = getEventPos(e); if(activeTool==='eraser') baseCtx.clearRect(p.x, p.y, 1, 1);
            else { baseCtx.fillStyle = document.getElementById('brushColor').value; baseCtx.fillRect(p.x, p.y, 1, 1); }
            previewEditor();
        }
        editCanvas.addEventListener('mousedown', startDraw); editCanvas.addEventListener('mousemove', moveDraw); window.addEventListener('mouseup', stopDraw);
        editCanvas.addEventListener('touchstart', startDraw, {passive:false}); editCanvas.addEventListener('touchmove', moveDraw, {passive:false}); editCanvas.addEventListener('touchend', stopDraw);

        function saveEdit() {
            currentEditGlyph.name = slugifyGlyphName(document.getElementById('glyphName').value || document.getElementById('customText').value || currentEditGlyph.name);
            currentEditGlyph.text = document.getElementById('customText').value.toUpperCase();
            mCtx.clearRect(currentEditGlyph.x, currentEditGlyph.y, 64, 64);
            mCtx.drawImage(editCanvas, currentEditGlyph.x, currentEditGlyph.y);
            currentEditGlyph.imgData = editCanvas.toDataURL();
            document.getElementById(`img_${currentEditGlyph.id}`).src = currentEditGlyph.imgData;
            updateGlyphCardMeta(currentEditGlyph);
            closeEditor();
        }

        function buildGlyphExportList() {
            return glyphDataList.map(g => ({ name: g.name || `GLYPH_${g.hex}`, unicode: `\\u${g.hex}`, char: g.char, text: g.text || '' }));
        }

        function downloadTextFile(filename, content, mime='text/plain') {
            const blob = new Blob([content], { type: mime + ';charset=utf-8' });
            const a = document.createElement('a');
            a.download = filename;
            a.href = URL.createObjectURL(blob);
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 500);
        }

        function downloadGlyphExportTxt() {
            const lines = ['# Eldoria Glyph Export', '# Format: NAME | UNICODE | GLYPH | PREVIEW_TEXT', '# Karakter glyph di kolom ke-3 bisa langsung dicopy ke Minecraft jika font glyph sudah dipasang.', ''];
            buildGlyphExportList().forEach(g => {
                lines.push(`${g.name} | ${g.unicode} | ${g.char} | ${g.text || g.name}`);
            });
            downloadTextFile('eldoria_glyph_export.txt', lines.join('\n'));
        }

        function downloadGlyphExportJson() {
            const payload = {
                baseHex: document.getElementById('baseHex').value.toUpperCase(),
                generatedAt: new Date().toISOString(),
                glyphs: buildGlyphExportList()
            };
            downloadTextFile('eldoria_glyph_export.json', JSON.stringify(payload, null, 2), 'application/json');
        }

        function downloadMaster() { const a = document.createElement('a'); a.download='master_1024.png'; a.href=masterCanvas.toDataURL(); a.click(); }
        window.onload = initPickers;
    
