/* =====================================================================
 * TRẠNG THÁI TOÀN CỤC
 * ===================================================================== */
let CFG = null;                 // cấu hình lấy từ getConfig()
let TEACHERS = [];               // danh sách giáo viên
let TEACHER = null;               // giáo viên đang chọn
let COURSES = [];               // danh sách khoá học (đã chuẩn hoá) của giáo viên đang chọn
let COURSE = null;               // khoá học đang chọn (đã có layoutUrl/unitUrl)
let CUR_CATEGORY = 'all';         // tab danh mục đang lọc trên trang danh mục
let ALL_LEAVES = [];               // toàn bộ item bài học (để tìm kiếm)
let sbOpen = true;
let currentPlyr = null, currentHls = null;
let videoRenewTimer = null;       // timer tự gia hạn signed URL (CDN / grant-video)
let currentVideoResourceId = null; // resourceId đang phát (để renew)
let isUsingBackupData = false;
const COURSE_CACHE = {};          // cache danh sách khoá học theo teacher.key, tránh gọi lại API
const SAVED_LESSONS_KEY = 'dominic_saved_lessons_v1';
const COURSE_VIEW_KEY = 'dominic_course_view_v1';
const LOGO_URL = 'https://thayvanhoa.izteach.vn/_next/image?url=https%3A%2F%2Fd21acfi38wn3iy.cloudfront.net%2Fresource%2Fdocuments%2Ffd3ced5d-236b-4594-9969-de8c644bf4d7%2F1782527058397-dominic-ban-tam-thoi-png.png&w=1920&q=75';
let PENDING_SAVED_OPEN = null;
let COURSE_VIEW = localStorage.getItem(COURSE_VIEW_KEY) || '3';

// Khởi tạo các biến quản lý trạng thái tài liệu PDF trực tiếp
let currentPdfDoc = null, currentPdfScale = 1, isPdfRendering = false;

/* =====================================================================
 * THANH TIẾN TRÌNH TẢI TRANG
 * ===================================================================== */
let _progressTimer = null;
function startProgress() {
  const bar = document.getElementById('top-progress');
  clearInterval(_progressTimer);
  bar.classList.remove('finish');
  bar.style.width = '0%';
  void bar.offsetWidth;
  bar.classList.add('active');
  let w = 0;
  _progressTimer = setInterval(() => {
    w += (88 - w) / 14;
    bar.style.width = Math.min(w, 88).toFixed(1) + '%';
  }, 180);
}
function doneProgress() {
  clearInterval(_progressTimer);
  const bar = document.getElementById('top-progress');
  bar.classList.add('finish');
  bar.style.width = '100%';
  setTimeout(() => { bar.classList.remove('active', 'finish'); bar.style.width = '0%'; }, 420);
}

/* =====================================================================
 * CẤU HÌNH CHẠY TRỰC TIẾP TRÊN TRÌNH DUYỆT
 * Không phụ thuộc Google Apps Script để khởi động giao diện.
 * ===================================================================== */
const LOCAL_CONFIG = {
  videoBucket: 'https://media.izteach.vn/',
  docBucket: 'https://online-learning-izteach-6-aws-source-bucket.s3-ap-southeast-1.amazonaws.com/',
  apiBase: 'https://p9y4zl6vkd.execute-api.ap-southeast-1.amazonaws.com/prod',
  teachers: [
    {
      key: 'lieu',
      name: 'Cô Phạm Liễu',
      subject: 'Tiếng Anh',
      vendorId: '628c020f-d083-432d-af2b-5f2a78a14364',
      userId: '2fe1f486-3c88-448e-9f44-f389078468bc',
      coursesApi: 'https://p9y4zl6vkd.execute-api.ap-southeast-1.amazonaws.com/prod/course?authors=6407f86b87f9810008e1ffd9&visibleHidden=false&type=online&status=published&vendorId=628c020f-d083-432d-af2b-5f2a78a14364',
      resLabel: '1080p',
      streamFile: 'playlist.m3u8',
      mediaHost: 'https://media-cophamlieu.iztv.io.vn/',
      usesGrantVideo: true,
      defaultToken: 'eayJhbGcciOiJIUzI1cNiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkQ29tcHJlc3NlZCI6ImVKdzF6ckVPZ2pBVVJ1RjMrZWRlVTB1NVJTWldYa0hqVU5wYklRR2FGSFRRK083R0dNZVRmTU41UVJZL3pXZ3g1cjNrNmRuZHZuMEllWUhDUTlhWVN4L1JnazBUdE5HSm9tNHFzcFdKNUpNWnFFN0d1OFlmYmNVV0N2ZE5majZsVUllVUhEbU9RdFlMMDBsNG9DaXNXYk9MZG1Bb2xEekxodmFDWFh3WXBlQ3FzUHBGL2tQOUdlOFBES2N4WXc9PSIsImlhdCI6MTc4NTk5NDY3NiwiZXhwIjoxNzkxMTc4Njc2fQ.5nqBB5yxAcwvrNtDstt61C6wt9FiI_Vhv-dvLxxClyc'
    },
    {
      key: 'troliupde',
      name: 'TRỢ LÍ CÔ LIỄU',
      subject: 'Tiếng Anh',
      vendorId: '628c020f-d083-432d-af2b-5f2a78a14364',
      userId: '2fe1f486-3c88-448e-9f44-f389078468bc',
      coursesApi: 'https://p9y4zl6vkd.execute-api.ap-southeast-1.amazonaws.com/prod/course?authors=645f4c98146d92000807fa6c&visibleHidden=false&type=online&status=published&vendorId=628c020f-d083-432d-af2b-5f2a78a14364',
      resLabel: '1080p',
      streamFile: 'playlist.m3u8',
      mediaHost: 'https://media-cophamlieu.iztv.io.vn/',
      usesGrantVideo: true,
      defaultToken: 'eayJhbGcciOiJIUzI1cNiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkQ29tcHJlc3NlZCI6ImVKdzF6ckVPZ2pBVVJ1RjMrZWRlVTB1NVJTWldYa0hqVU5wYklRR2FGSFRRK083R0dNZVRmTU41UVJZL3pXZ3g1cjNrNmRuZHZuMEllWUhDUTlhWVN4L1JnazBUdE5HSm9tNHFzcFdKNUpNWnFFN0d1OFlmYmNVV0N2ZE5majZsVUllVUhEbU9RdFlMMDBsNG9DaXNXYk9MZG1Bb2xEekxodmFDWFh3WXBlQ3FzUHBGL2tQOUdlOFBES2N4WXc9PSIsImlhdCI6MTc4NTk5NDY3NiwiZXhwIjoxNzkxMTc4Njc2fQ.5nqBB5yxAcwvrNtDstt61C6wt9FiI_Vhv-dvLxxClyc'
    },
    {
      key: 'duong',
      name: 'Cô Trần Thuỳ Dương',
      subject: 'Ngữ văn',
      vendorId: '2212701d-71cf-4311-be6b-dcd61c217148',
      userId: '7c15e6e8-afe5-41b3-b21d-84c2b59a4f12',
      coursesApi: 'https://p9y4zl6vkd.execute-api.ap-southeast-1.amazonaws.com/prod/course?authors=68c7e0f150cab5000256b6bd&visibleHidden=false&type=online&status=published&vendorId=2212701d-71cf-4311-be6b-dcd61c217148',
      resLabel: '720p',
      streamFile: 'playlist_drm.m3u8',
      mediaHost: 'https://media-qanda.iztv.io.vn/',
      usesGrantVideo: true,
      defaultToken: 'eayJhbGcciOiJIUzI1cNiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkQ29tcHJlc3NlZCI6ImVKdzF5anNPZ2tBVUJkQ3RrRnN6aGpmQUlGUW1WaFpXbHNaaVBnOGtnY0VNUW1OY2pEdXdjQWNtck1zWVkzZUtjd1AzdXUxUVlad0czL1M2M2Z6UmhHRzZyR2FQR0RON040U2RRd1VwU1JZSk9WR1FyVVdXRWduRHlnaG5uU0lycWFCc2pSalR5TDl2czh6VVNodVJwK3I3U3lsS3c3V3dOakhFcFZucklrZU1NSFE4b2pyaXl0cWVPZUFVdyt1ZVVXSDdma1dINWJrOGZCUHRkWXY3Qis3Y09OMD0iLCJpYXQiOjE3ODYwMDUwMjAsImV4cCI6MTc5MTE4OTAyMH0.uMSuILZUIpHNdzwO_qadxA_L7AezVuxmPc9CV9rylco'
    },
    {
      key: 'luong',
      name: 'Thầy Nguyễn Tiến Lượng',
      subject: 'Ngữ văn',
      vendorId: '38222383-c0b6-4adf-8580-2e25c8e1e235',
      userId: '2fe1f486-3c88-448e-9f44-f389078468bc',
      coursesApi: 'https://p9y4zl6vkd.execute-api.ap-southeast-1.amazonaws.com/prod/course?authors=6538f6e3cee4c10008b1dc5e&visibleHidden=false&type=online&status=published&vendorId=38222383-c0b6-4adf-8580-2e25c8e1e235',
      resLabel: '720p',
      streamFile: 'playlist_drm.m3u8',
      mediaHost: 'https://media-qanda.iztv.io.vn/',
      defaultToken: ''
    }
  ]
};



/* Same-origin proxy so AWS API Gateway / S3 calls work in the browser. */
function proxied(url) {
  if (!url) return url;
  const s = String(url);
  if (s.startsWith('/api/izteach')) return s;
  if (s.startsWith('/') && !s.startsWith('//')) return s;
  return '/api/izteach?url=' + encodeURIComponent(s);
}

function bootstrapApp() {
  startProgress();
  document.getElementById('loading-txt').textContent = 'Đang khởi động ứng dụng...';
  onConfig(LOCAL_CONFIG);
}

function loadBackupConfig() {
  onConfig(LOCAL_CONFIG);
}

window.startDominic = function startDominic() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const logoPreload = new Image(); logoPreload.src = LOGO_URL;
  if (window.matchMedia('(max-width:860px)').matches) {
    sbOpen = false;
    sidebar.classList.add('collapsed');
  }
  initExamAuthorization();
  bootstrapApp();
};
window.bootstrapApp = bootstrapApp;

function onConfig(cfg) {
  window._cfg = cfg;
  CFG = cfg;
  TEACHERS = cfg.teachers || [];
  doneProgress();
  goHome();
}

/* =====================================================================
 * TRANG CHỦ - lưới giáo viên trực quan
 * ===================================================================== */

function setBreadcrumb(parts) {
  const title = document.getElementById('top-title');
  if (!title) return;
  const safe = (parts || []).filter(Boolean);
  title.textContent = safe.length ? safe[safe.length - 1] : 'Hôm nay bạn muốn học gì?';
}


function goTeacher() {
  if (!TEACHER) return goHome();
  document.getElementById('saved-header-btn')?.classList.remove('active');
  document.getElementById('topbar-home-btn')?.classList.remove('active');
  document.querySelector('.app').classList.add('catalog-mode');
  document.querySelector('.app')?.classList.remove('in-lesson');
  COURSE = null;
  setBreadcrumb([TEACHER.name]);
  document.getElementById('sb-title').textContent = TEACHER.name;
  const tagEl = document.getElementById('sb-tag');
  tagEl.className = '';
  tagEl.onclick = null;
  tagEl.textContent = TEACHER.subject || '';
  document.getElementById('sb-home-btn')?.classList.remove('active');
  
  setSupportAvailable(false);
  ALL_LEAVES = [];
  if (COURSE_CACHE[TEACHER.key]) {
    COURSES = COURSE_CACHE[TEACHER.key];
    renderCatalog();
  } else {
    selectTeacher(TEACHER);
  }
}

function getSavedLessons() {
  try { return JSON.parse(localStorage.getItem(SAVED_LESSONS_KEY) || '[]'); } catch(e) { return []; }
}
function setSavedLessons(list) {
  try { localStorage.setItem(SAVED_LESSONS_KEY, JSON.stringify(list)); } catch(e) {}
}
function isLessonSaved(id) { return !!getSavedLessons().find(x => String(x.id) === String(id)); }
function toggleSavedLesson(item) {
  const list = getSavedLessons();
  const idx = list.findIndex(x => String(x.id) === String(item.id));
  if (idx >= 0) list.splice(idx,1); else list.unshift({...item, savedAt:Date.now()});
  setSavedLessons(list);
}
function savedTypeGroup(type) {
  type=(type||'other').toLowerCase();
  if(type==='video') return 'Video';
  if(type==='flashcard') return 'Flashcard';
  if(['embedded','iframe','link'].includes(type)) return 'Nhúng';
  if(['test','quiz','exam','reading-test','listening-test'].includes(type)) return 'Bài thi';
  if(type==='pdf') return 'PDF';
  return 'Khác';
}
function showSavedLessons() {
  document.querySelector('.app').classList.add('catalog-mode');
  document.getElementById('sb-home-btn')?.classList.remove('active');
  const list = getSavedLessons();
  const groups = {};
  list.forEach(x => (groups[savedTypeGroup(x.type)] ||= []).push(x));
  const order = ['Video','Flashcard','Nhúng','Bài thi','PDF','Khác'];

  const groupHtml = list.length ? order.filter(k => groups[k]).map(k => `
    <section class="saved-main-group">
      <div class="saved-main-title">
        ${leafIcon(k==='Bài thi'?'test':k==='Nhúng'?'link':k==='PDF'?'pdf':k==='Flashcard'?'flashcard':'video')}
        <span>${k}</span><span class="saved-main-count">${groups[k].length}</span>
      </div>
      <div class="saved-main-list">
        ${groups[k].map(x => `
          <article class="saved-main-item" data-saved-id="${esc(x.id)}">
            <div class="saved-main-icon">${leafIcon(x.type)}</div>
            <div class="saved-main-info">
              <div class="saved-main-name">${esc(x.title)}</div>
              <div class="saved-main-course">${esc(x.courseTitle || '')}</div>
            </div>
            <button class="save-lesson-btn saved saved-main-remove" type="button"
              title="Bỏ lưu" aria-label="Bỏ lưu" data-remove-saved="${esc(x.id)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 3.5h12v17l-6-3.8-6 3.8z"/>
              </svg>
            </button>
          </article>`).join('')}
      </div>
    </section>`).join('') : `
      <div class="saved-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3.5h12v17l-6-3.8-6 3.8z"/>
        </svg>
        <h3>Chưa có bài học đã lưu</h3>
        <p>Bấm biểu tượng bookmark ở bài học để lưu lại và xem sau.</p>
      </div>`;

  document.getElementById('saved-header-btn')?.classList.add('active');
  document.getElementById('topbar-home-btn')?.classList.remove('active');
  document.getElementById('top-title').textContent = 'Bài học đã lưu';
  setSupportAvailable(false);
  showContent(`
    <div class="saved-main-page">
      <div class="saved-main-head">
        <div>
          <div class="saved-main-kicker">THƯ VIỆN CÁ NHÂN</div>
          <h1>Bài học đã lưu</h1>
          <p>${list.length ? `Bạn đang lưu ${list.length} bài học để xem lại sau.` : 'Lưu những bài học bạn muốn quay lại sau.'}</p>
        </div>
        <button type="button" class="saved-main-back" onclick="goHome()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          Trang chủ
        </button>
      </div>
      <div class="saved-main-groups">${groupHtml}</div>
    </div>
  `);
  document.querySelectorAll('.saved-main-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('[data-remove-saved]')) return;
      const item = list.find(x => String(x.id) === String(el.dataset.savedId));
      if (item) openSavedLesson(item);
    });
  });
  document.querySelectorAll('[data-remove-saved]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleSavedLesson({id: btn.dataset.removeSaved});
      showSavedLessons();
    });
  });
}
function openSavedLesson(item) {
  const teacher=TEACHERS.find(t=>t.key===item.teacherKey);
  if(!teacher) return;
  if(!TEACHER || TEACHER.key!==teacher.key) {
    PENDING_SAVED_OPEN=item;
    selectTeacher(teacher);
    return;
  }
  const course=COURSES.find(c=>String(c.id)===String(item.courseId));
  if(course) {
    PENDING_SAVED_OPEN=item;
    selectCourse(course);
  }
}
function goHome() {
  document.querySelector('.app')?.classList.remove('in-lesson');
  document.body.classList.remove('exam-mode');
  document.querySelector('.app').classList.add('catalog-mode');
  document.getElementById('saved-header-btn')?.classList.remove('active');
  document.getElementById('topbar-home-btn')?.classList.add('active');
  TEACHER = null; COURSE = null;
  document.getElementById('sb-home-btn')?.classList.add('active');
  
  setBreadcrumb([]);
  document.getElementById('sb-title').textContent = 'Dominic';
  const tagHome = document.getElementById('sb-tag');
  tagHome.className = '';
  tagHome.onclick = null;
  tagHome.textContent = '';
  setSupportAvailable(false);
  ALL_LEAVES = [];
  document.getElementById('sb-body').innerHTML = '<div class="state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><p>Chọn một khoá học để xem danh sách bài học</p></div>';
  setActiveBottomNav('bn-home');
  autoCloseSBOnMobile();

  const cards = TEACHERS.map(t => teacherCardHtml(t)).join('');
  showContent(`
    <div class="hero">
      <h1>Chào mừng đến với Dominic Academy</h1>
      <p>Chọn một giáo viên bên dưới để xem trọn bộ khoá học đang mở.</p>
    </div>
    <div class="section-title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Giáo viên
    </div>
    <div class="teacher-grid" id="teacher-grid">${cards}</div>
  `);
}

function initialsOf(name) {
  return (name || '').split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
}

function teacherCardHtml(t) {
  const bio = TEACHER_BIO_CACHE[t.key];
  const initials = esc(initialsOf(t.name));
  const avatarHtml = (bio && bio.avatar)
    ? `<img class="avatar" src="${esc(bio.avatar)}" alt="${esc(t.name)}" onerror="imgFallback(this,'avatar','${initials}')">`
    : `<div class="avatar placeholder">${initials}</div>`;
  return `
    <div class="teacher-card" onclick="selectTeacherByKey('${t.key}')">
      ${avatarHtml}
      <h3>${esc(t.name)}</h3>
      ${t.subject ? `<span class="subject-tag">${esc(t.subject)}</span>` : ''}
      ${bio && bio.text ? `<p class="bio">${esc(bio.text)}</p>` : ''}
      <span class="cta">Vào học
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
      </span>
    </div>`;
}

function selectTeacherByKey(key) {
  const t = TEACHERS.find(x => x.key === key);
  if (t) selectTeacher(t);
}

/* =====================================================================
 * DANH MỤC KHOÁ HỌC CỦA MỘT GIÁO VIÊN (lấy động từ API)
 * ===================================================================== */
const TEACHER_BIO_CACHE = {};

function selectTeacher(t) {
  document.querySelector('.app').classList.add('catalog-mode');
  document.querySelector('.app')?.classList.remove('in-lesson');
  TEACHER = t; COURSE = null;
  document.getElementById('sb-home-btn')?.classList.remove('active');
  
  CUR_CATEGORY = 'all';
  document.getElementById('sb-title').textContent = t.name;
  const tagEl = document.getElementById('sb-tag');
  tagEl.className = '';
  tagEl.onclick = null;
  tagEl.textContent = t.subject || '';
  setBreadcrumb([t.name]);
  setSupportAvailable(false);
  ALL_LEAVES = [];
  document.getElementById('sb-body').innerHTML = '<div class="state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg><p>Chọn một khoá học để xem danh sách bài học</p></div>';
  setActiveBottomNav('bn-home');
  autoCloseSBOnMobile();

  if (COURSE_CACHE[t.key]) {
    COURSES = COURSE_CACHE[t.key];
    renderCatalog();
    if (PENDING_SAVED_OPEN) {
      const pending=PENDING_SAVED_OPEN; PENDING_SAVED_OPEN=null;
      const c=COURSES.find(x=>String(x.id)===String(pending.courseId));
      if(c) selectCourse(c);
    }
    return;
  }

  showContent('<div class="state"><div class="spinner"></div><p>Đang tải danh sách khoá học của ' + esc(t.name) + '...</p></div>');
  startProgress();

  apiFetch(t.coursesApi).then(raw => {
    doneProgress();
    const list = Array.isArray(raw) ? raw : (raw.data || raw.results || []);
    extractTeacherBio(t, list);
    COURSES = normalizeCourses(t, list);
    COURSE_CACHE[t.key] = COURSES;
    renderCatalog();
    if (PENDING_SAVED_OPEN) {
      const pending=PENDING_SAVED_OPEN; PENDING_SAVED_OPEN=null;
      const c=COURSES.find(x=>String(x.id)===String(pending.courseId));
      if(c) selectCourse(c);
    }
  }).catch(e => {
    doneProgress();
    showContent(`<div class="err">Không tải được danh sách khoá học của ${esc(t.name)}: ${esc(e.message)}
      <br><button class="btn-refresh" style="margin-top:10px" onclick="selectTeacher(TEACHER)">Thử lại</button></div>`);
  });
}

