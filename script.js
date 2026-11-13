/* =========================================================
   Zushioda – script.js
   Fitur: 1) Cari & filter menu  2) Keranjang pesanan
          3) Kuis rekomendasi    4) Game Sushi Catcher
          5) Slider ulasan + rating
   ========================================================= */
'use strict';

/* ---------- DATA MENU (gambar sesuai nama menu) ---------- */
const MENU = [
  { id: 1, name: 'Crunchy Spicy Salmon', cat: 'sushi', price: 38000, img: 'crunchy-spicy-salmon.svg',
    desc: 'Roll salmon pedas dengan taburan renyah di atasnya.' },
  { id: 2, name: 'Salmon Nigiri', cat: 'sushi', price: 30000, img: 'salmon-nigiri.svg',
    desc: 'Irisan salmon segar di atas nasi sushi.' },
  { id: 3, name: 'Sashimi Moriawase', cat: 'sushi', price: 65000, img: 'sashimi.svg',
    desc: 'Sashimi salmon & tuna dengan lobak dan wasabi.' },
  { id: 4, name: 'California Roll', cat: 'sushi', price: 32000, img: 'california-roll.svg',
    desc: 'Roll isi crab, timun dan alpukat dengan tobiko.' },
  { id: 5, name: 'Miso Ramen', cat: 'ramen', price: 42000, img: 'miso-ramen.svg',
    desc: 'Ramen kuah miso hangat dengan chashu, telur & jagung.' },
  { id: 6, name: 'Tori Katsu Curry', cat: 'ramen', price: 40000, img: 'tori-katsu-curry.svg',
    desc: 'Nasi dengan ayam katsu renyah dan saus kari Jepang.' },
  { id: 7, name: 'Kopi Laki Bini', cat: 'minuman', price: 22000, img: 'kopi-laki-bini.svg',
    desc: 'Kopi susu dingin berlapis, manis dan creamy.' },
  { id: 8, name: 'Lemon Tea', cat: 'minuman', price: 15000, img: 'lemon-tea.svg',
    desc: 'Teh dingin dengan irisan lemon yang menyegarkan.' }
];

/* ---------- UTIL ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rupiah = n => 'Rp' + n.toLocaleString('id-ID');
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

/* ---------- NAVBAR & STATUS BUKA ---------- */
$('#burger').addEventListener('click', () => $('#navLinks').classList.toggle('show'));
$$('#navLinks a').forEach(a => a.addEventListener('click', () => $('#navLinks').classList.remove('show')));
$('#year').textContent = new Date().getFullYear();

function updateOpenBadge() {
  const wib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const h = wib.getHours() + wib.getMinutes() / 60;
  const open = h >= 10 && h < 22;
  const b = $('#openBadge');
  b.className = 'open-badge ' + (open ? 'open' : 'closed');
  b.textContent = open ? '🟢 Sedang buka · tutup 22.00 WIB' : '🔴 Sedang tutup · buka 10.00 WIB';
}
updateOpenBadge();
setInterval(updateOpenBadge, 60000);

/* =========================================================
   FITUR 1: CARI & FILTER MENU
   ========================================================= */
let activeFilter = 'all';
function renderMenu() {
  const q = $('#search').value.trim().toLowerCase();
  const list = MENU.filter(m =>
    (activeFilter === 'all' || m.cat === activeFilter) &&
    (m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)));
  const grid = $('#menuGrid');
  if (!list.length) { grid.innerHTML = '<p class="empty">Menu tidak ditemukan 🍣</p>'; return; }
  grid.innerHTML = list.map((m, i) => `
    <article class="card" style="animation-delay:${i * 60}ms">
      <img src="${m.img}" alt="${m.name}" loading="lazy">
      <div class="card-body">
        <h3>${m.name}</h3>
        <p>${m.desc}</p>
        <div class="card-foot">
          <span class="price">${rupiah(m.price)}</span>
          <button class="add" data-id="${m.id}">+ Tambah</button>
        </div>
      </div>
    </article>`).join('');
}
$('#search').addEventListener('input', renderMenu);
$('#filters').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  $$('.chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  activeFilter = c.dataset.filter;
  renderMenu();
});
renderMenu();

/* =========================================================
   FITUR 2: KERANJANG PESANAN
   ========================================================= */
