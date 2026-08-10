const API_BASE = (window.STRATUM_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const form = document.getElementById('tgapps-form');
const statusNode = document.getElementById('tgapps-status');
const heroStage = document.getElementById('hero-stage');

function api(path) {
  return `${API_BASE}${path}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function setStatus(message, type = '') {
  statusNode.textContent = message;
  statusNode.className = `form-status${type ? ` is-${type}` : ''}`;
}

async function postJson(path, payload) {
  const response = await fetch(api(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.message || 'Ошибка отправки');
  return data;
}

function syncHeroScene() {
  if (!heroStage) return;
  const rect = heroStage.getBoundingClientRect();
  const total = rect.height + window.innerHeight;
  const progress = clamp((window.innerHeight - rect.top) / total, 0, 1);
  document.documentElement.style.setProperty('--hero-progress', String(progress));
}

function handlePointerMove(event) {
  if (!heroStage) return;
  const rect = heroStage.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  document.documentElement.style.setProperty('--pointer-x', `${x.toFixed(2)}px`);
  document.documentElement.style.setProperty('--pointer-y', `${y.toFixed(2)}px`);
}

function resetPointer() {
  document.documentElement.style.setProperty('--pointer-x', '0px');
  document.documentElement.style.setProperty('--pointer-y', '0px');
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.14 });
  document.querySelectorAll('[data-reveal]').forEach((node) => observer.observe(node));
}

async function handleSubmit(event) {
  event.preventDefault();
  const fd = new FormData(form);
  if (!fd.get('consent')) {
    setStatus('Подтвердите согласие на обработку данных.', 'error');
    return;
  }
  setStatus('Отправляем заявку…');
  try {
    const message = [
      'Источник: TgApps',
      `Тип проекта: ${fd.get('project_type') || '-'}`,
      `Срок: ${fd.get('deadline') || '-'}`,
      `Бюджет: ${fd.get('budget') || '-'}`,
      '',
      String(fd.get('message') || '').trim(),
    ].join('\n');

    await postJson('/api/stratum/apply', {
      name: fd.get('name'),
      contact: fd.get('contact'),
      telegram_id: String(fd.get('contact') || '').trim(),
      application_type: 'Разработка Telegram Mini App',
      message,
    });

    form.reset();
    setStatus('Заявка отправлена. Мы свяжемся с вами для обсуждения цены и ТЗ.', 'success');
  } catch (error) {
    setStatus(error.message || 'Не удалось отправить заявку.', 'error');
  }
}

function init() {
  initReveal();
  syncHeroScene();
  form?.addEventListener('submit', handleSubmit);
  window.addEventListener('scroll', syncHeroScene, { passive: true });
  window.addEventListener('resize', syncHeroScene);
  heroStage?.addEventListener('mousemove', handlePointerMove);
  heroStage?.addEventListener('mouseleave', resetPointer);
}

init();