// Lấy avatar + mô tả ngắn của giáo viên từ chính dữ liệu khoá học (trường "authors")
function extractTeacherBio(t, rawList) {
  if (TEACHER_BIO_CACHE[t.key] || !rawList || !rawList.length) return;
  const authors = rawList[0].authors || [];
  if (!authors.length) return;
  const author = authors[authors.length - 1];
  let avatar = '';
  if (author.avatar && author.avatar.origin) {
    avatar = normalizeBucket((author.avatar.origin.bucket || '').replace(/\/?$/, '/') + (author.avatar.link || author.avatar.origin.link || ''));
  }
  const text = cleanDesc(author.description || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  TEACHER_BIO_CACHE[t.key] = { avatar, text: text.slice(0, 110) };
  if (avatar) { const img = new Image(); img.decoding='async'; img.fetchPriority='high'; img.src=avatar; }
  const card = document.getElementById('teacher-grid');
  if (card) card.innerHTML = TEACHERS.map(x => teacherCardHtml(x)).join('');
}

// Chuẩn hoá khoá học từ API thô -> cấu trúc gọn dùng trong toàn app
function normalizeCourses(t, rawList) {
  return (rawList || []).map(c => {
    const id = c.id || c._id;
    const title = c.displayedTitle && c.title ? c.title : (c.title || 'Khoá học');
    const price = c.price || {};
    return {
      id: id,
      title: c.title || title,
      subtitle: c.displayedTitle || '',
      thumbnail: normalizeBucket(c.previewImg || c.backgroundImg || ''),
      category: categoryOf(t, c),
      isFree: !!c.isFree,
      priceAfter: price.afterDiscount || 0,
      featured: !!c.featured,
      studentCount: c.studentCount || 0
    };
  }).sort((a, b) => a.title.localeCompare(b.title, 'vi'));
}

// Phân loại khoá học theo danh mục để hiển thị dạng tab.
// Ưu tiên field "subject" (+ "grade") nếu API trả về, nếu không thì suy luận từ tiêu đề.
function categoryOf(t, c) {
  if (c.subject) return c.subject + (c.grade ? ' - Lớp ' + c.grade : '');
  const title = (c.title || '').toUpperCase();
  if (t.key === 'duong') {
    if (title.indexOf('LIVE') === 0) return 'Khoá Live';
    if (title.indexOf('VOD') === 0) return 'Khoá VOD';
    return 'Khác';
  }
  if (title.indexOf('IELTS') > -1 || title.indexOf('LIVE VIP') > -1) return 'IELTS';
  if (title.indexOf('TOEIC') > -1) return 'TOEIC';
  if (title.indexOf('SGK') > -1 || title.indexOf('LỚP 10') > -1 || title.indexOf('LỚP 11') > -1 ||
      title.indexOf('LỚP 12') > -1 || title.indexOf('THPT') > -1 || title.indexOf('2026-2027') > -1 ||
      title.indexOf('CHƯƠNG TRÌNH MỚI') > -1 || title.indexOf('(CTM)') > -1) return 'THPT - Tiếng Anh';
  return 'Tiếng Anh cơ bản';
}

function renderCatalog() {
  const cats = ['all', ...new Set(COURSES.map(c => c.category))];
  const tabsHtml = cats.map(cat => `
    <button class="cat-pill ${cat === CUR_CATEGORY ? 'active' : ''}" onclick="setCatalogCategory('${cat.replace(/'/g, "\\'")}')">
      ${cat === 'all' ? 'Tất cả' : esc(cat)}
    </button>`).join('');

  showContent(`
    <div class="catalog-head">
      <div class="section-title" style="margin-top:0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
        Khoá học của ${esc(TEACHER.name)} (${COURSES.length})
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="course-view-tools" title="Kiểu hiển thị">
          <button class="course-view-btn ${COURSE_VIEW==='list'?'active':''}" onclick="setCourseView('list')">☰</button>
          <button class="course-view-btn ${COURSE_VIEW==='3'?'active':''}" onclick="setCourseView('3')">3</button>
          <button class="course-view-btn ${COURSE_VIEW==='4'?'active':''}" onclick="setCourseView('4')">4</button>
        </div>
        <div class="catalog-search">
          <input type="text" id="catalog-search-input" placeholder="Tìm khoá học..." oninput="filterCatalogCards(this.value)">
        </div>
      </div>
    </div>
    <div class="cat-tabs">${tabsHtml}</div>
    <div class="course-grid view-${COURSE_VIEW}" id="course-grid"></div>
  `);
  renderCourseGrid();
}

function setCatalogCategory(cat) {
  CUR_CATEGORY = cat;
  renderCatalog();
}

function setCourseView(view) {
  COURSE_VIEW = ['list','3','4'].includes(view) ? view : '3';
  try { localStorage.setItem(COURSE_VIEW_KEY, COURSE_VIEW); } catch(e) {}
  const grid = document.getElementById('course-grid');
  if (grid) {
    grid.classList.remove('view-list','view-3','view-4');
    grid.classList.add('view-' + COURSE_VIEW);
  }
  document.querySelectorAll('.course-view-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.course-view-btn[onclick="setCourseView('${COURSE_VIEW}')"]`);
  if (btn) btn.classList.add('active');
}

function courseCardHtml(c) {
  const thumb = c.thumbnail
    ? `<img class="thumb" src="${esc(c.thumbnail)}" alt="${esc(c.title)}" decoding="async" fetchpriority="high" onerror="imgFallback(this,'thumb')">`
    : `<div class="thumb-fallback"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>`;

  let chips = '';
  if (c.featured) chips += '<span class="chip featured">Nổi bật</span>';
  if (c.isFree) chips += '<span class="chip free">Miễn phí</span>';
  else if (c.priceAfter > 0) chips += `<span class="chip price">${c.priceAfter.toLocaleString('vi-VN')}₫</span>`;
  if (c.studentCount > 0) chips += `<span class="chip students">${c.studentCount} học viên</span>`;

  return `
    <div class="course-card" data-title="${esc(c.title.toLowerCase())}" onclick="selectCourseById('${String(c.id).replace(/'/g, "\\'")}')">
      ${thumb}
      <div class="info">
        <span class="cat-tag">${esc(c.category)}</span>
        <h4>${esc(c.title)}</h4>
        ${c.subtitle ? `<span class="sub">${esc(c.subtitle)}</span>` : ''}
        <div class="meta-row">${chips}</div>
      </div>
    </div>`;
}

function renderCourseGrid() {
  const grid = document.getElementById('course-grid');
  if (!grid) return;
  const list = COURSES.filter(c => CUR_CATEGORY === 'all' || c.category === CUR_CATEGORY);
  grid.innerHTML = list.length
    ? list.map(courseCardHtml).join('')
    : '<div class="state" style="min-height:120px"><p>Không có khoá học phù hợp.</p></div>';
}

function filterCatalogCards(q) {
  q = q.trim().toLowerCase();
  document.querySelectorAll('#course-grid .course-card').forEach(el => {
    el.style.display = (!q || el.dataset.title.includes(q)) ? '' : 'none';
  });
}

function selectCourseById(id) {
  const c = COURSES.find(x => String(x.id) === String(id));
  if (c) selectCourse(c);
}

/* =====================================================================
 * CHỌN KHOÁ HỌC -> DỰNG layoutUrl / unitUrl -> TẢI CÂY BÀI HỌC
 * ===================================================================== */
function selectCourse(c) {
  document.querySelector('.app').classList.remove('catalog-mode');
  document.querySelector('.app')?.classList.remove('in-lesson');
  COURSE = {
    id: c.id,
    title: c.title,
    teacher: TEACHER,
    layoutUrl: `${CFG.apiBase}/course/layout/${c.id}?vendorId=${TEACHER.vendorId}`,
    unitUrl: `${CFG.apiBase}/unit/{id}?userId=${TEACHER.userId}&_populate=video&vendorId=${TEACHER.vendorId}`
  };
  document.getElementById('sb-title').textContent = c.title;
  const tagEl = document.getElementById('sb-tag');
  tagEl.className = 'sb-tag-back';
  tagEl.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg> ${esc(TEACHER?.name || 'Giáo viên')}`;
  tagEl.onclick = () => goTeacher();
  setBreadcrumb([TEACHER?.name || '', c.title || '']);

  sbState('Đang tải danh sách bài học...');
  showContent('<div class="state"><div class="spinner"></div><p>Đang tải danh sách bài học từ máy chủ...</p></div>');
  startProgress();
  setActiveBottomNav('bn-lessons');

  apiFetch(COURSE.layoutUrl).then(data => {
    doneProgress();
    const sections = Array.isArray(data) ? data : (data.data || data.sections || []);
    if (!sections.length) return showContent('<div class="state"><p>Khoá học này chưa có bài học.</p></div>');
    sections.sort((a, b) => (a.index || 0) - (b.index || 0));
    ALL_LEAVES = [];
    document.getElementById('sb-body').innerHTML = '';
    sections.forEach(sec => document.getElementById('sb-body').appendChild(createNode(sec, 1)));
    showContent(`<div class="state"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#c0ccdf" stroke-width="1.4"><polygon points="5 3 19 12 5 21 5 3"/></svg><p>Chọn bài học bên danh sách trái để bắt đầu xem.</p></div>`);
    if (PENDING_SAVED_OPEN) {
      const pending=PENDING_SAVED_OPEN; PENDING_SAVED_OPEN=null;
      const target=ALL_LEAVES.find(el => String(el.dataset.id)===String(pending.id));
      if(target) target.click();
    }
    if (window.matchMedia('(min-width:861px)').matches) return;
    if (!sbOpen) toggleSB();
  }).catch(e => { doneProgress(); showErr('Lỗi tải cấu trúc bài học:\n' + e.message); });
}

function createNode(node, level) {
  const block = mk('div', 'tree-node');
  const hd = mk('div', `folder-hd lvl${Math.min(level, 5)}-hd`);
  hd.innerHTML = `<span>${esc(node.title || 'Thư mục')}</span>${chevSvg('ch')}`;
  const kids = mk('div', 'kids');
  hd.addEventListener('click', () => {
    const willOpen = !kids.classList.contains('open');
    hd.classList.toggle('open', willOpen);
    kids.classList.toggle('open', willOpen);
  });

  const children = (node.children || []).filter(u => !u.settings?.isDraft);
  children.sort((a, b) => (a.index || 0) - (b.index || 0));
  children.forEach(u => kids.appendChild(mkLeaf(u, level)));

  const childSections = node.childSections || [];
  childSections.sort((a, b) => (a.index || 0) - (b.index || 0));
  childSections.forEach(sub => kids.appendChild(createNode(sub, level + 1)));

  // Đánh dấu nhóm có bài giảng để vẽ vertical line
  if (children.length) kids.classList.add('has-leaves');

  block.appendChild(hd); block.appendChild(kids);
  return block;
}

function mkLeaf(unit, folderLevel) {
  const id = unit.id || unit._id || '', title = unit.title || 'Bài học', type = (unit.type || 'video').toLowerCase();
  const item = mk('div', 'leaf');
  const saved = isLessonSaved(id);
  item.innerHTML = `<span class="leaf-badge ${badgeClassOf(type)}">${leafIcon(type)}</span><span class="leaf-title">${esc(title)}</span>
    <button class="save-lesson-btn ${saved ? 'saved' : ''}" type="button" title="${saved ? 'Bỏ lưu' : 'Lưu để xem sau'}" aria-label="${saved ? 'Bỏ lưu' : 'Lưu để xem sau'}">
      <svg viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M6 3.5h12v17l-6-3.8-6 3.8z"/></svg>
    </button>`;
  item.dataset.title = title.toLowerCase();
  item.dataset.titleNorm = stripVN(title);
  item.dataset.id = String(id);
  item.querySelector('.save-lesson-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleSavedLesson({id, title, type, courseId: COURSE?.id || '', courseTitle: COURSE?.title || '', teacherKey: TEACHER?.key || ''});
    const nowSaved = isLessonSaved(id);
    e.currentTarget.classList.toggle('saved', nowSaved);
    e.currentTarget.title = nowSaved ? 'Bỏ lưu' : 'Lưu để xem sau';
    e.currentTarget.innerHTML = `<svg viewBox="0 0 24 24" fill="${nowSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M6 3.5h12v17l-6-3.8-6 3.8z"/></svg>`;
  });
  item.addEventListener('click', () => selectLesson(item, id, title));
  ALL_LEAVES.push(item);
  return item;
}

function selectLesson(el, unitId, title) {
  ALL_LEAVES.forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  document.querySelector('.app')?.classList.add('in-lesson');
  setBreadcrumb([TEACHER?.name || '', COURSE?.title || '', title]);
  setSupportAvailable(false);
  showContent('<div class="state"><div class="spinner"></div><p>Đang tải nội dung bài học...</p></div>');
  startProgress();
  autoCloseSBOnMobile();

  const url = (COURSE.unitUrl || '').replace(/\{_?id\}/, unitId);
  apiFetch(url).then(unit => { doneProgress(); renderLesson(unit); }).catch(e => { doneProgress(); showErr('Lỗi tải dữ liệu bài: ' + e.message); });
}

/* =====================================================================
 * TRÌNH PHÁT VIDEO (HLS + Plyr)
 * ===================================================================== */
const VIDEO_MAX_AUTO_RETRY = 1; // 1 lần retry cùng URL rồi chuyển candidate
/* API cấp signed URL video CDN (VSTORAGE / isCDNW) — khác apiBase danh mục khoá học */
const VIDEO_CDN_API_BASE = 'https://xx7swzlhyl.execute-api.ap-southeast-1.amazonaws.com/prod';

/**
 * Danh sách URL HLS (ưu tiên media.izteach.vn có vendorId — đang chạy tốt;
 * fallback cophamlieu-media cho bài cũ / re-up lệch CDN).
 * videoId = video._id (KHÔNG dùng video.link path storage).
 */
/**
 * Lấy videoId + metadata từ unit (hỗ trợ cả form mới lẫn form cũ).
 *
 * Form mới (populate): unit.video = { _id, link, migratePrefix, ... }
 * Form cũ (sample demo): unit.video = "64b91687..." (string)
 *                        unit.resources[0] = { id, link, origin.previewUrl, ... }
 */
function extractVideoMeta(unit) {
  const teacher = (COURSE && COURSE.teacher) || {};
  const empty = {
    videoId: '',
    vendorId: teacher.vendorId || '',
    migratePrefix: '',
    previewUrl: '',
    streamFile: teacher.streamFile || 'playlist.m3u8',
    resourceId: '',
    isCDN: false,
    provider: ''
  };

  if (!unit) return empty;

  let videoId = '';
  let vendorId = teacher.vendorId || unit.vendorId || '';
  let migratePrefix = '';
  let previewUrl = '';
  let streamFile = teacher.streamFile || 'playlist.m3u8';
  let resourceId = '';
  let isCDN = false;
  let provider = '';

  // 1) unit.video là object (sau _populate=video)
  if (unit.video && typeof unit.video === 'object') {
    const v = unit.video;
    videoId = String(v._id || v.id || '').trim();
    vendorId = v.vendorId || vendorId;
    migratePrefix = v.migratePrefix || '';
    previewUrl = (v.origin && v.origin.previewUrl) || v.previewUrl || '';
    provider = v.provider || provider;
    if (v.origin && (v.origin.isCDNW || v.origin.isCDN)) isCDN = true;
    if (String(provider).toUpperCase() === 'VSTORAGE') isCDN = true;
    // video object đôi khi chính là resource
    if (!resourceId) resourceId = String(v._id || v.id || '').trim();
    if (!videoId && v.link) {
      const parts = String(v.link).split('/').filter(Boolean);
      videoId = parts.length ? parts[parts.length - 1] : '';
    }
  }

  // 2) unit.video là string ID (form cũ / chưa populate)
  if (!videoId && typeof unit.video === 'string' && unit.video.trim()) {
    videoId = unit.video.trim();
  }

  // 3) resources[] — mấu chốt cho grant-video (resourceId = _id)
  const resList = Array.isArray(unit.resources) ? unit.resources : [];
  const resVideo = resList.find(r => r && (
    r.type === 'video' ||
    r.subType === 'video' ||
    (r.origin && r.origin.mimeType && String(r.origin.mimeType).startsWith('video')) ||
    String(r.provider || '').toUpperCase() === 'VSTORAGE'
  )) || resList[0];
  if (resVideo) {
    const rid = String(resVideo._id || resVideo.id || '').trim();
    if (rid) resourceId = rid;
    if (!videoId) videoId = rid;
    if (!videoId && resVideo.link) {
      const parts = String(resVideo.link).split('/').filter(Boolean);
      videoId = parts.length ? parts[parts.length - 1] : '';
    }
    vendorId = resVideo.vendorId || vendorId;
    migratePrefix = resVideo.migratePrefix || migratePrefix;
    previewUrl = previewUrl || (resVideo.origin && resVideo.origin.previewUrl) || '';
    provider = resVideo.provider || provider;
    if (resVideo.origin && (resVideo.origin.isCDNW || resVideo.origin.isCDN || resVideo.origin.hasDateStampt)) isCDN = true;
    if (String(provider).toUpperCase() === 'VSTORAGE') isCDN = true;
  }

  // 4) unit.link thuần id
  if (!videoId && unit.link && !/^https?:\/\//i.test(String(unit.link)) && !String(unit.link).includes('/')) {
    videoId = String(unit.link).trim();
  }

  // Mọi tài nguyên video đều ưu tiên grant nếu có resourceId
  if (resourceId && (unit.type || '').toLowerCase() === 'video') {
    isCDN = true;
  }

  return { videoId, vendorId, migratePrefix, previewUrl, streamFile, resourceId, isCDN, provider };
}

