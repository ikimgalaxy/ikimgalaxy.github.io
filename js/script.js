(() => {
  'use strict';

  const data = window.PORTFOLIO_DATA;
  if (!data?.projects?.length) return;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const safeHttpUrl = (url) => {
    if (typeof url !== 'string' || !url.trim()) return '';
    try {
      const parsed = new URL(url.trim());
      return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : '';
    } catch { return ''; }
  };

  document.documentElement.classList.add('js-enabled');
  const projectGrid = $('#project-grid');
  const dialog = $('#project-dialog');
  const dialogContent = $('#dialog-content');
  const dialogClose = $('#dialog-close');
  let lastOpener = null;

  function renderPreview(project, detailed = false) {
    const alt = `${project.company} ${project.title} 프로젝트 작업 화면`;
    if (project.image?.trim()) {
      // 이미지가 실패한 경우 빈 화면을 보여주지 않도록 이미지 자체를 카드에서 숨김
      return `<div class="${detailed ? 'dialog-visual' : `project-preview has-image`}" ${detailed ? '' : `data-kind="${escapeHTML(project.id)}"`}>
        <img src="${escapeHTML(project.image.trim())}" alt="${escapeHTML(alt)}" loading="lazy" data-project-image>
      </div>`;
    }
    if (detailed) {
      return `<div class="dialog-visual"><p class="dialog-empty"><strong>작업 화면 등록 전</strong>공개 가능한 프로젝트 이미지가 준비되면<br>이 영역에 표시됩니다.</p></div>`;
    }
    return `<div class="project-preview" data-kind="${escapeHTML(project.id)}" aria-label="실제 이미지가 등록되지 않은 미리보기 영역">
      <div class="preview-browser" aria-hidden="true">
        <div class="preview-topbar"><i></i><i></i><i></i></div>
        <div class="preview-inner"><span class="preview-placeholder-title">${escapeHTML(project.company)}</span><div class="preview-lines"><i></i><i></i><i></i></div><span class="preview-label">프로젝트 이미지 영역</span></div>
      </div><span class="preview-safety">이미지 등록 전 · 안내용 화면</span>
    </div>`;
  }

  function renderCard(project, index) {
    return `<article role="listitem" class="project-card ${index === 0 ? 'is-featured' : ''}" data-category="${escapeHTML(project.category)}" data-project-id="${escapeHTML(project.id)}">
      ${renderPreview(project)}
      <div class="project-content">
        <div class="project-meta"><span class="project-num">${escapeHTML(project.number)}</span><span>${escapeHTML(project.type)}</span></div>
        <h3>${escapeHTML(project.title)}</h3>
        <p class="project-org">${escapeHTML(project.company)}</p>
        <p class="project-summary">${escapeHTML(project.summary)}</p>
        <div class="project-role"><span>담당 업무</span><strong>${escapeHTML(project.role)}</strong></div>
        <div class="project-bottom"><span class="project-period">${escapeHTML(project.period)}</span><button type="button" class="project-open" data-open-project="${escapeHTML(project.id)}" aria-haspopup="dialog" aria-controls="project-dialog" aria-label="${escapeHTML(project.company)} ${escapeHTML(project.title)} 자세히 보기">자세히 보기 <span aria-hidden="true">↗</span></button></div>
      </div>
    </article>`;
  }
  projectGrid.innerHTML = data.projects.map(renderCard).join('');

  // 잘못된 이미지 경로에도 빈 영역만 남지 않도록 안내 문구를 표시
  function handleImageError(event) {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.hasAttribute('data-project-image')) return;
    const wrapper = image.parentElement;
    image.remove();
    wrapper.classList.add('image-error');
    const message = document.createElement('p');
    message.className = 'dialog-empty';
    message.textContent = '이미지 경로를 확인해 주세요.';
    wrapper.append(message);
  }
  projectGrid.addEventListener('error', handleImageError, true);
  dialogContent.addEventListener('error', handleImageError, true);

  function detailHTML(project) {
    const link = project.id === 'hana' ? safeHttpUrl(project.url) : '';
    return `<div class="dialog-intro"><span class="dialog-kicker">${escapeHTML(project.company)} · ${escapeHTML(project.type)}</span><h2 id="dialog-title" tabindex="-1">${escapeHTML(project.title)}</h2><p>${escapeHTML(project.summary)}</p></div>
      <div class="dialog-details"><span><strong>참여 기간</strong> ${escapeHTML(project.period)}</span><span><strong>담당</strong> ${escapeHTML(project.role)}</span></div>
      ${renderPreview(project, true)}
      <section class="dialog-section"><h3>프로젝트 배경</h3><p>${escapeHTML(project.situation)}</p></section>
      <section class="dialog-section"><h3>주요 수행 업무</h3><ul>${project.tasks.map(task => `<li>${escapeHTML(task)}</li>`).join('')}</ul></section>
      <section class="dialog-section"><h3>작업 시 중점 사항</h3><p>${escapeHTML(project.focus)}</p></section>
      ${link ? `<div class="dialog-link-row"><a href="${escapeHTML(link)}" class="dialog-link" target="_blank" rel="noopener noreferrer">${escapeHTML(project.urlLabel || '프로젝트 링크')} 바로가기 (새 창) <span aria-hidden="true">↗</span></a></div>` : ''}`;
  }

  projectGrid.addEventListener('click', (event) => {
    const card = event.target.closest('.project-card');
    if (!card || !projectGrid.contains(card)) return;
    const button = card.querySelector('[data-open-project]');
    if (!button) return;
    const project = data.projects.find(p => p.id === card.dataset.projectId);
    if (!project) return;
    lastOpener = button;
    dialogContent.innerHTML = detailHTML(project);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
      document.body.classList.add('dialog-open');
    } else {
      // 구형 브라우저에서도 상세 내용은 표시
      dialog.setAttribute('open', '');
    }
    dialog.scrollTop = 0;
    $('#dialog-title').focus({ preventScroll: true });
  });
  function restoreDialogFocus() {
    document.body.classList.remove('dialog-open');
    lastOpener?.focus({ preventScroll: true });
  }
  function closeDialog() {
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else {
      dialog.removeAttribute('open');
      restoreDialogFocus();
    }
  }
  dialogClose.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) closeDialog();
  });
  dialog.addEventListener('close', restoreDialogFocus);

  // 작은 최신 인터랙션: View Transitions API가 지원되면 필터 전환에 사용
  $$('.filter-button').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    const applyFilter = () => {
      $$('.filter-button').forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      $$('.project-card', projectGrid).forEach(card => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.hidden = !matches;
      });
      requestAnimationFrame(() => {
        updateProgress();
        updateNavActive();
      });
    };
    if (!motionPreference.matches && typeof document.startViewTransition === 'function') {
      document.startViewTransition(applyFilter);
    } else applyFilter();
  }));

  // 모바일 메뉴
  const menuToggle = $('#menu-toggle');
  const siteNav = $('#site-nav');
  function setMenuOpen(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    siteNav.classList.toggle('is-open', open);
  }
  menuToggle.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
  // 해시 이동 시 실제 초점도 목적지로 옮겨 다음 Tab이 해당 영역에서 이어지게 함.
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const target = document.getElementById(link.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    setMenuOpen(false);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: motionPreference.matches ? 'instant' : 'smooth' });
    history.replaceState(null, '', link.hash);
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !dialog.open && menuToggle.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
  const mobileLayout = window.matchMedia('(max-width: 790px)');
  mobileLayout.addEventListener('change', () => {
    const active = document.activeElement;
    setMenuOpen(false);
    if (mobileLayout.matches && siteNav.contains(active)) menuToggle.focus();
    else if (!mobileLayout.matches && active === menuToggle) $('a', siteNav).focus();
  });
  document.addEventListener('focusin', event => {
    event.target.closest('[data-reveal]')?.classList.add('is-visible');
    if (!siteNav.contains(event.target) && event.target !== menuToggle) setMenuOpen(false);
  });
  $('#back-to-top').addEventListener('click', () => {
    $('.brand').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motionPreference.matches ? 'auto' : 'smooth' });
  });

  // 스크롤 진행률
  const progress = $('#scroll-progress');
  let scrollQueued = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max <= 0 ? 0 : (window.scrollY / max) * 100) + '%';
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  // 섹션 진입 인터랙션(동작 줄이기 설정 반영)
  const revealTargets = $$('[data-reveal]');
  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { threshold: .07, rootMargin: '0px 0px 45px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else revealTargets.forEach(el => el.classList.add('is-visible'));

  // 현재 영역에 따라 메뉴 강조: 페이지 맨 위에서는 선택 상태 초기화
  const navLinks = $$('#site-nav a[href^="#"]');
  const navSections = ['about', 'skills', 'projects', 'process', 'contact']
    .map(id => document.getElementById(id)).filter(Boolean);
  function updateNavActive() {
    let currentId = '';
    for (const section of navSections) {
      if (section.getBoundingClientRect().top <= 170) currentId = section.id;
    }
    if (window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2) {
      currentId = navSections.at(-1)?.id || currentId;
    }
    navLinks.forEach(link => {
      const current = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('is-current', current);
      if (current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('scroll', updateNavActive, { passive: true });
  window.addEventListener('resize', updateNavActive);
  updateNavActive();

  // 실제 이메일이 입력된 경우에만 메일 링크를 노출
  const email = (data.contact?.email || '').trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    $('#contact-email').textContent = email;
    $('#contact-note').textContent = '웹퍼블리싱 관련 문의는 이메일로 연락 부탁드립니다.';
    const contactAction = $('#contact-action');
    contactAction.href = `mailto:${email}`;
    contactAction.hidden = false;
  }
})();