let cart = store.get('zushioda-cart', {});
function saveCart() { store.set('zushioda-cart', cart); }
function cartTotals() {
  let count = 0, total = 0;
  for (const [id, q] of Object.entries(cart)) {
    const m = MENU.find(x => x.id == id); if (!m) continue;
    count += q; total += q * m.price;
  }
  return { count, total };
}
function renderCart() {
  const box = $('#cartItems');
  const ids = Object.keys(cart).filter(id => MENU.some(m => m.id == id));
  if (!ids.length) box.innerHTML = '<p class="cart-empty">Keranjang masih kosong 🛒</p>';
  else box.innerHTML = ids.map(id => {
    const m = MENU.find(x => x.id == id);
    return `<div class="ci">
      <img src="${m.img}" alt="${m.name}">
      <div class="ci-info"><b>${m.name}</b>${rupiah(m.price)}</div>
      <div class="qty">
        <button data-act="dec" data-id="${id}">−</button>
        <span>${cart[id]}</span>
        <button data-act="inc" data-id="${id}">+</button>
      </div></div>`;
  }).join('');
  const t = cartTotals();
  $('#cartCount').textContent = t.count;
  $('#cartTotal').textContent = rupiah(t.total);
}
function addToCart(id, n = 1) {
  cart[id] = (cart[id] || 0) + n;
  if (cart[id] <= 0) delete cart[id];
  saveCart(); renderCart();
}
$('#menuGrid').addEventListener('click', e => {
  const b = e.target.closest('.add'); if (!b) return;
  addToCart(b.dataset.id);
  toast('Ditambahkan: ' + MENU.find(m => m.id == b.dataset.id).name);
});
$('#cartItems').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  addToCart(b.dataset.id, b.dataset.act === 'inc' ? 1 : -1);
});
const drawer = (open) => {
  $('#drawer').classList.toggle('show', open);
  $('#drawerBg').classList.toggle('show', open);
};
$('#cartOpen').addEventListener('click', () => drawer(true));
$('#cartClose').addEventListener('click', () => drawer(false));
$('#drawerBg').addEventListener('click', () => drawer(false));
$('#clearCart').addEventListener('click', () => { cart = {}; saveCart(); renderCart(); });
$('#copyOrder').addEventListener('click', async () => {
  const t = cartTotals();
  if (!t.count) return toast('Keranjang masih kosong');
  const lines = Object.entries(cart).map(([id, q]) => {
    const m = MENU.find(x => x.id == id);
    return `- ${m.name} x${q} = ${rupiah(m.price * q)}`;
  });
  const text = `Pesanan Zushioda\n${lines.join('\n')}\nTotal: ${rupiah(t.total)}`;
  try { await navigator.clipboard.writeText(text); toast('Pesanan disalin ✔'); }
  catch { prompt('Salin pesananmu:', text); }
});
renderCart();

/* =========================================================
   FITUR 3: KUIS REKOMENDASI MENU
   ========================================================= */
const QUIZ = [
  { q: 'Kamu lagi mood makan seperti apa?',
    o: [['Yang hangat dan berkuah', 'ramen'], ['Yang segar dan ringan', 'sushi'], ['Yang mengenyangkan', 'katsu'], ['Yang pedas dan renyah', 'spicy']] },
  { q: 'Kamu makan bersama siapa?',
    o: [['Sendiri, santai', 'ramen'], ['Pacar / gebetan', 'sushi'], ['Keluarga besar', 'katsu'], ['Teman nongkrong', 'spicy']] },
  { q: 'Pilih suasana favoritmu:',
    o: [['Hujan & mendung', 'ramen'], ['Sore yang cerah', 'sushi'], ['Lapar berat habis kerja', 'katsu'], ['Ngobrol sambil ngemil', 'spicy']] }
];
const RESULT = {
  ramen: { id: 5, drink: 'Lemon Tea', why: 'Kamu butuh kehangatan — semangkuk Miso Ramen paling pas!' },
  sushi: { id: 2, drink: 'Lemon Tea', why: 'Kamu suka yang segar dan elegan — coba Salmon Nigiri.' },
  katsu: { id: 6, drink: 'Kopi Laki Bini', why: 'Perut lapar? Tori Katsu Curry bikin kenyang dan puas.' },
  spicy: { id: 1, drink: 'Kopi Laki Bini', why: 'Kamu suka sensasi — Crunchy Spicy Salmon jawabannya!' }
};
let qi = 0, score = {};
function renderQuiz() {
  $('#quizResult').hidden = true;
  $('#quizQ').hidden = false; $('#quizOpts').hidden = false;
  $('#quizBar').style.width = (qi / QUIZ.length * 100) + '%';
  const cur = QUIZ[qi];
  $('#quizQ').textContent = `(${qi + 1}/${QUIZ.length}) ${cur.q}`;
  $('#quizOpts').innerHTML = cur.o.map(([t, k]) => `<button class="opt" data-k="${k}">${t}</button>`).join('');
}
function showResult() {
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
  const r = RESULT[best], m = MENU.find(x => x.id === r.id);
  $('#quizBar').style.width = '100%';
  $('#quizQ').hidden = true; $('#quizOpts').hidden = true;
  const box = $('#quizResult');
  box.hidden = false;
  box.innerHTML = `
    <img src="${m.img}" alt="${m.name}">
    <h3>${m.name}</h3>
    <p>${r.why}</p>
    <span class="pair">Pasangan minuman: ${r.drink}</span><br>
    <button class="btn btn-primary" id="quizAdd">Tambah ke keranjang</button>
    <button class="btn btn-ghost" id="quizRetry">Ulangi kuis</button>`;
  $('#quizAdd').onclick = () => { addToCart(m.id); toast('Ditambahkan: ' + m.name); };
  $('#quizRetry').onclick = () => { qi = 0; score = {}; renderQuiz(); };
}
$('#quizOpts').addEventListener('click', e => {
  const b = e.target.closest('.opt'); if (!b) return;
  score[b.dataset.k] = (score[b.dataset.k] || 0) + 1;
  qi++;
  qi < QUIZ.length ? renderQuiz() : showResult();
});
renderQuiz();

