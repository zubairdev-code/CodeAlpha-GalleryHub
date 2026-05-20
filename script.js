const DEFAULT_PHOTOS = [
  { id:1,  title:'Misty Peaks',     cat:'nature',       src:'https://picsum.photos/seed/peak1/600/800',   desc:'Morning fog rolls over the mountain valleys.', added: Date.now()-86400000*10, fav:false },
  { id:2,  title:'Glass Tower',     cat:'architecture', src:'https://picsum.photos/seed/arch2/600/700',   desc:'Reflective glass facade at dusk.',             added: Date.now()-86400000*9,  fav:false },
  { id:3,  title:'Golden Hour',     cat:'nature',       src:'https://picsum.photos/seed/gold3/600/600',   desc:'Warm light just before sunset.',               added: Date.now()-86400000*8,  fav:false },
  { id:4,  title:'Urban Silence',   cat:'architecture', src:'https://picsum.photos/seed/urb4/600/900',    desc:'Empty street in the early hours.',             added: Date.now()-86400000*7,  fav:false },
  { id:5,  title:'Reverie',         cat:'portrait',     src:'https://picsum.photos/seed/port5/600/750',   desc:'A quiet, contemplative moment.',               added: Date.now()-86400000*6,  fav:false },
  { id:6,  title:'Chromatic Drift', cat:'abstract',     src:'https://picsum.photos/seed/abs6/600/600',    desc:'Colours bleed into one another.',              added: Date.now()-86400000*5,  fav:true  },
  { id:7,  title:'Santorini Blue',  cat:'travel',       src:'https://picsum.photos/seed/trav7/600/800',   desc:'Iconic whitewashed walls against cobalt skies.',added: Date.now()-86400000*4,  fav:false },
  { id:8,  title:'Forest Breath',   cat:'nature',       src:'https://picsum.photos/seed/fst8/600/700',    desc:'The quiet hush of an ancient forest.',         added: Date.now()-86400000*3,  fav:false },
  { id:9,  title:'Brutalist',       cat:'architecture', src:'https://picsum.photos/seed/brut9/600/650',   desc:'Raw concrete as a statement.',                 added: Date.now()-86400000*2,  fav:false },
  { id:10, title:'Gaze',            cat:'portrait',     src:'https://picsum.photos/seed/gaz10/600/800',   desc:'Eyes that hold entire worlds.',                added: Date.now()-86400000*1,  fav:false },
  { id:11, title:'Neon Bloom',      cat:'abstract',     src:'https://picsum.photos/seed/neo11/600/600',   desc:'Fluorescent light fragmented and scattered.',  added: Date.now(),             fav:true  },
  { id:12, title:'Kyoto Path',      cat:'travel',       src:'https://picsum.photos/seed/kyo12/600/900',   desc:'Moss-covered stone in an ancient garden.',     added: Date.now()+1000,        fav:false },
];

function loadPhotos() {
  try {
    const s = localStorage.getItem('lumiere_photos_v2');
    if (s) return JSON.parse(s);
  } catch(e) {}
  return DEFAULT_PHOTOS.map(p => ({...p}));
}
function savePhotos() {
  try { localStorage.setItem('lumiere_photos_v2', JSON.stringify(photos)); }
  catch(e) { showToast('Storage quota exceeded — image not saved permanently.', 'error'); }
}

let photos = loadPhotos();
let nextId = photos.reduce((m,p) => Math.max(m, p.id), 0) + 1;
let activeCategory = 'all';
let searchQuery    = '';
let sortMode       = 'default';
let showFavsOnly   = false;
let currentCols    = '4';
let lightboxPhotos = [];
let lightboxIndex  = 0;
let pendingFiles   = [];
let zoomed         = false;

