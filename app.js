// Available logos from logo folder
const AVAILABLE_LOGOS = [
  { name: 'Black', file: 'logo/black.svg' },
  { name: 'Long Black', file: 'logo/long_black.svg' },
  { name: 'Long White', file: 'logo/long_white.svg' },
  { name: 'White', file: 'logo/white.svg' }
];

// Available fonts from font folder
const AVAILABLE_FONTS = [
  { name: 'System Default', family: 'system-ui', file: null },
  { name: 'YS Text Regular', family: 'YS Text', file: 'font/YS Text-Regular.woff2', weight: '400' },
  { name: 'YS Text Medium', family: 'YS Text', file: 'font/YS Text-Medium.woff2', weight: '500' }
];

// Preset sizes by platform
const PRESET_SIZES = {
  'РСЯ': [
    { width: 1600, height: 1200, checked: true }
  ],
  'MTS': [
    { width: 200, height: 200, checked: true },
    { width: 240, height: 400, checked: true },
    { width: 300, height: 250, checked: true },
    { width: 300, height: 300, checked: true },
    { width: 300, height: 50, checked: true },
    { width: 300, height: 600, checked: true },
    { width: 320, height: 100, checked: true },
    { width: 320, height: 480, checked: true },
    { width: 336, height: 280, checked: true },
    { width: 728, height: 90, checked: true }
  ],
  'Upravel': [
    { width: 300, height: 250, checked: true },
    { width: 320, height: 100, checked: true },
    { width: 320, height: 50, checked: true },
    { width: 336, height: 280, checked: true },
    { width: 300, height: 300, checked: true },
    { width: 300, height: 600, checked: true }
  ],
  'Habr': [
    { width: 300, height: 600, checked: true },
    { width: 300, height: 250, checked: true },
    { width: 1560, height: 320, checked: true },
    { width: 960, height: 450, checked: true },
    { width: 1320, height: 300, checked: true },
    { width: 520, height: 800, checked: true },
    { width: 1920, height: 1080, checked: true },
    { width: 600, height: 1200, checked: true },
    { width: 900, height: 750, checked: true }
  ],
  'Ozon': [
    { width: 2832, height: 600, checked: true },
    { width: 1080, height: 450, checked: true }
  ]
};

// Application state
let currentPreviewIndex = 0;

let state = {
  paddingPercent: 5,
  title: 'Your Headline',
  titleColor: '#ffffff',
  titleAlign: 'left',
  titleVPos: 'top',
  titleSize: 64,
  titleWeight: 400,
  titleLetterSpacing: 0,
  titleLineHeight: 1.1,
  subtitle: 'Subtitle description',
  subtitleColor: '#e0e0e0',
  subtitleAlign: 'left',
  subtitleSize: 32,
  subtitleWeight: 400,
  subtitleLetterSpacing: 0,
  subtitleLineHeight: 1.2,
  subtitleGap: 0,
  legal: 'Рекламодатель АНО ДПО «Образовательные технологии Яндекса», действующая на основании лицензии N° ЛО35-01298-77/00185314 от 24 марта 2015 года, 119021, г. Москва, ул. Тимура Фрунзе, д. 11, к. 2. ОГРН 1147799006123 Сайт: https://practicum.yandex.ru/',
  legalColor: '#ffffff',
  legalOpacity: 70,
  legalAlign: 'left',
  legalSize: 12,
  legalWeight: 400,
  legalLetterSpacing: 0,
  legalLineHeight: 1.3,
  legalTopOffset: 0,
  age: '18+',
  ageGapPercent: 2,
  ageSize: 12,
  showSubtitle: true,
  showLegal: true,
  showAge: true,
  showKV: true,
  logo: null,
  logoSelected: 'logo/white.svg',
  logoSize: 40,
  kv: null,
  bgColor: '#1e1e1e',
  bgImage: null,
  logoPos: 'top-left',
  kvAnchor: 'center',
  kvSizePercent: 50,
  fontFamily: 'YS Text',
  fontFamilyFile: null,
  customFont: null,
  presetSizes: JSON.parse(JSON.stringify(PRESET_SIZES)),
  namePrefix: 'layout'
};

// Preview canvas reference
let previewCanvas = null;

function updateState(key, value) {
  state[key] = value;
  renderPreview();
}

function updatePadding(value) {
  state.paddingPercent = parseInt(value);
  document.getElementById('paddingValue').textContent = value + '%';
  renderPreview();
}

function updateLegalOpacity(value) {
  state.legalOpacity = parseInt(value);
  document.getElementById('legalOpacityValue').textContent = value + '%';
  renderPreview();
}

function selectTitleAlign(align) {
  state.titleAlign = align;
  updateChipGroup('title-align', align);
  renderPreview();
}

function selectTitleVPos(vPos) {
  state.titleVPos = vPos;
  updateChipGroup('title-vpos', vPos);
  renderPreview();
}

function selectSubtitleAlign(align) {
  state.subtitleAlign = align;
  updateChipGroup('subtitle-align', align);
  renderPreview();
}


