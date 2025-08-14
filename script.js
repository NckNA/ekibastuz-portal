/* globals L */
const map = L.map('leafletMap');
const ekibastuz = [51.729, 75.322];
map.setView(ekibastuz, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

const companyListEl = document.getElementById('companyList');
const listingListEl = document.getElementById('listingList');
const statCompanies = document.getElementById('statCompanies');
const statListings = document.getElementById('statListings');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

// Debounce helper
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// Load data
Promise.all([
  fetch('data/companies.json').then(r => r.json()),
  fetch('data/listings.json').then(r => r.json())
]).then(([companies, listings]) => {
  statCompanies.textContent = companies.length;
  statListings.textContent = listings.length;

  // Map markers
  const markers = [];
  companies.forEach(c => {
    const m = L.marker([c.lat, c.lng]).addTo(map);
    m.bindPopup(`
      <div class="small">
        <div class="fw-bold">${c.name}</div>
        <div class="text-muted">${c.category}</div>
        <div>${c.address}</div>
        <div><a href="tel:${c.phone}">${c.phone}</a></div>
        <div>${c.hours || ''}</div>
        <div class="mt-2"><a href="${c.website}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Сайт компании</a></div>
      </div>
    `);
    markers.push({ marker: m, data: c });
  });

  // Render companies
  function renderCompanies(filterCategory = '', searchQuery = '') {
    companyListEl.innerHTML = '';
    const q = searchQuery.trim().toLowerCase();
    const filtered = companies.filter(c => {
      const byCat = !filterCategory || c.category === filterCategory;
      const byName = !q || c.name.toLowerCase().includes(q);
      return byCat && byName;
    });
    filtered.forEach(c => {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      col.innerHTML = `
        <div class="card card-hover h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h3 class="h6 fw-bold mb-0">${c.name}</h3>
              <span class="badge rounded-pill text-bg-secondary">${c.category}</span>
            </div>
            <div class="small text-muted">${c.address}</div>
            <div class="mt-2"><a href="tel:${c.phone}" class="link-body-emphasis">${c.phone}</a></div>
            <div class="mt-2">${c.hours || ''}</div>
            <div class="mt-3 d-flex gap-2">
              <a href="${c.website}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-up-right-from-square me-1"></i>Сайт</a>
              <button class="btn btn-sm btn-outline-secondary" data-focus="${c.name}"><i class="fa-solid fa-location-dot me-1"></i>На карте</button>
            </div>
          </div>
        </div>
      `;
      companyListEl.appendChild(col);
    });

    // Focus button behavior
    companyListEl.querySelectorAll('button[data-focus]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-focus');
        const c = companies.find(x => x.name === name);
        if (!c) return;
        map.setView([c.lat, c.lng], 14);
        const mm = markers.find(m => m.data.name === name);
        if (mm) mm.marker.openPopup();
        document.getElementById('map').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Toggle marker visibility
    markers.forEach(({ marker, data }) => {
      const visible = filtered.includes(data);
      if (visible) marker.addTo(map);
      else map.removeLayer(marker);
    });
  }

  // Render listings
  function renderListings(category = '') {
    listingListEl.innerHTML = '';
    const filtered = listings.filter(l => !category || l.category === category);
    filtered.forEach(l => {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      col.innerHTML = `
        <div class="card card-hover h-100">
          <div class="card-body">
            <span class="badge badge-cat badge-${l.category} mb-2">${l.category}</span>
            <h3 class="h6 fw-bold">${l.title}</h3>
            <div class="small text-muted">${l.description}</div>
            <div class="mt-2 fw-semibold">${l.price}</div>
            <div class="mt-2 small"><i class="fa-solid fa-phone me-1"></i><a href="tel:${l.phone}" class="link-body-emphasis">${l.phone}</a></div>
            <div class="mt-1 small text-muted">${l.date}</div>
          </div>
        </div>
      `;
      listingListEl.appendChild(col);
    });
  }

  // Initial render
  renderCompanies();
  renderListings();

  // Filters
  const companyCategory = document.getElementById('companyCategory');
  const companySearch = document.getElementById('companySearch');
  const listingCategory = document.getElementById('listingCategory');

  companyCategory.addEventListener('change', () => {
    renderCompanies(companyCategory.value, companySearch.value);
  });
  companySearch.addEventListener('input', debounce(() => {
    renderCompanies(companyCategory.value, companySearch.value);
  }, 300));

  listingCategory.addEventListener('change', () => {
    renderListings(listingCategory.value);
  });
}).catch(err => {
  console.error(err);
  alert('Ошибка загрузки данных');
});