/* ════════════════════════════════════════════
   2.  DOM
════════════════════════════════════════════ */
const gallery        = document.getElementById('gallery');
const galleryCount   = document.getElementById('galleryCount');
const emptyState     = document.getElementById('emptyState');
const emptyMsg       = document.getElementById('emptyMsg');
const emptyAddBtn    = document.getElementById('emptyAddBtn');
const footerCount    = document.getElementById('footerCount');
const filterBar      = document.getElementById('filterBar');
const sortSelect     = document.getElementById('sortSelect');
const lightbox       = document.getElementById('lightbox');
const lbImg          = document.getElementById('lbImg');
const lbTitle        = document.getElementById('lbTitle');
const lbCat          = document.getElementById('lbCat');
const lbCounter      = document.getElementById('lbCounter');
const lbDesc         = document.getElementById('lbDesc');
const lbClose        = document.getElementById('lbClose');
const lbPrev         = document.getElementById('lbPrev');
const lbNext         = document.getElementById('lbNext');
const lbZoom         = document.getElementById('lbZoom');
const lbDownload     = document.getElementById('lbDownload');
const lbFavBtn       = document.getElementById('lbFav');
const addModal       = document.getElementById('addModal');
const modalClose     = document.getElementById('modalClose');
const uploadBtn      = document.getElementById('uploadBtn');
const fileInput      = document.getElementById('fileInput');
const dropZone       = document.getElementById('dropZone');
const previewArea    = document.getElementById('previewArea');
const imgForm        = document.getElementById('imgForm');
const imgTitle       = document.getElementById('imgTitle');
const imgCategory    = document.getElementById('imgCategory');
const imgDesc        = document.getElementById('imgDesc');
const addConfirmBtn  = document.getElementById('addConfirmBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar    = document.getElementById('progressBar');
const searchWrap     = document.getElementById('searchWrap');
const searchInput    = document.getElementById('searchInput');
const searchToggle   = document.getElementById('searchToggle');
const favToggle      = document.getElementById('favToggle');
const titleCharCount = document.getElementById('titleCharCount');

/* ════════════════════════════════════════════
   3.  RENDER
════════════════════════════════════════════ */

function getFilteredSorted() {
  let list = [...photos];
  // Favs-only
  if (showFavsOnly) list = list.filter(p => p.fav);
  // Category
  if (activeCategory !== 'all') list = list.filter(p => p.cat === activeCategory);
  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      (p.desc||'').toLowerCase().includes(q)
    );
  }
  // Sort
  switch(sortMode) {
    case 'title-asc':  list.sort((a,b) => a.title.localeCompare(b.title)); break;
    case 'title-desc': list.sort((a,b) => b.title.localeCompare(a.title)); break;
    case 'cat-asc':    list.sort((a,b) => a.cat.localeCompare(b.cat));     break;
    case 'date-desc':  list.sort((a,b) => (b.added||0)-(a.added||0));     break;
    case 'date-asc':   list.sort((a,b) => (a.added||0)-(b.added||0));     break;
  }
  return list;
}

function updateFilterCounts() {
  const cats = ['all','nature','architecture','portrait','abstract','travel','other'];
  cats.forEach(cat => {
    const el = document.getElementById('cnt-'+cat);
    if (!el) return;
    const n = cat === 'all' ? photos.length : photos.filter(p=>p.cat===cat).length;
    el.textContent = n;
  });
}

function renderGallery() {
  gallery.innerHTML = '';
  updateFilterCounts();

  lightboxPhotos = getFilteredSorted();
  const total = photos.length;
  const shown = lightboxPhotos.length;

  galleryCount.textContent = shown === total
    ? `${total} photo${total!==1?'s':''}`
    : `${shown} of ${total} photo${total!==1?'s':''}`;
  footerCount.textContent = `${total} photo${total!==1?'s':''}`;

  if (shown === 0) {
    emptyState.style.display = 'flex';
    emptyMsg.textContent = searchQuery
      ? `No results for "${searchQuery}"`
      : showFavsOnly
        ? 'No favourites yet — star some photos!'
        : 'No photos in this category';
    return;
  }
  emptyState.style.display = 'none';

  lightboxPhotos.forEach((photo, i) => gallery.appendChild(createGalleryItem(photo, i)));
}

