document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('amazon-search-form');
  const warningBox = document.getElementById('filter-warning');
  const clickSound = document.getElementById('clickSound');

  // Initialize Tagify for brand inclusion
  new Tagify(document.querySelector('input[name="brand-include"]'));

  // Click sound for all UI buttons
  document.querySelectorAll("button, input[type='submit'], input[type='button'], input[type='checkbox']").forEach(el => {
    el.addEventListener("click", () => {
      if (clickSound) clickSound.play().catch(() => {});
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const params = new URLSearchParams();
    const rh = [];

    // Show filter warning if too many checkboxes selected
    const checked = [...form.elements].filter(el =>
      el.type === 'checkbox' && el.checked && !el.closest('.coming-soon')
    ).length;
    if (warningBox) warningBox.style.display = (checked > 2) ? 'block' : 'none';

    // Search query
    const q = data.get('q')?.trim();
    if (!q) {
      alert('Please enter a product keyword before searching.');
      document.getElementById('mainSearchInput')?.focus();
      return;
    }
    params.set('k', q);

    // Sort
    const sort = data.get('sort');
    if (sort) params.set('s', sort);

    // Price range
    const min = data.get('min-price')?.trim();
    const max = data.get('max-price')?.trim();
    if (min && max) rh.push(`p_36:${Math.round(min * 100)}-${Math.round(max * 100)}`);
    else if (min)   rh.push(`p_36:${Math.round(min * 100)}-`);
    else if (max)   rh.push(`p_36:-${Math.round(max * 100)}`);

    // % Off
    const pct = data.get('percent-off');
    const PCT_MAP = {
      10: '2665401011', 20: '2665412011', 30: '2665413011',
      40: '2665414011', 50: '2665415011', 60: '2665416011',
      70: '2665417011', 80: '2665418011'
    };
    if (PCT_MAP[pct]) rh.push(`p_n_pct-off-with-tax:${PCT_MAP[pct]}`);

    // Predefined filters
    const FILTER_DEFS = {
      'condition-new': ['p_n_condition-type', '1248879011'],
      'condition-used': ['p_n_condition-type', '1248877011'],
      'condition-refurbished': ['p_n_condition-type', '1248878111'],
      'condition-collectible': ['p_n_condition-type', '1248878011'],
      'prime-only': ['p_n_prime', '1'],
      'free-shipping': ['p_n_shipping', 'free'],
      'in-stock': ['p_n_availability', '2661601011'],
      'coupons': ['p_n_coupon', '1'],
      'lightning-deals': ['p_n_deal_type', '23566065011'],
      'todays-deals': ['p_n_deal_type', '23566065011'],
      'subscribe-save': ['p_n_feature_browse-bin', '15283820011'],
      'amazon-choice': ['p_n_feature_browse-bin', '14826373011'],
      'best-seller': ['p_n_feature_browse-bin', '14826383011'],
      'fba-only': ['p_n_feature_browse-bin', '14674966011'],
      'free-returns': ['p_n_feature_browse-bin', '14674972011'],
      'gift-wrap': ['p_n_feature_browse-bin', '14674970011'],
      'small-business': ['p_n_feature_browse-bin', '14674977011'],
      'amazon-brands': ['p_n_feature_browse-bin', '14674969011'],
      'low-rating': ['p_n_feature_browse-bin', '14674975011'],
      'coupon-only': ['p_n_coupon', '1'],
      'warehouse-refurb': ['p_n_feature_browse-bin', '14674978011']
    };

    Object.entries(FILTER_DEFS).forEach(([field, [param, val]]) => {
      if (data.get(field) === 'on') rh.push(`${param}:${val}`);
    });

    // Deal-Hunter metrics
    ['below-avg-30', 'below-avg-60', 'below-avg-90'].forEach((key, i) => {
      const val = data.get(key)?.trim();
      if (val) rh.push(`p_n_discount_${30 * (i + 1)}day:${Math.round(val)}`);
    });

    const vol = data.get('max-volatility-7')?.trim();
    if (vol) rh.push(`p_n_price-volatility:${Math.round(vol)}`);

    // AI Filters
    if (data.get('predictive-score') === 'on') rh.push('p_n_predictive-score:1');
    if (data.get('emotion-feedback') === 'on') rh.push('p_n_emotion-feedback:1');
    const restockASIN = data.get('restock-forecast')?.trim();
    if (restockASIN) params.set('restock_asin', restockASIN);

    // Brand inclusion
    const brandInput = document.getElementById('brandInclude');
    let brands = [];
    try {
      brands = JSON.parse(brandInput.value).map(x => x.value.trim());
    } catch {
      brands = brandInput.value.split(',').map(x => x.trim());
    }
    brands.filter(Boolean).forEach(b => rh.push(`p_89:${encodeURIComponent(b)}`));

    // Advanced tools
    if (data.get('enable-boolean') === 'on') params.set('boolean', 'on');
    const fields = data.get('field-filters')?.trim();
    if (fields) params.set('fields', fields);
    const asin = data.get('direct-lookup')?.trim();
    if (asin) params.set('asin', asin);

    // Finalize
    if (rh.length) params.set('rh', rh.join(','));
    params.set('tag', 'echolover25-20');

    const finalUrl = `https://www.amazon.com/s?${params.toString()}`;
    window.open(finalUrl, '_blank');
  });
});
