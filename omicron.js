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
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
  if (!circularTextElem) return;

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


// ================== 3D-ЭФФЕКТ КАРТОЧЕК ======================
function initLetterBoxes() {
  const letterBoxes = document.querySelectorAll('.letter-box');

  letterBoxes.forEach(box => {
    // Наведение на саму карточку
    box.addEventListener('mousemove', (e) => {
      const rect = box.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Координаты относительно центра
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      const rotateY = ((x - halfWidth) / halfWidth) * 10; // 10 градусов
      const rotateX = -((y - halfHeight) / halfHeight) * 10;

      box.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`;
    });

    // Когда мышь уходит с карточки
    box.addEventListener('mouseleave', () => {
      box.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });
}


// ================== ГЕНЕРАЦИЯ КОМЕТ ===============================
function generateComets() {
  const cometsContainer = document.querySelector('.comets');
  if (!cometsContainer) return;

  function createComet() {
    // Проверяем, не превышено ли максимальное количество комет
    if (cometsContainer.children.length >= MAX_COMETS) return;

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
});