function createGalleryItem(photo, index) {
  const item = document.createElement('div');
  item.className = 'gallery-item' + (photo.fav ? ' is-fav' : '');
  item.dataset.id = photo.id;

  const isList = currentCols === 'list';

  item.innerHTML = `
    <img src="${photo.src}" alt="${escapeHtml(photo.title)}" loading="lazy" />
    ${isList ? '' : `<div class="overlay">
      <div class="overlay-title">${escapeHtml(photo.title)}</div>
      <div class="overlay-cat">${escapeHtml(photo.cat)}</div>
    </div>`}
    <div class="fav-badge" title="Favourite">★</div>
    <div class="card-actions">
      <button class="card-action-btn fav${photo.fav?' active':''}" title="${photo.fav?'Unfavourite':'Favourite'}">★</button>
      <button class="card-action-btn delete" title="Remove">✕</button>
    </div>
    ${isList ? `<div class="list-info">
      <span class="list-title">${escapeHtml(photo.title)}</span>
      <span class="list-cat">${escapeHtml(photo.cat)}</span>
      <span class="list-date">${new Date(photo.added||Date.now()).toLocaleDateString()}</span>
    </div>` : ''}
  `;

  item.addEventListener('click', e => {
    if (e.target.closest('.card-actions')) return;
    openLightbox(index);
  });
  item.querySelector('.card-action-btn.fav').addEventListener('click', e => {
    e.stopPropagation();
    toggleFav(photo.id);
  });
  item.querySelector('.card-action-btn.delete').addEventListener('click', e => {
    e.stopPropagation();
    deletePhoto(photo.id);
  });

  return item;
}

function deletePhoto(id) {
  const photo = photos.find(p=>p.id===id);
  photos = photos.filter(p=>p.id!==id);
  savePhotos();
  renderGallery();
  showToast(`"${photo?.title||'Photo'}" removed`, 'info');
}

function toggleFav(id) {
  const p = photos.find(x=>x.id===id);
  if (!p) return;
  p.fav = !p.fav;
  savePhotos();
  renderGallery();
  // update lightbox fav button if open
  if (lightbox.classList.contains('open')) {
    const cur = lightboxPhotos[lightboxIndex];
    if (cur && cur.id === id) updateLbFavBtn(p.fav);
  }
  showToast(p.fav ? '★ Added to favourites' : 'Removed from favourites', 'info');
}

/* ════════════════════════════════════════════
   4.  FILTER / SEARCH / SORT
════════════════════════════════════════════ */

filterBar.addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  activeCategory = btn.dataset.cat;
  renderGallery();
});

searchToggle.addEventListener('click', () => {
  searchWrap.classList.toggle('visible');
  if (searchWrap.classList.contains('visible')) searchInput.focus();
  else { searchInput.value=''; searchQuery=''; renderGallery(); }
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim();
  renderGallery();
});

sortSelect.addEventListener('change', () => {
  sortMode = sortSelect.value;
  renderGallery();
});

favToggle.addEventListener('click', () => {
  showFavsOnly = !showFavsOnly;
  favToggle.style.color = showFavsOnly ? 'var(--accent)' : '';
  favToggle.style.borderColor = showFavsOnly ? 'var(--accent)' : '';
  renderGallery();
});

/* View toggle */
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentCols = btn.dataset.cols;
    gallery.className = 'gallery' + (currentCols==='list'?' grid-list' : currentCols!=='4'?` grid-${currentCols}`:'');
    renderGallery();
  });
});

emptyAddBtn.addEventListener('click', openModal);

/* ════════════════════════════════════════════
   5.  LIGHTBOX
════════════════════════════════════════════ */

