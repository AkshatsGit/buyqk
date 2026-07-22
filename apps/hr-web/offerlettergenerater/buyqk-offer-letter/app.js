/* ================================================================
   BuyQk HR Handbook Generator — app.js
   Pure browser-based PDF generator using jsPDF.
   No server required. Open index.html directly in Chrome.
   ================================================================ */

'use strict';

// ─── PDF LAYOUT CONSTANTS (all in mm on A4) ───────────────────
const PDF = {
    PAGE_W:   210,      // A4 width
    PAGE_H:   297,      // A4 height
    HEADER_H:  24,      // height reserved for header image
    FOOTER_H:  20,      // height reserved for footer image
    MARGIN_X:  17,      // left & right text margin
    MARGIN_TOP: 8,      // gap between header image bottom and text
    MARGIN_BOT: 8,      // gap between text bottom and footer image top
    LINE_H:     6.0,    // line height per row of body text (mm)
    PARA_GAP:   3.5,    // extra vertical space between paragraphs
    SIG_W:    130,      // width of signatures image
    SIG_H:     40,      // height of signatures image
    SIG_GAP:   14,      // space above signatures block
    FONT_SIZE:  11,     // body text font size (pt)
    META_FONT:  10.5,   // meta row font size
    TITLE_FONT: 14,     // document title font size
};

// Derived: Y where body text may start and must stop
PDF.CONTENT_TOP = PDF.HEADER_H + PDF.MARGIN_TOP;
PDF.CONTENT_BOT = PDF.PAGE_H - PDF.FOOTER_H - PDF.MARGIN_BOT;
PDF.CONTENT_W   = PDF.PAGE_W - PDF.MARGIN_X * 2;

// ─── STATE ────────────────────────────────────────────────────
let generatedDoc = null;   // last generated jsPDF instance

// ─── DOM REFS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const els = {
    form:           $('handbookForm'),
    name:           $('inp-name'),
    role:           $('inp-role'),
    refNo:          $('inp-refno'),
    date:           $('inp-date'),
    content:        $('inp-content'),
    charHint:       $('charHint'),
    generateBtn:    $('generateBtn'),
    downloadBtn:    $('downloadBtn'),
    previewFrame:   $('previewFrame'),
    previewEmpty:   $('previewEmpty'),
    previewStatus:  $('previewStatus'),
    statusDot:      document.querySelector('.status-dot'),
    statusText:     $('statusText'),
    pageInfo:       $('pageInfo'),
    pageInfoText:   $('pageInfoText'),
    loadingOverlay: $('loadingOverlay'),
    toast:          $('toast'),
    toastIcon:      $('toastIcon'),
    toastMsg:       $('toastMsg'),
    currentDate:    $('currentDate'),
};

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Topbar: today's date
    const now = new Date();
    els.currentDate.textContent = now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Default document date = today
    els.date.value = now.toISOString().slice(0, 10);

    // Character counter for textarea
    els.content.addEventListener('input', () => {
        const len = els.content.value.length;
        els.charHint.textContent = len.toLocaleString() + ' character' + (len !== 1 ? 's' : '');
        els.charHint.classList.toggle('active', len > 0);
    });

    // Buttons
    els.generateBtn.addEventListener('click', handleGenerate);
    els.downloadBtn.addEventListener('click', handleDownload);
});


// ════════════════════════════════════════════════════════════════
//  IMAGE LOADER
//  Loads a local PNG file and returns it as a base64 data URL.
//  Tries fetch() first (works in Chrome from file://); falls back
//  to an <img> + <canvas> approach.
// ════════════════════════════════════════════════════════════════
async function loadImageBase64(relPath) {
    // Strategy 1: fetch (preferred)
    try {
        const resp = await fetch(relPath);
        if (!resp.ok) throw new Error('fetch failed');
        const blob = await resp.blob();
        return await blobToBase64(blob);
    } catch (_) { /* fall through */ }

    // Strategy 2: <img> → <canvas> → dataURL
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width  = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            try {
                resolve(canvas.toDataURL('image/png'));
            } catch (e) {
                reject(new Error('Canvas tainted — cannot read image: ' + relPath));
            }
        };
        img.onerror = () => reject(new Error('Image not found: ' + relPath));
        // Append cache-bust to avoid stale cache issues
        img.src = relPath + '?t=' + Date.now();
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result);
        fr.onerror   = reject;
        fr.readAsDataURL(blob);
    });
}


