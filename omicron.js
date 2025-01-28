// ========= ПАРАМЕТРЫ =========

const NUM_STARS = 1000;        // Количество звёзд
const COMET_INTERVAL = 4000;   // Интервал между появлениями комет (в мс)
const MAX_COMETS = 10;         // Максимальное количество одновременно летящих комет

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
      size: Math.random() * 2 + 1,  // 1..3 px
      alpha: Math.random(),         // начальная прозрачность
      alphaChange: (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1)
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

// ========= ОБНОВЛЕННЫЙ КОД ДЛЯ LETTER-BOXES =========
function initLetterBoxes() {
  const letterBoxes = document.querySelectorAll('.letter-box');
  const globalMouse = { x: 0, y: 0 };
  const boxStates = new Map();
  let animationFrame;
  const lerpFactor = 0.15;
  const parallaxIntensity = 0.03;
  const magnetPower = 0.15;

  // Инициализация состояний
  letterBoxes.forEach(box => {
    boxStates.set(box, {
      x: 0,
      y: 0,
      scale: 1,
      isHovered: false,
      targetX: 0,
      targetY: 0,
      targetScale: 1
    });
  });

  // Плавное обновление
  function smoothUpdate() {
    let needsUpdate = false;

    letterBoxes.forEach(box => {
      const state = boxStates.get(box);

      if (!state.isHovered) {
        state.x += (state.targetX - state.x) * lerpFactor;
        state.y += (state.targetY - state.y) * lerpFactor;
        state.scale += (state.targetScale - state.scale) * lerpFactor;
      }

      const transform = `
        translate(${state.x}px, ${state.y}px)
        scale(${state.scale})
      `;

      if (box.style.transform !== transform) {
        box.style.transform = transform;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      animationFrame = requestAnimationFrame(smoothUpdate);
    } else {
      animationFrame = null;
    }
  }

  // Обработчик движения мыши
  document.addEventListener('mousemove', (e) => {
    globalMouse.x = e.clientX;
    globalMouse.y = e.clientY;

    letterBoxes.forEach(box => {
      const state = boxStates.get(box);
      if (state.isHovered) return;

      const rect = box.getBoundingClientRect();
      const boxCenterX = rect.left + rect.width/2;
      const boxCenterY = rect.top + rect.height/2;

      // Параллакс
      const parallaxX = (globalMouse.x - window.innerWidth/2) * parallaxIntensity;
      const parallaxY = (globalMouse.y - window.innerHeight/2) * parallaxIntensity;

      // Магнетизм
      const deltaX = globalMouse.x - boxCenterX;
      const deltaY = globalMouse.y - boxCenterY;
      const distance = Math.sqrt(deltaX**2 + deltaY**2);
      const maxDistance = 250;
      const force = Math.max(0, (1 - distance/maxDistance)) * magnetPower;

      state.targetX = parallaxX + deltaX * force;
      state.targetY = parallaxY + deltaY * force;
      state.targetScale = 1 + force * 0.3;
    });

    if (!animationFrame) {
      animationFrame = requestAnimationFrame(smoothUpdate);
    }
  });

  // Обработчики hover
  letterBoxes.forEach(box => {
    const state = boxStates.get(box);

    box.addEventListener('mouseenter', () => {
      state.isHovered = true;
      state.targetX = 0;
      state.targetY = 0;
      state.targetScale = 1.15;

      anime({
        targets: box,
        translateZ: [state.z || 0, 20],
        duration: 600,
        easing: 'easeOutExpo',
        update: (anim) => {
          state.z = anim.animations[0].currentValue;
        }
      });
    });

    box.addEventListener('mouseleave', () => {
      state.isHovered = false;

      anime({
        targets: box,
        translateZ: 0,
        duration: 800,
        easing: 'easeOutElastic',
        update: (anim) => {
          state.z = anim.animations[0].currentValue;
        }
      });
    });
  });
}
// ========= УПРОЩЕННАЯ ПУЛЬСАЦИЯ =========
function animatePulse() {
  const boxes = document.querySelectorAll('.letter-box');

  anime({
    targets: boxes,
    scale: [
      { value: 1.05, duration: 1500, easing: 'easeInOutSine' },
      { value: 1, duration: 2000, easing: 'easeOutElastic(1, .5)' }
    ],
    translateY: [
      { value: -5, duration: 1500, easing: 'easeInOutSine' },
      { value: 0, duration: 2000, easing: 'easeOutElastic(1, .5)' }
    ],
    boxShadow: [
      { value: '0 0 30px rgba(100,149,237,0.3)', duration: 1500 },
      { value: '0 8px 40px rgba(0,0,0,0.5)', duration: 2000 }
    ],
    delay: anime.stagger(150, { grid: [5, 5], from: 'center' }),
    easing: 'easeInOutSine',
    loop: false
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

// ================== АНИМАЦИЯ ПОЯВЛЕНИЯ СЕТКИ ================
function initGridEntrance() {
  const boxes = document.querySelectorAll('.letter-box');

  anime({
    targets: boxes,
    translateY: [100, 0],
    rotateX: [-90, 0],
    rotateZ: [15, 0],
    scale: [0.8, 1],
    opacity: [0, 1],
    duration: 1200,
    delay: anime.stagger(80, { grid: [5, 5], from: 'center' }),
    easing: 'spring(1, 80, 10, 0)',
    complete: () => {
      boxes.forEach(box => {
        box.style.transform = 'none';
      });
      // Запускаем первую пульсацию после завершения входа
      animatePulse();
    }
  });
}


function initPulseAnimation() {
  // Запускаем первую анимацию сразу
  animatePulse();

  // Затем запускаем анимацию каждые 12 секунд
  setInterval(animatePulse, 12000);
}

// ================== ЗАПУСК ВСЕГО ===============================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Звёздный фон
  initCanvas();
  animateStars();

  // 2. Кометы
  generateComets();

  // 3. Планета (Three.js)
  initPlanet();

  // 4. 3D-эффект при наведении на карточки
  initLetterBoxes();

  // 5. Кольцо текста (без анимации вращения)
  initCircularText();

  // 6. Пульсация сетки
  initPulseAnimation();

  // 7. Анимация появления сетки
  initGridEntrance();
});