function selectLegalAlign(align) {
  state.legalAlign = align;
  updateChipGroup('legal-align', align);
  renderPreview();
}

function updateChipGroup(group, value) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach(chip => {
    chip.classList.toggle('active', chip.dataset.value === value);
  });
}

function selectPreloadedLogo(logoFile) {
  state.logoSelected = logoFile;
  if (!logoFile || logoFile === '') {
    state.logo = null;
    updateLogoUI();
    renderPreview();
    return;
  }
  
  // Load logo from logo folder
  const logoInfo = AVAILABLE_LOGOS.find(l => l.file === logoFile);
  if (!logoInfo) {
    state.logo = null;
    updateLogoUI();
    renderPreview();
    return;
  }
  
  const img = new Image();
  img.onload = () => {
    state.logo = img;
    updateLogoUI();
    renderPreview();
  };
  img.onerror = () => {
    console.error('Failed to load logo:', logoFile);
    state.logo = null;
    updateLogoUI();
    renderPreview();
  };
  img.src = logoInfo.file;
}

function updateLogoSize(value) {
  state.logoSize = parseInt(value);
  document.getElementById('logoSizeValue').textContent = value + '%';
  renderPreview();
}

function updateKVSizePercent(value) {
  state.kvSizePercent = parseInt(value);
  document.getElementById('kvSizeValue').textContent = value + '%';
  renderPreview();
}

function updateLogoUI() {
  const preview = document.getElementById('logoPreview');
  const actions = document.getElementById('logoActions');
  const thumb = document.getElementById('logoThumb');
  
  if (state.logo) {
    preview.style.display = 'block';
    actions.style.display = 'block';
    thumb.src = state.logo.src;
  } else {
    preview.style.display = 'none';
    actions.style.display = 'none';
  }
}

function updateKVUI() {
  const preview = document.getElementById('kvPreview');
  const actions = document.getElementById('kvActions');
  const thumb = document.getElementById('kvThumb');
  
  if (state.kv) {
    preview.style.display = 'block';
    actions.style.display = 'block';
    thumb.src = state.kv.src;
  } else {
    preview.style.display = 'none';
    actions.style.display = 'none';
  }
}

function updateBgUI() {
  const preview = document.getElementById('bgPreview');
  const actions = document.getElementById('bgActions');
  const thumb = document.getElementById('bgThumb');
  
  if (state.bgImage) {
    preview.style.display = 'block';
    actions.style.display = 'block';
    thumb.style.backgroundImage = `url(${state.bgImage.src})`;
  } else {
    preview.style.display = 'none';
    actions.style.display = 'none';
  }
}

function clearLogo() {
  state.logo = null;
  document.getElementById('logoSelect').value = '';
  updateLogoUI();
  renderPreview();
}

function clearKV() {
  state.kv = null;
  document.getElementById('showKV').checked = false;
  state.showKV = false;
  updateKVUI();
  renderPreview();
}

function clearBg() {
  state.bgImage = null;
  updateBgUI();
  renderPreview();
}

function selectLogoPos(pos) {
  state.logoPos = pos;
  updateChipGroup('logo-pos', pos);
  renderPreview();
}

function loadImageFile(file, target) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      state[target] = img;
      if (target === 'logo') updateLogoUI();
      if (target === 'kv') updateKVUI();
      if (target === 'bgImage') updateBgUI();
      renderPreview();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (file) loadImageFile(file, 'logo');
}

function handleKVUpload(event) {
  const file = event.target.files[0];
  if (file) loadImageFile(file, 'kv');
}

function handleBgUpload(event) {
  const file = event.target.files[0];
  if (file) loadImageFile(file, 'bgImage');
}

function wrapText(ctx, text, maxWidth, fontSize, fontWeight, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  ctx.font = `${fontWeight} ${fontSize}px ${state.fontFamily}`;
  
  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawTextWithSpacing(ctx, text, x, y, letterSpacing, align) {
  ctx.textAlign = align;
  
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }
  
  let startX = x;
  if (align === 'center') {
    const totalWidth = Array.from(text).reduce((sum, char) => 
      sum + ctx.measureText(char).width + letterSpacing, -letterSpacing);
    startX = x - totalWidth / 2;
  } else if (align === 'right') {
    const totalWidth = Array.from(text).reduce((sum, char) => 
      sum + ctx.measureText(char).width + letterSpacing, -letterSpacing);
    startX = x - totalWidth;
  }
  
  let currentX = startX;
  for (let char of text) {
    ctx.fillText(char, currentX, y);
    currentX += ctx.measureText(char).width + letterSpacing;
  }
}

function getAlignedX(align, canvasWidth, paddingPx) {
  if (align === 'left') return paddingPx;
  if (align === 'center') return canvasWidth / 2;
  if (align === 'right') return canvasWidth - paddingPx;
  return paddingPx;
}

// Helper function to check if two rectangles overlap
function rectanglesOverlap(r1, r2, margin = 10) {
  return !(r1.x + r1.width + margin < r2.x || 
           r2.x + r2.width + margin < r1.x || 
           r1.y + r1.height + margin < r2.y || 
           r2.y + r2.height + margin < r1.y);
}