function resolveVideoCandidates(unit) {
  const teacher = (COURSE && COURSE.teacher) || TEACHER || {};
  const videoBucket = String(CFG.videoBucket || 'https://media.izteach.vn/').replace(/\/?$/, '/');
  const mediaHost = String(teacher.mediaHost || '').replace(/\/?$/, '/');
  const meta = extractVideoMeta(unit);
  const { videoId, vendorId, migratePrefix, previewUrl } = meta;
  const streamFile = meta.streamFile || teacher.streamFile || 'playlist.m3u8';
  const out = [];
  const add = (u) => {
    if (!u || typeof u !== 'string') return;
    u = u.trim();
    if (u && !out.includes(u)) out.push(u);
  };

  if (!videoId) {
    for (const h of [previewUrl, unit && unit.link, unit && unit.data && unit.data.link]) {
      if (typeof h === 'string' && /^https?:\/\//i.test(h) && h.indexOf('oss.nextidc.net') === -1) add(h);
    }
    return out;
  }

  // 0) mediaHost riêng theo giáo viên (cô Liễu / cô Dương…)
  if (mediaHost) {
    if (vendorId) add(mediaHost + vendorId + '/' + videoId + '/' + streamFile);
    add(mediaHost + videoId + '/' + streamFile);
    if (streamFile !== 'playlist.m3u8') {
      if (vendorId) add(mediaHost + vendorId + '/' + videoId + '/playlist.m3u8');
      add(mediaHost + videoId + '/playlist.m3u8');
    }
  }

  // 1) media.izteach.vn/{vendorId}/{videoId}/…
  if (vendorId) add(videoBucket + vendorId + '/' + videoId + '/' + streamFile);

  // 2) bucket ghi chú (iztv.io.vn) — luôn thử thêm
  add('https://media-cophamlieu.iztv.io.vn/' + videoId + '/' + streamFile);
  add('https://media-qanda.iztv.io.vn/' + videoId + '/' + streamFile);
  if (vendorId) {
    add('https://media-cophamlieu.iztv.io.vn/' + vendorId + '/' + videoId + '/' + streamFile);
    add('https://media-qanda.iztv.io.vn/' + vendorId + '/' + videoId + '/' + streamFile);
  }

  // 3) form cũ cô Liễu
  add('https://cophamlieu-media.izteach.vn/' + videoId + '/' + streamFile);

  // 4) media phẳng
  add(videoBucket + videoId + '/' + streamFile);

  // 5) migratePrefix
  if (migratePrefix) add(String(migratePrefix).replace(/\/?$/, '/') + videoId + '/' + streamFile);

  // 6) DRM → playlist.m3u8 thường
  if (streamFile !== 'playlist.m3u8') {
    if (vendorId) add(videoBucket + vendorId + '/' + videoId + '/playlist.m3u8');
    add('https://cophamlieu-media.izteach.vn/' + videoId + '/playlist.m3u8');
    add(videoBucket + videoId + '/playlist.m3u8');
  }

  // 7) playlist_720
  if (vendorId) add(videoBucket + vendorId + '/' + videoId + '/playlist_720.m3u8');
  add('https://cophamlieu-media.izteach.vn/' + videoId + '/playlist_720.m3u8');
  if (mediaHost) add(mediaHost + videoId + '/playlist_720.m3u8');

  // 8) previewUrl sau cùng
  if (previewUrl && /^https?:\/\//i.test(previewUrl)) add(previewUrl);

  return out;
}



/* =====================================================================
 * VIDEO CDN / grant-video (VSTORAGE, isCDNW)
 * resourceId lấy từ unit.resources[]._id — xin signed URL + tự gia hạn
 * trước khi hết ttl để phát mượt, không gián đoạn.
 * ===================================================================== */
function clearVideoRenewTimer() {
  if (videoRenewTimer) {
    clearTimeout(videoRenewTimer);
    videoRenewTimer = null;
  }
  currentVideoResourceId = null;
}

async function grantVideoSignedUrl(resourceId) {
  const authorization = getExamAuthorization();
  if (!authorization) {
    throw new Error('Chưa nhập Authorization. Hãy bấm nút ⚙️ trên thanh đầu trang và dán token trước.');
  }
  const teacher = (COURSE && COURSE.teacher) || TEACHER || {};
  const vendorId = teacher.vendorId || '';

  // Kiểm tra quyền video-cdn (không chặn nếu API lỗi — vẫn thử grant)
  try {
    const checkUrl = `${VIDEO_CDN_API_BASE}/config/check-feature-access?key=video-cdn&vendorId=${encodeURIComponent(vendorId)}`;
    const checkRes = await fetch(proxied(checkUrl), {
      method: 'GET',
      headers: { Authorization: authorization, Accept: 'application/json' }
    });
    if (checkRes.ok) {
      const hasAccess = await checkRes.json();
      if (hasAccess === false) {
        throw new Error('Không có quyền dùng Video CDN');
      }
    }
  } catch (e) {
    if (e && e.message && e.message.includes('Không có quyền')) throw e;
    // bỏ qua lỗi check — vẫn grant
  }

  const grantRes = await fetch(proxied(`${VIDEO_CDN_API_BASE}/resource/grant-video`), {
    method: 'POST',
    headers: {
      Authorization: authorization,
      'Content-Type': 'application/json;charset=UTF-8',
      Accept: 'application/json, text/plain, */*'
    },
    body: JSON.stringify({ resourceId })
  });

  if (!grantRes.ok) {
    const body = await grantRes.text().catch(() => '');
    throw new Error('Lỗi grant-video: ' + grantRes.status + (body ? ' — ' + body.substring(0, 200) : ''));
  }

  const data = await grantRes.json();
  if (!data || !data.master) {
    throw new Error('Không nhận được link master từ grant-video');
  }
  return data; // { master, ttl, ... }
}

/**
 * Phát video qua signed URL (grant-video) + tự gia hạn.
 * Giữ nguyên vị trí đang xem khi renew.
 */
async function playGrantedVideo(vel, section, resourceId, preserveTime, isRenew) {
  currentVideoResourceId = resourceId;

  const data = await grantVideoSignedUrl(resourceId);
  const masterUrl = data.master;
  const ttl = Number(data.ttl) || 300;
  // Gia hạn sớm hơn để còn buffer, tránh đứt khi TTL gần hết
  const renewAfterSec = Math.max(ttl - 60, 25);

  if (isRenew && (currentHls || (vel && (vel.src || vel.currentSrc)))) {
    // Đọc lại thời điểm SAU khi grant xong (grant mất vài trăm ms)
    let seekTo = 0;
    try {
      seekTo = (currentPlyr && !isNaN(currentPlyr.currentTime) ? currentPlyr.currentTime : 0)
        || (vel && !isNaN(vel.currentTime) ? vel.currentTime : 0)
        || (typeof preserveTime === 'number' ? preserveTime : 0);
    } catch (e) {
      seekTo = typeof preserveTime === 'number' ? preserveTime : 0;
    }
    softSwapVideoSource(vel, masterUrl, seekTo);
  } else {
    setupHlsPlayer(vel, [masterUrl], section, 0, 0);
  }

  if (videoRenewTimer) { clearTimeout(videoRenewTimer); videoRenewTimer = null; }
  videoRenewTimer = setTimeout(async () => {
    if (currentVideoResourceId !== resourceId) return;
    let t = 0;
    try {
      t = (currentPlyr && currentPlyr.currentTime) || (vel && vel.currentTime) || 0;
    } catch (e) {}
    try {
      await playGrantedVideo(vel, section, resourceId, t, true);
    } catch (err) {
      console.error('Gia hạn video thất bại:', err);
      videoRenewTimer = setTimeout(() => {
        if (currentVideoResourceId === resourceId) {
          playGrantedVideo(vel, section, resourceId, t, true).catch(() => {});
        }
      }, 12000);
    }
  }, renewAfterSec * 1000);

  return data;
}

/** Đổi signed URL, giữ vị trí + trạng thái play — không destroy Plyr */
function softSwapVideoSource(vel, masterUrl, seekTo) {
  if (!vel || !masterUrl) return;
  let wasPlaying = true;
  try {
    wasPlaying = currentPlyr ? !currentPlyr.paused : !vel.paused;
  } catch (e) {}
  const t = Math.max(0, Number(seekTo) || 0);

  const applySeekAndPlay = () => {
    try {
      if (t > 0.3) {
        if (currentHls && typeof currentHls.startLoad === 'function') {
          try { currentHls.startLoad(t); } catch (e) {}
        }
        vel.currentTime = t;
        if (currentPlyr) {
          try { currentPlyr.currentTime = t; } catch (e) {}
        }
      }
      if (wasPlaying) {
        const p = currentPlyr ? currentPlyr.play() : vel.play();
        if (p && p.catch) p.catch(() => {});
      }
    } catch (e) {}
  };

  // Retry seek vài lần vì buffer HLS cần thời gian
  const stickSeek = () => {
    applySeekAndPlay();
    let n = 0;
    const iv = setInterval(() => {
      n++;
      try {
        const cur = vel.currentTime || 0;
        if (t > 0.3 && Math.abs(cur - t) > 1.2) {
          vel.currentTime = t;
          if (currentPlyr) currentPlyr.currentTime = t;
        } else if (n >= 2) {
          clearInterval(iv);
        }
        if (n >= 6) clearInterval(iv);
        if (wasPlaying && vel.paused) {
          (currentPlyr ? currentPlyr.play() : vel.play()).catch(() => {});
        }
      } catch (e) {
        clearInterval(iv);
      }
    }, 280);
  };

  if (currentHls && typeof Hls !== 'undefined') {
    try {
      const onParsed = () => {
        stickSeek();
      };
      currentHls.once(Hls.Events.MANIFEST_PARSED, onParsed);
      currentHls.loadSource(masterUrl);
      // Một số bản HLS cần attachMedia lại nếu media bị detach
      try { currentHls.attachMedia(vel); } catch (e) {}
      return;
    } catch (e) {
      console.warn('softSwap HLS fail', e);
    }
  }

  try {
    const onMeta = () => {
      stickSeek();
      vel.removeEventListener('loadedmetadata', onMeta);
    };
    vel.addEventListener('loadedmetadata', onMeta);
    vel.src = masterUrl;
    vel.load();
  } catch (e) {
    console.warn('softSwap native fail', e);
  }
}

function setupHlsPlayer(vel, murlOrList, section, autoRetryCount, candidateIndex) {
  autoRetryCount = autoRetryCount || 0;
  candidateIndex = candidateIndex || 0;

  const list = Array.isArray(murlOrList) ? murlOrList.filter(Boolean) : (murlOrList ? [murlOrList] : []);
  if (!list.length || candidateIndex >= list.length) {
    if (vel) vel.style.opacity = '1';
    showVideoErrorOverlay(vel, (list && list[0]) || '', section, list || []);
    return;
  }

  const murl = list[candidateIndex];
  section._videoCandidates = list;
  section._videoCandidateIndex = candidateIndex;

  if (currentPlyr) { try { currentPlyr.destroy(); } catch (e) {} currentPlyr = null; }
  if (currentHls) { try { currentHls.destroy(); } catch (e) {} currentHls = null; }
  vel.style.display = 'block';
  vel.style.opacity = '0';
  vel.style.transition = 'opacity .2s ease';
  vel.removeAttribute('controls'); // tránh nháy native 0:00 trước khi Plyr gắn
  // Xóa overlay lỗi cũ nếu có
  section.querySelectorAll('.video-error-overlay').forEach(el => el.remove());

  const failThisUrl = () => {
    if (candidateIndex + 1 < list.length) {
      // Chuyển ngay sang URL kế (media → cophamlieu-media …)
      setupHlsPlayer(vel, list, section, 0, candidateIndex + 1);
      return;
    }
    showVideoErrorOverlay(vel, murl, section, list);
  };

  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    currentHls = new Hls({ maxBufferLength: 30, enableWorker: true });
    currentHls.loadSource(murl);
    currentHls.attachMedia(vel);
    currentHls.on(Hls.Events.MANIFEST_PARSED, () => {
      try { vel.style.opacity = '1'; } catch (e) {}
      try { vel.play().catch(() => {}); } catch (e) {}
    });
    currentHls.on(Hls.Events.ERROR, (_, d) => {
      if (!d.fatal) return;
      // Fatal: retry 1 lần cùng URL, rồi chuyển candidate — KHÔNG kẹt startLoad() mãi
      if (autoRetryCount < VIDEO_MAX_AUTO_RETRY) {
        setTimeout(() => setupHlsPlayer(vel, list, section, autoRetryCount + 1, candidateIndex), 500);
      } else {
        failThisUrl();
      }
    });
  } else if (vel.canPlayType('application/vnd.apple.mpegurl')) {
    vel.src = murl;
    const onErr = () => {
      vel.removeEventListener('error', onErr);
      if (autoRetryCount < VIDEO_MAX_AUTO_RETRY) {
        setTimeout(() => setupHlsPlayer(vel, list, section, autoRetryCount + 1, candidateIndex), 500);
      } else {
        failThisUrl();
      }
    };
    vel.addEventListener('error', onErr);
    vel.addEventListener('loadedmetadata', () => {
      try { vel.style.opacity = '1'; } catch (e) {}
      try { vel.play().catch(() => {}); } catch (e) {}
    }, { once: true });
  } else {
    failThisUrl();
    return;
  }

  const qualityNum = parseInt((COURSE.teacher.resLabel || '').replace(/\D/g, ''), 10) || 1080;

  currentPlyr = new Plyr(vel, {
    controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
    tooltips: { controls: false, seek: true },
    keyboard: { focused: false, global: false },
    fullscreen: { enabled: true, fallback: true, iosNative: true },
    quality: { default: qualityNum, options: [qualityNum], forced: true, onChange: () => {} },
    i18n: {
      play: 'Phát', pause: 'Tạm dừng', mute: 'Tắt tiếng', unmute: 'Bật tiếng',
      settings: 'Cài đặt', pip: 'Hình trong hình', fullscreen: 'Toàn màn hình',
      speed: 'Tốc độ', normal: 'Bình thường', quality: 'Chất lượng',
      loop: 'Lặp lại', start: 'Bắt đầu', end: 'Kết thúc',
      captions: 'Phụ đề', disabled: 'Tắt', enabled: 'Bật'
    }
  });

  attachVideoKeyboardShortcuts(currentPlyr, vel, section);
  // Hiện player khi Plyr sẵn sàng (tránh khung native 0:00 nháy)
  const reveal = () => { try { vel.style.opacity = '1'; } catch (e) {} };
  if (currentPlyr) {
    currentPlyr.on('ready', reveal);
    currentPlyr.on('loadeddata', reveal);
  }
  setTimeout(reveal, 1200);
}

function showVideoErrorOverlay(section, originalUrl, wrapper, candidates) {
  if (!wrapper) wrapper = section;
  if (wrapper.querySelector && wrapper.querySelector('.video-error-overlay')) return;
  if (section && section.style) section.style.display = 'none';
  if (currentPlyr) { try { currentPlyr.destroy(); } catch (e) {} currentPlyr = null; }
  if (currentHls) { try { currentHls.destroy(); } catch (e) {} currentHls = null; }

  const list = (candidates && candidates.length)
    ? candidates
    : (wrapper._videoCandidates || (originalUrl ? [originalUrl] : []));

  const overlay = mk('div', 'video-error-overlay state');
  overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);color:#fff;z-index:10;display:flex;flex-direction:column;gap:14px;justify-content:center;align-items:center;padding:20px;text-align:center;border-radius:10px;';

  const msg = document.createElement('div');
  msg.innerHTML = '<p style="color:#ffbe76;font-weight:600;margin-bottom:4px;">Đã xảy ra lỗi, vui lòng thử lại!</p>';
  overlay.appendChild(msg);

  const btn = document.createElement('button');
  btn.className = 'btn-support';
  btn.style.cssText = 'display:flex;background:#e1b12c;color:#0F172A;padding:10px 20px;';
  btn.textContent = 'Thử lại';
  btn.addEventListener('click', () => {
    wrapper.innerHTML = '';
    const vel = document.createElement('video');
    vel.controls = true;
    vel.setAttribute('playsinline', 'true');
    wrapper.appendChild(vel);
    setupHlsPlayer(vel, list.length ? list : originalUrl, wrapper, 0, 0);
  });

  overlay.appendChild(btn);
  wrapper.appendChild(overlay);
  if (wrapper.style) wrapper.style.position = wrapper.style.position || 'relative';
}


/* ===== Phím tắt kiểu YouTube + overlay hiển thị giữa video ===== */
function videoOverlaySvg(kind) {
  const M = {
    play: '<path d="M8 5v14l11-7z"/>',
    pause: '<path d="M6 5h4v14H6zM14 5h4v14h-4z"/>',
    fwd: '<path d="M13 5v14l8-7z"/><path d="M4 5v14l8-7z"/>',
    rew: '<path d="M11 5v14l-8-7z"/><path d="M20 5v14l-8-7z"/>',
    volUp: '<path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
    volDown: '<path d="M4 9v6h4l5 5V4L8 9H4z"/>',
    mute: '<path d="M4 9v6h4l5 5V4L8 9H4z"/><line x1="16" y1="9" x2="21" y2="14"/><line x1="21" y1="9" x2="16" y2="14"/>'
  };
  return `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="0">${M[kind] || M.play}</svg>`;
}

function attachVideoKeyboardShortcuts(plyr, vel, section) {
  let overlayTimer = null;
  const overlay = mk('div', 'video-kbd-overlay');
  overlay.innerHTML = '<span class="vko-icon"></span><span class="vko-label"></span>';
  section.appendChild(overlay);

  function flash(kind, label) {
    overlay.querySelector('.vko-icon').innerHTML = videoOverlaySvg(kind);
    overlay.querySelector('.vko-label').textContent = label;
    overlay.classList.remove('show'); void overlay.offsetWidth; overlay.classList.add('show');
    clearTimeout(overlayTimer);
    overlayTimer = setTimeout(() => overlay.classList.remove('show'), 650);
  }

  section.tabIndex = 0; // cho phép nhận sự kiện bàn phím khi rê chuột / chạm vào khu vực video
  section.addEventListener('keydown', onKey);
  section.addEventListener('mouseenter', () => section.focus({ preventScroll: true }));

  function onKey(e) {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    switch (e.key) {
      case ' ': case 'k': case 'K':
        e.preventDefault();
        if (plyr.playing) { plyr.pause(); flash('pause', 'Tạm dừng'); }
        else { plyr.play(); flash('play', 'Phát'); }
        break;
      case 'ArrowRight': case 'l': case 'L':
        e.preventDefault(); plyr.currentTime = Math.min(plyr.duration, plyr.currentTime + 10); flash('fwd', 'Tua tới 10 giây'); break;
      case 'ArrowLeft': case 'j': case 'J':
        e.preventDefault(); plyr.currentTime = Math.max(0, plyr.currentTime - 10); flash('rew', 'Tua lùi 10 giây'); break;
      case 'ArrowUp':
        e.preventDefault(); plyr.increaseVolume(0.05); flash(plyr.muted ? 'mute' : 'volUp', 'Âm lượng ' + Math.round((plyr.muted ? 0 : plyr.volume) * 100) + '%'); break;
      case 'ArrowDown':
        e.preventDefault(); plyr.decreaseVolume(0.05); flash(plyr.muted ? 'mute' : 'volDown', 'Âm lượng ' + Math.round((plyr.muted ? 0 : plyr.volume) * 100) + '%'); break;
      case 'm': case 'M':
        e.preventDefault(); plyr.muted = !plyr.muted; flash(plyr.muted ? 'mute' : 'volUp', plyr.muted ? 'Đã tắt tiếng' : 'Đã bật tiếng'); break;
      case 'f': case 'F':
        e.preventDefault(); plyr.fullscreen.toggle(); break;
    }
  }
}

