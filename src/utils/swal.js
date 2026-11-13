// SweetAlert2-Style Alert Utility (Zero-Dependency, Native DOM + Tailwind)

class SweetAlertEngine {
  constructor() {
    this.containerId = 'sweetalert-container-root';
  }

  getContainer() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = this.containerId;
      document.body.appendChild(container);
    }
    return container;
  }

  fire(options = {}) {
    return new Promise((resolve) => {
      const {
        title = '',
        text = '',
        html = '',
        icon = 'success', // 'success' | 'warning' | 'error' | 'info'
        timer = 0,
        showConfirmButton = true,
        showCancelButton = false,
        confirmButtonText = 'OK',
        cancelButtonText = 'Batal',
        confirmButtonColor = '', // fallback by icon
        preConfirm = null
      } = typeof options === 'string' ? { title: options } : options;

      const container = this.getContainer();
      container.innerHTML = ''; // Clear previous

      // Backdrop & Modal Wrapper
      const backdrop = document.createElement('div');
      backdrop.className =
        'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-fade-in font-sans select-none';

      // Icon HTML
      let iconHtml = '';
      let btnColorClass = confirmButtonColor || 'bg-[#0284c7] hover:bg-[#0369a1] text-white';

      if (icon === 'success') {
        btnColorClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20';
        iconHtml = `
          <div class="w-14 h-14 rounded-full border-4 border-emerald-400/80 bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <svg class="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        `;
      } else if (icon === 'warning') {
        btnColorClass = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20';
        iconHtml = `
          <div class="w-14 h-14 rounded-full border-4 border-amber-400/80 bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <svg class="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
        `;
      } else if (icon === 'error') {
        btnColorClass = 'bg-rose-600 hover:bg-rose-700 text-white';
        iconHtml = `
          <div class="w-14 h-14 rounded-full border-4 border-rose-400/80 bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <svg class="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
        `;
      } else {
        iconHtml = `
          <div class="w-14 h-14 rounded-full border-4 border-sky-400/80 bg-sky-50 text-sky-500 mx-auto flex items-center justify-center mb-3 shadow-inner">
            <svg class="w-7 h-7 stroke-current" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        `;
      }

      const modalWidth = html ? 'max-w-md' : 'max-w-sm';

      const modalHtml = `
        <div class="bg-white rounded-2xl ${modalWidth} w-full p-5 shadow-2xl border border-slate-200 text-center transform transition-all scale-100 overflow-hidden relative">
          ${iconHtml}
          ${title ? `<h3 class="text-base font-extrabold text-slate-800 leading-tight mb-2">${title}</h3>` : ''}
          ${html ? `<div class="text-xs text-slate-600 mb-4 text-left max-h-[60vh] overflow-y-auto pr-1">${html}</div>` : text ? `<p class="text-xs text-slate-500 leading-relaxed mb-4">${text}</p>` : '<div class="h-2"></div>'}
          
          <div class="flex items-center justify-center gap-2 mt-2">
            ${
              showCancelButton
                ? `<button id="swal-btn-cancel" type="button" class="flex-1 py-2 px-3 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-200">${cancelButtonText}</button>`
                : ''
            }
            ${
              showConfirmButton
                ? `<button id="swal-btn-confirm" type="button" class="flex-1 py-2 px-3 text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer ${btnColorClass}">${confirmButtonText}</button>`
                : ''
            }
          </div>

          ${
            timer > 0
              ? `<div class="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden"><div id="swal-timer-bar" class="h-full bg-emerald-500 transition-all duration-[${timer}ms] w-full"></div></div>`
              : ''
          }
        </div>
      `;

      backdrop.innerHTML = modalHtml;
      container.appendChild(backdrop);

      const cleanup = (result) => {
        backdrop.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => {
          container.innerHTML = '';
          resolve(result);
        }, 150);
      };

      const btnConfirm = backdrop.querySelector('#swal-btn-confirm');
      if (btnConfirm) {
        btnConfirm.focus();
        btnConfirm.addEventListener('click', async () => {
          let value = true;
          if (typeof preConfirm === 'function') {
            try {
              value = await preConfirm();
              if (value === false) return;
            } catch (err) {
              console.error('Swal preConfirm error:', err);
              return;
            }
          }
          cleanup({ isConfirmed: true, isDismissed: false, value });
        });
      }

      const btnCancel = backdrop.querySelector('#swal-btn-cancel');
      if (btnCancel) {
        btnCancel.addEventListener('click', () => cleanup({ isConfirmed: false, isDismissed: true }));
      }

      // Close on backdrop click (if cancelButton or auto-close enabled)
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          cleanup({ isConfirmed: false, isDismissed: true });
        }
      });

      // Auto timer
      if (timer > 0) {
        const timerBar = backdrop.querySelector('#swal-timer-bar');
        if (timerBar) {
          requestAnimationFrame(() => {
            timerBar.style.width = '0%';
            timerBar.style.transition = `width ${timer}ms linear`;
          });
        }
        setTimeout(() => {
          cleanup({ isConfirmed: true, isDismissed: false });
        }, timer);
      }
    });
  }

  // Quick Shortcuts
  success(title, text = '', timer = 2200) {
    return this.fire({
      icon: 'success',
      title,
      text,
      timer,
      showConfirmButton: timer === 0,
    });
  }

  error(title, text = '') {
    return this.fire({
      icon: 'error',
      title,
      text,
      showConfirmButton: true,
      confirmButtonText: 'Tutup',
    });
  }

  warning(title, text = '') {
    return this.fire({
      icon: 'warning',
      title,
      text,
      showConfirmButton: true,
    });
  }

  confirm(title, text = '', confirmButtonText = 'Ya, Hapus!') {
    return this.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      showConfirmButton: true,
      confirmButtonText,
      cancelButtonText: 'Batal',
    });
  }
}

export const Swal = new SweetAlertEngine();
export default Swal;

