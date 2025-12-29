  const DEFAULT_LOGO_URL = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAxNjAgMzYiPgo8dGV4dCB4PSIwIiB5PSIyNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIyIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMWQ0YzhkIiBsZXR0ZXItc3BhY2luZz0iOCI+TUFSVMONPC90ZXh0Pgo8L3N2Zz4=';
const PHONE_NUMBER = '(809) 227-0003';
const SIGNATURE_IMAGE = (typeof window !== 'undefined' && window.SIGNATURE_IMAGE_DATA_URL)
    ? window.SIGNATURE_IMAGE_DATA_URL
    : DEFAULT_LOGO_URL;

const form = document.getElementById('signatureForm');
const preview = document.getElementById('preview');
const copySignatureBtn = document.getElementById('copySignatureBtn');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const downloadBtn = document.getElementById('downloadBtn');
const sendEmailBtn = document.getElementById('sendEmailBtn');
const toast = document.getElementById('toast');

let signatureHTML = '';

form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    signatureHTML = buildSignatureHTML();
    preview.innerHTML = signatureHTML;
    showToast('✅ Firma generada');
});

copySignatureBtn.addEventListener('click', async () => {
    if (!ensureSignatureReady()) return;

    try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = signatureHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        const range = document.createRange();
        range.selectNodeContents(tempDiv);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        const successful = document.execCommand('copy');

        selection.removeAllRanges();
        document.body.removeChild(tempDiv);

        if (!successful) throw new Error('No se pudo copiar');
        showToast('📋 Firma copiada. Usa Ctrl+V / Cmd+V en Outlook.');
    } catch (error) {
        try {
            await navigator.clipboard.writeText(signatureHTML);
            showToast('📋 Firma copiada usando el portapapeles.');
        } catch (fallbackError) {
            showToast('❌ No se pudo copiar. Intenta con «Copiar HTML».');
        }
    }
});

copyHtmlBtn.addEventListener('click', async () => {
    if (!ensureSignatureReady()) return;

    try {
        await navigator.clipboard.writeText(signatureHTML);
        showToast('💻 HTML copiado al portapapeles');
    } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = signatureHTML;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
            showToast('💻 HTML copiado al portapapeles');
        } catch (fallbackError) {
            showToast('❌ No se pudo copiar');
        }

        document.body.removeChild(textarea);
    }
});

downloadBtn.addEventListener('click', () => {
    if (!ensureSignatureReady()) return;

    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const fileName = `firma-${nombre}-${apellidos}`.toLowerCase().replace(/\s+/g, '-');

    const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firma de Correo - ${nombre} ${apellidos}</title>
</head>
<body>
${signatureHTML}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('💾 Archivo HTML descargado');
});

sendEmailBtn.addEventListener('click', () => {
    if (!ensureSignatureReady()) return;

    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();

    const subject = encodeURIComponent(`Firma de correo - ${nombre} ${apellidos}`);
    const body = encodeURIComponent(`Hola,

Aquí está mi firma para Outlook. Cópiala y pégala en tu configuración de firmas.

---
${signatureHTML}
`);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast('📧 Abriendo tu cliente de correo');
});