// ════════════════════════════════════════════════════════════════
//  DATE FORMATTER
// ════════════════════════════════════════════════════════════════
function formatDate(isoDate) {
    // isoDate is "YYYY-MM-DD"
    const [y, m, d] = isoDate.split('-').map(Number);
    const months = [
        '', 'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    return `${d} ${months[m]} ${y}`;
}


async function createV1HeaderBase64() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 2100;
        canvas.height = 380;
        const ctx = canvas.getContext('2d');

        // Background #010f24
        ctx.fillStyle = '#010f24';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Yellow skewed polygon on right #fbbc04
        ctx.fillStyle = '#fbbc04';
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.62, 0);
        ctx.lineTo(canvas.width, 0);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(canvas.width * 0.76, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Bottom yellow accent polygon
        ctx.fillStyle = '#fbbc04';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 20);
        ctx.lineTo(canvas.width * 0.35, canvas.height - 35);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#010f24';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 12);
        ctx.lineTo(canvas.width * 0.33, canvas.height - 25);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Slogan text inside right yellow section
        ctx.fillStyle = '#010f24';
        ctx.textAlign = 'right';
        ctx.font = '900 24px Inter, sans-serif';
        ctx.fillText('THE', canvas.width - 70, 110);
        ctx.font = '900 46px Inter, sans-serif';
        ctx.fillText('UNIVERSAL', canvas.width - 70, 168);
        ctx.font = '900 26px Inter, sans-serif';
        ctx.fillText('LOCAL SUPPLY NETWORK', canvas.width - 70, 218);

        // Load and draw /assets/image.png logo on top-left
        const logoImg = new Image();
        logoImg.onload = () => {
            const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
            const logoH = 280;
            const logoW = logoH * aspect;
            ctx.drawImage(logoImg, 100, 20, logoW, logoH);
            resolve(canvas.toDataURL('image/png'));
        };
        logoImg.onerror = () => {
            resolve(canvas.toDataURL('image/png'));
        };
        logoImg.src = '/assets/image.png';
    });
}

// ════════════════════════════════════════════════════════════════
//  CORE PDF BUILDER
// ════════════════════════════════════════════════════════════════
async function buildPDF(fields) {
    const { jsPDF } = window.jspdf;

    // 1. Pre-load all images concurrently
    const [headerB64, footerB64, sigB64] = await Promise.all([
        createV1HeaderBase64().catch(() => loadImageBase64('header.png')),
        loadImageBase64('footer.png'),
        loadImageBase64('signatures.png'),
    ]);

    // 2. Create jsPDF document
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // ── Helpers ────────────────────────────────────────────────
    /** Draw header + footer images on the current page */
    function drawPageDecorations() {
        doc.addImage(headerB64, 'PNG', 0, 0, PDF.PAGE_W, PDF.HEADER_H);
        doc.addImage(footerB64, 'PNG', 0, PDF.PAGE_H - PDF.FOOTER_H, PDF.PAGE_W, PDF.FOOTER_H);
    }

    /**
     * Ensure there is at least `needed` mm of vertical space left on
     * the current page. If not, start a new page and return reset Y.
     */
    function ensureSpace(curY, needed) {
        if (curY + needed <= PDF.CONTENT_BOT) return curY;
        doc.addPage();
        drawPageDecorations();
        return PDF.CONTENT_TOP;
    }

    // ── Page 1 ────────────────────────────────────────────────
    drawPageDecorations();
    let y = PDF.CONTENT_TOP;

    // 3. Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(PDF.TITLE_FONT);
    doc.setTextColor(13, 27, 42);
    doc.text('EMPLOYEE HANDBOOK', PDF.MARGIN_X, y);
    y += 8;

    // Yellow rule under title
    doc.setDrawColor(255, 184, 0);
    doc.setLineWidth(0.9);
    doc.line(PDF.MARGIN_X, y, PDF.PAGE_W - PDF.MARGIN_X, y);
    y += 7;

    // 4. Meta information block
    //    Layout: label in gray bold  |  value in dark normal
    const COL_LABEL = PDF.MARGIN_X;
    const COL_VALUE = PDF.MARGIN_X + 50;

    const metaRows = [
        ['Issued To',          fields.name],
        ['Role / Designation', fields.role],
        ['Reference No.',      fields.refNo],
        ['Date of Issue',      formatDate(fields.docDate)],
    ];

    doc.setFontSize(PDF.META_FONT);

    for (const [label, value] of metaRows) {
        y = ensureSpace(y, PDF.LINE_H);

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text(label + ':', COL_LABEL, y);

        // Value
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(20, 20, 20);
        // Wrap value in case it's long (unlikely but safe)
        const valLines = doc.splitTextToSize(value, PDF.CONTENT_W - 52);
        doc.text(valLines, COL_VALUE, y);

        y += PDF.LINE_H * Math.max(valLines.length, 1);
    }

    // Divider below meta block
    y += 3;
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.3);
    doc.line(PDF.MARGIN_X, y, PDF.PAGE_W - PDF.MARGIN_X, y);
    y += 9;

    // 5. Body Content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(PDF.FONT_SIZE);
    doc.setTextColor(28, 28, 28);

    // Split raw content into paragraphs by newline
    const paragraphs = fields.content.split('\n');

    for (const para of paragraphs) {

        // Blank line → paragraph gap only
        if (para.trim() === '') {
            y += PDF.PARA_GAP;
            // Don't let paragraph gaps alone push us to a new page
            if (y > PDF.CONTENT_BOT) {
                doc.addPage();
                drawPageDecorations();
                y = PDF.CONTENT_TOP;
            }
            continue;
        }

        // Wrap paragraph text to fit content width
        const lines = doc.splitTextToSize(para.trim(), PDF.CONTENT_W);

        for (const line of lines) {
            // If this line won't fit, start a new page
            if (y + PDF.LINE_H > PDF.CONTENT_BOT) {
                doc.addPage();
                drawPageDecorations();
                y = PDF.CONTENT_TOP;
            }
            doc.text(line, PDF.MARGIN_X, y);
            y += PDF.LINE_H;
        }
    }

    // 6. Signatures Block — appears on the last page
    //    Required vertical space: gap + signature image height
    const sigTotalH = PDF.SIG_GAP + PDF.SIG_H;
    y = ensureSpace(y, sigTotalH);

    y += PDF.SIG_GAP;
    const sigX = (PDF.PAGE_W - PDF.SIG_W) / 2; // centered horizontally
    doc.addImage(sigB64, 'PNG', sigX, y, PDF.SIG_W, PDF.SIG_H);

    return doc;
}


