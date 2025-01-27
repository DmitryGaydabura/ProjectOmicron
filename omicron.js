// ========= Конфигурационные значения =============
const NUM_STARS = 1000;        // Количество звёзд
const COMET_INTERVAL = 4000;   // Интервал в мс между появлениями комет
const MAX_COMETS = 10;         // Макс. одновременно летящих комет

// ========= Глобальные переменные для звёзд =
let canvas, ctx;
let stars = [];

// Инициализация canvas и ресайз
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
      size: Math.random() * 2 + 1,    // 1..3 px
      alpha: Math.random(),          // начальная прозрачность
      alphaChange: (Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1)
      // небольшое случайное изменение прозрачности
    });
  }
}

// Подгонка размера canvas к окну
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Анимация звёзд
function animateStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рисуем и анимируем звёзды (мерцание)
  for (let s of stars) {
    s.alpha += s.alphaChange;
    if (s.alpha <= 0) {
      s.alpha = 0;
      s.alphaChange = -s.alphaChange; // меняем направление
    } else if (s.alpha >= 1) {
      s.alpha = 1;
      s.alphaChange = -s.alphaChange;
    }
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  requestAnimationFrame(animateStars);
}

// ====================== Three.js планета =========================
let scene, camera, renderer, planet, atmosphere;

function initPlanet() {
  // Контейнер для рендера
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
  camera.position.z = 5;

  // Рендерер
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Свет
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Увеличенная интенсивность
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Увеличенная интенсивность
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Загрузчик текстур
  const textureLoader = new THREE.TextureLoader();

  // Текстура планеты
  const planetTexture = textureLoader.load('assets/textures/Swamp.png', onLoadTexture, onProgress, onError);

  // Геометрия и материал планеты
  const geometry = new THREE.SphereGeometry(1.5, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: planetTexture,
    metalness: 0.2,
    roughness: 0.7
  });
  planet = new THREE.Mesh(geometry, material);
  scene.add(planet);

  // Атмосфера (лёгкое свечение)
  const atmosphereGeometry = new THREE.SphereGeometry(1.55, 64, 64);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x7ec0ee,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // Ресайз
  window.addEventListener('resize', onWindowResize, false);

  animatePlanet();
}

// Обработчики загрузки текстур
function onLoadTexture(texture) {
  console.log('Текстура загружена:', texture);
}

function onProgress(xhr) {
  console.log((xhr.loaded / xhr.total * 100) + '% загружено');
}

function onError(err) {
  console.error('Ошибка загрузки текстуры:', err);
}

function onWindowResize() {
  const container = document.getElementById('three-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// Анимация планеты
function animatePlanet() {
  requestAnimationFrame(animatePlanet);
  planet.rotation.y += 0.005;
  atmosphere.rotation.y += 0.001;
  renderer.render(scene, camera);
}

// ================== 3D-эффект для карточек ======================
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

// ================== Генерация комет ===============================
function generateComets() {
  const cometsContainer = document.querySelector('.comets');

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

// ================== Добавление анимированной круговой надписи ===============================
function initCircularText() {
  const circularTextContainer = document.querySelector('.circular-text');
  const text = circularTextContainer.textContent.trim();
  circularTextContainer.textContent = ''; // Очищаем текст для последующей генерации букв

  const radius = 80; // Радиус круга, по которому будут размещаться буквы
  const letters = text.split('');
  const total = letters.length;
  const angleStep = 360 / total;

  letters.forEach((letter, index) => {
    const span = document.createElement('span');
    span.textContent = letter;
    const angle = angleStep * index;
    // Устанавливаем трансформацию: поворот на угол, смещение по X на радиус, обратный поворот для правильного отображения
    span.style.transform = `rotate(${angle}deg) translateX(${radius}px) rotate(${-angle}deg)`;
    circularTextContainer.appendChild(span);
  });
}

// ================== Запуск всего ===============================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Инициализируем канвас и запускаем анимацию звёзд
  initCanvas();
  animateStars();

  // 2. Генерируем кометы
  generateComets();

  // 3. Инициализируем планету Three.js
  initPlanet();

  // 4. 3D-эффект для карточек
  initLetterBoxes();

  // 5. Инициализируем круговую надпись
  initCircularText();
});