function buildSignatureHTML() {
    const nombre = document.getElementById('nombre').value.trim();
    const apellidos = document.getElementById('apellidos').value.trim();
    const cargo = document.getElementById('cargo').value.trim();
    const email = document.getElementById('email').value.trim();
    const extension = document.getElementById('extension').value.trim();
    const celular = document.getElementById('celular').value.trim();
    const direccionSelect = document.getElementById('direccion');
    const direccion = direccionSelect.value;
    const selectedOption = direccionSelect.options[direccionSelect.selectedIndex];
    const enlaceMaps = selectedOption ? selectedOption.dataset.map : '';
    const websiteInput = document.getElementById('website').value.trim() || 'www.marti.do';

    const telefonoCompleto = extension ? `${PHONE_NUMBER} Ext. ${extension}` : PHONE_NUMBER;
    const nombreCompleto = `${nombre} ${apellidos}`.trim();
    const websiteHref = /^https?:\/\//i.test(websiteInput) ? websiteInput : `http://${websiteInput}`;
    const websiteLabel = websiteInput.replace(/^https?:\/\//i, '');
    const direccionHtml = formatDireccion(direccion);

    const safeNombre = escapeHTML(nombreCompleto);
    const safeCargo = escapeHTML(cargo);
    const safeEmail = escapeHTML(email);
    const safeTelefono = escapeHTML(telefonoCompleto);
    const safeCelular = escapeHTML(celular);
    const safeDireccion = direccionHtml;
    const safeWebsite = escapeHTML(websiteLabel);

    const celularBlock = celular ? `
                    <br><span style="color: rgb(33, 93, 147); font-weight: 700;">C. </span>
                    <span style="color: rgb(136,136,136);">${safeCelular}</span>` : '';

    return `<p>&nbsp;</p>
<table style="border-collapse:collapse;">
    <tbody>
        <tr>
            <td style="vertical-align:top; width: 200px;">
                <div style="margin: 10px;">
                    <a href="http://www.marti.do" target="_top">
                        <img alt="grupo marti" width="200" height="200" src="${SIGNATURE_IMAGE}" style="display:block;border:0;" />
                    </a>
                </div>
            </td>
            <td style="vertical-align:top;margin-left: 3px; margin-top: 10px">
                <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 17px; margin-top: 20px;">
                    <span style="color:black;font-weight: 700;">${safeNombre}</span>
                    <br><span style="color: rgb(136,136,136);">${safeCargo}</span>
                    <br>
                    <br>
                    <span style="color: rgb(33, 93, 147); font-weight: 700;">E. </span>
                    <span style="color: rgb(136,136,136);"><a href="mailto:${email}" style="color: rgb(33, 93, 147); text-decoration: none;">${safeEmail}</a></span>
                    <br><span style="color: rgb(33, 93, 147); font-weight: 700;">T. </span>
                    <span style="color: rgb(136,136,136);">${safeTelefono}</span>${celularBlock}
                    <br><span style="color: rgb(33, 93, 147); font-weight: 700;">D. </span>
                    <span style="color: rgb(136,136,136);"><a href="${enlaceMaps}" target="_blank" style="color: rgb(33, 93, 147); text-decoration: none;">${safeDireccion}</a></span>
                    <br><span style="color: rgb(33, 93, 147); font-weight: 700;">W. </span>
                    <span style="color: rgb(136,136,136);"><a href="${websiteHref}" target="_blank" style="color: rgb(33, 93, 147); text-decoration: none;"><span>${safeWebsite}</span></a></span>
                </div>
            </td>
        </tr>
    </tbody>
</table>`;
}

function formatDireccion(direccion) {
    if (!direccion) return '';
    const commaIndex = direccion.indexOf(', ');
    if (commaIndex === -1) {
        return escapeHTML(direccion);
    }
    const first = direccion.slice(0, commaIndex);
    const rest = direccion.slice(commaIndex + 2);
    return `${escapeHTML(first)},<br>${escapeHTML(rest)}`;
}

function escapeHTML(str) {
    if (!str) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, (char) => map[char] || char);
}

function ensureSignatureReady() {
    if (!signatureHTML) {
        showToast('⚠️ Genera la firma primero');
        return false;
    }
    return true;
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

initHeroAnimation();

function initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const blobs = Array.from({ length: 20 }, (_, index) => ({
        angle: Math.random() * Math.PI * 2,
        radius: 30 + Math.random() * 90,
        speed: 0.002 + Math.random() * 0.004,
        offset: index * 30,
        hue: 205 + Math.random() * 40
    }));

    let width = 0;
    let height = 0;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, width, height);

        blobs.forEach((blob) => {
            blob.angle += blob.speed;
            const x = width / 2 + Math.cos(blob.angle + blob.offset) * blob.radius;
            const y = height / 2 + Math.sin(blob.angle + blob.offset) * blob.radius * 0.6;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 80);
            gradient.addColorStop(0, `hsla(${blob.hue}, 70%, 60%, 0.9)`);
            gradient.addColorStop(1, 'hsla(220, 60%, 10%, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(x, y, 90, 60, blob.angle, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = 'rgba(16, 30, 50, 0.35)';
        ctx.fillRect(0, 0, width, height);

        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
}
