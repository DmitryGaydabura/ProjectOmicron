// ========= ПАРАМЕТРЫ =========

const NUM_STARS = 2000;        // Количество звёзд
const COMET_INTERVAL = 10;   // Интервал между появлениями комет (в мс)
const MAX_COMETS = 100;         // Максимальное количество одновременно летящих комет

// ========= ГЛОБАЛЬНЫЕ =========
let canvas, ctx;       // для звёздного фона
let stars = [];        // массив звёзд
let scene, camera, renderer; // Three.js
let planet, atmosphere;      // Mesh для планеты и атмосферы

// ================== CANVAS ЗВЁЗД =====================
function initCanvas() {
  canvas = document.getElementById('starfield');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Генерируем звёзды
  stars = [];
  for (let i = 0; i < NUM_STARS; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 3 + 1,  // 1..4 px
      alpha: Math.random(),         // начальная прозрачность
      alphaChange: (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1),
      twinkleSpeed: Math.random() * 0.02 + 0.01 // скорость мерцания
    });
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const s of stars) {
    s.alpha += s.alphaChange;
    if (s.alpha <= 0) {
      s.alpha = 0;
      s.alphaChange *= -1;
    } else if (s.alpha >= 1) {
      s.alpha = 1;
      s.alphaChange *= -1;
    }
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  requestAnimationFrame(animateStars);
}

// ================== ТРИ.ЖС ПЛАНЕТА ===================
function initPlanet() {
  const container = document.getElementById('three-container');

  // Сцена
  scene = new THREE.Scene();

  // Камера
  camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
  );
  camera.position.set(0, 0, 5);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Рендерер
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Свет
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Текстура планеты
  const textureLoader = new THREE.TextureLoader();
  const planetTexture = textureLoader.load('assets/textures/Swamp.png');

  // Геометрия планеты (радиус 1.3)
  const geometry = new THREE.SphereGeometry(1.3, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: planetTexture,
    metalness: 0.2,
    roughness: 0.7
  });
  planet = new THREE.Mesh(geometry, material);
  scene.add(planet);

  // Атмосфера
  const atmosphereGeo = new THREE.SphereGeometry(1.35, 64, 64);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x7ec0ee,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  scene.add(atmosphere);

  // Ресайз
  window.addEventListener('resize', onWindowResize, false);

  // Стартуем анимацию
  animatePlanet();
}