function addFsBtn(section) {
  const fsBtn = mk('button', 'fs-btn');
  fsBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;

  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      section.requestFullscreen().catch(err => console.warn('Lỗi Fullscreen:', err));
    } else {
      document.exitFullscreen();
    }
  });

  section.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement === section) {
      fsBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6m10-6h-6v6M4 10h6V4m10 6h-6V4"/></svg>`;
    } else {
      fsBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`;
    }
  });

  section.appendChild(fsBtn);
}

/* =====================================================================
 * RENDER MỘT BÀI HỌC (video / pdf / nhúng / thi online)
 * ===================================================================== */
function renderLesson(unit) {
  clearVideoRenewTimer();
  if (currentPlyr) { try { currentPlyr.destroy(); } catch (e) {} currentPlyr = null; }
  if (currentHls) { try { currentHls.destroy(); } catch (e) {} currentHls = null; }
  const area = document.getElementById('content'); area.innerHTML = '';
  const type = (unit.type || 'video').toLowerCase();
  const titleLower = (unit.title || '').toLowerCase();
  let hasSupportInfo = false;
  const mBody = document.getElementById('modal-content'); mBody.innerHTML = '';
  document.getElementById('modal-title').textContent = unit.title || 'Bài học';

  mBody.innerHTML = '';

  // Modal tối giản: Mô tả + Đính kèm (kiểu tham chiếu)
  if (unit.description && cleanDesc(unit.description).trim()) {
    hasSupportInfo = true;
    mBody.innerHTML += `<div class="modal-section-label">Mô tả:</div><div class="modal-desc">${cleanDesc(unit.description)}</div>`;
  }

  if (unit.syllabus?.length) {
    hasSupportInfo = true;
    let attHtml = `<div class="modal-section-label">Đính kèm:</div>`;
    unit.syllabus.forEach(f => {
      const bucket = normalizeBucket((f.origin?.bucket || CFG.docBucket)).replace(/\/?$/, '/');
      const furl = normalizeBucket((f.link || '').startsWith('http') ? f.link : bucket + (f.link || ''));
      const name = esc(f.title || 'Tài liệu');
      attHtml += `<a class="attach-row" href="${furl}" target="_blank" rel="noopener"><span class="att-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></span><span class="att-name" title="${name}">${name}</span><span class="att-dl">Tải xuống</span></a>`;
    });
    mBody.innerHTML += attHtml;
  }

  setSupportAvailable(hasSupportInfo);

  if (type === 'video') {
    clearVideoRenewTimer();
    const meta = extractVideoMeta(unit);
    const section = mk('div', 'viewer-wrap dark');
    const vel = document.createElement('video');
    vel.setAttribute('playsinline', 'true');
    vel.setAttribute('preload', 'metadata');
    section.appendChild(vel);
    area.appendChild(section);

    const teacher = (COURSE && COURSE.teacher) || TEACHER || {};
    const useGrant = meta.resourceId && teacherUsesGrantVideo(teacher);
    if (useGrant) {
      playGrantedVideo(vel, section, meta.resourceId, 0, false).catch(err => {
        console.error(err);
        const candidates = resolveVideoCandidates(unit);
        if (candidates.length) setupHlsPlayer(vel, candidates, section, 0, 0);
        else section.appendChild(mkNotice('blue', warnSvg(), 'Không phát được video', err.message || 'Lỗi grant-video'));
      });
    } else {
      const candidates = resolveVideoCandidates(unit);
      if (!candidates.length) {
        return area.appendChild(mkNotice('blue', warnSvg(), 'Bài giảng đang được thiết lập', 'Bài giảng bạn đang xem hiện đang được thiết lập. Vui lòng chuyển sang bài giảng khác.'));
      }
      setupHlsPlayer(vel, candidates, section, 0, 0);
    }

  } else if (type === 'pdf') {
    const pdf = unit.pdf || unit.data || {};
    const firstUrl = normalizeBucket((pdf.link || unit.link || '').startsWith('http') ? (pdf.link || unit.link) : (pdf.origin?.bucket || CFG.docBucket).replace(/\/?$/, '/') + (pdf.link || unit.link));
    const section = mk('div', 'viewer-wrap');
    section.style.cssText = 'display: flex; flex-direction: column; height: 82dvh;';

    const toolbar = mk('div', 'pdf-control-bar');
    toolbar.innerHTML = `
      <button id="pdf-thumb-toggle" class="pdf-btn" title="Xem trước các trang">${pdfScrollSvg()}</button>
      <span style="opacity:.3">|</span>
      <span>Trang <span id="pdf-page-num" style="font-weight:600">1</span> / <span id="pdf-page-count">-</span></span>
      <span style="opacity:.3">|</span>
      <button id="pdf-zoom-out" class="pdf-btn">${pdfZoomSvg('out')}</button>
      <span id="pdf-zoom-text">100%</span>
      <button id="pdf-zoom-in" class="pdf-btn">${pdfZoomSvg('in')}</button>
      <span style="opacity:.3">|</span>
      <a id="pdf-download" class="pdf-btn" download title="Tải tài liệu">${pdfDownloadSvg()}</a>
    `;

    const body = mk('div', 'pdf-body');
    const thumbRail = mk('div', 'pdf-thumb-rail');
    thumbRail.id = 'pdf-thumb-rail';
    const canvasWrap = mk('div', 'pdf-canvas-container');
    body.appendChild(thumbRail);
    body.appendChild(canvasWrap);

    section.appendChild(toolbar);
    section.appendChild(body);
    area.appendChild(section);
    addFsBtn(section);

    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = false;

    currentPdfDoc = null;
    isPdfRendering = false;
    let pdfBaseScale = 1;
    let pageObserver = null, thumbObserver = null;
    let pageRatios = {};

    const pageNumEl = toolbar.querySelector('#pdf-page-num');
    const pageCountEl = toolbar.querySelector('#pdf-page-count');
    const zoomTextEl = toolbar.querySelector('#pdf-zoom-text');
    const downloadBtn = toolbar.querySelector('#pdf-download');
    const thumbToggleBtn = toolbar.querySelector('#pdf-thumb-toggle');

    thumbToggleBtn.addEventListener('click', () => thumbRail.classList.toggle('show'));

    function updateZoomLabel() { zoomTextEl.textContent = Math.round((currentPdfScale / pdfBaseScale) * 100) + '%'; }

    function highlightThumb(num) {
      thumbRail.querySelectorAll('.pdf-thumb-item.active').forEach(el => el.classList.remove('active'));
      const el = thumbRail.querySelector(`.pdf-thumb-item[data-page="${num}"]`);
      if (el) el.classList.add('active');
    }

    function renderScrollMode() {
      if (pageObserver) { pageObserver.disconnect(); pageObserver = null; }
      pageRatios = {};
      canvasWrap.innerHTML = '';
      const list = mk('div', 'pdf-scroll-list');
      canvasWrap.appendChild(list);
      const total = currentPdfDoc.numPages;
      const pageEls = [];

      for (let i = 1; i <= total; i++) {
        const holder = mk('div', 'pdf-scroll-page placeholder');
        holder.dataset.page = i;
        holder.textContent = `Trang ${i}`;
        list.appendChild(holder);
        pageEls.push(holder);
      }

      function renderInto(holder, num) {
        if (holder.dataset.rendered) return;
        holder.dataset.rendered = '1';
        currentPdfDoc.getPage(num).then(page => {
          const viewport = page.getViewport({ scale: currentPdfScale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width; canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');
          page.render({ canvasContext: ctx, viewport }).promise.then(() => {
            holder.classList.remove('placeholder');
            holder.textContent = '';
            holder.appendChild(canvas);
            const tag = mk('span', 'pg-num'); tag.textContent = num + ' / ' + total;
            holder.appendChild(tag);
          });
        });
      }

      // Cuộn mượt + đếm trang chuẩn: chọn trang có diện tích hiển thị (intersectionRatio) LỚN NHẤT
      // trong khung nhìn hiện tại làm "trang đang xem", thay vì trang đầu tiên chạm ngưỡng.
      pageObserver = new IntersectionObserver((entries) => {
        entries.forEach(en => {
          const num = parseInt(en.target.dataset.page, 10);
          pageRatios[num] = en.intersectionRatio;
          if (en.isIntersecting) renderInto(en.target, num);
        });
        let bestPage = null, bestRatio = 0;
        Object.keys(pageRatios).forEach(k => { if (pageRatios[k] > bestRatio) { bestRatio = pageRatios[k]; bestPage = k; } });
        if (bestPage) { pageNumEl.textContent = bestPage; highlightThumb(parseInt(bestPage, 10)); }
      }, { root: canvasWrap, rootMargin: '500px 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });

      pageEls.forEach(el => pageObserver.observe(el));
    }

    function rerenderAtScale() {
      canvasWrap.querySelectorAll('.pdf-scroll-page').forEach(h => { h.dataset.rendered = ''; h.classList.add('placeholder'); h.innerHTML = `Trang ${h.dataset.page}`; });
      renderScrollMode();
    }

    toolbar.querySelector('#pdf-zoom-in').addEventListener('click', () => {
      if (currentPdfScale >= pdfBaseScale * 3) return;
      currentPdfScale = Math.min(pdfBaseScale * 3, currentPdfScale * 1.15);
      updateZoomLabel(); rerenderAtScale();
    });
    toolbar.querySelector('#pdf-zoom-out').addEventListener('click', () => {
      if (currentPdfScale <= pdfBaseScale * 0.4) return;
      currentPdfScale = Math.max(pdfBaseScale * 0.4, currentPdfScale / 1.15);
      updateZoomLabel(); rerenderAtScale();
    });

    function scrollToPage(num) {
      const holder = canvasWrap.querySelector(`.pdf-scroll-page[data-page="${num}"]`);
      if (holder) holder.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderThumb(item) {
      const num = parseInt(item.dataset.page, 10);
      currentPdfDoc.getPage(num).then(page => {
        const vp = page.getViewport({ scale: 0.16 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise.then(() => {
          const wrap = item.querySelector('.pdf-thumb-canvas-wrap');
          wrap.innerHTML = ''; wrap.appendChild(canvas);
        });
      });
    }

    function buildThumbRail() {
      if (thumbObserver) { thumbObserver.disconnect(); thumbObserver = null; }
      thumbRail.innerHTML = '';
      const total = currentPdfDoc.numPages;
      for (let i = 1; i <= total; i++) {
        const item = mk('div', 'pdf-thumb-item');
        item.dataset.page = i;
        item.innerHTML = `<div class="pdf-thumb-canvas-wrap"></div><span>${i}</span>`;
        item.addEventListener('click', () => scrollToPage(i));
        thumbRail.appendChild(item);
      }
      thumbObserver = new IntersectionObserver((entries) => {
        entries.forEach(en => { if (en.isIntersecting) { renderThumb(en.target); thumbObserver.unobserve(en.target); } });
      }, { root: thumbRail, rootMargin: '300px 0px' });
      thumbRail.querySelectorAll('.pdf-thumb-item').forEach(el => thumbObserver.observe(el));
    }

    function loadPdf(url) {
      downloadBtn.href = url;
      canvasWrap.innerHTML = '<div class="state" style="min-height:200px"><div class="spinner"></div><p>Đang tải tài liệu...</p></div>';
      pdfjsLib.getDocument(proxied(url)).promise.then(pdfDoc_ => {
        currentPdfDoc = pdfDoc_;
        pageCountEl.textContent = pdfDoc_.numPages;
        return pdfDoc_.getPage(1).then(p1 => {
          const vp1 = p1.getViewport({ scale: 1 });
          const containerWidth = Math.max(240, canvasWrap.clientWidth - 40);
          pdfBaseScale = containerWidth / vp1.width;
          currentPdfScale = pdfBaseScale;
          updateZoomLabel();
          renderScrollMode();
          buildThumbRail();
        });
      }).catch(err => {
        console.warn('Lỗi phân giải PDF qua luồng trực tiếp:', err);
        canvasWrap.innerHTML = `
          <div class="err" style="margin: auto; max-width: 450px; text-align:center;">
            Không thể hiển thị tài liệu trực tiếp (do chặn CORS trình duyệt).<br>
            <a href="${url}" target="_blank" class="attach-btn" style="margin-top:10px; display:inline-flex;">Nhấp vào đây để tải / xem file PDF gốc</a>
          </div>`;
      });
    }

    loadPdf(firstUrl);

    if (hasSupportInfo) openModal();

  } else if (type === 'embedded' || type === 'link' || type === 'iframe') {
    let embedUrl = unit.link || unit.url || (unit.data && unit.data.link);
    if (!embedUrl) return area.appendChild(mkNotice('blue', warnSvg(), 'Thông báo', 'Nội dung nhúng đang cập nhật.'));
    const section = mk('div', 'viewer-wrap');
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    section.appendChild(iframe); area.appendChild(section);
    addFsBtn(section);
  } else if (['test', 'quiz', 'exam', 'reading-test', 'listening-test'].includes(type)) {
    renderExamLanding(unit);
  } else {
    area.appendChild(mkNotice('blue', warnSvg(), 'Thông báo', 'Vui lòng nhấn nút "Hỗ trợ bài học" để xem nội dung văn bản / tài liệu đi kèm của bài này.'));
  }
}

/* =====================================================================
 * BÀI KIỂM TRA / THI ONLINE (test, quiz, exam, reading-test, listening-test)
 * Đề (câu hỏi + đáp án đúng) được lấy qua 2 hàm server-side trong Code.gs
 * (getExamMeta = công khai, getExamQuestions = cần token, token nằm ở
 * Script Properties phía server - KHÔNG bao giờ chạm tới trình duyệt).
 * ===================================================================== */
const EXAM_META_CACHE = {};
let EXAM = null;
let examTimerInterval = null;

/* =====================================================================
 * AUTHORIZATION BÀI THI - CHẠY TRỰC TIẾP TRÊN TRÌNH DUYỆT
 * ===================================================================== */
const EXAM_API_BASE =
  'https://rt6i5wgkj4.execute-api.ap-southeast-1.amazonaws.com/prod';

const EXAM_AUTH_STORAGE_KEY = 'dominic_auth_tokens_v2';
const EXAM_AUTH_LEGACY_KEY = 'dominic_exam_authorization';

/** Token mặc định theo key giáo viên (seed lần đầu) */
function teacherDefaultToken(key) {
  const t = (TEACHERS || []).find(x => x.key === key) || (LOCAL_CONFIG.teachers || []).find(x => x.key === key);
  return (t && t.defaultToken) ? String(t.defaultToken).trim() : '';
}

function readAuthMap() {
  try {
    const raw = localStorage.getItem(EXAM_AUTH_STORAGE_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === 'object') return obj;
    }
  } catch (e) {}
  // Migrate legacy single token → gắn cho cô Liễu
  try {
    const legacy = localStorage.getItem(EXAM_AUTH_LEGACY_KEY);
    if (legacy && String(legacy).trim()) {
      return { lieu: String(legacy).trim(), troliupde: String(legacy).trim() };
    }
  } catch (e) {}
  return {};
}

function writeAuthMap(map) {
  localStorage.setItem(EXAM_AUTH_STORAGE_KEY, JSON.stringify(map || {}));
}

/** Seed token mặc định nếu chưa có mã cho giáo viên đó */
function seedDefaultTokens() {
  const map = readAuthMap();
  let changed = false;
  const list = TEACHERS.length ? TEACHERS : (LOCAL_CONFIG.teachers || []);
  list.forEach(t => {
    if (!t || !t.key) return;
    if (!map[t.key] || !String(map[t.key]).trim()) {
      const def = teacherDefaultToken(t.key);
      if (def) {
        map[t.key] = def;
        changed = true;
      }
    }
  });
  if (changed) writeAuthMap(map);
  return map;
}

function getTokenForTeacherKey(key) {
  if (!key) return '';
  const map = readAuthMap();
  const v = map[key];
  if (v && String(v).trim()) return String(v).trim();
  return teacherDefaultToken(key) || '';
}

/** Token đang dùng: theo giáo viên đang chọn (TEACHER), fallback token bất kỳ đã lưu */
function getExamAuthorization() {
  const key = (TEACHER && TEACHER.key) || (COURSE && COURSE.teacher && COURSE.teacher.key) || '';
  if (key) {
    const t = getTokenForTeacherKey(key);
    if (t) return t;
  }
  const map = readAuthMap();
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    if (map[keys[i]] && String(map[keys[i]]).trim()) return String(map[keys[i]]).trim();
  }
  // seed defaults
  const seeded = seedDefaultTokens();
  if (key && seeded[key]) return seeded[key];
  const any = Object.values(seeded).find(v => v && String(v).trim());
  return any ? String(any).trim() : '';
}

function saveTeacherToken(key, value) {
  const token = String(value || '').trim();
  if (!key) throw new Error('Thiếu key giáo viên');
  if (!token) throw new Error('Mã đang trống — hãy dán token rồi bấm Lưu.');
  const map = readAuthMap();
  map[key] = token;
  writeAuthMap(map);
}

function clearTeacherToken(key) {
  const map = readAuthMap();
  delete map[key];
  writeAuthMap(map);
}

function normalizeAuthorization(value) {
  return String(value || '').trim();
}

function teacherListForAuth() {
  // Gộp theo vendor: trợ lí cô Liễu dùng chung token với cô Liễu trong UI? Vẫn hiện riêng để rõ.
  return TEACHERS.length ? TEACHERS : (LOCAL_CONFIG.teachers || []);
}

function parseJwtExp(token) {
  try {
    const parts = String(token || '').replace(/^Bearer\s+/i, '').split('.');
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const payload = JSON.parse(atob(b64));
    if (!payload || !payload.exp) return null;
    return Number(payload.exp) * 1000;
  } catch (e) {
    return null;
  }
}

function formatTokenExpiry(token) {
  const expMs = parseJwtExp(token);
  if (!expMs) return { text: 'Không đọc được hạn', cls: '' };
  const d = new Date(expMs);
  const pad = n => String(n).padStart(2, '0');
  const label = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const now = Date.now();
  if (expMs < now) return { text: 'Hết hạn ' + label, cls: 'expired' };
  if (expMs - now < 7 * 24 * 3600 * 1000) return { text: 'Hết hạn ' + label, cls: 'warn' };
  return { text: 'Hết hạn ' + label, cls: '' };
}

function teacherUsesGrantVideo(t) {
  if (!t) return false;
  if (t.usesGrantVideo === true) return true;
  const k = t.key || '';
  return k === 'lieu' || k === 'troliupde' || k === 'duong';
}

function renderAuthTeacherList() {
  const box = document.getElementById('auth-teacher-list');
  if (!box) return;
  const map = seedDefaultTokens();
  const list = teacherListForAuth();
  const pencil = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

  box.innerHTML = list.map(t => {
    const token = (map[t.key] && String(map[t.key]).trim()) || teacherDefaultToken(t.key) || '';
    const exp = formatTokenExpiry(token);
    const expLine = token
      ? `<div class="arc-exp ${exp.cls}">${esc(exp.text)}</div>`
      : `<div class="arc-exp">Chưa có mã</div>`;
    return `<div class="auth-row-card" data-key="${esc(t.key)}">
      <div class="arc-name">${esc(t.name)}</div>
      <div class="arc-actions">
        <button type="button" class="auth-icon-btn" data-edit="${esc(t.key)}" title="Sửa mã" aria-label="Sửa">${pencil}</button>
        <button type="button" class="auth-icon-btn save" data-save="${esc(t.key)}" title="Lưu" aria-label="Lưu" hidden>${check}</button>
      </div>
      ${expLine}
      <div class="arc-edit"><input type="text" data-input="${esc(t.key)}" spellcheck="false" autocomplete="off" value="${esc(token)}" placeholder="Dán token mới..."></div>
      <div class="arc-msg" data-msg="${esc(t.key)}"></div>
    </div>`;
  }).join('');
}

function initExamAuthorization() {
  const panel = document.getElementById('auth-panel');
  const toggle = document.getElementById('auth-toggle');
  const closeBtn = document.getElementById('auth-panel-close');
  if (!panel || !toggle) return;
  if (toggle.dataset.wired === '1') return;
  toggle.dataset.wired = '1';

  seedDefaultTokens();

  const openPanel = () => {
    renderAuthTeacherList();
    panel.classList.add('show');
  };
  const closePanel = () => panel.classList.remove('show');

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    if (panel.classList.contains('show')) closePanel();
    else openPanel();
  });
  if (closeBtn) closeBtn.addEventListener('click', closePanel);

  panel.addEventListener('click', e => {
    const editKey = e.target.closest && e.target.closest('[data-edit]');
    const saveKey = e.target.closest && e.target.closest('[data-save]');
    if (editKey) {
      const key = editKey.getAttribute('data-edit');
      const card = panel.querySelector(`.auth-row-card[data-key="${CSS.escape(key)}"]`);
      if (!card) return;
      panel.querySelectorAll('.auth-row-card.editing').forEach(c => {
        if (c !== card) {
          c.classList.remove('editing');
          const s = c.querySelector('[data-save]');
          if (s) s.hidden = true;
        }
      });
      card.classList.add('editing');
      const saveBtn = card.querySelector('[data-save]');
      if (saveBtn) saveBtn.hidden = false;
      const inp = card.querySelector('input');
      if (inp) { inp.focus(); inp.select(); }
      return;
    }
    if (saveKey) {
      const key = saveKey.getAttribute('data-save');
      const card = panel.querySelector(`.auth-row-card[data-key="${CSS.escape(key)}"]`);
      const inp = card && card.querySelector('input');
      const msg = card && card.querySelector('[data-msg]');
      try {
        saveTeacherToken(key, inp ? inp.value : '');
        if (msg) { msg.textContent = 'Đã lưu'; msg.className = 'arc-msg show'; }
        setTimeout(() => renderAuthTeacherList(), 400);
      } catch (err) {
        if (msg) { msg.textContent = err.message; msg.className = 'arc-msg show err'; }
      }
    }
  });

  panel.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const inp = e.target.closest && e.target.closest('input[data-input]');
    if (!inp) return;
    e.preventDefault();
    const key = inp.getAttribute('data-input');
    const saveBtn = panel.querySelector(`[data-save="${CSS.escape(key)}"]`);
    if (saveBtn) saveBtn.click();
  });

  panel.addEventListener('click', e => {
    if (e.target === panel) closePanel();
  });
  document.addEventListener('click', e => {
    if (!panel.classList.contains('show')) return;
    if (e.target === toggle || (toggle && toggle.contains(e.target))) return;
    if (!panel.contains(e.target)) closePanel();
  });
}

async function examFetch(path, options = {}) {

  const authorization = getExamAuthorization();

  if (!authorization) {
    throw new Error(
      'Chưa nhập Authorization. Hãy bấm nút "Authorization" trên thanh đầu trang và nhập mã trước.'
    );
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
    Authorization: authorization
  };

  const response = await fetch(
    proxied(EXAM_API_BASE + path),
    {
      ...options,
      method: options.method || 'GET',
      headers
    }
  );

  const body = await response.text();

  let data = null;

  try {
    data = body ? JSON.parse(body) : null;
  } catch (e) {
    data = body;
  }

  if (!response.ok) {

    let detail = '';

    if (data && typeof data === 'object') {
      detail =
        data.message ||
        data.error ||
        data.detail ||
        JSON.stringify(data);
    } else {
      detail = String(data || response.statusText || '');
    }

    throw new Error(
      `HTTP ${response.status}: ${detail.substring(0, 1000)}`
    );
  }

  return data;
}

/* =====================================================================
 * apiFetch: dùng CHUNG một cơ chế Authorization (localStorage) cho MỌI
 * lệnh gọi tới các API json khác trong app (danh sách khoá học, cây bài
 * học, nội dung bài học...), bao gồm cả apiBase p9y4zl6vkd.
 * Trước đây Authorization chỉ được gắn cho phần bài thi (examFetch).
 * ===================================================================== */