/* =========================================================
   FITUR 4: GAME – SUSHI CATCHER
   ========================================================= */
(() => {
  const canvas = $('#gameCanvas'), ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const overlay = $('#gameOverlay');
  const sprites = {};
  
  // DIPERBAIKI: Langsung mengambil file SVG dari direktori utama (tanpa folder 'images/')
  ['crunchy-spicy-salmon', 'salmon-nigiri', 'california-roll'].forEach(n => {
    const im = new Image(); im.src = `${n}.svg`; sprites[n] = im;
  });
  
  const GOOD = Object.keys(sprites);
  let best = store.get('zushioda-best', 0);
  $('#gBest').textContent = best;

  let running = false, score, lives, items, plate, spawnT, speedMul, last, keys = {};

  function reset() {
    score = 0; lives = 3; items = []; spawnT = 0; speedMul = 1;
    plate = { x: W / 2, y: H - 46, w: 110, h: 22 };
    updateHud();
  }
  function updateHud() {
    $('#gScore').textContent = score;
    $('#gLives').textContent = '❤'.repeat(Math.max(lives, 0)) || '–';
  }
  function spawn() {
    const bad = Math.random() < 0.22;
    const size = bad ? 38 : 64;
    items.push({
      bad, size,
      type: bad ? 'wasabi' : GOOD[Math.floor(Math.random() * GOOD.length)],
      x: size / 2 + Math.random() * (W - size),
      y: -size,
      vy: (110 + Math.random() * 70) * speedMul,
      rot: Math.random() * 6
    });
  }
  function drawPlate() {
    const { x, y, w } = plate;
    ctx.fillStyle = '#00000022'; ctx.beginPath(); ctx.ellipse(x, y + 20, w / 2, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#c8312f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, 16, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f3e6cf'; ctx.beginPath(); ctx.ellipse(x, y - 2, w / 2 - 14, 9, 0, 0, 7); ctx.fill();
  }
  function drawItem(it) {
    ctx.save(); ctx.translate(it.x, it.y);
    if (it.bad) {
      ctx.rotate(it.rot);
      ctx.fillStyle = '#6fb23a'; ctx.beginPath();
      ctx.moveTo(0, -20); ctx.bezierCurveTo(24, -18, 26, 12, 0, 20); ctx.bezierCurveTo(-26, 12, -24, -18, 0, -20); ctx.fill();
      ctx.fillStyle = '#9ad25b'; ctx.beginPath(); ctx.ellipse(-6, -6, 7, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.arc(-6, 2, 2.5, 0, 7); ctx.arc(6, 2, 2.5, 0, 7); ctx.fill();
    } else {
      const im = sprites[it.type];
      if (im && im.complete && im.naturalWidth !== 0) {
        ctx.drawImage(im, -it.size / 2 * 1.3, -it.size / 2, it.size * 1.3, it.size);
      } else {
        // Fallback jika gambar gagal dimuat agar game tidak crash/kosong
        ctx.fillStyle = '#e8a33d';
        ctx.beginPath(); ctx.arc(0, 0, it.size / 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawBg() {
    ctx.fillStyle = '#fdf1dd'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f3e1c1';
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(30 + i * 55, H - 8, 30, Math.PI, 0); ctx.fill(); }
  }
  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - last) / 1000, 0.05); last = ts;
    if (keys.ArrowLeft || keys.a) plate.x -= 420 * dt;
    if (keys.ArrowRight || keys.d) plate.x += 420 * dt;
    plate.x = Math.max(plate.w / 2, Math.min(W - plate.w / 2, plate.x));
    
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = Math.max(0.35, 0.95 - score / 400); }
    speedMul = 1 + score / 250;
    
    for (const it of items) it.y += it.vy * dt;
    items = items.filter(it => {
      const caught = it.y + it.size / 2 >= plate.y - 10 && it.y < plate.y + 8 &&
        Math.abs(it.x - plate.x) < plate.w / 2 + it.size / 3;
      if (caught) {
        if (it.bad) { lives--; toast('Aduh, wasabi! 😖'); } else score += 10;
        updateHud(); return false;
      }
      if (it.y - it.size > H) {
        if (!it.bad) { lives--; updateHud(); }
        return false;
      }
      return true;
    });
    
    drawBg(); items.forEach(drawItem); drawPlate();
    if (lives <= 0) return gameOver();
    requestAnimationFrame(loop);
  }
  function gameOver() {
    running = false;
    if (score > best) { best = score; store.set('zushioda-best', best); $('#gBest').textContent = best; }
    $('#gameTitle').textContent = 'Game Over!';
    $('#gameMsg').textContent = `Skor kamu ${score}. ${score >= best && score > 0 ? 'Rekor baru! 🎉' : 'Coba lagi!'}`;
    $('#gameStart').textContent = 'Main lagi';
    overlay.classList.remove('hide');
  }
  function start() {
    reset(); running = true; last = performance.now();
    overlay.classList.add('hide');
    requestAnimationFrame(loop);
  }
  $('#gameStart').addEventListener('click', start);

  const moveTo = clientX => {
    if (!running) return;
    const r = canvas.getBoundingClientRect();
    plate.x = (clientX - r.left) * (W / r.width);
  };
  canvas.addEventListener('pointermove', e => moveTo(e.clientX));
  canvas.addEventListener('pointerdown', e => moveTo(e.clientX));
  
  window.addEventListener('keydown', e => {
    if (['ArrowLeft', 'ArrowRight'].includes(e.key) && running) e.preventDefault();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  reset(); drawBg(); drawPlate();
})();

/* =========================================================
   FITUR 5: SLIDER ULASAN + RATING
   ========================================================= */
const REVIEWS = [
  { name: 'Devina W.', stars: 5, text: 'Desain restonya bagus banget, ternyata pemiliknya seorang arsitek! Variasi menunya banyak dengan harga yang pas.' },
  { name: 'Puji W.', stars: 5, text: 'Crunchy Spicy Salmon-nya enak, rasanya nggak ada duanya. Minumannya juga segar, terutama lemon tea.' },
  { name: 'Pengunjung dari Jakarta', stars: 4, text: 'Tempatnya nyaman, makanan oke, pelayanan baik. Cocok untuk pelajar yang mau mengerjakan tugas sambil makan.' },
  { name: 'Reviewer Kesambi', stars: 5, text: 'Suasananya enak dan ramah keluarga, harganya terjangkau. Miso Ramen dan Tori Katsu Curry wajib dicoba!' }
];
let ri = 0, rTimer;
function renderReview() {
  const r = REVIEWS[ri];
  $('#slide').innerHTML = `
    <div class="stars-s">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</div>
    <p>“${r.text}”</p><small>— ${r.name}</small>`;
  $('#dots').innerHTML = REVIEWS.map((_, i) => `<button class="dot ${i === ri ? 'active' : ''}" data-i="${i}" aria-label="Ulasan ${i + 1}"></button>`).join('');
}
function goReview(i) {
  ri = (i + REVIEWS.length) % REVIEWS.length;
  renderReview(); restartAuto();
}
function restartAuto() { clearInterval(rTimer); rTimer = setInterval(() => goReview(ri + 1), 6000); }
$('#prevT').addEventListener('click', () => goReview(ri - 1));
$('#nextT').addEventListener('click', () => goReview(ri + 1));
$('#dots').addEventListener('click', e => { const d = e.target.closest('.dot'); if (d) goReview(+d.dataset.i); });
renderReview(); restartAuto();

let myRate = store.get('zushioda-rate', 0);
const RATE_TXT = ['', 'Maaf ya 🙏', 'Kurang puas? Kami perbaiki.', 'Lumayan!', 'Senang kamu suka! 😊', 'Luar biasa, terima kasih! 🎉'];
function renderStars(hover = 0) {
  $('#stars').innerHTML = [1, 2, 3, 4, 5].map(n =>
    `<button class="star ${n <= (hover || myRate) ? 'on' : ''}" data-n="${n}" aria-label="${n} bintang">★</button>`).join('');
  $('#rateMsg').textContent = myRate ? `Ratingmu: ${myRate}/5 — ${RATE_TXT[myRate]}` : 'Belum ada rating.';
}
$('#stars').addEventListener('click', e => {
  const s = e.target.closest('.star'); if (!s) return;
  myRate = +s.dataset.n; store.set('zushioda-rate', myRate); renderStars();
});
const paintStars = n => $$('.star').forEach((s, i) => s.classList.toggle('on', i < n));
$('#stars').addEventListener('mouseover', e => { const s = e.target.closest('.star'); if (s) paintStars(+s.dataset.n); });
$('#stars').addEventListener('mouseleave', () => paintStars(myRate));
renderStars();