function onWindowResize() {
  const container = document.getElementById('three-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animatePlanet() {
  requestAnimationFrame(animatePlanet);
  // Лёгкое вращение планеты
  planet.rotation.y += 0.005;
  atmosphere.rotation.y += 0.001;

  renderer.render(scene, camera);
}

// ================= КРУГОВАЯ НАДПИСЬ ==================
function initCircularText() {
  const circularTextElem = document.querySelector('.circular-text');
  if (!circularTextElem) {
    return;
  }

  const text = circularTextElem.textContent.trim();
  circularTextElem.textContent = ''; // очищаем

  // Контейнер для букв
  const container = document.createElement('div');
  container.classList.add('text-container');
  circularTextElem.appendChild(container);

  const letters = text.split('');
  const total = letters.length;

  // Шаг угла
  const angleStep = 360 / total;
  // Радиус (примерно 66 px, чтобы буквы шли по кругу внутри 200×200)
  const radius = 120; // Регулируйте радиус по необходимости

  letters.forEach((letter, i) => {
    const span = document.createElement('span');
    span.textContent = letter;

    const angle = angleStep * i;
    // Разворачиваем букву так, чтобы её нижняя часть смотрела к центру
    span.style.transform = `
      rotate(${angle}deg)
      translate(${radius}px)
      rotate(90deg)
    `;
    container.appendChild(span);
  });
}

// ================== ГЕНЕРАЦИЯ КОМЕТ ===============================
function generateComets() {
  const cometsContainer = document.querySelector('.comets');
  if (!cometsContainer) {
    return;
  }

  function createComet() {
    // Проверяем, не превышено ли максимальное количество комет
    if (cometsContainer.children.length >= MAX_COMETS) {
      return;
    }

    const comet = document.createElement('div');
    comet.classList.add('comet');

    // Случайный цвет кометы
    const colors = ['blue', 'purple', 'white'];
    const colorClass = colors[Math.floor(Math.random() * colors.length)];
    comet.classList.add(colorClass);

    // Случайная начальная позиция (слева или справа)
    const startFromLeft = Math.random() < 0.5;
    if (startFromLeft) {
      comet.style.left = `-10px`; // Начинаем за пределами экрана слева
      comet.style.top = `${Math.random() * 100}%`;
      comet.style.transform = `rotate(45deg)`; // Стандартное направление
    } else {
      comet.style.left = `100%`; // Начинаем за пределами экрана справа
      comet.style.top = `${Math.random() * 100}%`;
      comet.style.transform = `rotate(-45deg)`; // Поворачиваем комету в противоположную сторону
    }

    // Случайная анимационная задержка и длительность
    comet.style.animationDuration = `${Math.random() * 0.5 + 1.5}s`; // от 1.5s до 2s

    // Добавляем комету в контейнер
    cometsContainer.appendChild(comet);

    // Удаляем комету после завершения анимации
    comet.addEventListener('animationend', () => {
      comet.remove();
    });
  }

  // Запускаем генерацию комет через заданные интервалы
  setInterval(createComet, COMET_INTERVAL);

  // Создаём несколько комет сразу при загрузке для разнообразия
  for (let i = 0; i < 3; i++) {
    setTimeout(createComet, Math.random() * COMET_INTERVAL);
  }
}



function initPulseAnimation() {
  // Запускаем первую анимацию сразу
  animatePulse();

  // Затем запускаем анимацию каждые 12 секунд
  setInterval(animatePulse, 12000);
}

function initResumeCards() {
  const cards = document.querySelectorAll('.resume-card, .cta-button');
  const globalMouse = { x: 0, y: 0 };
  const cardStates = new Map();
  let animationFrame;
  const lerpFactor = 0.15;
  const parallaxIntensity = 0.03;
  const magnetPower = 0.15;

  cards.forEach(card => {
    cardStates.set(card, {
      x: 0,
      y: 0,
      scale: 1,
      isHovered: false,
      targetX: 0,
      targetY: 0,
      targetScale: 1
    });
  });

  function smoothUpdate() {
    let needsUpdate = false;
    cards.forEach(card => {
      const state = cardStates.get(card);
      if (!state.isHovered) {
        state.x += (state.targetX - state.x) * lerpFactor;
        state.y += (state.targetY - state.y) * lerpFactor;
        state.scale += (state.targetScale - state.scale) * lerpFactor;
      }
      const transform = `
        translate(${state.x}px, ${state.y}px)
        scale(${state.scale})
      `;
      if (card.style.transform !== transform) {
        card.style.transform = transform;
        needsUpdate = true;
      }
    });
    if (needsUpdate) animationFrame = requestAnimationFrame(smoothUpdate);
  }

  document.addEventListener('mousemove', (e) => {
    globalMouse.x = e.clientX;
    globalMouse.y = e.clientY;
    cards.forEach(card => {
      const state = cardStates.get(card);
      if (state.isHovered) return;
      const rect = card.getBoundingClientRect();
      const boxCenterX = rect.left + rect.width/2;
      const boxCenterY = rect.top + rect.height/2;
      const parallaxX = (globalMouse.x - window.innerWidth/2) * parallaxIntensity;
      const parallaxY = (globalMouse.y - window.innerHeight/2) * parallaxIntensity;
      const deltaX = globalMouse.x - boxCenterX;
      const deltaY = globalMouse.y - boxCenterY;
      const distance = Math.sqrt(deltaX**2 + deltaY**2);
      const maxDistance = 250;
      const force = Math.max(0, (1 - distance/maxDistance)) * magnetPower;
      state.targetX = parallaxX + deltaX * force;
      state.targetY = parallaxY + deltaY * force;
      state.targetScale = 1 + force * 0.3;
    });
    if (!animationFrame) animationFrame = requestAnimationFrame(smoothUpdate);
  });

  cards.forEach(card => {
    const state = cardStates.get(card);
    card.addEventListener('mouseenter', () => {
      state.isHovered = true;
      state.targetX = 0;
      state.targetY = 0;
      state.targetScale = 1.15;
      anime({
        targets: card,
        translateZ: [state.z || 0, 20],
        duration: 600,
        easing: 'easeOutExpo',
        update: (anim) => { state.z = anim.animations[0].currentValue; }
      });
    });
    card.addEventListener('mouseleave', () => {
      state.isHovered = false;
      anime({
        targets: card,
        translateZ: 0,
        duration: 800,
        easing: 'easeOutElastic',
        update: (anim) => { state.z = anim.animations[0].currentValue; }
      });
    });
  });
}

// Обновлённые функции анимации
function animatePulse() {
  anime({
    targets: '.resume-card',
    scale: [
      { value: 1.05, duration: 1500, easing: 'easeInOutSine' },
      { value: 1, duration: 2000, easing: 'easeOutElastic(1, .5)' }
    ],
    translateY: [
      { value: -5, duration: 1500, easing: 'easeInOutSine' },
      { value: 0, duration: 2000, easing: 'easeOutElastic(1, .5)' }
    ],
    delay: anime.stagger(100),
    loop: false
  });
}

function initGridEntrance() {
  anime({
    targets: '.resume-card, .cta-button',
    translateY: [100, 0],
    rotateX: [-90, 0],
    rotateZ: [15, 0],
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 1200,
    delay: anime.stagger(80),
    easing: 'spring(1, 80, 10, 0)',
    complete: () => {
      document.querySelectorAll('.resume-card').forEach(card => {
        card.style.transform = 'none';
      });
      animatePulse();
    }
  });
}

// ================== ЗАПУСК ВСЕГО ===============================
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  animateStars();
  generateComets();
  initPlanet();
  initResumeCards();
  initCircularText();
  initPulseAnimation();
  initGridEntrance();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  });

  // Анимация элементов при скролле
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.resume-card').forEach(card => {
    observer.observe(card);
  });
});