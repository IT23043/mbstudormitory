/**
 * MBSTU Hall Management System - Shared UI Utilities & Component Helpers
 * Clean, minimal interface utilities without icon clutter.
 */

const App = {
  async init() {
    await DB.init();
    Auth.renderNavbarAuth();
    this.setupActiveNav();
    this.injectToastContainer();
  },

  setupActiveNav() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('active', 'fw-bold', 'text-primary');
      }
    });
  },

  injectToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
  },

  toast(message, type = 'info', title = null) {
    this.injectToastContainer();
    const container = document.getElementById('toast-container');
    const toastTitle = title || (type === 'success' ? 'Success' : (type === 'danger' || type === 'error' ? 'Notice' : 'System'));
    const toastId = 'toast-' + Date.now();

    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center border shadow-sm mb-2 rounded-2 bg-white" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header border-bottom-0 pb-1">
          <strong class="me-auto text-dark small">${toastTitle}</strong>
          <small class="text-muted">just now</small>
          <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body text-secondary pt-0 pb-3 small">
          ${message}
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, { delay: 4000 });
    bsToast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  },

  formatCurrency(amount) {
    return `${Number(amount || 0).toLocaleString('en-US')} ৳`;
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  },

  generateQRCanvas(text, elementId, size = 120) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }

    const grid = 15;
    const cellSize = size / grid;
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="#ffffff" rx="4"/>`;

    const drawFinder = (x, y) => {
      svg += `<rect x="${x}" y="${y}" width="${cellSize * 4}" height="${cellSize * 4}" fill="#0f172a" rx="2"/>`;
      svg += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#ffffff" rx="1"/>`;
      svg += `<rect x="${x + cellSize * 1.5}" y="${y + cellSize * 1.5}" width="${cellSize}" height="${cellSize}" fill="#0f172a"/>`;
    };

    drawFinder(cellSize, cellSize);
    drawFinder((grid - 5) * cellSize, cellSize);
    drawFinder(cellSize, (grid - 5) * cellSize);

    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if ((r < 5 && c < 5) || (r < 5 && c >= grid - 5) || (r >= grid - 5 && c < 5)) continue;
        if (Math.sin(hash + r * 13 + c * 29) > 0.15) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize - 0.5}" height="${cellSize - 0.5}" fill="#0f172a"/>`;
        }
      }
    }
    svg += '</svg>';
    el.innerHTML = svg;
  },

  populateHallDropdown(selectElementId, selectedGender = null, currentHallId = null) {
    const select = document.getElementById(selectElementId);
    if (!select) return;

    const halls = DB.getHalls();
    const filteredHalls = selectedGender ? halls.filter(h => h.gender.toLowerCase() === selectedGender.toLowerCase()) : halls;

    select.innerHTML = '<option value="">-- Select Residential Hall --</option>';

    if (!selectedGender) {
      const maleGroup = document.createElement('optgroup');
      maleGroup.label = 'Male Residential Halls';
      halls.filter(h => h.gender === 'Male').forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `${h.name} (${h.available} seats left)`;
        if (currentHallId === h.id) opt.selected = true;
        maleGroup.appendChild(opt);
      });

      const femaleGroup = document.createElement('optgroup');
      femaleGroup.label = 'Female Residential Halls';
      halls.filter(h => h.gender === 'Female').forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `${h.name} (${h.available} seats left)`;
        if (currentHallId === h.id) opt.selected = true;
        femaleGroup.appendChild(opt);
      });

      select.appendChild(maleGroup);
      select.appendChild(femaleGroup);
    } else {
      filteredHalls.forEach(h => {
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `${h.name} (${h.available} available seats)`;
        if (currentHallId === h.id) opt.selected = true;
        select.appendChild(opt);
      });
    }
  },

  printMealToken(tokenId) {
    const token = DB.getMealTokenById(tokenId);
    if (!token) {
      this.toast('Token not found', 'danger');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=500,height=620');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MBSTU Meal Token - ${token.tokenId}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>
          body { font-family: system-ui, sans-serif; background: #ffffff; padding: 25px; color: #0f172a; }
          .token-card { max-width: 420px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; }
          @media print { .no-print { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="token-card text-center">
          <h6 class="fw-bold text-dark mb-0">Mawlana Bhashani Science & Technology University</h6>
          <p class="text-muted small mb-2">${token.hallName}</p>
          <hr class="my-2">
          
          <div class="badge bg-light text-dark border px-3 py-1 my-2 text-uppercase font-mono">
            ${token.mealSlot} Meal Token
          </div>
          <h4 class="fw-bold font-mono my-1">${token.tokenId}</h4>
          <p class="text-muted small mb-3">Valid Date: <strong>${token.date}</strong></p>
          
          <div class="p-2 border rounded d-inline-block my-2">
            <div id="print-qr"></div>
          </div>

          <div class="text-start bg-light p-3 rounded mt-3 small border">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Student Name:</span>
              <strong>${token.studentName}</strong>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Student ID:</span>
              <strong>${token.studentId}</strong>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-muted">Status:</span>
              <span>${token.residentStatus}</span>
            </div>
            <div class="d-flex justify-content-between">
              <span class="text-muted">Price:</span>
              <strong>${token.price} BDT (PAID)</strong>
            </div>
          </div>

          <p class="text-muted small mt-3 mb-3 text-start">
            Present this token slip at the dining counter during serving hours. Single-use only.
          </p>

          <div class="no-print d-flex gap-2 justify-content-center">
            <button onclick="window.print()" class="btn btn-dark btn-sm px-4 rounded-pill">Print / Save PDF</button>
            <button onclick="window.close()" class="btn btn-outline-secondary btn-sm px-3 rounded-pill">Close</button>
          </div>
        </div>

        <script>
          const qrBox = document.getElementById('print-qr');
          qrBox.innerHTML = '${this.getRawQRSvg(token.tokenId)}';
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  },

  getRawQRSvg(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
    const grid = 15;
    const size = 110;
    const cellSize = size / grid;
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
    const drawFinder = (x, y) => {
      svg += `<rect x="${x}" y="${y}" width="${cellSize * 4}" height="${cellSize * 4}" fill="#0f172a" rx="1"/>`;
      svg += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#ffffff"/>`;
      svg += `<rect x="${x + cellSize * 1.5}" y="${y + cellSize * 1.5}" width="${cellSize}" height="${cellSize}" fill="#0f172a"/>`;
    };
    drawFinder(cellSize, cellSize);
    drawFinder((grid - 5) * cellSize, cellSize);
    drawFinder(cellSize, (grid - 5) * cellSize);
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        if ((r < 5 && c < 5) || (r < 5 && c >= grid - 5) || (r >= grid - 5 && c < 5)) continue;
        if (Math.sin(hash + r * 13 + c * 29) > 0.15) {
          svg += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize - 0.5}" height="${cellSize - 0.5}" fill="#0f172a"/>`;
        }
      }
    }
    svg += '</svg>';
    return svg.replace(/"/g, '\\"');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