// ════════════════════════════════════════════════════════════════
//  GENERATE HANDLER
// ════════════════════════════════════════════════════════════════
async function handleGenerate() {
    // Collect & validate fields
    const fields = {
        name:    els.name.value.trim(),
        role:    els.role.value.trim(),
        refNo:   els.refNo.value.trim(),
        docDate: els.date.value,
        content: els.content.value,
    };

    if (!fields.name || !fields.role || !fields.refNo || !fields.docDate || !fields.content.trim()) {
        showToast('⚠️', 'Please fill in all fields before generating.', true);
        return;
    }

    // Show loading overlay + update status
    els.loadingOverlay.style.display = 'flex';
    setStatus('loading', 'Generating…');
    els.generateBtn.disabled = true;

    try {
        generatedDoc = await buildPDF(fields);

        // Show PDF in iframe via blob URL
        const blob = generatedDoc.output('blob');
        const url  = URL.createObjectURL(blob);

        els.previewFrame.src = url;
        els.previewFrame.style.display = 'block';
        els.previewEmpty.style.display = 'none';

        // Count pages
        const pageCount = generatedDoc.internal.getNumberOfPages();

        // Update status indicators
        setStatus('ready', `${fields.name} — ${fields.role}`);
        els.pageInfo.style.display = 'flex';
        els.pageInfoText.textContent = `${pageCount} page${pageCount !== 1 ? 's' : ''}`;

        // Enable download
        els.downloadBtn.disabled = false;

        showToast('✅', `PDF generated — ${pageCount} page${pageCount !== 1 ? 's' : ''}`);

    } catch (err) {
        console.error('[HandbookGen] PDF error:', err);
        setStatus('idle', 'Generation failed');
        showToast('❌', 'Could not load images. Ensure header.png, footer.png & signatures.png are in the same folder.', true);
    } finally {
        els.loadingOverlay.style.display = 'none';
        els.generateBtn.disabled = false;
    }
}


// ════════════════════════════════════════════════════════════════
//  DOWNLOAD HANDLER
// ════════════════════════════════════════════════════════════════
function handleDownload() {
    if (!generatedDoc) return;

    const name  = els.name.value.trim().replace(/\s+/g, '_');
    const refNo = els.refNo.value.trim().replace(/\//g, '-');
    const filename = `BuyQk_Handbook_${name}_${refNo}.pdf`;

    generatedDoc.save(filename);
    showToast('⬇️', `Saved as ${filename}`);
}


// ════════════════════════════════════════════════════════════════
//  UI HELPERS
// ════════════════════════════════════════════════════════════════

/** Update the preview status pill */
function setStatus(state, text) {
    // state: 'idle' | 'loading' | 'ready'
    els.statusDot.className = 'status-dot status-dot--' + state;
    els.statusText.textContent = text;
    els.previewStatus.classList.toggle('is-ready', state === 'ready');
}

/** Show a toast notification that auto-hides */
let toastTimer = null;
function showToast(icon, msg, isError = false) {
    els.toastIcon.textContent = icon;
    els.toastMsg.textContent  = msg;
    els.toast.classList.toggle('toast--error', isError);
    els.toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3800);
}
