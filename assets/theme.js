/* DIAZ Luxe — Theme JavaScript */
'use strict';

window.DiazTheme = (function () {

  /* ─── Utilities ─── */
  function formatMoney(cents) {
    const dollars = (cents / 100).toFixed(2);
    return '$' + dollars;
  }

  function showToast(message, duration) {
    duration = duration || 3000;
    const toast = document.getElementById('Toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(function () {
      toast.classList.remove('is-visible');
    }, duration);
  }

  /* ─── Cart State ─── */
  let cartData = { items: [], item_count: 0, total_price: 0 };

  function fetchCart() {
    return fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        cartData = data;
        updateCartUI(data);
        return data;
      });
  }

  function addToCart(variantId, quantity, triggerEl) {
    quantity = quantity || 1;
    const btn = triggerEl;
    if (btn) btn.textContent = 'Adding…';

    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: parseInt(variantId), quantity: quantity }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Could not add item');
        return res.json();
      })
      .then(function () {
        return fetchCart();
      })
      .then(function () {
        if (btn) btn.textContent = 'Add to Cart';
        resetCartTimer();
        openCart();
        showToast('Added to cart');
      })
      .catch(function (err) {
        console.error(err);
        if (btn) btn.textContent = 'Add to Cart';
        showToast('Could not add item. Please try again.');
      });
  }

  function changeCartItem(key, quantity) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: quantity }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        cartData = data;
        updateCartUI(data);
        return data;
      });
  }

  function removeCartItem(key) {
    return changeCartItem(key, 0);
  }

  /* ─── Discount Tiers ─── */
  var discountTiers = [
    { threshold: 5000,  percent: 10 },  // $50
    { threshold: 10000, percent: 15 },  // $100
    { threshold: 15000, percent: 20 },  // $150
  ];

  function updateDiscountBar(totalCents) {
    var bar     = document.getElementById('CartDiscountBar');
    var msg     = document.getElementById('CartDiscountMsg');
    var fill    = document.getElementById('CartDiscountFill');
    var discountLine = document.getElementById('CartDiscountLine');
    var discountName = document.getElementById('CartDiscountName');
    var discountAmount = document.getElementById('CartDiscountAmount');
    if (!bar) return;

    if (totalCents === 0) {
      bar.style.display = 'none';
      if (discountLine) discountLine.style.display = 'none';
      return;
    }
    bar.style.display = '';

    var maxThreshold = discountTiers[discountTiers.length - 1].threshold;
    var fillPct = Math.min((totalCents / maxThreshold) * 100, 100);
    if (fill) fill.style.width = fillPct + '%';

    // Update milestones
    var milestones = bar.querySelectorAll('.cart-discount-milestone');
    milestones.forEach(function (m, i) {
      if (totalCents >= discountTiers[i].threshold) {
        m.classList.add('reached');
      } else {
        m.classList.remove('reached');
      }
    });

    // Find current tier
    var currentTier = null;
    var nextTier = discountTiers[0];
    for (var i = 0; i < discountTiers.length; i++) {
      if (totalCents >= discountTiers[i].threshold) {
        currentTier = discountTiers[i];
        nextTier = discountTiers[i + 1] || null;
      }
    }

    // Update message
    var tagIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>';
    if (msg) {
      if (!currentTier) {
        var awayDollars = ((nextTier.threshold - totalCents) / 100).toFixed(2);
        msg.innerHTML = tagIcon + 'You\'re <span class="highlight">$' + awayDollars + '</span> away from <span class="highlight">' + nextTier.percent + '% OFF!</span>';
      } else if (nextTier) {
        var awayDollars = ((nextTier.threshold - totalCents) / 100).toFixed(2);
        msg.innerHTML = tagIcon + currentTier.percent + '% OFF unlocked! <span class="highlight">$' + awayDollars + '</span> more for <span class="highlight">' + nextTier.percent + '%!</span>';
      } else {
        msg.innerHTML = tagIcon + 'Maximum <span class="highlight">' + currentTier.percent + '% OFF</span> unlocked!';
      }
    }

    // Update discount line in footer
    if (discountLine && discountName && discountAmount) {
      if (currentTier) {
        var savedAmount = ((totalCents * currentTier.percent / 100) / 100).toFixed(2);
        discountName.textContent = currentTier.percent + '% OFF';
        discountAmount.textContent = '-$' + savedAmount;
        discountLine.style.display = '';
      } else {
        discountLine.style.display = 'none';
      }
    }
  }

  /* ─── Cart Upsell from Product Template Settings ─── */
  var upsellProductCache = {};

  function updateCartUpsell(cartItems) {
    var upsellEl = document.getElementById('CartUpsell');
    var productsEl = document.getElementById('CartUpsellProducts');
    if (!upsellEl || !productsEl) return;

    if (cartItems.length === 0) {
      upsellEl.style.display = 'none';
      return;
    }

    // Read upsell handles from window.DiazUpsellMap (set on product pages)
    var map = window.DiazUpsellMap || {};
    var cartHandles = cartItems.map(function (item) { return item.handle; });
    var upsellHandles = [];

    cartItems.forEach(function (item) {
      var handles = map[item.handle] || [];
      handles.forEach(function (h) {
        if (h && upsellHandles.indexOf(h) === -1 && cartHandles.indexOf(h) === -1) {
          upsellHandles.push(h);
        }
      });
    });

    upsellHandles = upsellHandles.slice(0, 2);

    if (upsellHandles.length === 0) {
      upsellEl.style.display = 'none';
      return;
    }

    // Fetch product JSON for each upsell handle
    var fetches = upsellHandles.map(function (handle) {
      if (upsellProductCache[handle]) return Promise.resolve(upsellProductCache[handle]);
      return fetch('/products/' + handle + '.json')
        .then(function (res) { return res.ok ? res.json() : null; })
        .then(function (data) {
          if (data && data.product) {
            upsellProductCache[handle] = data.product;
            return data.product;
          }
          return null;
        })
        .catch(function () { return null; });
    });

    Promise.all(fetches).then(function (products) {
      var valid = products.filter(function (p) { return p !== null; });
      renderUpsellProducts(valid, upsellEl, productsEl);
    });
  }

  function renderUpsellProducts(products, upsellEl, productsEl) {
    if (products.length === 0) {
      upsellEl.style.display = 'none';
      return;
    }

    upsellEl.style.display = '';
    productsEl.innerHTML = products.map(function (p) {
      var variant = p.variants[0];
      var imgSrc = p.image && p.image.src ? p.image.src.replace(/(\.\w+)(\?|$)/, '_200x200$1$2') : '';
      // /products/{handle}.json returns prices as dollar strings ("35.00"), convert to cents
      var priceCents = Math.round(parseFloat(variant.price) * 100);
      var price = formatMoney(priceCents);
      var compareHtml = '';
      if (variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price)) {
        var compareCents = Math.round(parseFloat(variant.compare_at_price) * 100);
        compareHtml = '<s style="color:var(--color-text-muted);margin-right:0.25rem;font-size:0.7rem;">' + formatMoney(compareCents) + '</s>';
      }
      return '<div class="cart-upsell-item">' +
        '<a href="/products/' + p.handle + '" class="cart-upsell-item-image">' +
          (imgSrc ? '<img src="' + imgSrc + '" alt="' + escapeHTML(p.title) + '" loading="lazy">' : '') +
        '</a>' +
        '<div class="cart-upsell-item-info">' +
          '<a href="/products/' + p.handle + '" class="cart-upsell-item-title">' + escapeHTML(p.title) + '</a>' +
          '<p class="cart-upsell-item-price">' + compareHtml + price + '</p>' +
        '</div>' +
        '<button type="button" class="cart-upsell-item-add" data-variant-id="' + variant.id + '">Add</button>' +
      '</div>';
    }).join('');

    // Bind upsell add buttons
    productsEl.querySelectorAll('.cart-upsell-item-add').forEach(function (btn) {
      if (!btn.disabled) {
        btn.addEventListener('click', function () {
          var vid = btn.dataset.variantId;
          btn.textContent = '...';
          addToCart(vid, 1, null).then(function () {
            btn.textContent = 'Added';
            setTimeout(function () { btn.textContent = 'Add'; }, 1500);
          });
        });
      }
    });
  }

  /* ─── Cart Reservation Timer ─── */
  var cartTimerInterval = null;
  var cartTimerSeconds = 300; // 5 minutes

  function startCartTimer() {
    if (cartTimerInterval) return; // already running
    var timerEl = document.getElementById('CartTimer');
    if (!timerEl) return;
    cartTimerSeconds = 300;
    updateTimerDisplay(timerEl);
    cartTimerInterval = setInterval(function () {
      cartTimerSeconds--;
      if (cartTimerSeconds <= 0) {
        cartTimerSeconds = 0;
        clearInterval(cartTimerInterval);
        cartTimerInterval = null;
      }
      updateTimerDisplay(timerEl);
    }, 1000);
  }

  function resetCartTimer() {
    if (cartTimerInterval) {
      clearInterval(cartTimerInterval);
      cartTimerInterval = null;
    }
    cartTimerSeconds = 300;
    var timerEl = document.getElementById('CartTimer');
    if (timerEl) updateTimerDisplay(timerEl);
    startCartTimer();
  }

  function updateTimerDisplay(el) {
    var m = Math.floor(cartTimerSeconds / 60);
    var s = cartTimerSeconds % 60;
    el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ─── Cart UI ─── */
  function updateCartUI(data) {
    // Badge
    const badge = document.getElementById('CartCount');
    if (badge) {
      badge.textContent = data.item_count;
      badge.style.display = data.item_count > 0 ? 'flex' : 'none';
    }

    // Update title with item count
    var titleEl = document.getElementById('CartDrawerTitle');
    if (titleEl) {
      titleEl.textContent = data.item_count > 0
        ? 'Cart \u00b7 ' + data.item_count + ' item' + (data.item_count > 1 ? 's' : '')
        : 'Cart';
    }

    // Show/hide reserved timer
    var reservedEl = document.getElementById('CartReserved');
    if (reservedEl) {
      reservedEl.style.display = data.item_count > 0 ? 'flex' : 'none';
      if (data.item_count > 0) startCartTimer();
    }

    const body    = document.getElementById('CartDrawerBody');
    const empty   = document.getElementById('CartEmpty');
    const items   = document.getElementById('CartItems');
    const footer  = document.getElementById('CartFooter');
    const total   = document.getElementById('CartTotal');

    if (!body) return;

    // Update discount bar
    updateDiscountBar(data.total_price);

    if (data.item_count === 0) {
      if (empty)  empty.style.display  = '';
      if (items)  items.style.display  = 'none';
      if (footer) footer.style.display = 'none';
      var discountBar = document.getElementById('CartDiscountBar');
      if (discountBar) discountBar.style.display = 'none';
      var upsellEl = document.getElementById('CartUpsell');
      if (upsellEl) upsellEl.style.display = 'none';
    } else {
      if (empty)  empty.style.display  = 'none';
      if (items)  items.style.display  = '';
      if (footer) footer.style.display = '';

      if (total) total.textContent = formatMoney(data.total_price);

      // Update checkout button total
      var checkoutTotal = document.getElementById('CartCheckoutTotal');
      if (checkoutTotal) checkoutTotal.textContent = formatMoney(data.total_price);

      if (items) {
        items.innerHTML = data.items.map(function (item) {
          return buildCartItemHTML(item);
        }).join('');

        // Bind qty buttons
        items.querySelectorAll('[data-qty-btn]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            const key   = btn.dataset.key;
            const delta = parseInt(btn.dataset.delta);
            const current = parseInt(btn.closest('.cart-item').dataset.qty);
            changeCartItem(key, current + delta);
          });
        });

        // Bind remove buttons
        items.querySelectorAll('[data-remove-btn]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            removeCartItem(btn.dataset.key);
          });
        });
      }

      // Update upsell recommendations
      updateCartUpsell(data.items);
    }
  }

  function buildCartItemHTML(item) {
    const imgSrc = item.image
      ? item.image.replace(/(\.\w+)$/, '_200x200$1')
      : '';
    return '<div class="cart-item" data-qty="' + item.quantity + '">' +
      '<div class="cart-item-image">' +
        (imgSrc ? '<img src="' + imgSrc + '" alt="' + escapeHTML(item.title) + '" loading="lazy">' : '') +
      '</div>' +
      '<div class="cart-item-details">' +
        '<p class="cart-item-title">' + escapeHTML(item.product_title) + '</p>' +
        (item.variant_title && item.variant_title !== 'Default Title'
          ? '<p class="cart-item-variant">' + escapeHTML(item.variant_title) + '</p>' : '') +
        (item.compare_at_price && item.compare_at_price > item.price
          ? '<p class="cart-item-price">' +
              '<s class="cart-item-compare-price">' + formatMoney(item.compare_at_price * item.quantity) + '</s> ' +
              formatMoney(item.line_price) +
            '</p>'
          : '<p class="cart-item-price">' + formatMoney(item.line_price) + '</p>') +
      '</div>' +
      '<div class="cart-item-actions">' +
        '<button class="cart-item-remove" data-remove-btn data-key="' + item.key + '" aria-label="Remove">' +
          renderTrashIcon() +
        '</button>' +
        '<div class="cart-qty">' +
          '<button class="cart-qty-btn" data-qty-btn data-key="' + item.key + '" data-delta="-1" aria-label="Decrease">' + renderMinusIcon() + '</button>' +
          '<span class="cart-qty-num">' + item.quantity + '</span>' +
          '<button class="cart-qty-btn" data-qty-btn data-key="' + item.key + '" data-delta="1"  aria-label="Increase">' + renderPlusIcon() + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderTrashIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';
  }

  function renderMinusIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  }

  function renderPlusIcon() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  /* ─── Cart Drawer Toggle ─── */
  function openCart() {
    const drawer  = document.getElementById('CartDrawer');
    const overlay = document.getElementById('CartOverlay');
    if (!drawer) return;
    drawer.removeAttribute('hidden');
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const toggle = document.getElementById('CartToggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }

  function closeCart() {
    const drawer  = document.getElementById('CartDrawer');
    const overlay = document.getElementById('CartOverlay');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    const toggle = document.getElementById('CartToggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    setTimeout(function () { drawer.setAttribute('hidden', ''); }, 350);
  }

  /* ─── Mobile Menu ─── */
  function initMobileMenu() {
    const toggle = document.getElementById('MobileMenuToggle');
    const nav    = document.getElementById('MobileNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('is-open');
      nav.setAttribute('aria-hidden', String(!isOpen));
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        nav.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ─── Product Gallery (Product Page) ─── */
  function initProductGallery() {
    var gallery = document.querySelector('.product-gallery');
    if (!gallery) return;

    var mainImage = gallery.querySelector('.product-main-image img');
    var allThumbs = Array.from(gallery.querySelectorAll('.product-thumbnail'));
    var visCurrentIdx = 0;

    function getVisible() {
      return allThumbs.filter(function(t) { return t.style.display !== 'none'; });
    }

    function loadThumb(thumb) {
      var img = thumb.querySelector('img');
      if (img && img.dataset.thumbSrc && !img.getAttribute('src')) {
        img.src = img.dataset.thumbSrc;
      }
    }

    function setActiveVisible(visIdx) {
      var visible = getVisible();
      if (!visible.length) return 0;
      var idx = ((visIdx % visible.length) + visible.length) % visible.length;
      allThumbs.forEach(function(t) { t.classList.remove('active'); });
      var thumb = visible[idx];
      thumb.classList.add('active');
      loadThumb(thumb);
      if (mainImage && thumb.dataset.src) mainImage.src = thumb.dataset.src;
      return idx;
    }

    allThumbs.forEach(function(thumb) {
      thumb.addEventListener('click', function() {
        var visible = getVisible();
        var visIdx = visible.indexOf(thumb);
        if (visIdx !== -1) visCurrentIdx = setActiveVisible(visIdx);
      });
    });

    var prevBtn = gallery.querySelector('[data-gallery-prev]');
    var nextBtn = gallery.querySelector('[data-gallery-next]');
    if (prevBtn) prevBtn.addEventListener('click', function() {
      visCurrentIdx = setActiveVisible(visCurrentIdx - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', function() {
      visCurrentIdx = setActiveVisible(visCurrentIdx + 1);
    });

    // Exposed for variant selector to call when color changes
    gallery._filterByColor = function(colorValue) {
      var color = colorValue.toLowerCase().trim();
      var visible = [];
      allThumbs.forEach(function(thumb) {
        var thumbColor = (thumb.dataset.color || '').toLowerCase();
        var isMatch = thumbColor.includes(color) || (color.includes(thumbColor) && thumbColor !== '');
        thumb.style.display = isMatch ? '' : 'none';
        if (isMatch) visible.push(thumb);
      });
      if (!visible.length) allThumbs.forEach(function(t) { t.style.display = ''; });
      visCurrentIdx = setActiveVisible(0);
    };
  }

  /* ─── Variant Selector (Product Page) ─── */
  function initVariantSelector() {
    const form = document.getElementById('ProductForm');
    if (!form) return;

    const variantInput    = form.querySelector('[name="id"]');
    const priceEl         = document.getElementById('ProductPrice');
    const addBtn          = form.querySelector('.product-atc-btn');
    const optionBtns      = form.querySelectorAll('.option-btn');

    // Keep track of selected options
    const selected = {};

    optionBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const optionName = btn.dataset.option;
        const optionVal  = btn.dataset.value;

        // Deselect siblings
        form.querySelectorAll('.option-btn[data-option="' + optionName + '"]').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        selected[optionName] = optionVal;

        // Color: filter gallery and update label
        if (btn.dataset.isColor === 'true') {
          var colorLabel = document.getElementById('SelectedColorLabel');
          if (colorLabel) colorLabel.textContent = optionVal;
          var gal = document.querySelector('.product-gallery');
          if (gal && gal._filterByColor) gal._filterByColor(optionVal);
        }

        // Find matching variant
        const variants = JSON.parse(form.dataset.variants || '[]');
        const match = variants.find(function (v) {
          return v.options.every(function (opt, i) {
            const key = form.dataset['option' + (i + 1)];
            return !selected[key] || selected[key] === opt;
          });
        });

        if (match) {
          variantInput.value = match.id;
          if (priceEl) priceEl.textContent = formatMoney(match.price);
          if (addBtn) {
            addBtn.disabled = !match.available;
            addBtn.textContent = match.available ? 'Add to Cart' : 'Sold Out';
            addBtn.dataset.variantId = match.id;
          }
        }
      });
    });
  }

  /* ─── Product Card Hover Image ─── */
  function initProductCardHover() {
    document.querySelectorAll('.product-card').forEach(function (card) {
      const primary   = card.querySelector('.product-card-img-primary');
      const secondary = card.querySelector('.product-card-img-secondary');
      if (!primary || !secondary) return;

      card.addEventListener('mouseenter', function () {
        primary.style.opacity   = '0';
        secondary.style.opacity = '1';
      });
      card.addEventListener('mouseleave', function () {
        primary.style.opacity   = '1';
        secondary.style.opacity = '0';
      });
    });
  }

  /* ─── Hero Scroll Button ─── */
  function initHeroScroll() {
    const btn = document.querySelector('[data-scroll-to]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const target = document.getElementById(btn.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ─── Cart Page Qty ─── */
  function initCartPage() {
    const form = document.getElementById('CartPageForm');
    if (!form) return;

    form.querySelectorAll('.cart-qty-change').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const key     = btn.dataset.key;
        const delta   = parseInt(btn.dataset.delta);
        const input   = form.querySelector('input[data-key="' + key + '"]');
        if (!input) return;
        const newQty = Math.max(0, parseInt(input.value) + delta);
        input.value  = newQty;
        changeCartItem(key, newQty).then(function () {
          window.location.reload();
        });
      });
    });
  }

  /* ─── Init ─── */
  function init() {
    // Cart toggle
    const cartToggle = document.getElementById('CartToggle');
    if (cartToggle) {
      cartToggle.addEventListener('click', function () {
        const drawer = document.getElementById('CartDrawer');
        if (drawer && drawer.classList.contains('is-open')) {
          closeCart();
        } else {
          fetchCart().then(function () { openCart(); });
        }
      });
    }

    const cartClose   = document.getElementById('CartClose');
    const cartOverlay = document.getElementById('CartOverlay');
    if (cartClose)   cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const drawer = document.getElementById('CartDrawer');
        if (drawer && drawer.classList.contains('is-open')) closeCart();
        const nav = document.getElementById('MobileNav');
        if (nav && nav.classList.contains('is-open')) {
          nav.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      }
    });

    fetchCart();
    initMobileMenu();
    initProductGallery();
    initVariantSelector();
    initProductCardHover();
    initHeroScroll();
    initCartPage();
  }

  document.addEventListener('DOMContentLoaded', init);

  // Public API
  return {
    addToCart: addToCart,
    openCart: openCart,
    closeCart: closeCart,
    showToast: showToast,
    fetchCart: fetchCart,
  };

})();