async function apiFetch(url, options = {}) {

  const authorization = getExamAuthorization();

  if (!authorization) {
    throw new Error(
      'Chưa nhập Authorization. Hãy bấm nút "Authorization" trên thanh đầu trang và nhập mã trước.'
    );
  }

  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
    Authorization: authorization
  };

  const response = await fetch(proxied(url), {
    ...options,
    method: options.method || 'GET',
    headers
  });

  const body = await response.text();

  let data = null;

  try {
    data = body ? JSON.parse(body) : null;
  } catch (e) {
    data = body;
  }

  if (!response.ok) {

    let detail = '';

    if (data && typeof data === 'object') {
      detail = data.message || data.error || data.detail || JSON.stringify(data);
    } else {
      detail = String(data || response.statusText || '');
    }

    throw new Error(`HTTP ${response.status}: ${detail.substring(0, 1000)}`);
  }

  return data;
}

async function getExamMetaDirect(examId, vendorId) {

  const path =
    '/exam/' +
    encodeURIComponent(examId) +
    '?vendorId=' +
    encodeURIComponent(vendorId);

  /*
   * Meta có thể là public, nhưng gửi Authorization luôn
   * để test cùng một cơ chế xác thực.
   */
  return examFetch(path);
}

async function getExamQuestionsDirect(examId, vendorId) {

  const path =
    '/question/admin?exam=' +
    encodeURIComponent(examId) +
    '&vendorId=' +
    encodeURIComponent(vendorId);

  return examFetch(path);
}


