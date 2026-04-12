/* ── Bundle Deals Custom Element ── */
class BundleDeals extends HTMLElement {
  connectedCallback() {
    this.sectionId       = this.dataset.section;
    this.percentageLeft  = parseFloat(this.dataset.percentageLeft) || 1;
    this.fixedDiscount   = parseFloat(this.dataset.fixedDiscount)  || 0;
    this.currencySymbol  = this.dataset.currencySymbol || '$';
    this.updatePrices    = this.dataset.updatePrices !== 'false';
    this.skipUnavailable = this.dataset.skipUnavailable === 'true';

    this.checkboxes    = this.querySelectorAll('.bundle-deals__checkbox-js');
    this.mediaItems    = this.querySelectorAll('.bundle-deals__media-item-container-js');
    this.totalPriceEl  = this.querySelector('.bundle-deals__total-price-js');
    this.totalCmpEl    = this.querySelector('.bundle-deals__total-compare-price-js');
    this.submitBtn     = this.querySelector('.bundle-deals__btn');
    this.errorEl       = this.querySelector('.bundle-deals__error');

    this.checkboxes.forEach(cb => {
      cb.addEventListener('change', this._onCheckbox.bind(this));
    });

    this.querySelectorAll('.bundle-deals__variant-selects-js').forEach(container => {
      container.querySelectorAll('select').forEach(sel => {
        sel.addEventListener('change', () => this._onVariantChange(container));
      });
    });

    if (this.submitBtn) {
      this.submitBtn.addEventListener('click', this._onSubmit.bind(this));
    }
  }

  /* ── Checkbox toggled ── */
  _onCheckbox(e) {
    const cb    = e.target;
    const index = parseInt(cb.dataset.index);
    const media = this.mediaItems[index];
    const row   = cb.closest('.bundle-deals__product-js');

    if (cb.checked) {
      cb.dataset.checked = 'true';
      media && media.classList.remove('bundle-deals__media-item--disabled');
      row   && row.classList.remove('bundle-deals__product--deselected');
    } else {
      cb.dataset.checked = 'false';
      media && media.classList.add('bundle-deals__media-item--disabled');
      row   && row.classList.add('bundle-deals__product--deselected');
    }

    if (this.updatePrices) this._updateTotals();
  }

  /* ── Variant select changed ── */
  _onVariantChange(container) {
    const jsonEl = container.querySelector('script[type="application/json"]');
    if (!jsonEl) return;

    const variants = JSON.parse(jsonEl.textContent);
    const selected = Array.from(container.querySelectorAll('select')).map(s => s.value);

    const variant = variants.find(v =>
      selected.every((val, i) => v['option' + (i + 1)] === val)
    );
    if (!variant) return;

    const index = parseInt(container.dataset.index);
    const cb    = this.querySelector(`#checkbox-${index}-${this.sectionId}`);
    if (!cb) return;

    const pctLeft = parseFloat(container.dataset.percentageLeft) || this.percentageLeft;
    const fixed   = parseFloat(container.dataset.fixedDiscount)  || 0;
    const price   = Math.round(variant.price * pctLeft - fixed);
    const cmp     = (variant.compare_at_price > variant.price)
                    ? variant.compare_at_price
                    : variant.price;

    cb.dataset.id           = variant.id;
    cb.dataset.price        = price;
    cb.dataset.comparePrice = cmp;

    const row = cb.closest('.bundle-deals__product-js');
    if (row) {
      const priceEl = row.querySelector('.bundle-deals__price-js');
      const cmpEl   = row.querySelector('.bundle-deals__compare-price-js');
      if (priceEl) priceEl.textContent = this._money(price);
      if (cmpEl)   cmpEl.textContent   = cmp > price ? this._money(cmp) : '';
    }

    if (this.updatePrices) this._updateTotals();
  }

  /* ── Recalculate total price row ── */
  _updateTotals() {
    let total = 0;
    let totalCmp = 0;

    this.checkboxes.forEach(cb => {
      if (cb.checked) {
        total    += parseFloat(cb.dataset.price)        || 0;
        totalCmp += parseFloat(cb.dataset.comparePrice) || parseFloat(cb.dataset.price) || 0;
      }
    });

    total = Math.round(total * this.percentageLeft - this.fixedDiscount);

    if (this.totalPriceEl) this.totalPriceEl.textContent = this._money(total);
    if (this.totalCmpEl) {
      this.totalCmpEl.textContent = totalCmp > total ? this._money(totalCmp) : '';
    }
  }

  /* ── Add bundle to cart ── */
  async _onSubmit(e) {
    e.preventDefault();
    this._setError('');

    const items = [];
    this.checkboxes.forEach(cb => {
      if (cb.checked && cb.dataset.id) {
        items.push({ id: parseInt(cb.dataset.id), quantity: 1 });
      }
    });

    if (!items.length) return;

    if (this.submitBtn) {
      this.submitBtn.disabled    = true;
      this.submitBtn.textContent = 'Adding…';
    }

    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.description || 'Could not add items to cart.');
      }

      /* Use MammothTheme cart helpers if available, otherwise redirect */
      if (window.MammothTheme && typeof window.MammothTheme.fetchCart === 'function') {
        await window.MammothTheme.fetchCart();
        if (typeof window.MammothTheme.openCart === 'function') {
          window.MammothTheme.openCart();
        }
        if (typeof window.MammothTheme.showToast === 'function') {
          window.MammothTheme.showToast('Bundle added to cart!');
        }
      } else {
        window.location.href = '/cart';
      }

    } catch (err) {
      console.error('[BundleDeals]', err);
      this._setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      if (this.submitBtn) {
        this.submitBtn.disabled    = false;
        this.submitBtn.textContent = this.submitBtn.dataset.label || 'Add Bundle to Cart';
      }
    }
  }

  _money(cents) {
    return this.currencySymbol + (cents / 100).toFixed(2);
  }

  _setError(msg) {
    if (!this.errorEl) return;
    this.errorEl.textContent = msg;
    this.errorEl.classList.toggle('is-visible', !!msg);
  }
}

customElements.define('bundle-deals', BundleDeals);
