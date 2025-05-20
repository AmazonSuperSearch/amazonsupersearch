document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('amazon-search-form');
  const warningBox = document.getElementById('filter-warning');

  new Tagify(document.querySelector('input[name="brand-include"]'));
  new Tagify(document.querySelector('input[name="brand-exclude"]'));

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const checked = [...form.elements].filter(el =>
      el.type === 'checkbox' && el.checked && !el.closest('.coming-soon')
    ).length;

    if (warningBox) warningBox.style.display = (checked > 2) ? 'block' : 'none';

    ['brandInclude', 'brandExclude'].forEach(id => {
      const tagifyInput = document.getElementById(id);
      if (tagifyInput && tagifyInput._tagify) {
       tagifyInput.setAttribute('value', tagifyInput._tagify.value.map(x => x.value).join(','));
      }
    });
document.querySelectorAll('button, input[type="submit"]').forEach(el => {
  el.addEventListener('click', () => {
    const clickSound = document.getElementById('clickSound');
    if (clickSound) clickSound.play().catch(() => {});
  });
});
    const data = new FormData(form);
    const params = new URLSearchParams();
    const rh = [];
    
// --- Prime Only Filter Logic ---
 // ——— consolidate filters into one place ———
const FILTER_DEFS = {
  // Condition filters
  'condition-new':         ['p_n_condition-type', '1248879011'],
  'condition-used':        ['p_n_condition-type', '1248877011'],
  'condition-refurbished': ['p_n_condition-type', '1248878111'],
  'condition-collectible': ['p_n_condition-type', '1248878011'],

  // Other filters
  'prime-only':        ['p_n_prime',               '1'],
  'free-shipping':     ['p_n_shipping',            'free'],
  'in-stock':          ['p_n_availability',        '2661601011'],
  'coupons':           ['p_n_coupon',              '1'],
  'lightning-deals':   ['p_n_deal_type',           '23566065011'],
  'todays-deals':      ['p_n_deal_type',           '23566065011'],
  'subscribe-save':    ['p_n_feature_browse-bin',  '15283820011'],
  'amazon-choice':     ['p_n_feature_browse-bin',  '14826373011'],
  'best-seller':       ['p_n_feature_browse-bin',  '14826383011'],
  'fba-only':          ['p_n_feature_browse-bin',  '14674966011'],
  'free-returns':      ['p_n_feature_browse-bin',  '14674972011'],
  'gift-wrap':         ['p_n_feature_browse-bin',  '14674970011'],
  'small-business':    ['p_n_feature_browse-bin',  '14674977011'],
  'amazon-brands':     ['p_n_feature_browse-bin',  '14674969011'],
  'low-rating':        ['p_n_feature_browse-bin',  '14674975011'],
  'coupon-only':       ['p_n_coupon',              '1'],
  'warehouse-refurb':  ['p_n_feature_browse-bin',  '14674978011']
};


Object.entries(FILTER_DEFS).forEach(([field, [param, val]]) => {
  if (data.get(field) === 'on') {
    rh.push(`${param}:${val}`);
  }
});

  // ─── AI-DRIVEN FILTERS ───
  // Buy-Now-or-Wait Score
  if (data.get('predictive-score') === 'on') {
    rh.push('p_n_predictive-score:1');
  }
  // Restock Forecasts (ASIN)
  const restockASIN = data.get('restock-forecast')?.trim();
  if (restockASIN) {
    params.set('restock_asin', restockASIN);
  }
  // Emotion-Feedback Loop
  if (data.get('emotion-feedback') === 'on') {
    rh.push('p_n_emotion-feedback:1');
  }

  // ─── continue with percentage-off, price range, etc. ───

// percentage-off dropdown
const pct = data.get('percent-off');
const PCT_MAP = {
  10:'2665401011',20:'2665412011',30:'2665413011',
  40:'2665414011',50:'2665415011',60:'2665416011',
  70:'2665417011',80:'2665418011'
};
if (PCT_MAP[pct]) rh.push(`p_n_pct-off-with-tax:${PCT_MAP[pct]}`);

// price range
const min = data.get('min-price')?.trim(),
      max = data.get('max-price')?.trim();
if      (min && max) rh.push(`p_36:${Math.round(min*100)}-${Math.round(max*100)}`);
else if (min)        rh.push(`p_36:${Math.round(min*100)}-`);
else if (max)        rh.push(`p_36:-${Math.round(max*100)}`);
    
// Deal-Hunter Goodies: discounts vs 30/60/90-day avg, and volatility
const d30 = data.get('below-avg-30')?.trim();
if (d30) rh.push(`p_n_discount_30day:${Math.round(d30)}`);

const d60 = data.get('below-avg-60')?.trim();
if (d60) rh.push(`p_n_discount_60day:${Math.round(d60)}`);

const d90 = data.get('below-avg-90')?.trim();
if (d90) rh.push(`p_n_discount:${Math.round(d90)}`);

const vol = data.get('max-volatility-7')?.trim();
if (vol) rh.push(`p_n_price-volatility:${Math.round(vol)}`);

// ✅ Brand Inclusion Logic
const rawInclude = data.get('brand-include')?.trim();
if (rawInclude) {
  let brands = [];

  // Tagify may output JSON or a comma-list; try both
  try {
    brands = JSON.parse(rawInclude).map(o => o.value.trim());
  } catch {
    brands = rawInclude.split(',').map(s => s.trim());
  }

  brands
    .filter(b => b)
    .forEach(b => rh.push(`p_89:${encodeURIComponent(b)}`));
}


// Brand Exclusion (for your NOT logic)
const rawExclude = data.get('brand-exclude')?.trim();
if (rawExclude) {
  let exclude = [];
  try {
    exclude = JSON.parse(rawExclude).map(o => o.value.trim());
  } catch {
    exclude = rawExclude.split(',').map(s => s.trim());
  }
  // …then use exclude for your NOT or client-side prune…
}



// now your brand-include/brand-exclude, boolean, field-filters, asin lookup, sort, query…
if (data.get('enable-boolean') === 'on') params.set('boolean','on');
const fields = data.get('field-filters')?.trim();
if (fields) params.set('fields', fields);
const asin = data.get('direct-lookup')?.trim();
if (asin)   params.set('asin', asin);

const sort = data.get('sort');
if (sort) params.set('s', sort);

const q = data.get('q')?.trim();
if (q) params.set('k', q);

if (rh.length) params.set('rh', rh.join(','));
params.set('tag','echolover25-20');

const finalUrl = `https://www.amazon.com/s?${params.toString()}`;
window.open(finalUrl, '_blank');

  });
});