function getLocalExamResult(examId) {
  try { const raw = localStorage.getItem('exam_result_' + examId); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
function saveLocalExamResult(examId, result) {
  try { localStorage.setItem('exam_result_' + examId, JSON.stringify(result)); } catch (e) { /* ignore */ }
}

/* ----- Màn hình giới thiệu (mô tả + đính kèm + thẻ "Bài kiểm tra" + kết quả gần nhất) ----- */
function renderExamLanding(unit) {
  document.body.classList.remove('exam-mode');
  const area = document.getElementById('content');
  const examId = unit.exam;
  const vendorId = (COURSE && COURSE.teacher && COURSE.teacher.vendorId) || '';

  let attHtml = '';
  if (unit.syllabus && unit.syllabus.length) {
    attHtml = unit.syllabus.map(f => {
      const bucket = normalizeBucket((f.origin?.bucket || CFG.docBucket)).replace(/\/?$/, '/');
      const furl = normalizeBucket((f.link || '').startsWith('http') ? f.link : bucket + (f.link || ''));
      const name = esc(f.title || 'Tài liệu');
      return `<a class="attach-row" href="${furl}" target="_blank" rel="noopener"><span class="att-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></span><span class="att-name" title="${name}">${name}</span><span class="att-dl">Tải xuống</span></a>`;
    }).join('');
  }
  const descHtml = (unit.description && cleanDesc(unit.description).trim())
    ? `<div class="desc-html" style="margin-bottom:22px;background:transparent;border-radius:0;padding:0">${cleanDesc(unit.description)}</div>`
    : `<div class="desc-html" style="margin-bottom:22px;background:transparent;border-radius:0;padding:0;color:#94A3B8">Bài tập này chưa có mô tả</div>`;

  const last = getLocalExamResult(examId);
  const resultHtml = last
    ? `<div class="exam-result-box has-result">
         <div class="exam-result-score"><b>${last.score10}</b><span>/ ${last.scale || 10}</span></div>
         <div style="font-size:13px;color:#64748B">${last.correct} câu đúng &middot; ${last.total - last.correct} câu sai &middot; làm lúc ${new Date(last.at).toLocaleString('vi-VN')}</div>
       </div>`
    : `<div class="exam-result-box">Bạn chưa hoàn thành bài kiểm tra này. Vui lòng nộp bài và xem kết quả sau khi đã hoàn tất.</div>`;

  area.innerHTML = `
    <div class="exam-landing">
      <div class="lesson-section">
        <div class="lesson-section-title">Mô tả bài giảng</div>
        ${descHtml}
        ${attHtml}
      </div>
      <div class="lesson-section">
        <div class="lesson-section-title">Bài kiểm tra</div>
        <div class="exam-info-card" id="exam-info-card">
          <div class="exam-info-item"><span>Thời gian</span><b id="exam-info-time">…</b></div>
          <div class="exam-info-item"><span>Thực hiện</span><b id="exam-info-attempts">…</b></div>
          <button class="exam-submit-btn exam-start-cta" id="exam-start-btn" disabled>Đang tải...</button>
        </div>
      </div>
      <div class="lesson-section">
        <div class="lesson-section-title">Kết quả</div>
        ${resultHtml}
      </div>
    </div>`;

  if (!examId) {
    document.getElementById('exam-info-time').textContent = '—';
    document.getElementById('exam-info-attempts').textContent = '—';
    const btn = document.getElementById('exam-start-btn');
    btn.textContent = 'Bài này chưa gắn đề thi'; btn.disabled = true;
    return;
  }

  getExamMetaDirect(examId, vendorId).then(meta => {
    EXAM_META_CACHE[examId] = meta;
    const s = meta.settings || {};
    document.getElementById('exam-info-time').textContent = s.selectedTime === 'unlimited' ? 'Không giới hạn' : ((s.expiredTime || 0) + ' phút');
    document.getElementById('exam-info-attempts').textContent = s.submitCount ? 'Giới hạn lượt làm' : 'Nhiều lần';
    const btn = document.getElementById('exam-start-btn');
    btn.disabled = false;
    btn.textContent = last ? 'Làm lại' : 'Bắt đầu làm';
    btn.addEventListener('click', () => startExam(unit, examId, vendorId));
  }).catch(err => {
    document.getElementById('exam-info-time').textContent = '—';
    document.getElementById('exam-info-attempts').textContent = '—';
    const btn = document.getElementById('exam-start-btn');
    btn.textContent = 'Thử lại'; btn.disabled = false;
    btn.onclick = () => renderExamLanding(unit);
  });
}

/* ----- Tải đề đầy đủ (câu hỏi + đáp án, qua server) rồi vào màn hình làm bài ----- */
function startExam(unit, examId, vendorId) {
  clearInterval(examTimerInterval);
  EXAM = null;
  try { localStorage.removeItem('exam_result_' + examId); } catch (e) {}
  const area = document.getElementById('content');
  area.innerHTML = '<div class="state"><div class="spinner"></div><p>Đang tải đề thi...</p></div>';
  startProgress();

  const metaPromise = EXAM_META_CACHE[examId] ? Promise.resolve(EXAM_META_CACHE[examId]) : getExamMetaDirect(examId, vendorId);

  Promise.all([metaPromise, getExamQuestionsDirect(examId, vendorId)]).then(([meta, rawQuestions]) => {
    doneProgress();
    EXAM_META_CACHE[examId] = meta;
    renderExamRunner(unit, examId, meta, Array.isArray(rawQuestions) ? rawQuestions : []);
  }).catch(err => {
    doneProgress();
    area.innerHTML = '';
    area.appendChild(mkNotice('blue', warnSvg(), 'Không tải được đề thi', err.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'));
  });
}

// Gộp nhóm (group) + câu hỏi (leaf có answers+correct) theo đúng thứ tự index của đề gốc.
// Dựng model câu hỏi theo ĐÚNG cấu trúc partition của đề (không xếp lẫn giữa các phần),
// hỗ trợ nhiều dạng thức: trắc nghiệm (single/multi-choice, nối, chọn danh sách, kéo thả xử lý
// như chọn danh sách để ổn định trên mobile), điền khuyết (rời hoặc điền ngay trong câu), đúng/sai nhiều ý.
function stripTags(html) { const d = document.createElement('div'); d.innerHTML = html || ''; return (d.textContent || '').trim(); }

function buildExamModel(meta, rawQuestions) {
  const byId = {};
  rawQuestions.forEach(q => { byId[q._id] = q; });
  const partitionSource = meta.partition || meta.partitions || meta.parts || {};
  const partitionsRaw = (Array.isArray(partitionSource) ? partitionSource : Object.values(partitionSource)).sort((a, b) => (a.index || 0) - (b.index || 0));
  const isAudioExam = (meta.type || '').toLowerCase() === 'listening-test';
  const atoms = [];
  let counter = 0;
  let partCounter = 0;
  // Chỉ đánh số lại từ 1 cho mỗi part khi đây là bài nghe nhiều part.
  // Bài kiểm tra thường (normal test) hoặc bài đọc trắc nghiệm đầy đủ luôn đánh số liên tục từ đầu đến cuối.
  const nextNum = () => isAudioExam ? ++partCounter : ++counter;
  const explainOf = (top) => cleanDesc((top.config && top.config.explain) || '');

  function buildNode(top) {
    if (!top) return null;
    const t = top.type || '';
    if (t === 'group') {
      const kids = (top.questions || []).map(cid => byId[cid]).filter(Boolean).sort((a, b) => (a.index || 0) - (b.index || 0));
      const children = kids.map(buildNode).filter(Boolean);
      const headerText = top.html ? stripTags(top.html) : '';
      return { render: 'container', headerHtml: headerText ? cleanDesc(top.html) : '', children };
    }
    if (t === 'link-question-group') {
      const pool = top.answers || {};
      const kids = (top.questions || []).map(cid => byId[cid]).filter(Boolean).sort((a, b) => (a.index || 0) - (b.index || 0));
      const children = kids.map(k => {
        const num = nextNum();
        const correctKey = Array.isArray(k.correct) ? k.correct[0] : k.correct;
        const atom = { id: k._id, kind: 'matching', num, answers: pool, correct: correctKey, explain: explainOf(k), stemHtml: cleanDesc(k.html || '') };
        atoms.push(atom);
        return { render: 'matching', atom };
      });
      return { render: 'matchingGroup', headerHtml: cleanDesc(top.html || ''), children, pool };
    }
    if (t === 'dropdown-question-group' || t === 'drag-drop-group') {
      const pool = top.answers || {};
      const kids = (top.questions || []).map(cid => byId[cid]).filter(Boolean);
      const topHtmlClean = cleanDesc(top.html || '');
      // Có 2 kiểu dữ liệu thật: (a) đoạn văn của cả nhóm chứa sẵn các chỗ trống {{key}} dùng chung
      // (VD nhóm chỉ có 1 câu) — dùng chung groupHtml; (b) đoạn văn nhóm chỉ là tiêu đề, không có
      // chỗ trống nào — khi đó MỖI câu có đoạn văn html RIÊNG của chính nó, phải dùng cái đó.
      const groupHasPlaceholders = /\{\{[^}]*\}\}/.test(topHtmlClean);
      const blanks = kids.map(k => {
        const num = nextNum();
        let correctKey = k.correct;
        if (Array.isArray(correctKey)) correctKey = correctKey[0];
        else if (correctKey && typeof correctKey === 'object') correctKey = Object.values(correctKey)[0];
        const atom = {
          id: k._id, kind: 'mcq', sheetKind: 'dropdown', num, answers: pool, correct: correctKey,
          key: String((k.config && k.config.key) || k.index), explain: explainOf(k),
          ownHtml: groupHasPlaceholders ? null : cleanDesc(k.html || '')
        };
        atoms.push(atom);
        return atom;
      });
      return { render: 'inlineselects', groupHtml: topHtmlClean, blanks, pool, isDragDrop: t === 'drag-drop-group', perChild: !groupHasPlaceholders };
    }
    if (t === 'direct-fill-blank-group') {
      const kids = (top.questions || []).map(cid => byId[cid]).filter(Boolean);
      const blanks = kids.map(k => {
        const num = nextNum();
        const variants = String(k.correct || '').split('//').map(s => s.trim()).filter(Boolean);
        const atom = { id: k._id, kind: 'fillblank', num, variants, key: String((k.config && k.config.key) || k.index), explain: explainOf(k) };
        atoms.push(atom);
        return atom;
      });
      return { render: 'inlineblanks', groupHtml: cleanDesc(top.html || ''), blanks };
    }
    if (/dictation|dictate|listen-and-write|search|find-and-copy/i.test(t)) {
      const num = nextNum();
      const variants = String(top.correct || top.answer || '').split('//').map(s => s.trim()).filter(Boolean);
      const audioSource = top.audio || top.resource || top.data?.resource || top.data?.audio || null;
      let audioUrl = '';
      if (typeof audioSource === 'string') audioUrl = audioSource;
      else if (audioSource) audioUrl = normalizeBucket((audioSource.origin?.bucket || '').replace(/\/?$/, '/') + (audioSource.origin?.link || audioSource.link || audioSource.url || ''));
      const atom = { id: top._id, kind: 'dictation', num, variants, explain: explainOf(top), audioUrl, stemHtml: cleanDesc(top.html || ''), mode:t };
      atoms.push(atom);
      return { render: 'dictation', atom, stemHtml: cleanDesc(top.html || '') };
    }
    if (t === 'fill-blank') {
      const num = nextNum();
      const variants = String(top.correct || '').split('//').map(s => s.trim()).filter(Boolean);
      const atom = { id: top._id, kind: 'fillblank', num, variants, explain: explainOf(top) };
      atoms.push(atom);
      return { render: 'fillblank', atom, stemHtml: cleanDesc(top.html || '') };
    }
    if (t === 'true-false-choice') {
      const num = nextNum();
      const atom = { id: top._id, kind: 'truefalse', num, items: top.answers || {}, correct: top.correct || {}, explain: explainOf(top) };
      atoms.push(atom);
      return { render: 'truefalse', atom, stemHtml: cleanDesc(top.html || '') };
    }
    if (top.answers && top.correct) {
      // single-choice-child / multiple-choice-child và các biến thể tương đương
      const num = nextNum();
      const correctKey = Array.isArray(top.correct) ? top.correct[0] : top.correct;
      const atom = { id: top._id, kind: 'mcq', num, answers: top.answers, correct: correctKey, explain: explainOf(top) };
      atoms.push(atom);
      return { render: 'mcq', atom, stemHtml: cleanDesc(top.html || '') };
    }
    if (top.html && (top.correct !== undefined || top.answer !== undefined || top.answers)) {
      const num = nextNum();
      const variants = String(top.correct ?? top.answer ?? '').split('//').map(s => s.trim()).filter(Boolean);
      const atom = { id: top._id, kind: 'dictation', num, variants, explain: explainOf(top), stemHtml: cleanDesc(top.html || ''), mode:t };
      atoms.push(atom);
      return { render: 'dictation', atom, stemHtml: cleanDesc(top.html || '') };
    }
    return null; // dạng chưa nhận diện được - bỏ qua an toàn, không làm vỡ giao diện
  }

  const partitions = partitionsRaw.map(part => {
    const atomStart = atoms.length;
    partCounter = 0;
    const nodes = (part.questions || []).map(id => buildNode(byId[id])).filter(Boolean);
    let passage = null;
    if (isAudioExam) {
      const res = part.data && part.data.resource;
      const url = res
        ? normalizeBucket((res.origin?.bucket || '').replace(/\/?$/, '/') + (res.origin?.link || res.link || ''))
        : normalizeBucket(part.description || '');
      passage = { kind: 'audio', url };
    } else if (part.description) {
      passage = { kind: 'text', html: cleanDesc(part.description) };
    }
    return { title: part.title || '', passage, nodes, atoms: atoms.slice(atomStart) };
  });

  // Nếu đề không dùng partition (isPartition=false / không có mục nào), coi toàn bộ câu hỏi gốc là 1 phần duy nhất.
  if (!partitions.length) {
    const roots = rawQuestions.filter(q => !rawQuestions.some(p => (p.questions || []).includes(q._id)));
    const nodes = roots.sort((a, b) => (a.index || 0) - (b.index || 0)).map(buildNode).filter(Boolean);
    partitions.push({ title: '', passage: null, nodes, atoms: atoms.slice() });
  }

  return { partitions, atoms };
}

/* ----- render từng loại câu hỏi ra HTML ----- */
function renderNode(node) {
  switch (node.render) {
    case 'container':
      return (node.headerHtml ? `<div class="exam-group-title">${node.headerHtml}</div>` : '') + node.children.map(renderNode).join('');
    case 'mcq': return renderMcqBlock(node.atom, node.stemHtml);
    case 'fillblank': return renderFillBlankBlock(node.atom, node.stemHtml);
    case 'truefalse': return renderTrueFalseBlock(node.atom, node.stemHtml);
    case 'inlineblanks': return renderInlineBlanksBlock(node);
    case 'inlineselects': return renderInlineSelectsBlock(node);
    case 'matchingGroup': return renderMatchingGroup(node);
    case 'dictation': return renderDictationBlock(node.atom, node.stemHtml);
    default: return '';
  }
}

function renderMcqBlock(atom, stemHtml) {
  const keys = Object.keys(atom.answers).sort((a, b) => (atom.answers[a].label || '').localeCompare(atom.answers[b].label || ''));
  const optsHtml = keys.map(k => {
    const a = atom.answers[k];
    return `<div class="exam-choice-row">
      <button type="button" class="exam-letter" data-qid="${atom.id}" data-key="${k}">${esc(a.label)}</button>
      <span class="exam-choice-text">${a.value}</span>
    </div>`;
  }).join('');
  return `<div class="exam-q" id="eq-${atom.id}" data-qnum="${atom.num}">
    <div class="exam-q-title"><span class="exam-q-num">${atom.num}.</span> ${stemHtml}</div>
    <div class="exam-opts">${optsHtml}</div>
  </div>`;
}

function renderMatchingGroup(node) {
  const rightKeys = Object.keys(node.pool || {}).sort((a,b) =>
    String(node.pool[a].label || '').localeCompare(String(node.pool[b].label || ''))
  );
  const leftHtml = node.children.map(ch => `
    <div class="exam-match-item" id="eq-${esc(ch.atom.id)}">
      <button type="button" class="exam-match-card exam-match-left-card" data-qid="${esc(ch.atom.id)}">
        <span class="exam-match-number">${ch.atom.num}.</span>
        <span>${ch.atom.stemHtml || ''}</span>
      </button>
    </div>`).join('');
  const rightHtml = rightKeys.map(k => `
    <div class="exam-match-item">
      <button type="button" class="exam-match-card exam-match-right-card" data-match-key="${esc(k)}">
        <span class="exam-match-number">${esc(node.pool[k].label || k)}.</span>
        <span>${node.pool[k].value || ''}</span>
      </button>
    </div>`).join('');
  return `<div class="exam-q exam-matching" data-matching-group="1" data-qnum="${node.children[0]?.atom.num || ''}">
    ${node.headerHtml ? `<div class="exam-q-title">${node.headerHtml}</div>` : ''}
    <div class="exam-matching-grid">
      <svg class="exam-match-svg" aria-hidden="true"></svg>
      <div class="exam-match-left">${leftHtml}</div>
      <div class="exam-match-right">${rightHtml}</div>
      <div class="exam-match-remove-layer"></div>
    </div>
    <div class="exam-match-explain-list" style="display:none"></div>
  </div>`;
}
function renderDictationBlock(atom, stemHtml) {
  const audio = atom.audioUrl ? `<audio controls preload="none" src="${esc(atom.audioUrl)}" style="width:min(560px,100%);margin:4px 0 10px"></audio>` : '';
  const modeLabel = audio ? (/search|find-and-copy/i.test(atom.mode || '') ? 'Tìm và chép lại' : 'Nghe và điền') : '';
  return `<div class="exam-q" id="eq-${atom.id}" data-qnum="${atom.num}">
    <div class="exam-q-title"><span class="exam-q-num">${atom.num}.</span> ${stemHtml}</div>
    ${modeLabel ? `<div style="font-size:.82em;color:#94A3B8;margin-bottom:8px">${modeLabel}</div>` : ''}${audio}
    <textarea class="exam-blank-input exam-blank-input-lg" data-qid="${atom.id}" placeholder="Nhập câu trả lời..." rows="2"></textarea>
  </div>`;
}

function renderFillBlankBlock(atom, stemHtml) {
  return `<div class="exam-q" id="eq-${atom.id}" data-qnum="${atom.num}">
    <div class="exam-q-title"><span class="exam-q-num">${atom.num}.</span> ${stemHtml}</div>
    <textarea class="exam-blank-input exam-blank-input-lg" data-qid="${atom.id}" placeholder="Nhập câu trả lời..." rows="2"></textarea>
  </div>`;
}

function renderTrueFalseBlock(atom, stemHtml) {
  const keys = Object.keys(atom.items);
  const rows = keys.map(k => {
    const it = atom.items[k];
    return `<div class="exam-tf-row">
      <span class="exam-tf-text">${esc(it.label)}. ${stripTags(it.value)}</span>
      <div class="exam-tf-btns">
        <button type="button" class="exam-tf-btn" data-qid="${atom.id}" data-key="${k}" data-val="true" id="etf-${atom.id}-${k}-true">Đúng</button>
        <button type="button" class="exam-tf-btn" data-qid="${atom.id}" data-key="${k}" data-val="false" id="etf-${atom.id}-${k}-false">Sai</button>
      </div>
    </div>`;
  }).join('');
  return `<div class="exam-q" id="eq-${atom.id}" data-qnum="${atom.num}">
    <div class="exam-q-title"><span class="exam-q-num">${atom.num}.</span> ${stemHtml}</div>
    <div class="exam-tf-group">${rows}</div>
  </div>`;
}

function renderInlineBlanksBlock(node) {
  let html = node.groupHtml;
  node.blanks.forEach(atom => {
    const re = new RegExp('\\{\\{\\s*' + atom.key + '\\s*\\}\\}', 'g');
    html = html.replace(re, `<span class="exam-blank-wrap" id="eq-${esc(atom.id)}"><b class="exam-blank-num">(${atom.num})</b><input type="text" class="exam-blank-input" data-qid="${atom.id}"></span>`);
  });
  return `<div class="exam-q exam-inline-group" data-qnum="${node.blanks[0] ? node.blanks[0].num : ''}">${html}<div class="exam-inline-explain-list" style="display:none"></div></div>`;
}

function renderInlineSelectsBlock(node) {
  const groupId = node.blanks[0] ? node.blanks[0].id : '';
  const selectHtmlFor = atom => {
    const options = Object.keys(atom.answers)
      .sort((a, b) => (atom.answers[a].label || '').localeCompare(atom.answers[b].label || ''))
      .map(k => `<option value="${k}">${esc(stripTags(atom.answers[k].value))}</option>`).join('');
    return `<select class="exam-inline-select" data-qid="${atom.id}"><option value="">--Chọn--</option>${options}</select>`;
  };
  // Kéo thả: ô trống là 1 khoảng trống có thể bấm để đặt từ vào, không phải dropdown xổ xuống.
  const dropSlotFor = atom => `<span class="exam-dragdrop-slot" data-group="${esc(groupId)}" data-qid="${esc(atom.id)}" data-empty-text="…"></span>`;
  const widgetFor = atom => node.isDragDrop ? dropSlotFor(atom) : selectHtmlFor(atom);

  if (node.perChild) {
    // Mỗi câu có đoạn văn riêng của chính nó (không dùng chung 1 đoạn với các câu khác trong nhóm).
    const bodyHtml = node.blanks.map(atom => {
      let html = atom.ownHtml || '';
      html = html.replace(/\{\{[^}]*\}\}/, `<span class="exam-blank-wrap" id="eq-${esc(atom.id)}"><b class="exam-blank-num">(${atom.num})</b>${widgetFor(atom)}</span>`);
      return `<div class="exam-inline-own-block">${html}</div>`;
    }).join('');
    return `<div class="exam-q exam-inline-group" data-qnum="${node.blanks[0] ? node.blanks[0].num : ''}" ${node.isDragDrop ? `data-dragdrop-group="${esc(groupId)}"` : ''}>
      ${node.isDragDrop ? dragDropBankHtml(node.pool, groupId) : ''}${bodyHtml}
      <div class="exam-inline-explain-list" style="display:none"></div>
    </div>`;
  }

  let html = node.groupHtml;
  html = html.replace(/\{\{\s*Answers\s*\}\}/gi, '');
  node.blanks.forEach(atom => {
    const re = new RegExp('\\{\\{\\s*' + atom.key + '\\s*\\}\\}', 'g');
    html = html.replace(re, `<span class="exam-blank-wrap" id="eq-${esc(atom.id)}"><b class="exam-blank-num">(${atom.num})</b>${widgetFor(atom)}</span>`);
  });
  return `<div class="exam-q exam-inline-group" data-qnum="${node.blanks[0] ? node.blanks[0].num : ''}" ${node.isDragDrop ? `data-dragdrop-group="${esc(groupId)}"` : ''}>
    ${node.isDragDrop ? dragDropBankHtml(node.pool, groupId) : ''}${html}
    <div class="exam-inline-explain-list" style="display:none"></div>
  </div>`;
}
function dragDropBankHtml(pool, groupId) {
  const keys = Object.keys(pool).sort((a, b) => (pool[a].label || '').localeCompare(pool[b].label || ''));
  return `<div class="exam-dragbank" data-group="${esc(groupId)}">` + keys
    .map(k => `<button type="button" class="exam-dragbank-item" data-group="${esc(groupId)}" data-key="${esc(k)}">${esc(stripTags(pool[k].value))}</button>`).join('') + '</div>';
}

/* ----- Phiếu trả lời nhanh: chia trang 10 câu/trang, mỗi loại câu hỏi hiển thị đúng kiểu chọn của nó ----- */
function examSheetRowHtml(atom) {
  if (atom.kind === 'matching') {
    const keys = Object.keys(atom.answers || {}).sort((a,b) => String(atom.answers[a].label || a).localeCompare(String(atom.answers[b].label || b)));
    const opts = keys.map(k => `<button type="button" class="exam-sheet-match-opt" data-qid="${esc(atom.id)}" data-key="${esc(k)}">${esc(atom.answers[k].label || k)}</button>`).join('');
    return `<div class="exam-sheet-row exam-sheet-matching-row"><span class="qnum" data-jump="${atom.id}">${atom.num}</span><div class="exam-sheet-opts">${opts}</div></div>`;
  }
  if (atom.sheetKind === 'dropdown') {
    const selected = EXAM && EXAM.answers ? EXAM.answers[atom.id] : null;
    const label = selected != null && atom.answers[selected] ? stripTags(atom.answers[selected].value || atom.answers[selected].label || '') : '';
    return `<div class="exam-sheet-row"><span class="qnum" data-jump="${atom.id}">${atom.num}</span><div class="exam-sheet-dropdown-preview${label ? '' : ' is-empty'}" data-qid="${esc(atom.id)}">${esc(label || '…')}</div></div>`;
  }
  if (atom.kind === 'mcq') {
    const keys = Object.keys(atom.answers).sort((a, b) => (atom.answers[a].label || '').localeCompare(atom.answers[b].label || ''));
    const lettersHtml = keys.map(k => `<button type="button" class="exam-letter" data-qid="${atom.id}" data-key="${k}">${esc(atom.answers[k].label)}</button>`).join('');
    return `<div class="exam-sheet-row"><span class="qnum" data-jump="${atom.id}">${atom.num}</span><div class="exam-sheet-opts">${lettersHtml}</div></div>`;
  }
  if (atom.kind === 'fillblank' || atom.kind === 'dictation') {
    return `<div class="exam-sheet-row"><span class="qnum" data-jump="${atom.id}">${atom.num}</span><input type="text" class="exam-sheet-textmini" data-qid="${atom.id}" placeholder="…"></div>`;
  }
  return `<div class="exam-sheet-row"><span class="qnum" data-jump="${atom.id}">${atom.num}</span><span class="exam-sheet-dot" id="esh-dot-${atom.id}"></span></div>`;
}
function examSheetPagesHtml(atoms) {
  // Hiển thị đủ toàn bộ số câu của phần hiện tại, không chia nhỏ theo từng danh sách 10 câu.
  return `<div class="exam-sheet-page show" data-page="0">${atoms.map(examSheetRowHtml).join('')}</div>`;
}

function renderExamRunner(unit, examId, meta, rawQuestions, requestedPart) {
  document.body.classList.add('exam-mode');
  const model = EXAM && EXAM.examId === examId ? EXAM.model : buildExamModel(meta, rawQuestions);
  const atoms = model.atoms;
  const examType = (meta.type || unit.type || '').toLowerCase();
  const isReading = examType === 'reading-test';
  const isListening = examType === 'listening-test';
  const settings = meta.settings || {};
  const scale = settings.selectedTypeScore === '100-mark' ? 100 : 10;
  const sources=[meta.partitions,meta.partition,meta.parts].filter(Boolean);
  const declaredParts=sources.reduce((m,x)=>Math.max(m,Array.isArray(x)?x.length:Object.keys(x||{}).length),0);
  const partCount=Math.max(1,model.partitions.length,declaredParts);
  const previous = (EXAM && EXAM.examId === examId) ? EXAM : null;
  const currentPart = Math.max(0, Math.min(partCount - 1,
    Number.isInteger(requestedPart) ? requestedPart : (previous ? (previous.currentPart || 0) : 0)));

  EXAM = previous || {
    examId, unit, meta, model, atoms, answers: {}, submitted: false,
    startedAt: Date.now(), scale, highlightMode: false, currentPart, _matchingPending:{left:null,right:null}
  };
  EXAM.unit = unit;
  EXAM.meta = meta;
  EXAM.model = model;
  EXAM.atoms = atoms;
  EXAM.scale = scale;
  EXAM.currentPart = currentPart;

  const part = model.partitions[currentPart] || {title:'', passage:null, nodes:[], atoms:[]};
  const partAtoms = part.atoms || [];
  const partLabel = `${currentPart + 1} / ${partCount}`;

  let bodyInner;

  if (isReading) {
    const passageHtml = part.passage && part.passage.kind === 'text'
      ? part.passage.html
      : '';
    const passageTitle = part.title ? `<h4 style="margin:0 0 12px">${esc(part.title)}</h4>` : '';
    const questionsHtml = part.nodes.map(renderNode).join('');
    bodyInner = `
      <div class="exam-passage" id="exam-passage">${passageTitle}${passageHtml}</div>
      <div class="exam-questions" id="exam-questions">${questionsHtml}</div>`;
  } else {
    let head = '';
    if (isListening && part.passage && part.passage.kind === 'audio' && part.passage.url) {
      head = `<div class="exam-audio-bar">${part.title ? `<b style="display:block;margin-bottom:6px">${esc(part.title)}</b>` : ''}<audio controls preload="none" src="${esc(part.passage.url)}"></audio></div>`;
    } else if (part.title) {
      head = `<h4 style="margin:0 0 14px">${esc(part.title)}</h4>`;
    }

    bodyInner = `
      <div class="exam-questions" id="exam-questions">
        ${head}${part.nodes.map(renderNode).join('')}
      </div>
      <div class="exam-nav" id="exam-nav">
        <h4>Phiếu trả lời${part.title ? ' · ' + esc(part.title) : (partCount > 1 ? ' · Phần ' + (currentPart + 1) : '')}</h4>
        <div class="exam-sheet-scroll" id="exam-sheet-pages">${examSheetPagesHtml(partAtoms)}</div>
        <div class="exam-sheet-part-pager">
          <button type="button" id="exam-sheet-part-prev" ${currentPart===0?'disabled':''}>‹</button>
          <span id="exam-sheet-part-indicator">${partLabel}</span>
          <button type="button" id="exam-sheet-part-next" ${currentPart===partCount-1?'disabled':''}>›</button>
        </div>
      </div>
      <div class="exam-mobile-sheet-backdrop" id="exam-mobile-sheet-backdrop"></div>
      <button type="button" class="exam-mobile-answerbar" id="exam-mobile-answerbar">
        <span>Trả lời</span>
        <span class="exam-mobile-answerbar-count">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></svg>
          <b id="exam-mobile-answered-txt">0/${atoms.length}</b>
        </span>
      </button>`;
  }

  const area = document.getElementById('content');
  area.innerHTML = `
    <div class="exam-runner" id="exam-runner">
      <div class="exam-toolbar">
        <div class="exam-timer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>
          <span id="exam-timer-txt">00:00</span>
        </div>

        <div class="exam-fontsize-group" title="Cỡ chữ">
          <button type="button" id="exam-font-dec">A-</button>
          <button type="button" id="exam-font-inc">A+</button>
        </div>

        <button type="button" class="exam-tool-btn" id="exam-highlight-toggle" title="Đánh dấu bôi màu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l6-6 4 4-6 6H9v-4z"/><path d="M3 21l4-1 8-8-3-3-8 8-1 4z"/></svg>
        </button>

        <button type="button" class="exam-tool-btn" id="exam-darkmode-toggle" title="Chế độ tối">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>
        </button>

        <div class="exam-part-tabs" id="exam-part-tabs" title="Chuyển phần">
          ${partCount > 1 ? model.partitions.map((p, i) => `<button type="button" class="exam-part-tab ${i === currentPart ? 'active' : ''}" data-part-index="${i}">${esc(p.title || ('Phần ' + (i + 1)))}</button>`).join('') : ''}
        </div>

        <div class="exam-answered" id="exam-answered-txt">Đã trả lời: 0 / ${atoms.length}</div>
        <button type="button" class="exam-submit-btn exam-submit-toolbar" id="exam-action-btn">
          ${EXAM.submitted ? 'Quay lại' : 'Nộp bài'}
        </button>
      </div>

      <div class="exam-body ${isReading ? 'split' : ''}">${bodyInner}</div>
    </div>`;

  startExamTimer();
  wireExamEvents();
  updateAnsweredCount();
  updateMatchingSheetUI();
  if (EXAM.submitted) applyExamReviewColors();
}

function startExamTimer() {
  clearInterval(examTimerInterval);
  const txt = document.getElementById('exam-timer-txt');
  examTimerInterval = setInterval(() => {
    if (!EXAM || !txt) { clearInterval(examTimerInterval); return; }
    const sec = Math.floor((Date.now() - EXAM.startedAt) / 1000);
    txt.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
  }, 1000);
}

function autosizeBlankInput(el) {
  if (!el || el.classList.contains('exam-blank-input-lg')) return;
  const len = (el.value || '').length;
  el.style.width = Math.max(6, Math.min(26, len + 2)) + 'ch';
}

function wireExamEvents() {
  const qEl = document.getElementById('exam-questions');
  if (!qEl) return;

  qEl.addEventListener('click', e => {
    const dragRemove = e.target.closest('.exam-dragdrop-remove');
    if (dragRemove) { examDragDropRemove(dragRemove.dataset.qid, dragRemove.dataset.group); return; }
    const dragSlot = e.target.closest('.exam-dragdrop-slot');
    if (dragSlot) { examDragDropPick('blank', dragSlot.dataset.qid, dragSlot.dataset.group); return; }
    const dragPill = e.target.closest('.exam-dragbank-item');
    if (dragPill && !dragPill.disabled) { examDragDropPick('pool', dragPill.dataset.key, dragPill.dataset.group); return; }

    const matchLeft = e.target.closest('.exam-match-left-card');
    if (matchLeft) { examMatchingPick(matchLeft.dataset.qid, null, matchLeft.closest('.exam-matching')); return; }
    const matchRight = e.target.closest('.exam-match-right-card');
    if (matchRight) { examMatchingPick(null, matchRight.dataset.matchKey, matchRight.closest('.exam-matching')); return; }
    const matchRemove = e.target.closest('[data-remove-match]');
    if (matchRemove) {
      examMatchingRemove(matchRemove.closest('.exam-matching'), matchRemove.dataset.removeMatch);
      return;
    }
    const letBtn = e.target.closest('.exam-letter');
    if (letBtn) { examSelectAnswer(letBtn.dataset.qid, letBtn.dataset.key); return; }

    const tfBtn = e.target.closest('.exam-tf-btn');
    if (tfBtn) { examSetTF(tfBtn.dataset.qid, tfBtn.dataset.key, tfBtn.dataset.val); return; }

    const actBtn = e.target.closest('#exam-action-btn');
    if (actBtn) handleActionBtn();
  });

  qEl.addEventListener('input', e => {
    if (e.target.classList.contains('exam-blank-input')) {
      examSetText(e.target.dataset.qid, e.target.value);
      autosizeBlankInput(e.target);
      const mini = document.querySelector(`.exam-sheet-textmini[data-qid="${e.target.dataset.qid}"]`);
      if (mini && mini.value !== e.target.value) mini.value = e.target.value;
    }
  });

  qEl.addEventListener('change', e => {
    if (e.target.classList.contains('exam-inline-select')) {
      examSelectAnswer(e.target.dataset.qid, e.target.value);
    }
  });

  const sheetPagesEl = document.getElementById('exam-sheet-pages');
  if (sheetPagesEl) {
    sheetPagesEl.addEventListener('click', e => {
      const letBtn = e.target.closest('.exam-letter');
      if (letBtn) { examSelectAnswer(letBtn.dataset.qid, letBtn.dataset.key); return; }

      const matchOpt = e.target.closest('.exam-sheet-match-opt');
      if (matchOpt) { examSheetMatchPick(matchOpt.dataset.qid, matchOpt.dataset.key); return; }

      const dropPreview = e.target.closest('.exam-sheet-dropdown-preview');
      if (dropPreview) {
        const el = document.getElementById('eq-' + dropPreview.dataset.qid);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const numEl = e.target.closest('.qnum');
      if (numEl) {
        const el = document.getElementById('eq-' + numEl.dataset.jump);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    sheetPagesEl.addEventListener('input', e => {
      if (e.target.classList.contains('exam-sheet-textmini')) {
        examSetText(e.target.dataset.qid, e.target.value);
        const main = document.querySelector(`.exam-blank-input[data-qid="${e.target.dataset.qid}"]`);
        if (main && main.value !== e.target.value) main.value = e.target.value;
      }
    });

    const pages = sheetPagesEl.querySelectorAll('.exam-sheet-page');
    pages.forEach((p, i) => p.classList.toggle('show', i === 0));
  }

  function handleActionBtn() {
    if (EXAM.submitted) examGoBack();
    else examConfirmSubmit();
  }

  updateMatchingSheetUI();
  document.querySelectorAll('.exam-inline-group[data-dragdrop-group]').forEach(g => redrawDragDropGroup(g.dataset.dragdropGroup));
  document.querySelectorAll('.exam-blank-input:not(.exam-blank-input-lg)').forEach(el => {
    const v = EXAM.answers[el.dataset.qid];
    if (v != null && el.value !== v) el.value = v;
    autosizeBlankInput(el);
  });
  const actionBtn = document.getElementById('exam-action-btn');
  if (actionBtn) actionBtn.addEventListener('click', handleActionBtn);

  const mobileBar = document.getElementById('exam-mobile-answerbar');
  const mobileBackdrop = document.getElementById('exam-mobile-sheet-backdrop');
  const navEl = document.getElementById('exam-nav');
  if (mobileBar && navEl && mobileBackdrop) {
    const closeSheet = () => { navEl.classList.remove('mobile-open'); mobileBackdrop.classList.remove('show'); };
    mobileBar.addEventListener('click', () => {
      const open = navEl.classList.toggle('mobile-open');
      mobileBackdrop.classList.toggle('show', open);
    });
    mobileBackdrop.addEventListener('click', closeSheet);
  }

  const partTabsEl = document.getElementById('exam-part-tabs');
  if (partTabsEl) {
    partTabsEl.addEventListener('click', e => {
      const tab = e.target.closest('.exam-part-tab');
      if (!tab) return;
      const idx = Number(tab.dataset.partIndex);
      if (Number.isInteger(idx) && idx !== EXAM.currentPart) {
        renderExamRunner(EXAM.unit, EXAM.examId, EXAM.meta, [], idx);
      }
    });
  }

  const sheetPrev=document.getElementById('exam-sheet-part-prev');
  const sheetNext=document.getElementById('exam-sheet-part-next');
  if(sheetPrev) sheetPrev.addEventListener('click',()=>{ if(EXAM.currentPart>0) renderExamRunner(EXAM.unit,EXAM.examId,EXAM.meta,[],EXAM.currentPart-1); });
  if(sheetNext) sheetNext.addEventListener('click',()=>{ if(EXAM.currentPart<((EXAM.model.partitions||[]).length-1)) renderExamRunner(EXAM.unit,EXAM.examId,EXAM.meta,[],EXAM.currentPart+1); });

  const runnerEl = document.getElementById('exam-runner');
  let fontSize = 16;
  const fontIncBtn = document.getElementById('exam-font-inc');
  const fontDecBtn = document.getElementById('exam-font-dec');

  if (fontIncBtn) fontIncBtn.addEventListener('click', () => {
    fontSize = Math.min(22, fontSize + 1);
    runnerEl.style.setProperty('--exam-font-size', fontSize + 'px');
  });

  if (fontDecBtn) fontDecBtn.addEventListener('click', () => {
    fontSize = Math.max(13, fontSize - 1);
    runnerEl.style.setProperty('--exam-font-size', fontSize + 'px');
  });

  const darkBtn = document.getElementById('exam-darkmode-toggle');
  if (darkBtn) darkBtn.addEventListener('click', () => {
    const isDark = runnerEl.classList.toggle('dark-mode');
    darkBtn.classList.toggle('active', isDark);
  });

  const hlBtn = document.getElementById('exam-highlight-toggle');
  if (hlBtn) hlBtn.addEventListener('click', () => {
    EXAM.highlightMode = !EXAM.highlightMode;
    hlBtn.classList.toggle('active', EXAM.highlightMode);
  });

  initHighlightTool(document.querySelector('.exam-body'));
  requestAnimationFrame(() => document.querySelectorAll('.exam-matching').forEach(redrawMatchingGroup));
  window.addEventListener('resize', () => document.querySelectorAll('.exam-matching').forEach(redrawMatchingGroup), { passive:true });
}

/* ----- Công cụ highlight: chỉ hoạt động khi bật (tránh vướng thao tác chọn/copy chữ bình thường).
   Bôi đen đoạn chữ -> hiện bảng màu nổi -> chọn màu để đánh dấu; bấm lại vào chỗ đã đánh dấu để xoá. ----- */
function initHighlightTool(root) {
  if (!root) return;
  const COLORS = ['#fff59d', '#a5d6a7', '#90caf9', '#f48fb1', '#ffcc80'];
  let toolbarEl = null;
  function removeToolbar() { if (toolbarEl) { toolbarEl.remove(); toolbarEl = null; } }

  root.addEventListener('mouseup', () => {
    if (!EXAM || !EXAM.highlightMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { removeToolbar(); return; }
    const range = sel.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) return;
    removeToolbar();
    toolbarEl = mk('div', 'exam-hl-toolbar');
    toolbarEl.style.left = Math.max(8, rect.left + rect.width / 2 - 84) + 'px';
    toolbarEl.style.top = Math.max(8, rect.top - 42 + window.scrollY) + 'px';
    toolbarEl.innerHTML = COLORS.map(c => `<button type="button" class="exam-hl-swatch" style="background:${c}" data-color="${c}"></button>`).join('') +
      `<button type="button" class="exam-hl-swatch clear" data-action="clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg></button>`;
    document.body.appendChild(toolbarEl);
    toolbarEl.addEventListener('mousedown', e => e.preventDefault());
    toolbarEl.querySelectorAll('.exam-hl-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action !== 'clear') applyHighlight(range, btn.dataset.color);
        sel.removeAllRanges();
        removeToolbar();
      });
    });
  });

  document.addEventListener('mousedown', e => { if (toolbarEl && !toolbarEl.contains(e.target)) removeToolbar(); });

  root.addEventListener('click', e => {
    const m = e.target.closest('mark.exam-hl');
    if (m && window.getSelection().isCollapsed) {
      const parent = m.parentNode;
      while (m.firstChild) parent.insertBefore(m.firstChild, m);
      parent.removeChild(m);
      parent.normalize();
    }
  });
}

function applyHighlight(range, color) {
  const markEl = document.createElement('mark');
  markEl.className = 'exam-hl';
  markEl.style.background = color;
  try {
    range.surroundContents(markEl);
  } catch (e) {
    try { markEl.appendChild(range.extractContents()); range.insertNode(markEl); }
    catch (e2) { /* vùng chọn quá phức tạp để bọc - bỏ qua, không làm hỏng nội dung */ }
  }
}

function updateAnsweredCount() {
  const answered = Object.keys(EXAM.answers).filter(id => {
    const v = EXAM.answers[id];
    if (v && typeof v === 'object') return Object.keys(v).length > 0;
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  document.getElementById('exam-answered-txt').textContent = `Đã trả lời: ${answered} / ${EXAM.atoms.length}`;
  const mobileTxt = document.getElementById('exam-mobile-answered-txt');
  if (mobileTxt) mobileTxt.textContent = `${answered}/${EXAM.atoms.length}`;
}

function matchingAtomById(id) {
  return EXAM?.atoms?.find(a => String(a.id) === String(id) && a.kind === 'matching') || null;
}

function matchingIsCorrect(atom, key) {
  return !!(EXAM?.submitted && atom && String(atom.correct) === String(key));
}

function redrawMatchingGroup(root) {
  if (!root || !EXAM) return;
  const grid = root.querySelector('.exam-matching-grid');
  const svg = root.querySelector('.exam-match-svg');
  const removeLayer = root.querySelector('.exam-match-remove-layer');
  if (!grid || !svg) return;

  const rect = grid.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return;

  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.innerHTML = '';
  if (removeLayer) removeLayer.innerHTML = '';

  root.querySelectorAll('.exam-match-card').forEach(b =>
    b.classList.remove('matched','selected','match-correct','match-wrong')
  );

  const groupIds = Array.from(root.querySelectorAll('.exam-match-left-card'))
    .map(el => el.dataset.qid);

  groupIds.forEach(id => {
    const key = EXAM.answers[id];
    if (key === undefined || key === null || String(key) === '') return;

    const left = root.querySelector(`.exam-match-left-card[data-qid="${CSS.escape(String(id))}"]`);
    const right = root.querySelector(`.exam-match-right-card[data-match-key="${CSS.escape(String(key))}"]`);
    if (!left || !right) return;

    const atom = matchingAtomById(id);
    const correct = matchingIsCorrect(atom, key);

    left.classList.add('matched');
    right.classList.add('matched');
    if (EXAM.submitted) {
      left.classList.add(correct ? 'match-correct' : 'match-wrong');
      right.classList.add(correct ? 'match-correct' : 'match-wrong');
    }

    const a = left.getBoundingClientRect();
    const b = right.getBoundingClientRect();
    const g = grid.getBoundingClientRect();

    const x1 = a.right - g.left;
    const y1 = a.top + a.height / 2 - g.top;
    const x2 = b.left - g.left;
    const y2 = b.top + b.height / 2 - g.top;
    const mid = x1 + Math.max(35, (x2 - x1) * .5);

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
    path.setAttribute('class', `exam-match-line ${EXAM.submitted ? (correct ? 'correct' : 'wrong') : 'active'}`);
    svg.appendChild(path);

    if (!EXAM.submitted && removeLayer) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exam-match-remove';
      btn.dataset.removeMatch = id;
      btn.title = 'Huỷ nối';
      btn.setAttribute('aria-label', 'Huỷ nối');
      btn.textContent = '×';
      btn.style.left = `${x1 + 4}px`;
      btn.style.top = `${y1 - 11}px`;
      removeLayer.appendChild(btn);
    }
  });
}

function syncDropdownSheetPreview(qid) {
  const preview = document.querySelector(`.exam-sheet-dropdown-preview[data-qid="${CSS.escape(String(qid))}"]`);
  if (!preview || !EXAM) return;
  const atom = EXAM.atoms.find(a => String(a.id) === String(qid));
  const key = EXAM.answers[qid];
  const label = atom && atom.answers && key != null && atom.answers[key] ? stripTags(atom.answers[key].value || atom.answers[key].label || '') : '';
  preview.textContent = label || '…';
  preview.classList.toggle('is-empty', !label);
}

// ----- Kéo thả (click để đặt từ vào chỗ trống, thay cho kéo-rê để hoạt động tốt trên mọi thiết bị) -----
function examDragDropPick(kind, id, groupId) {
  if (!EXAM || EXAM.submitted || !groupId) return;
  EXAM._dragPending = EXAM._dragPending || {};
  const p = EXAM._dragPending[groupId] || { blank: null, pool: null };

  if (kind === 'blank') {
    if (EXAM.answers[id] != null && String(EXAM.answers[id]) !== '') return; // đã điền -> dùng nút x để xoá
    p.blank = (p.blank === id) ? null : id;
  } else {
    p.pool = (p.pool === id) ? null : id;
  }

  if (p.blank && p.pool != null) {
    EXAM.answers[p.blank] = p.pool;
    syncDropdownSheetPreview(p.blank);
    p.blank = null; p.pool = null;
    updateAnsweredCount();
  }

  EXAM._dragPending[groupId] = p;
  redrawDragDropGroup(groupId);
}

function examDragDropRemove(qid, groupId) {
  if (!EXAM || EXAM.submitted) return;
  delete EXAM.answers[qid];
  syncDropdownSheetPreview(qid);
  updateAnsweredCount();
  redrawDragDropGroup(groupId);
}

function redrawDragDropGroup(groupId) {
  if (!EXAM || !groupId) return;
  const p = (EXAM._dragPending && EXAM._dragPending[groupId]) || { blank: null, pool: null };
  const usedKeys = new Set();
  document.querySelectorAll(`.exam-dragdrop-slot[data-group="${CSS.escape(groupId)}"]`).forEach(slot => {
    const qid = slot.dataset.qid;
    const key = EXAM.answers[qid];
    slot.classList.remove('armed', 'filled');
    if (key != null && key !== '') {
      usedKeys.add(String(key));
      const atom = EXAM.atoms.find(a => String(a.id) === String(qid));
      const label = atom && atom.answers && atom.answers[key] ? stripTags(atom.answers[key].value || '') : '';
      slot.classList.add('filled');
      slot.innerHTML = `<span class="exam-dragdrop-slot-text">${esc(label)}</span><button type="button" class="exam-dragdrop-remove" data-qid="${esc(qid)}" data-group="${esc(groupId)}" aria-label="Bỏ đáp án" title="Bỏ đáp án">×</button>`;
    } else {
      slot.innerHTML = '';
      if (p.blank === qid) slot.classList.add('armed');
    }
  });
  document.querySelectorAll(`.exam-dragbank-item[data-group="${CSS.escape(groupId)}"]`).forEach(btn => {
    const used = usedKeys.has(String(btn.dataset.key));
    btn.classList.toggle('used', used);
    btn.classList.toggle('armed', !used && p.pool === btn.dataset.key);
    btn.disabled = used;
  });
}

function examMatchingPick(qid, key, root) {
  if (!EXAM || EXAM.submitted || !root) return;
  EXAM._matchingPending ||= {left:null,right:null};
  const p = EXAM._matchingPending;

  if (qid !== null) {
    if (p.right !== null) {
      connectMatchingPair(root, qid, p.right);
      p.left = null; p.right = null;
    } else {
      p.left = p.left === qid ? null : qid;
    }
  } else {
    if (p.left !== null) {
      connectMatchingPair(root, p.left, key);
      p.left = null; p.right = null;
    } else {
      p.right = p.right === key ? null : key;
    }
  }

  redrawMatchingGroup(root);
  root.querySelectorAll('.exam-match-left-card,.exam-match-right-card')
    .forEach(b => b.classList.remove('selected'));
  if (p.left !== null) {
    root.querySelector(`.exam-match-left-card[data-qid="${CSS.escape(String(p.left))}"]`)?.classList.add('selected');
  }
  if (p.right !== null) {
    root.querySelector(`.exam-match-right-card[data-match-key="${CSS.escape(String(p.right))}"]`)?.classList.add('selected');
  }
  updateMatchingSheetUI();
  updateAnsweredCount();
}

function connectMatchingPair(root, leftId, rightKey) {
  if (!leftId || rightKey == null) return;

  // Một đáp án bên phải chỉ thuộc về một câu.
  Object.keys(EXAM.answers).forEach(id => {
    if (String(EXAM.answers[id]) === String(rightKey) || String(id) === String(leftId)) {
      delete EXAM.answers[id];
    }
  });
  EXAM.answers[leftId] = rightKey;
}

// Chọn nhanh cặp nối ngay từ phiếu trả lời (không cần bấm vào khối câu hỏi chính).
function examSheetMatchPick(qid, key) {
  if (!EXAM || EXAM.submitted || !qid || key == null) return;
  const leftCard = document.querySelector(`.exam-match-left-card[data-qid="${CSS.escape(String(qid))}"]`);
  const root = leftCard ? leftCard.closest('.exam-matching') : document.querySelector('.exam-matching');
  if (!root) return;
  // Nếu đang chọn lại đúng đáp án đã nối -> huỷ nối (bấm lần nữa để bỏ chọn).
  if (String(EXAM.answers[qid]) === String(key)) {
    delete EXAM.answers[qid];
  } else {
    connectMatchingPair(root, qid, key);
  }
  EXAM._matchingPending = { left: null, right: null };
  redrawMatchingGroup(root);
  updateMatchingSheetUI();
  updateAnsweredCount();
}

function examMatchingRemove(root, leftId) {
  if (!EXAM || EXAM.submitted || !root) return;
  const key = EXAM.answers[leftId];
  if (key === undefined) return;
  delete EXAM.answers[leftId];
  EXAM._matchingPending = {left:null,right:null};
  redrawMatchingGroup(root);
  updateMatchingSheetUI();
  updateAnsweredCount();
}

function examSelectAnswer(qid, key) {
  if (!EXAM || EXAM.submitted) return;
  EXAM.answers[qid] = key;
  document.querySelectorAll(`.exam-letter[data-qid="${qid}"]`).forEach(b => b.classList.remove('picked'));
  document.querySelectorAll(`.exam-letter[data-qid="${qid}"][data-key="${key}"]`).forEach(b => b.classList.add('picked'));
  const sel = document.querySelector(`.exam-inline-select[data-qid="${qid}"]`);
  if (sel && sel.value !== key) sel.value = key;
  const preview = document.querySelector(`.exam-sheet-dropdown-preview[data-qid="${qid}"]`);
  if (preview) {
    const atom = EXAM.atoms.find(a => String(a.id) === String(qid));
    const label = atom && atom.answers && atom.answers[key] ? stripTags(atom.answers[key].value || atom.answers[key].label || '') : '';
    preview.textContent = label || '…';
    preview.classList.toggle('is-empty', !label);
  }
  updateAnsweredCount();
}

function examSetText(qid, value) {
  if (!EXAM || EXAM.submitted) return;
  EXAM.answers[qid] = value;
  updateAnsweredCount();
}

function examSetTF(qid, subkey, val) {
  if (!EXAM || EXAM.submitted) return;
  if (!EXAM.answers[qid] || typeof EXAM.answers[qid] !== 'object') EXAM.answers[qid] = {};
  EXAM.answers[qid][subkey] = val;
  document.querySelectorAll(`.exam-tf-btn[data-qid="${qid}"][data-key="${subkey}"]`).forEach(b => b.classList.remove('picked'));
  const btn = document.getElementById(`etf-${qid}-${subkey}-${val}`);
  if (btn) btn.classList.add('picked');
  updateAnsweredCount();
}

function examGoBack() {
  if (!EXAM) return;
  if (!EXAM.submitted) {
    showExamDialog('Rời khỏi bài làm? Câu trả lời chưa nộp sẽ không được lưu.', 'Rời đi', 'Ở lại', () => renderExamLanding(EXAM.unit));
  } else {
    renderExamLanding(EXAM.unit);
  }
}

function examConfirmSubmit() {
  if (!EXAM || EXAM.submitted) return;
  showExamDialog('Bạn đã chắc chắn muốn nộp bài?', 'Nộp bài', 'Đóng', examSubmit);
}

function showExamDialog(question, confirmLabel, cancelLabel, onConfirm) {
  const ov = mk('div', 'exam-dialog-overlay');
  ov.innerHTML = `<div class="exam-dialog"><p class="q">${esc(question)}</p><div class="row"><button class="cancel">${esc(cancelLabel)}</button><button class="confirm">${esc(confirmLabel)}</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('.confirm').addEventListener('click', () => { ov.remove(); onConfirm(); });
  ov.querySelector('.cancel').addEventListener('click', () => ov.remove());
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}

function isAtomCorrect(atom) {
  const ans = EXAM.answers[atom.id];
  if (atom.kind === 'mcq') return ans === atom.correct;
  if (atom.kind === 'matching') return String(ans ?? '') === String(atom.correct ?? '');
  if (atom.kind === 'fillblank' || atom.kind === 'dictation') {
    if (typeof ans !== 'string' || !ans.trim()) return false;
    const norm = s => s.trim().toLowerCase().replace(/\s+/g, ' ');
    return atom.variants.some(v => norm(v) === norm(ans));
  }
  if (atom.kind === 'truefalse') {
    const subAns = (ans && typeof ans === 'object') ? ans : {};
    const keys = Object.keys(atom.correct);
    if (!keys.length) return false;
    return keys.every(k => String(atom.correct[k]) === subAns[k]);
  }
  return false;
}

function examSubmit() {
  if (!EXAM || EXAM.submitted) return;
  EXAM.submitted = true;
  clearInterval(examTimerInterval);

  let correct = 0;
  EXAM.atoms.forEach(a => { if (isAtomCorrect(a)) correct++; });
  const total = EXAM.atoms.length;
  const score10 = total ? Math.round((correct / total) * EXAM.scale * 10) / 10 : 0;
  const durationSec = Math.floor((Date.now() - EXAM.startedAt) / 1000);

  saveLocalExamResult(EXAM.examId, { correct, total, score10, scale: EXAM.scale, at: Date.now(), durationSec });

  applyExamReviewColors();
  showExamCelebrate(score10, EXAM.scale, correct, total);
}

// Quy tắc tô màu sau khi nộp (áp dụng cho cả ô ở câu hỏi chính lẫn ô trong phiếu trả lời):
// - Chọn đúng -> ô chữ cái tô ĐẦY màu xanh.
// - Chọn sai -> ô chữ cái đã chọn tô ĐẦY màu đỏ.
// - Đáp án đúng mà không chọn -> ô chữ cái đó viền xanh (không tô đầy) để biết đáp án đúng là gì.
function updateMatchingSheetUI(){
  if(!EXAM) return;
  EXAM.atoms.filter(a=>a.kind==='matching').forEach(atom=>{
    const selected=EXAM.answers[atom.id];
    document.querySelectorAll(`.exam-sheet-match-opt[data-qid="${CSS.escape(String(atom.id))}"]`).forEach(btn=>{
      btn.classList.remove('picked','correct','wrong');
      if(selected!=null && String(btn.dataset.key)===String(selected)) btn.classList.add('picked');
      if(EXAM.submitted){ if(String(btn.dataset.key)===String(atom.correct)) btn.classList.add('correct'); if(selected!=null && String(btn.dataset.key)===String(selected) && String(selected)!==String(atom.correct)) btn.classList.add('wrong'); }
    });
  });
}

function applyExamReviewColors() {
  EXAM.atoms.forEach(atom => {
    const isCorrect = isAtomCorrect(atom);
    const selected = EXAM.answers[atom.id];

    if (atom.kind === 'mcq' && atom.sheetKind !== 'dropdown') {
      Object.keys(atom.answers).forEach(key => {
        document.querySelectorAll(`.exam-letter[data-qid="${atom.id}"][data-key="${key}"]`).forEach(btn => {
          btn.classList.remove('picked');
          btn.disabled = true;
          if (key === atom.correct && key === selected) btn.classList.add('res-correct-fill');
          else if (key === atom.correct) btn.classList.add('res-correct-outline');
          else if (key === selected) btn.classList.add('res-wrong-fill');
        });
      });
    } else if (atom.sheetKind === 'dropdown') {
      // Dùng chung cho cả dropdown thường (select) lẫn kéo thả (ô click-để-đặt).
      const correctLabel = atom.answers[atom.correct] ? stripTags(atom.answers[atom.correct].value || '') : '';
      const selLabel = selected != null && atom.answers[selected] ? stripTags(atom.answers[selected].value || '') : '';
      const sel = document.querySelector(`.exam-inline-select[data-qid="${atom.id}"]`);
      if (sel) {
        sel.disabled = true;
        sel.insertAdjacentHTML('afterend', isCorrect
          ? `<span class="exam-correct-hint exam-correct-hint-ok">${esc(selLabel)}</span>`
          : `<span class="exam-correct-hint"><s>${esc(selLabel || '(bỏ trống)')}</s> <b>Đáp án: ${esc(correctLabel)}</b></span>`);
      }
      const slot = document.querySelector(`.exam-dragdrop-slot[data-qid="${atom.id}"]`);
      if (slot) {
        slot.classList.remove('armed');
        slot.classList.add('filled', isCorrect ? 'res-correct' : 'res-wrong');
        slot.innerHTML = isCorrect
          ? `<span class="exam-dragdrop-slot-text">${esc(selLabel)}</span>`
          : `<span class="exam-dragdrop-slot-text is-wrong">${esc(selLabel || '(bỏ trống)')}</span><span class="exam-dragdrop-correct-hint">Đáp án: ${esc(correctLabel)}</span>`;
      }
      document.querySelectorAll(`.exam-dragbank-item[data-key]`).forEach(btn => { btn.disabled = true; });
    } else if (atom.kind === 'matching') {
      document.querySelectorAll('.exam-matching').forEach(redrawMatchingGroup);
      const left = document.querySelector(`.exam-match-left-card[data-qid="${CSS.escape(atom.id)}"]`);
      const right = selected ? document.querySelector(`.exam-match-right-card[data-match-key="${CSS.escape(String(selected))}"]`) : null;
      if (left) left.classList.add('matched');
      if (right) right.classList.add(isCorrect ? 'matched' : 'selected');

      // Gộp lời giải của cả nhóm câu nối vào 1 khối chung bên dưới toàn bộ khối ghép đôi
      // (không chèn xen vào từng thẻ nhỏ để tránh đè lên thẻ / đường nối).
      if (atom.explain) {
        const groupEl = left ? left.closest('.exam-matching') : null;
        const list = groupEl ? groupEl.querySelector('.exam-match-explain-list') : null;
        if (list) {
          list.style.display = '';
          if (!list.dataset.labeled) {
            list.innerHTML = '<span class="exam-explain-label">Lời giải chi tiết</span>';
            list.dataset.labeled = '1';
          }
          list.insertAdjacentHTML('beforeend', `<div class="exam-match-explain-row"><b>Câu ${esc(String(atom.num))}:</b> ${atom.explain}</div>`);
        }
      }
    } else if (atom.kind === 'fillblank' || atom.kind === 'dictation') {
      document.querySelectorAll(`.exam-blank-input[data-qid="${atom.id}"], .exam-sheet-textmini[data-qid="${atom.id}"]`).forEach(inp => {
        inp.disabled = true;
        inp.classList.add(isCorrect ? 'res-input-correct' : 'res-input-wrong');
      });
      const mainInput = document.querySelector(`.exam-blank-input[data-qid="${atom.id}"]`);
      if (mainInput && !isCorrect) {
        mainInput.insertAdjacentHTML('afterend', `<span class="exam-correct-hint">Đáp án đúng: ${esc(atom.variants[0] || '')}</span>`);
      }
    } else if (atom.kind === 'truefalse') {
      Object.keys(atom.items).forEach(k => {
        const wantVal = String(atom.correct[k]);
        const pickedVal = (selected && selected[k]) || null;
        ['true', 'false'].forEach(v => {
          const btn = document.getElementById(`etf-${atom.id}-${k}-${v}`);
          if (!btn) return;
          btn.classList.remove('picked');
          btn.disabled = true;
          if (v === wantVal && v === pickedVal) btn.classList.add('res-correct-fill');
          else if (v === wantVal) btn.classList.add('res-correct-outline');
          else if (v === pickedVal) btn.classList.add('res-wrong-fill');
        });
      });
    }
    const dot = document.getElementById('esh-dot-' + atom.id);
    if (dot) dot.classList.add(isCorrect ? 'res-ok' : 'res-bad');

    // Giải thích nối ngay sau câu hỏi (không đóng khung riêng), phân cách bằng chữ "Lời giải chi tiết" màu xanh.
    if (atom.explain && atom.kind !== 'matching') {
      const qEl = document.getElementById('eq-' + atom.id);
      if (qEl && qEl.classList.contains('exam-blank-wrap')) {
        // Câu này là 1 trong nhiều ô trống của 1 nhóm (direct-fill-blank-group / drag-drop-group / dropdown-question-group).
        const groupEl = qEl.closest('.exam-inline-group');
        // Nếu ô trống này nằm riêng trong 1 đoạn văn/thẻ khối của chính nó (không chung với ô trống nào khác)
        // -> hiện lời giải ngay sau đúng đoạn đó, giống hệ thống gốc. Nếu nhiều ô trống dùng chung 1 đoạn
        // (dạng thơ) -> gộp chung 1 khối bên dưới, đánh số theo từng câu.
        let ownBlock = qEl.parentElement;
        while (ownBlock && ownBlock !== groupEl && ownBlock.parentElement !== groupEl) ownBlock = ownBlock.parentElement;
        const exclusive = ownBlock && ownBlock !== groupEl && ownBlock.querySelectorAll('.exam-blank-wrap').length === 1;
        if (exclusive) {
          if (!ownBlock.dataset.explained) {
            ownBlock.insertAdjacentHTML('afterend', `<div class="exam-q-explain"><span class="exam-explain-label">Lời giải chi tiết</span>${atom.explain}</div>`);
            ownBlock.dataset.explained = '1';
          }
        } else {
          const list = groupEl ? groupEl.querySelector('.exam-inline-explain-list') : null;
          if (list) {
            list.style.display = '';
            if (!list.dataset.labeled) {
              list.innerHTML = '<span class="exam-explain-label">Lời giải chi tiết</span>';
              list.dataset.labeled = '1';
            }
            list.insertAdjacentHTML('beforeend', `<div class="exam-inline-explain-row"><b>Câu ${esc(String(atom.num))}:</b> ${atom.explain}</div>`);
          }
        }
      } else if (qEl) {
        qEl.insertAdjacentHTML('beforeend', `<div class="exam-q-explain"><span class="exam-explain-label">Lời giải chi tiết</span>${atom.explain}</div>`);
      }
    }
  });

  const actionBtn = document.getElementById('exam-action-btn');
  if (actionBtn) actionBtn.textContent = 'Quay lại';
}

function showExamCelebrate(score10, scale, correct, total) {
  const ov = mk('div', 'exam-dialog-overlay');
  ov.innerHTML = `
    <div class="exam-dialog exam-celebrate">
      <h2>Chúc mừng</h2>
      <p class="sub">Bạn đã hoàn thành bài kiểm tra</p>
      <div class="big-score">${score10} / ${scale}</div>
      <p class="sub">${correct} câu đúng &middot; ${total - correct} câu sai</p>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="h-24 w-24" width="96" height="96"><g clip-path="url(#clip0)"><path d="M68.9052 13.7354L55.8519 11.8236L50 0L44.1478 11.8236L31.0945 13.7354L40.531 22.9549L38.3158 35.9602L50 29.8344L61.6841 35.9602L59.4687 22.9549L68.9052 13.7354Z" fill="#FFD321"></path><path d="M47.0728 92.1389H52.9321V99.9998H47.0728V92.1389Z" fill="#FFF16B"></path><path d="M47.0728 54.0803H52.9321V86.2791H47.0728V54.0803Z" fill="#FFF16B"></path><path d="M47.0728 37.5824H52.9321V48.2205H47.0728V37.5824Z" fill="#FFF16B"></path><path d="M67.6541 94.4307H61.7947C61.7947 87.4565 62.0021 80.1276 63.5064 73.778C65.0376 67.3141 67.7779 62.192 72.13 57.6584L76.3572 61.7161C72.7597 65.4635 70.4878 69.7254 69.208 75.1286C67.8423 80.893 67.6541 87.8124 67.6541 94.4307Z" fill="#FFF16B"></path><path d="M83.9714 43.3375C79.9812 43.3375 76.7351 46.5836 76.7351 50.5739C76.7351 54.5639 79.9812 57.81 83.9714 57.81C87.9615 57.81 91.2076 54.5639 91.2076 50.5739C91.2076 46.5836 87.9615 43.3375 83.9714 43.3375Z" fill="#FFD321"></path><path d="M38.2076 94.4307H32.3482C32.3482 87.812 32.1599 80.8928 30.7945 75.1286C29.5144 69.7254 27.2427 65.4635 23.6453 61.7161L27.8722 57.6584C32.2246 62.192 34.9648 67.3143 36.496 73.778C38.0003 80.1276 38.2076 87.4565 38.2076 94.4307Z" fill="#FFF16B"></path><path d="M19.9985 6.53668L24.1411 2.3941L28.284 6.53696L24.1414 10.6795L19.9985 6.53668Z" fill="#98F9FF"></path><path d="M19.9956 33.879L24.1382 29.7364L28.281 33.8792L24.1385 38.0218L19.9956 33.879Z" fill="#98F9FF"></path><path d="M8.27881 20.2066L12.4214 16.064L16.5642 20.2068L12.4217 24.3494L8.27881 20.2066Z" fill="#5ECBF1"></path><path d="M71.7041 6.54282L75.847 2.39997L79.9895 6.54255L75.8467 10.6854L71.7041 6.54282Z" fill="#98F9FF"></path><path d="M71.7012 33.8852L75.844 29.7424L79.9866 33.885L75.8438 38.0278L71.7012 33.8852Z" fill="#98F9FF"></path><path d="M83.4209 20.2151L87.5638 16.0723L91.7063 20.2149L87.5635 24.3577L83.4209 20.2151Z" fill="#5ECBF1"></path><path d="M16.0311 43.3375C12.041 43.3375 8.79492 46.5836 8.79492 50.5739C8.79492 54.5639 12.041 57.81 16.0311 57.81C20.0211 57.81 23.2672 54.5639 23.2672 50.5739C23.2672 46.5836 20.0211 43.3375 16.0311 43.3375Z" fill="#FFD321"></path><path d="M84.6355 70.4428H90.4949V76.3025H84.6355V70.4428Z" fill="#BEE75E"></path><path d="M74.8694 80.209H80.7288V86.0687H74.8694V80.209Z" fill="#5BC980"></path><path d="M9.50757 70.4428H15.3669V76.3025H9.50757V70.4428Z" fill="#BEE75E"></path><path d="M19.2737 80.209H25.1331V86.0687H19.2737V80.209Z" fill="#5BC980"></path><path d="M67.6541 94.4307H61.7947C61.7947 87.4565 62.0021 80.1276 63.5064 73.778C65.0376 67.3141 67.7779 62.192 72.13 57.6584L76.3572 61.7161C72.7597 65.4635 70.4878 69.7254 69.208 75.1286C67.8423 80.893 67.6541 87.8124 67.6541 94.4307Z" fill="#FFD321"></path><path d="M83.9714 43.3375C79.9812 43.3375 76.7351 46.5836 76.7351 50.5739C76.7351 54.5639 79.9812 57.81 83.9714 57.81C87.9615 57.81 91.2076 54.5639 91.2076 50.5739C91.2076 46.5836 87.9615 43.3375 83.9714 43.3375Z" fill="#FFAF00"></path><path d="M71.7041 6.54282L75.847 2.39997L79.9895 6.54255L75.8467 10.6854L71.7041 6.54282Z" fill="#5ECBF1"></path><path d="M71.7012 33.8852L75.844 29.7424L79.9866 33.885L75.8438 38.0278L71.7012 33.8852Z" fill="#5ECBF1"></path><path d="M83.4209 20.2151L87.5638 16.0723L91.7063 20.2149L87.5635 24.3577L83.4209 20.2151Z" fill="#4793FF"></path><path d="M84.6355 70.4428H90.4949V76.3025H84.6355V70.4428Z" fill="#5BC980"></path><path d="M74.8694 80.209H80.7288V86.0687H74.8694V80.209Z" fill="#00A78E"></path><path d="M59.4688 22.9549L68.9053 13.7354L55.852 11.8236L50 0V29.8344L61.6842 35.9602L59.4688 22.9549Z" fill="#FFAF00"></path><path d="M50 92.1389H52.9322V99.9998H50V92.1389Z" fill="#FFD321"></path><path d="M50 54.0803H52.9322V86.2791H50V54.0803Z" fill="#FFD321"></path><path d="M50 37.5824H52.9322V48.2205H50V37.5824Z" fill="#FFD321"></path></g><defs><clipPath id="clip0"><rect width="100" height="100" fill="white"></rect></clipPath></defs></svg>
      <div class="row" style="margin-top:16px">
        <button class="confirm" id="exam-view-result">Kết quả</button>
        <button class="cancel" id="exam-close-celebrate">Đóng</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  document.getElementById('exam-close-celebrate').addEventListener('click', () => ov.remove());
  document.getElementById('exam-view-result').addEventListener('click', () => {
    ov.remove();
    const firstQ = document.querySelector('.exam-q');
    if (firstQ) firstQ.scrollIntoView({ behavior: 'smooth' });
  });
}
function openModal() { document.getElementById('lesson-modal').classList.add('show'); }
function closeModal(e) { if (e === true || e.target.id === 'lesson-modal') document.getElementById('lesson-modal').classList.remove('show'); }

function toggleSB() {
  sbOpen = !sbOpen;
  document.getElementById('sidebar').classList.toggle('collapsed', !sbOpen);
  const isMobile = window.matchMedia('(max-width:860px)').matches;
  document.getElementById('sb-backdrop').classList.toggle('show', isMobile && sbOpen);
  setActiveBottomNav(sbOpen ? 'bn-lessons' : null);
}
function autoCloseSBOnMobile() {
  if (window.matchMedia('(max-width:860px)').matches && sbOpen) toggleSB();
}

function setActiveBottomNav(id) {
  document.querySelectorAll('.bn-item').forEach(el => el.classList.remove('active'));
  if (id) { const el = document.getElementById(id); if (el) el.classList.add('active'); }
}

function setSupportAvailable(has) {
  document.getElementById('btn-support').style.display = has ? 'flex' : 'none';
  const bn = document.getElementById('bn-support');
  bn.disabled = !has;
}

function showContent(h) { document.getElementById('content').innerHTML = h; }
function sbState(m) { document.getElementById('sb-body').innerHTML = `<div class="state"><div class="spinner"></div><p>${esc(m)}</p></div>`; }
function showErr(m) { document.getElementById('content').innerHTML = `<div class="err">${m}</div>`; }
function mkNotice(c, i, t, b) { const d = mk('div', 'notice-box ' + c); d.innerHTML = i + `<div><h3>${esc(t)}</h3><p>${esc(b)}</p></div>`; return d; }
function mk(t, c) { const e = document.createElement(t); if (c) e.className = c; return e; }
// Ép mọi URL trỏ về bucket tài liệu izteach-N-aws-source-bucket luôn về đúng số 6,
// bất kể dữ liệu từ API (origin.bucket) trả về số khác.
function normalizeBucket(url) {
  if (!url) return url;
  return String(url).replace(/izteach-\d+-aws-source-bucket/gi, 'izteach-6-aws-source-bucket');
}
// Khi <img> avatar/thumbnail tải lỗi (link hỏng, đổi domain, CORS...), tự thay bằng khối placeholder
// thay vì để trống -> khắc phục lỗi "ảnh chưa hiển thị".
function imgFallback(el, kind, altText) {
  const rep = document.createElement('div');
  if (kind === 'avatar') {
    rep.className = 'avatar placeholder';
    rep.textContent = altText || '';
  } else {
    rep.className = 'thumb-fallback';
    rep.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
  }
  el.replaceWith(rep);
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function cleanDesc(html) { const d = document.createElement('div'); d.innerHTML = html; return (d.querySelector('.ql-editor') || d).innerHTML; }
function typeLabel(t) {
  return {
    video: 'Video bài giảng', pdf: 'Tài liệu PDF',
    embedded: 'Nội dung nhúng', link: 'Liên kết nhúng', iframe: 'Nội dung nhúng',
    test: 'Bài kiểm tra', quiz: 'Bài kiểm tra', exam: 'Bài kiểm tra',
    'listening-test': 'Bài nghe', 'reading-test': 'Bài đọc',
    flashcard: 'Flashcard'
  }[t] || 'Bài học';
}
function badgeClassOf(t) {
  if (t === 'video' || t === 'pdf' || t === 'flashcard') return t;
  if (t === 'link' || t === 'iframe' || t === 'embedded') return 'link';
  if (t === 'test' || t === 'quiz' || t === 'exam') return 'test';
  if (t === 'listening-test' || t === 'reading-test') return t;
  return 'other';
}
function chevSvg(c) { return `<svg class="${c}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>`; }
function warnSvg() { return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1"/></svg>`; }

function pdfScrollSvg() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="6" rx="1"/><rect x="4" y="15" width="16" height="6" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`; }
function pdfZoomSvg(kind) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.6" y2="16.6"/><line x1="8" y1="11" x2="14" y2="11"/>${kind === 'in' ? '<line x1="11" y1="8" x2="11" y2="14"/>' : ''}</svg>`; }
function pdfDownloadSvg() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><polyline points="7 11 12 16 17 11"/><path d="M5 21h14"/></svg>`; }

function leafIcon(t) {
  // Icon filled theo bộ SVG tham chiếu (video, file, test, circle…)
  const ICONS = {
    video: '<svg class="li" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>',
    pdf: '<svg class="li" viewBox="0 0 24 28" width="16" height="18" fill="currentColor"><path d="M6 2C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2H6ZM13 9V3.5L18.5 9H13Z"/></svg>',
    link: '<svg class="li" viewBox="0 0 25 25" width="17" height="17" fill="currentColor"><path d="M7.46,25a7.57,7.57,0,0,1-5.19-2l-.09-.08a6.72,6.72,0,0,1,0-9.9L15,1.42a5.46,5.46,0,0,1,7.35,0A4.88,4.88,0,0,1,24,5a4.83,4.83,0,0,1-1.56,3.54L10.38,19.41A3.23,3.23,0,0,1,6,19.4a2.91,2.91,0,0,1,0-4.3L17.27,5l1.33,1.49L7.35,16.57a.91.91,0,0,0-.29.66.93.93,0,0,0,.31.68,1.23,1.23,0,0,0,1.66,0L21.09,7.11a2.81,2.81,0,0,0,0-4.16,3.45,3.45,0,0,0-4.69-.06L3.53,14.46a4.72,4.72,0,0,0,0,7l.09.08a5.65,5.65,0,0,0,7.63,0L23.33,10.69l1.34,1.49L12.62,23A7.53,7.53,0,0,1,7.46,25Z"/></svg>',
    test: '<svg class="li" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h2v2H8v-2zm0-3h2v2H8v-2zm0 3h2v2H8v-2zm4-6h4v2h-4v-2zm0 3h4v2h-4v-2zm0 3h4v2h-4v-2z"/></svg>',
    'listening-test': '<svg class="li" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 3a9 9 0 0 0-9 9v4a2 2 0 0 0 2 2h2v-6H5.05A7 7 0 0 1 12 5a7 7 0 0 1 6.95 7H17v6h2a2 2 0 0 0 2-2v-4a9 9 0 0 0-9-9z"/></svg>',
    'reading-test': '<svg class="li" viewBox="0 0 18 20" width="15" height="17" fill="currentColor"><path d="M14 0h-1v9.688a.316.316 0 0 1-.08.213.3.3 0 0 1-.232.1.316.316 0 0 1-.213-.08L10.5 8 8.537 9.906l-.012.013a.316.316 0 0 1-.213.08.3.3 0 0 1-.23-.1A.314.314 0 0 1 8 9.687V0H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1z"/></svg>',
    flashcard: '<svg class="li" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 6a2 2 0 0 1 2-2h9a1 1 0 1 1 0 2H6v10a1 1 0 1 1-2 0V6zm5 3a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V9zm2 0v9h9V9h-9z"/></svg>',
    other: '<svg class="li" viewBox="0 0 24 28" width="16" height="18" fill="currentColor"><path d="M6 2C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2H6ZM13 9V3.5L18.5 9H13Z"/></svg>'
  };
  const key = ICONS[t] ? t
    : (t === 'embedded' || t === 'iframe' || t === 'link') ? 'link'
    : (t === 'quiz' || t === 'exam') ? 'test'
    : (t === 'pdf') ? 'pdf'
    : 'video';
  return ICONS[key] || ICONS.other;
}

function stripVN(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'd');
}
function filterLessons(q) {
  q = stripVN(q.trim());
  ALL_LEAVES.forEach(el => {
    const title = el.dataset.titleNorm || stripVN(el.dataset.title || '');
    el.style.display = (!q || title.includes(q)) ? '' : 'none';
  });
  // Duyệt từ sâu ra ngoài để folder cha hiện khi còn leaf khớp
  const nodes = Array.from(document.querySelectorAll('.tree-node')).reverse();
  nodes.forEach(node => {
    if (!q) {
      node.style.display = '';
      return;
    }
    const kids = node.querySelector(':scope > .kids');
    const anyLeaf = kids && Array.from(kids.querySelectorAll('.leaf')).some(l => l.style.display !== 'none');
    const anyChild = kids && Array.from(kids.querySelectorAll(':scope > .tree-node')).some(n => n.style.display !== 'none');
    const show = !!(anyLeaf || anyChild);
    node.style.display = show ? '' : 'none';
    if (show && kids) {
      const hd = node.querySelector(':scope > .folder-hd');
      if (hd) { hd.classList.add('open'); kids.classList.add('open'); }
    }
  });
}

window.addEventListener('beforeunload', () => { clearVideoRenewTimer(); });