// Helper function to get text block bounds
function getTextBlockBounds(ctx, lines, x, y, fontSize, lineHeight, align, maxWidth) {
  if (lines.length === 0) return null;
  
  let minX = x;
  let maxX = x;
  let minY = y - fontSize;
  let maxY = y;
  
  // Calculate actual text bounds based on alignment
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const metrics = ctx.measureText(line);
    const lineWidth = metrics.width;
    let lineX = x;
    
    if (align === 'center') {
      lineX = x - lineWidth / 2;
    } else if (align === 'right') {
      lineX = x - lineWidth;
    }
    
    minX = Math.min(minX, lineX);
    maxX = Math.max(maxX, lineX + lineWidth);
    minY = Math.min(minY, y - fontSize * (i + 1) * lineHeight);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function renderToCanvas(canvas, width, height) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  
  const paddingPx = (state.paddingPercent / 100) * Math.min(width, height);
  const maxTextWidth = width - paddingPx * 2;
  const scale = width / 1080;
  
  // Background
  if (state.bgImage) {
    ctx.drawImage(state.bgImage, 0, 0, width, height);
  } else {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, width, height);
  }
  
  // Calculate legal text and age dimensions first (ensure they never overlap)
  let legalBlockHeight = 0;
  let legalLines = [];
  let legalSize = 0;
  let ageSizePx = 0;
  let ageTextWidth = 0;
  // Age metrics
  if (state.showAge && state.age) {
    ageSizePx = state.ageSize * scale;
  }
  // Legal metrics and wrap respecting reserved space for age on the right
  if (state.showLegal && state.legal) {
    legalSize = state.legalSize * scale;
    // Measure age width before wrapping legal to reserve space
    if (state.showAge && state.age) {
      ctx.font = `${state.legalWeight} ${ageSizePx}px ${state.fontFamily}`;
      ageTextWidth = ctx.measureText(state.age).width;
    }
    const gapPx = (state.ageGapPercent / 100) * width;
    const reservedRight = (state.showAge && state.age) ? (gapPx + ageTextWidth + paddingPx) : 0;
    const legalMaxWidth = Math.max(0, width - paddingPx - reservedRight - paddingPx);
    ctx.font = `${state.legalWeight} ${legalSize}px ${state.fontFamily}`;
    legalLines = wrapText(ctx, state.legal, legalMaxWidth, legalSize, state.legalWeight, state.legalLineHeight);
    legalBlockHeight = legalLines.length * legalSize * state.legalLineHeight;
  }
  if (state.showAge && state.age) {
    legalBlockHeight = Math.max(legalBlockHeight, ageSizePx * 1.5);
  }
  
  // Calculate text block positions for collision detection
  const titleSize = state.titleSize * scale;
  const subtitleSize = state.subtitleSize * scale;
  
  ctx.font = `${state.titleWeight} ${titleSize}px ${state.fontFamily}`;
  const titleLines = wrapText(ctx, state.title, maxTextWidth, titleSize, state.titleWeight, state.titleLineHeight);
  const titleBlockHeight = titleLines.length * titleSize * state.titleLineHeight;
  
  let subtitleBlockHeight = 0;
  let subtitleLines = [];
  if (state.showSubtitle && state.subtitle) {
    ctx.font = `${state.subtitleWeight} ${subtitleSize}px ${state.fontFamily}`;
    subtitleLines = wrapText(ctx, state.subtitle, maxTextWidth, subtitleSize, state.subtitleWeight, state.subtitleLineHeight);
    subtitleBlockHeight = subtitleLines.length * subtitleSize * state.subtitleLineHeight + (state.subtitleGap / 100) * height;
  }
  
  const totalTextHeight = titleBlockHeight + subtitleBlockHeight;
  
  // Calculate Y position based on vertical position (title/subtitle should not overlap legal)
  let startY;
  if (state.titleVPos === 'top') {
    startY = paddingPx + titleSize;
  } else if (state.titleVPos === 'center') {
    // Center but avoid legal block at bottom
    const availableHeight = height - legalBlockHeight - paddingPx * 2;
    startY = (availableHeight - totalTextHeight) / 2 + paddingPx + titleSize;
  } else { // bottom
    const bottomOffset = legalBlockHeight + paddingPx;
    startY = height - bottomOffset - totalTextHeight + titleSize;
  }
  
  // Calculate text block bounds for collision detection
  const titleX = getAlignedX(state.titleAlign, width, paddingPx);
  const titleBounds = getTextBlockBounds(ctx, titleLines, titleX, startY, titleSize, state.titleLineHeight, state.titleAlign, maxTextWidth);
  
  let subtitleBounds = null;
  if (state.showSubtitle && subtitleLines.length > 0) {
    const subtitleY = startY + titleBlockHeight + (state.subtitleGap / 100) * height;
    const subtitleX = getAlignedX(state.subtitleAlign, width, paddingPx);
    subtitleBounds = getTextBlockBounds(ctx, subtitleLines, subtitleX, subtitleY, subtitleSize, state.subtitleLineHeight, state.subtitleAlign, maxTextWidth);
  }
  
  // Calculate legal+age bounds as a combined block at bottom (legal left, age right)
  let legalBounds = null;
  if (state.showLegal && legalLines.length > 0) {
    const topOffsetPx = (state.legalTopOffset / 100) * height;
    const baselineY = height - paddingPx - topOffsetPx;
    
    const gapPx = (state.ageGapPercent / 100) * width;
    const ageXRight = width - paddingPx; // right edge for age
    const ageXLeft = ageXRight - ageTextWidth;
    const legalRightEdgeX = ageXLeft - gapPx; // right edge of last legal line
    
    // Legal text is always left-aligned
    const legalX = paddingPx;
    legalBounds = getTextBlockBounds(ctx, legalLines, legalX, baselineY, legalSize, state.legalLineHeight, 'left', maxTextWidth);
    
    // Expand bounds to include age box
    if (state.showAge && state.age && ageTextWidth > 0) {
      const ageBox = { x: ageXLeft, y: baselineY - ageSizePx, width: ageTextWidth, height: ageSizePx };
      const minX = Math.min(legalBounds.x, ageBox.x);
      const minY = Math.min(legalBounds.y, ageBox.y);
      const maxX = Math.max(legalBounds.x + legalBounds.width, ageBox.x + ageBox.width);
      const maxY = Math.max(legalBounds.y + legalBounds.height, ageBox.y + ageBox.height);
      legalBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
  }
  
  // Calculate logo position
  let logoBounds = null;
  if (state.logo) {
    const logoWidth = (width * state.logoSize) / 100;
    const logoScale = logoWidth / state.logo.width;
    const logoHeight = state.logo.height * logoScale;
    
    let logoX, logoY;
    
    switch(state.logoPos) {
      case 'top-left':
        logoX = paddingPx;
        logoY = paddingPx;
        break;
      case 'center-top':
        logoX = (width - logoWidth) / 2;
        logoY = paddingPx;
        break;
      case 'bottom-left':
        logoX = paddingPx;
        if (state.showLegal || state.showAge) {
          logoY = height - paddingPx - logoHeight - legalBlockHeight - paddingPx * 0.5;
        } else {
          logoY = height - logoHeight - paddingPx;
        }
        break;
      case 'center-bottom':
        logoX = (width - logoWidth) / 2;
        if (state.showLegal || state.showAge) {
          logoY = height - paddingPx - logoHeight - legalBlockHeight - paddingPx * 0.5;
        } else {
          logoY = height - logoHeight - paddingPx;
        }
        break;
    }
    
    logoBounds = { x: logoX, y: logoY, width: logoWidth, height: logoHeight };
  }
  
  // Key Visual with anchor system and collision avoidance
  let kvX, kvY, kvW, kvH;
  if (state.kv && state.showKV) {
    const kvMaxDim = Math.max(width, height);
    const kvTargetSize = (kvMaxDim * state.kvSizePercent) / 100;
    const kvScale = kvTargetSize / Math.max(state.kv.width, state.kv.height);
    kvW = state.kv.width * kvScale;
    kvH = state.kv.height * kvScale;
    
    // Initial position based on anchor
    switch(state.kvAnchor) {
      case 'center':
        kvX = (width - kvW) / 2;
        kvY = (height - kvH) / 2;
        break;
      case 'top-left':
        kvX = paddingPx;
        kvY = paddingPx;
        break;
      case 'top-right':
        kvX = width - kvW - paddingPx;
        kvY = paddingPx;
        break;
      case 'bottom-left':
        kvX = paddingPx;
        kvY = height - kvH - paddingPx;
        break;
      case 'bottom-right':
        kvX = width - kvW - paddingPx;
        kvY = height - kvH - paddingPx;
        break;
      case 'left':
        kvX = paddingPx;
        kvY = (height - kvH) / 2;
        break;
      case 'right':
        kvX = width - kvW - paddingPx;
        kvY = (height - kvH) / 2;
        break;
      case 'top':
        kvX = (width - kvW) / 2;
        kvY = paddingPx;
        break;
      case 'bottom':
        kvX = (width - kvW) / 2;
        kvY = height - kvH - paddingPx;
        break;
    }
    
    const kvBounds = { x: kvX, y: kvY, width: kvW, height: kvH };
    const collisionMargin = 20;
    
    // Check for collisions and adjust position
    const blocksToAvoid = [titleBounds, subtitleBounds, logoBounds, legalBounds].filter(b => b !== null);
    
    // Iterate multiple times to resolve all collisions
    let maxIterations = 10;
    let iteration = 0;
    while (iteration < maxIterations) {
      let hasCollision = false;
      let totalDx = 0;
      let totalDy = 0;
      let collisionCount = 0;
      
      for (let block of blocksToAvoid) {
        if (rectanglesOverlap(kvBounds, block, collisionMargin)) {
          hasCollision = true;
          const blockCenterX = block.x + block.width / 2;
          const blockCenterY = block.y + block.height / 2;
          const kvCenterX = kvBounds.x + kvBounds.width / 2;
          const kvCenterY = kvBounds.y + kvBounds.height / 2;
          
          const dx = kvCenterX - blockCenterX;
          const dy = kvCenterY - blockCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const requiredSeparation = (Math.max(block.width, block.height) + Math.max(kvW, kvH)) / 2 + collisionMargin;
            const currentSeparation = distance;
            const moveDistance = Math.max(0, requiredSeparation - currentSeparation + 10);
            
            totalDx += (dx / distance) * moveDistance;
            totalDy += (dy / distance) * moveDistance;
            collisionCount++;
          }
        }
      }
      
      if (!hasCollision) break;
      
      if (collisionCount > 0) {
        totalDx /= collisionCount;
        totalDy /= collisionCount;
      }
      
      kvX += totalDx;
      kvY += totalDy;
      
      kvX = Math.max(paddingPx, Math.min(kvX, width - kvW - paddingPx));
      kvY = Math.max(paddingPx, Math.min(kvY, height - kvH - paddingPx));
      
      kvBounds.x = kvX;
      kvBounds.y = kvY;
      
      iteration++;
    }
    
    ctx.drawImage(state.kv, kvX, kvY, kvW, kvH);
  }
  
  // After KV placement, adjust logo to avoid collisions with all blocks
  if (state.logo && logoBounds) {
    const blocksToAvoidForLogo = [];
    if (titleBounds) blocksToAvoidForLogo.push(titleBounds);
    if (subtitleBounds) blocksToAvoidForLogo.push(subtitleBounds);
    if (legalBounds) blocksToAvoidForLogo.push(legalBounds);
    if (state.kv && state.showKV) {
      const kvB = { x: kvX, y: kvY, width: kvW, height: kvH };
      blocksToAvoidForLogo.push(kvB);
    }
    
    let maxIterationsLogo = 20;
    let iterationLogo = 0;
    while (iterationLogo < maxIterationsLogo) {
      let hasCollision = false;
      for (let block of blocksToAvoidForLogo) {
        if (rectanglesOverlap(logoBounds, block, 20)) {
          hasCollision = true;
          const blockCenterX = block.x + block.width / 2;
          const blockCenterY = block.y + block.height / 2;
          const logoCenterX = logoBounds.x + logoBounds.width / 2;
          const logoCenterY = logoBounds.y + logoBounds.height / 2;
          const dx = logoCenterX - blockCenterX;
          const dy = logoCenterY - blockCenterY;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const step = 20;
          logoBounds.x += (dx / dist) * step;
          logoBounds.y += (dy / dist) * step;
          logoBounds.x = Math.max(paddingPx, Math.min(logoBounds.x, width - logoBounds.width - paddingPx));
          logoBounds.y = Math.max(paddingPx, Math.min(logoBounds.y, height - logoBounds.height - paddingPx));
        }
      }
      if (!hasCollision) break;
      iterationLogo++;
    }

    // Fallback: if still colliding, try snapping to a non-overlapping corner
    const stillCollides = blocksToAvoidForLogo.some(b => rectanglesOverlap(logoBounds, b, 20));
    if (stillCollides) {
      const computeYAboveLegal = () => {
        if (state.showLegal || state.showAge) {
          return Math.max(paddingPx, height - paddingPx - legalBlockHeight - logoBounds.height - paddingPx * 0.5);
        }
        return height - logoBounds.height - paddingPx;
      };
      const candidates = [
        { x: paddingPx, y: paddingPx },
        { x: width - logoBounds.width - paddingPx, y: paddingPx },
        { x: paddingPx, y: computeYAboveLegal() },
        { x: width - logoBounds.width - paddingPx, y: computeYAboveLegal() }
      ];
      for (const c of candidates) {
        const test = { x: c.x, y: c.y, width: logoBounds.width, height: logoBounds.height };
        const collides = blocksToAvoidForLogo.some(b => rectanglesOverlap(test, b, 20));
        if (!collides) {
          logoBounds.x = c.x;
          logoBounds.y = c.y;
          break;
        }
      }
    }
    ctx.drawImage(state.logo, logoBounds.x, logoBounds.y, logoBounds.width, logoBounds.height);
  }
  
  // Draw title
  ctx.font = `${state.titleWeight} ${titleSize}px ${state.fontFamily}`;
  ctx.fillStyle = state.titleColor;
  let textY = startY;
  for (let line of titleLines) {
    const x = getAlignedX(state.titleAlign, width, paddingPx);
    drawTextWithSpacing(ctx, line, x, textY, state.titleLetterSpacing * scale, state.titleAlign);
    textY += titleSize * state.titleLineHeight;
  }
  
  // Draw subtitle
  if (state.showSubtitle && state.subtitle) {
    textY += (state.subtitleGap / 100) * height;
    ctx.font = `${state.subtitleWeight} ${subtitleSize}px ${state.fontFamily}`;
    ctx.fillStyle = state.subtitleColor;
    for (let line of subtitleLines) {
      const x = getAlignedX(state.subtitleAlign, width, paddingPx);
      drawTextWithSpacing(ctx, line, x, textY, state.subtitleLetterSpacing * scale, state.subtitleAlign);
      textY += subtitleSize * state.subtitleLineHeight;
    }
  }
  
  // Draw legal text (always left) and age rating (always right) at bottom (no overlap)
  if (state.showLegal && state.legal) {
    ctx.font = `${state.legalWeight} ${legalSize}px ${state.fontFamily}`;
    ctx.textBaseline = 'alphabetic';
    const alpha = (state.legalOpacity / 100).toFixed(2);
    const rgb = hexToRgb(state.legalColor);
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    
    const topOffsetPx = (state.legalTopOffset / 100) * height;
    let legalY = height - paddingPx - topOffsetPx;
    
    // Legal text is always left-aligned
    ctx.font = `${state.legalWeight} ${legalSize}px ${state.fontFamily}`;
    for (let i = legalLines.length - 1; i >= 0; i--) {
      drawTextWithSpacing(ctx, legalLines[i], paddingPx, legalY, state.legalLetterSpacing * scale, 'left');
      legalY -= legalSize * state.legalLineHeight;
    }
    
    // Age rating always right-aligned at bottom
    if (state.showAge && state.age) {
      ctx.font = `${state.legalWeight} ${ageSizePx}px ${state.fontFamily}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      // Use the same color and opacity as legal text
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
      const ageY = height - paddingPx - topOffsetPx;
      ctx.fillText(state.age, width - paddingPx, ageY);
    }
  }
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 255, g: 255, b: 255};
}

function renderPreview() {
  if (!previewCanvas) {
    previewCanvas = document.getElementById('previewCanvas');
  }
  
  const checkedSizes = getCheckedSizes();
  if (checkedSizes.length === 0) return;
  
  if (currentPreviewIndex >= checkedSizes.length) {
    currentPreviewIndex = 0;
  }
  
  const size = checkedSizes[currentPreviewIndex];
  renderToCanvas(previewCanvas, size.width, size.height);
}

function updatePreviewSizeSelect() {
  const select = document.getElementById('previewSizeSelect');
  const checkedSizes = getCheckedSizes();
  
  if (checkedSizes.length === 0) {
    select.innerHTML = '<option value="-1">No sizes selected</option>';
    return;
  }
  
  select.innerHTML = checkedSizes.map((size, index) => 
    `<option value="${index}" ${index === currentPreviewIndex ? 'selected' : ''}>${size.width} × ${size.height} (${size.platform})</option>`
  ).join('');
}

function changePreviewSize(index) {
  currentPreviewIndex = parseInt(index);
  renderPreview();
}

function renderSingleExport(targetCanvas, width, height) {
  renderToCanvas(targetCanvas, width, height);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportAllPNG() {
  const checkedSizes = getCheckedSizes();
  
  if (checkedSizes.length === 0) {
    alert('Нет выбранных размеров для экспорта!');
    return;
  }
  
  checkedSizes.forEach((size, index) => {
    setTimeout(() => {
      const exportCanvas = document.createElement('canvas');
      try {
      renderSingleExport(exportCanvas, size.width, size.height);
        exportCanvas.toBlob((blob) => {
          if (!blob) {
            alert('Не удалось сформировать изображение. Возможно, холст «tainted». Запустите через локальный сервер.');
            return;
          }
          const platform = (size.platform || 'unknown').toString().toLowerCase();
          const fname = `${state.namePrefix}/${platform}/${size.width}x${size.height}.png`;
          downloadBlob(blob, fname);
        }, 'image/png');
      } catch (e) {
        console.error(e);
        alert('Ошибка экспорта. Если вы открыли файл напрямую (file://), запустите проект через локальный сервер (например: python -m http.server).');
      }
    }, index * 100);
  });
}

function exportAllJPG() {
  const checkedSizes = getCheckedSizes();
  
  if (checkedSizes.length === 0) {
    alert('Нет выбранных размеров для экспорта!');
    return;
  }
  
  checkedSizes.forEach((size, index) => {
    setTimeout(() => {
      const exportCanvas = document.createElement('canvas');
      try {
      renderSingleExport(exportCanvas, size.width, size.height);
        exportCanvas.toBlob((blob) => {
          if (!blob) {
            alert('Не удалось сформировать изображение. Возможно, холст «tainted». Запустите через локальный сервер.');
            return;
          }
          const platform = (size.platform || 'unknown').toString().toLowerCase();
          const fname = `${state.namePrefix}/${platform}/${size.width}x${size.height}.jpg`;
          downloadBlob(blob, fname);
        }, 'image/jpeg', 0.95);
      } catch (e) {
        console.error(e);
        alert('Ошибка экспорта. Если вы открыли файл напрямую (file://), запустите проект через локальный сервер (например: python -m http.server).');
      }
    }, index * 100);
  });
}

function renderPresetSizes() {
  const container = document.getElementById('presetSizesList');
  let html = '';
  
  Object.keys(state.presetSizes).forEach(platform => {
    html += `
      <div class="platform-group">
        <div class="platform-header" onclick="togglePlatform('${platform}')">
          <span>${platform}</span>
          <span class="platform-arrow" id="arrow-${platform}">▼</span>
        </div>
        <div class="platform-sizes" id="sizes-${platform}">
    `;
    
    state.presetSizes[platform].forEach((size, index) => {
      const id = `size-${platform}-${index}`;
      html += `
        <div class="size-checkbox-item">
          <input type="checkbox" id="${id}" ${size.checked ? 'checked' : ''} onchange="toggleSize('${platform}', ${index})">
          <label for="${id}">${size.width} × ${size.height}</label>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  updateSizesSummary();
}

function togglePlatform(platform) {
  const sizesEl = document.getElementById(`sizes-${platform}`);
  const arrowEl = document.getElementById(`arrow-${platform}`);
  sizesEl.classList.toggle('collapsed');
  arrowEl.classList.toggle('collapsed');
}

function toggleSize(platform, index) {
  state.presetSizes[platform][index].checked = !state.presetSizes[platform][index].checked;
  updateSizesSummary();
  updatePreviewSizeSelect();
  renderPreview();
}

function selectAllSizes() {
  Object.keys(state.presetSizes).forEach(platform => {
    state.presetSizes[platform].forEach(size => {
      size.checked = true;
    });
  });
  renderPresetSizes();
  updatePreviewSizeSelect();
  renderPreview();
}

function deselectAllSizes() {
  Object.keys(state.presetSizes).forEach(platform => {
    state.presetSizes[platform].forEach(size => {
      size.checked = false;
    });
  });
  renderPresetSizes();
  updatePreviewSizeSelect();
  renderPreview();
}

function updateSizesSummary() {
  let count = 0;
  Object.keys(state.presetSizes).forEach(platform => {
    count += state.presetSizes[platform].filter(s => s.checked).length;
  });
  document.getElementById('sizesSummary').textContent = `Выбрано: ${count} размеров`;
}

function getCheckedSizes() {
  const sizes = [];
  Object.keys(state.presetSizes).forEach(platform => {
    state.presetSizes[platform].forEach(size => {
      if (size.checked) {
        sizes.push({ width: size.width, height: size.height, platform });
      }
    });
  });
  return sizes;
}

let savedSettings = null;

function saveSettings() {
  savedSettings = JSON.parse(JSON.stringify(state));
  delete savedSettings.logo;
  delete savedSettings.kv;
  delete savedSettings.bgImage;
  delete savedSettings.customFont;
  alert('Настройки сохранены (изображения исключены, выбор пресетов сохранён)');
}

function loadSettings() {
  if (!savedSettings) {
    alert('Нет сохранённых настроек.');
    return;
  }
  
  const currentLogo = state.logo;
  const currentKV = state.kv;
  const currentBg = state.bgImage;
  
  Object.assign(state, savedSettings);
  
  state.logo = currentLogo;
  state.kv = currentKV;
  state.bgImage = currentBg;
  
  if (state.logoSelected) {
    selectPreloadedLogo(state.logoSelected);
  }
  
  syncFormFields();
  renderPresetSizes();
  updatePreviewSizeSelect();
  renderPreview();
  
  alert('Настройки загружены!');
}

function syncFormFields() {
  document.getElementById('paddingPercent').value = state.paddingPercent;
  document.getElementById('paddingValue').textContent = state.paddingPercent + '%';
  document.getElementById('title').value = state.title;
  document.getElementById('titleColor').value = state.titleColor;
  document.getElementById('titleSize').value = state.titleSize;
  document.getElementById('titleWeight').value = state.titleWeight;
  document.getElementById('titleLetterSpacing').value = state.titleLetterSpacing;
  document.getElementById('titleLineHeight').value = state.titleLineHeight;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('subtitleColor').value = state.subtitleColor;
  document.getElementById('subtitleSize').value = state.subtitleSize;
  document.getElementById('subtitleWeight').value = state.subtitleWeight;
  document.getElementById('subtitleLetterSpacing').value = state.subtitleLetterSpacing;
  document.getElementById('subtitleLineHeight').value = state.subtitleLineHeight;
  document.getElementById('subtitleGap').value = state.subtitleGap;
  document.getElementById('legal').value = state.legal;
  document.getElementById('legalColor').value = state.legalColor;
  document.getElementById('legalOpacity').value = state.legalOpacity;
  document.getElementById('legalOpacityValue').textContent = state.legalOpacity + '%';
  document.getElementById('legalSize').value = state.legalSize;
  document.getElementById('legalWeight').value = state.legalWeight;
  document.getElementById('legalLetterSpacing').value = state.legalLetterSpacing;
  document.getElementById('legalLineHeight').value = state.legalLineHeight;
  document.getElementById('legalTopOffset').value = state.legalTopOffset;
  document.getElementById('age').value = state.age;
  document.getElementById('ageSize').value = state.ageSize;
  const ageGapPercentEl = document.getElementById('ageGapPercent');
  if (ageGapPercentEl) ageGapPercentEl.value = state.ageGapPercent;
  document.getElementById('showSubtitle').checked = state.showSubtitle;
  document.getElementById('showLegal').checked = state.showLegal;
  document.getElementById('showAge').checked = state.showAge;
  document.getElementById('showKV').checked = state.showKV;
  document.getElementById('logoSelect').value = state.logoSelected;
  document.getElementById('logoSize').value = state.logoSize;
  document.getElementById('logoSizeValue').textContent = state.logoSize + '%';
  document.getElementById('bgColor').value = state.bgColor;
  document.getElementById('kvAnchor').value = state.kvAnchor;
  document.getElementById('kvSizePercent').value = state.kvSizePercent;
  document.getElementById('kvSizeValue').textContent = state.kvSizePercent + '%';
  document.getElementById('namePrefix').value = state.namePrefix;
  
  // Font family
  const fontSelect = document.getElementById('fontFamily');
  if (fontSelect) {
    fontSelect.value = state.fontFamily;
  }
  
  updateChipGroup('title-align', state.titleAlign);
  updateChipGroup('title-vpos', state.titleVPos);
  updateChipGroup('subtitle-align', state.subtitleAlign);
  updateChipGroup('logo-pos', state.logoPos);
}

function resetAll() {
  if (!confirm('Сбросить все настройки к значениям по умолчанию?')) return;
  
  state = {
    paddingPercent: 5,
    title: 'Your Headline',
    titleColor: '#ffffff',
    titleAlign: 'left',
    titleVPos: 'top',
    titleSize: 64,
    titleWeight: 400,
    titleLetterSpacing: 0,
    titleLineHeight: 1.1,
    subtitle: 'Subtitle description',
    subtitleColor: '#e0e0e0',
    subtitleAlign: 'left',
    subtitleSize: 32,
    subtitleWeight: 400,
    subtitleLetterSpacing: 0,
    subtitleLineHeight: 1.2,
    subtitleGap: 0,
    legal: 'Рекламодатель АНО ДПО «Образовательные технологии Яндекса», действующая на основании лицензии N° ЛО35-01298-77/00185314 от 24 марта 2015 года, 119021, г. Москва, ул. Тимура Фрунзе, д. 11, к. 2. ОГРН 1147799006123 Сайт: https://practicum.yandex.ru/',
    legalColor: '#ffffff',
    legalOpacity: 70,
    legalAlign: 'left',
    legalSize: 12,
    legalWeight: 400,
    legalLetterSpacing: 0,
    legalLineHeight: 1.3,
    legalTopOffset: 0,
    age: '18+',
    ageGapPercent: 2,
    ageSize: 12,
    showSubtitle: true,
    showLegal: true,
    showAge: true,
    showKV: true,
    logo: null,
    logoSelected: 'logo/white.svg',
    logoSize: 40,
    kv: null,
    bgColor: '#1e1e1e',
    bgImage: null,
    logoPos: 'top-left',
    kvAnchor: 'center',
    kvSizePercent: 50,
    fontFamily: 'YS Text',
    fontFamilyFile: null,
    customFont: null,
    presetSizes: JSON.parse(JSON.stringify(PRESET_SIZES)),
    namePrefix: 'layout'
  };
  
  selectPreloadedLogo('logo/white.svg');
  syncFormFields();
  updateLogoUI();
  updateKVUI();
  updateBgUI();
  renderPresetSizes();
  updatePreviewSizeSelect();
  renderPreview();
}

// Initialize logo dropdown
function initializeLogoDropdown() {
  const select = document.getElementById('logoSelect');
  select.innerHTML = '<option value="">-- None --</option>';
  AVAILABLE_LOGOS.forEach(logo => {
    const option = document.createElement('option');
    option.value = logo.file;
    option.textContent = logo.name;
    select.appendChild(option);
  });
}

// Initialize font dropdown
function initializeFontDropdown() {
  const select = document.getElementById('fontFamily');
  if (!select) return;
  select.innerHTML = '';
  AVAILABLE_FONTS.forEach(font => {
    const option = document.createElement('option');
    option.value = font.family;
    option.textContent = font.name;
    option.dataset.file = font.file || '';
    if (font.family === state.fontFamily) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

function selectFontFamily(fontFamily) {
  const select = document.getElementById('fontFamily');
  if (!select) return;
  const selectedOption = select.options[select.selectedIndex];
  const fontFile = selectedOption ? selectedOption.dataset.file : null;
  
  state.fontFamily = fontFamily;
  state.fontFamilyFile = fontFile;
  
  renderPreview();
}

function toggleSection(sectionId) {
  const contentEl = document.getElementById(`content-${sectionId}`);
  const arrowEl = document.getElementById(`arrow-${sectionId}`);
  if (contentEl && arrowEl) {
    contentEl.classList.toggle('collapsed');
    arrowEl.classList.toggle('collapsed');
  }
}

// Initialize
initializeLogoDropdown();
initializeFontDropdown();
selectPreloadedLogo('logo/white.svg');
renderPresetSizes();
updatePreviewSizeSelect();
renderPreview();