function openLightbox(index) {
  lightboxIndex = index;
  updateLightboxDisplay();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  if (zoomed) unzoom();
}
function updateLightboxDisplay() {
  const photo = lightboxPhotos[lightboxIndex];
  if (!photo) return;
  lbImg.style.animation = 'none';
  lbImg.offsetHeight;
  lbImg.style.animation = '';
  lbImg.src = photo.src;
  lbImg.alt = photo.title;
  lbTitle.textContent   = photo.title;
  lbCat.textContent     = photo.cat;
  lbCounter.textContent = `${lightboxIndex+1} / ${lightboxPhotos.length}`;
  lbDesc.textContent    = photo.desc || '';
  updateLbFavBtn(photo.fav);
  if (zoomed) unzoom();
}
function updateLbFavBtn(isFav) {
  lbFavBtn.classList.toggle('active', !!isFav);
  lbFavBtn.title = isFav ? 'Unfavourite (F)' : 'Favourite (F)';
}
function lightboxPrev() { lightboxIndex=(lightboxIndex-1+lightboxPhotos.length)%lightboxPhotos.length; updateLightboxDisplay(); }
function lightboxNext() { lightboxIndex=(lightboxIndex+1)%lightboxPhotos.length; updateLightboxDisplay(); }

lbClose.addEventListener('click', closeLightbox);
lbPrev.addEventListener('click', lightboxPrev);
lbNext.addEventListener('click', lightboxNext);
lightbox.addEventListener('click', e => { if(e.target===lightbox) closeLightbox(); });

// Touch swipe
let touchStartX = 0;
lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, {passive:true});
lightbox.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) { dx < 0 ? lightboxNext() : lightboxPrev(); }
});

// Zoom
function unzoom() { zoomed=false; lbImg.classList.remove('zoomed'); lbImg.classList.add('zoomable'); lbZoom.classList.remove('active'); }
lbImg.addEventListener('click', () => {
  zoomed = !zoomed;
  lbImg.classList.toggle('zoomed', zoomed);
  lbImg.classList.toggle('zoomable', !zoomed);
  lbZoom.classList.toggle('active', zoomed);
});
lbZoom.addEventListener('click', () => {
  zoomed = !zoomed;
  lbImg.classList.toggle('zoomed', zoomed);
  lbImg.classList.toggle('zoomable', !zoomed);
  lbZoom.classList.toggle('active', zoomed);
});

// Download
lbDownload.addEventListener('click', async () => {
  const photo = lightboxPhotos[lightboxIndex];
  if (!photo) return;

  try {
    const response = await fetch(photo.src);
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${photo.title}.jpg`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    showToast('Download started', 'success');

  } catch (err) {
    console.error(err);
    showToast('Unable to download image', 'error');
  }
});

// Fav from lightbox
lbFavBtn.addEventListener('click', () => {
  const photo = lightboxPhotos[lightboxIndex];
  if (photo) toggleFav(photo.id);
});

// Keyboard
document.addEventListener('keydown', e => {
  if (lightbox.classList.contains('open')) {
    if (e.key==='ArrowLeft')  { lightboxPrev(); return; }
    if (e.key==='ArrowRight') { lightboxNext(); return; }
    if (e.key==='Escape')     { closeLightbox(); return; }
    if (e.key.toLowerCase()==='f') { const p=lightboxPhotos[lightboxIndex]; if(p) toggleFav(p.id); return; }
    if (e.key.toLowerCase()==='z') { lbImg.click(); return; }
    if (e.key.toLowerCase()==='d') { lbDownload.click(); return; }
  }
  if (addModal.classList.contains('open') && e.key==='Escape') closeModal();
});

/* ════════════════════════════════════════════
   6.  ADD IMAGE MODAL
════════════════════════════════════════════ */

function openModal() {
  resetModal();
  addModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  addModal.classList.remove('open');
  document.body.style.overflow = '';
  resetModal();
}
function resetModal() {
  pendingFiles = [];
  previewArea.innerHTML = '';
  imgForm.style.display = 'none';
  imgTitle.value = '';
  imgCategory.value = 'nature';
  imgDesc.value = '';
  fileInput.value = '';
  titleCharCount.textContent = '0 / 80';
  uploadProgress.classList.remove('visible');
  progressBar.style.width = '0%';
}

uploadBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
addModal.addEventListener('click', e => { if(e.target===addModal) closeModal(); });

imgTitle.addEventListener('input', () => {
  titleCharCount.textContent = `${imgTitle.value.length} / 80`;
});

/* File input */
fileInput.addEventListener('change', e => handleFiles(Array.from(e.target.files)));

/* Drag & drop */
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/'));
  if (!files.length) { showToast('No image files detected', 'error'); return; }
  handleFiles(files);
});

function handleFiles(files) {
  if (!files.length) return;
  files.forEach(file => {
    const url = URL.createObjectURL(file);
    pendingFiles.push({file, previewUrl: url});

    const wrap = document.createElement('div');
    wrap.className = 'preview-thumb-wrap';
    const thumb = document.createElement('img');
    thumb.src = url;
    thumb.className = 'preview-thumb';
    thumb.alt = file.name;
    const rmBtn = document.createElement('button');
    rmBtn.className = 'remove-preview';
    rmBtn.textContent = '✕';
    rmBtn.title = 'Remove';
    rmBtn.addEventListener('click', () => {
      const idx = pendingFiles.findIndex(p=>p.previewUrl===url);
      if (idx>-1) { URL.revokeObjectURL(url); pendingFiles.splice(idx,1); }
      wrap.remove();
      if (!pendingFiles.length) imgForm.style.display = 'none';
    });
    wrap.appendChild(thumb);
    wrap.appendChild(rmBtn);
    previewArea.appendChild(wrap);
  });
  if (!imgTitle.value && pendingFiles.length) {
    const name = pendingFiles[0].file.name.replace(/\.[^.]+$/,'');
    imgTitle.value = toTitleCase(name.replace(/[-_]/g,' '));
    titleCharCount.textContent = `${imgTitle.value.length} / 80`;
  }
  imgForm.style.display = 'flex';
}

addConfirmBtn.addEventListener('click', async () => {
  if (!pendingFiles.length) { showToast('Please select at least one image', 'error'); return; }
  const title    = imgTitle.value.trim() || 'Untitled';
  const category = imgCategory.value;
  const desc     = imgDesc.value.trim();

  addConfirmBtn.textContent = 'Adding…';
  addConfirmBtn.disabled = true;
  uploadProgress.classList.add('visible');

  try {
    for (let i=0; i<pendingFiles.length; i++) {
      progressBar.style.width = `${((i+1)/pendingFiles.length)*100}%`;
      const {file, previewUrl} = pendingFiles[i];
      const photoTitle = pendingFiles.length===1 ? title : `${title} ${i+1}`;
      const base64 = await fileToBase64(file);
      photos.push({ id:nextId++, title:photoTitle, cat:category, src:base64, desc, added:Date.now(), fav:false });
      URL.revokeObjectURL(previewUrl);
    }
    savePhotos();
    renderGallery();
    closeModal();
    if (activeCategory!=='all' && activeCategory!==category) {
      document.querySelector('.filter-btn[data-cat="all"]').click();
    }
    showToast(`${pendingFiles.length===1?'Photo':'Photos'} added to gallery`, 'success');
  } catch(err) {
    console.error(err);
    showToast('Error adding image(s). Please try again.', 'error');
  } finally {
    addConfirmBtn.textContent = 'Add to Gallery';
    addConfirmBtn.disabled = false;
    uploadProgress.classList.remove('visible');
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════
   7.  TOAST
════════════════════════════════════════════ */
function showToast(msg, type='info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type==='success'?'✓' : type==='error'?'✕' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 320);
  }, 2800);
}

/* ════════════════════════════════════════════
   8.  HELPERS
════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toTitleCase(str) {
  return str.replace(/\b\w/g, c=>c.toUpperCase());
}


renderGallery();