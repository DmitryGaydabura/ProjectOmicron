/************************************
 omicron.js — сборный файл скриптов
 ************************************/

// ---------- Глобальные для Three.js планеты ----------
let scene, camera, renderer;
let planet, atmosphere;

/**
 * Глобальный коэффициент для «взрыва» звёзд.
 * Сначала будет > 1, потом вернётся к 1.
 */
let starExplosionFactor = 5; // Стартуем с сильного эффекта

/** Инициализация звёздного холста */
function initCanvas() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];

  class Star {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.z = Math.random() * 500; // расстояние
      this.speed = Math.random() * 0.02 + 0.01;
      this.size = Math.random() * 1.5 + 0.5;
    }

    update() {
      // Вместо обычного this.z -= this.speed
      // умножаем на starExplosionFactor (5 → 1)
      this.z -= this.speed * starExplosionFactor;

      // Если улетела «за камеру» — сбрасываем
      if (this.z <= 0) {
        this.reset();
        // Чтобы эффект «рассыпания» был красивее,
        // можно вновь задать z побольше:
        this.z = 500;
      }

      // Вычисляем положение на экране
      const factor = 100 / this.z;
      this.drawX = (this.x - canvas.width / 2) * factor + canvas.width / 2;
      this.drawY = (this.y - canvas.height / 2) * factor + canvas.height / 2;
      this.radius = this.size * factor;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.drawX, this.drawY, this.radius, 0, Math.PI * 2);
      // Слегка меняем оттенок
      ctx.fillStyle = `hsl(${this.z * 0.2}, 80%, 60%)`;
      ctx.fill();
    }
  }

  // При ресайзе экрана пересоздаём массив звёзд
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 2000 }, () => new Star());
  }

  // Анимация звёзд
  function animate() {
    // Чуть прозрачная заливка, дающая «шлейф»
    ctx.fillStyle = 'rgba(10,10,22,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    stars.forEach(star => {
      star.update();
      star.draw();
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();
}

/** Инициализация планеты на Three.js */
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

  // Текстура планеты (замените путь при необходимости)
  const textureLoader = new THREE.TextureLoader();
  const planetTexture = textureLoader.load('assets/textures/Swamp.png');

  // Геометрия и материал планеты
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

  // Следим за ресайзом контейнера
  window.addEventListener('resize', onWindowResize, false);

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
  planet.rotation.y += 0.005;
  atmosphere.rotation.y += 0.001;
  renderer.render(scene, camera);
}

/** Круговой текст с вращением */
function initCircularText() {
  const circularTextElem = document.querySelector('.circular-text');
  if (!circularTextElem) return;

  const text = circularTextElem.textContent.trim();
  circularTextElem.textContent = '';

  const container = document.createElement('div');
  container.classList.add('text-container');
  container.classList.add('rotate-container'); // класс для CSS-анимации вращения
  circularTextElem.appendChild(container);

  const letters = text.split('');
  const total = letters.length;
  const angleStep = 360 / total;
  const radius = 100; // радиус, подбирайте под себя

  letters.forEach((letter, i) => {
    const span = document.createElement('span');
    span.textContent = letter;

    const angle = angleStep * i;
    span.style.transform = `
      rotate(${angle}deg)
      translate(${radius}px)
      rotate(90deg)
    `;
    container.appendChild(span);
  });
}

/** Кометы (оставим как было) */
function generateComets() {
  const cometsContainer = document.querySelector('.comets');
  if (!cometsContainer) return;

  const MAX_COMETS = 100;
  const COMET_INTERVAL = 1000; // интервал

  function createComet() {
    // Не более MAX_COMETS комет одновременно
    if (cometsContainer.children.length >= MAX_COMETS) {
      return;
    }
    const comet = document.createElement('div');
    comet.classList.add('comet');

    // случайный цвет
    const colors = ['blue', 'purple', 'white'];
    const colorClass = colors[Math.floor(Math.random() * colors.length)];
    comet.classList.add(colorClass);

    // Начальная позиция (слева или справа)
    const startFromLeft = Math.random() < 0.5;
    if (startFromLeft) {
      comet.style.left = `-10px`;
      comet.style.top = `${Math.random() * 100}%`;
      comet.style.transform = `rotate(45deg)`;
    } else {
      comet.style.left = `100%`;
      comet.style.top = `${Math.random() * 100}%`;
      comet.style.transform = `rotate(-45deg)`;
    }

    // Длительность полёта
    comet.style.animationDuration = `${Math.random() * 0.5 + 1.5}s`;

    cometsContainer.appendChild(comet);
    comet.addEventListener('animationend', () => {
      comet.remove();
    });
  }

  // Запуск комет каждые COMET_INTERVAL
  setInterval(createComet, COMET_INTERVAL);

  // Небольшой «вброс» комет в начале
  for (let i = 0; i < 3; i++) {
    setTimeout(createComet, Math.random() * COMET_INTERVAL);
  }
}

/** «Магнитные» карточки */
function initResumeCards() {
  const cards = document.querySelectorAll('.resume-card');
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
      targetScale: 1,
      z: 0
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
    if (needsUpdate) {
      animationFrame = requestAnimationFrame(smoothUpdate);
    } else {
      animationFrame = null;
    }
  }

  document.addEventListener('mousemove', (e) => {
    globalMouse.x = e.clientX;
    globalMouse.y = e.clientY;
    cards.forEach(card => {
      const state = cardStates.get(card);
      if (state.isHovered) return;

      const rect = card.getBoundingClientRect();
      const boxCenterX = rect.left + rect.width / 2;
      const boxCenterY = rect.top + rect.height / 2;

      const parallaxX = (globalMouse.x - window.innerWidth / 2) * parallaxIntensity;
      const parallaxY = (globalMouse.y - window.innerHeight / 2) * parallaxIntensity;

      const deltaX = globalMouse.x - boxCenterX;
      const deltaY = globalMouse.y - boxCenterY;
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const maxDistance = 250;
      const force = Math.max(0, (1 - distance / maxDistance)) * magnetPower;

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
      anime({
        targets: card,
        translateZ: [state.z, 20],
        scale: 1.15,
        duration: 600,
        easing: 'easeOutExpo',
        update: anim => {
          state.z = anim.animations[0].currentValue;
        }
      });
    });

    card.addEventListener('mouseleave', () => {
      state.isHovered = false;
      anime({
        targets: card,
        translateZ: 0,
        scale: 1,
        duration: 800,
        easing: 'easeOutElastic',
        update: anim => {
          state.z = anim.animations[0].currentValue;
        }
      });
    });
  });
}

/** Tilt-эффект (если хотите совместить с магнитным — аккуратно) */
function initCardInteractions() {
  const cards = document.querySelectorAll('.resume-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      anime({
        targets: card,
        translateX: (x - rect.width / 2) * 0.05,
        translateY: (y - rect.height / 2) * 0.05,
        rotateY: (x - rect.width / 2) * 0.1,
        rotateX: -(y - rect.height / 2) * 0.1,
        scale: 1.02,
        duration: 300,
        easing: 'easeOutQuad'
      });
    });

    card.addEventListener('mouseleave', () => {
      anime({
        targets: card,
        translateX: 0,
        translateY: 0,
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        duration: 800,
        easing: 'easeOutElastic'
      });
    });
  });
}

/** Подсветка при наведении на ссылки */
function initHoverEffects() {
  const links = document.querySelectorAll('.contact-link');
  links.forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const x = e.pageX - link.offsetLeft;
      const y = e.pageY - link.offsetTop;
      link.style.setProperty('--x', `${x}px`);
      link.style.setProperty('--y', `${y}px`);
    });
  });
}

/** Анимация «пульса» карточек */
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

/** Анимация появления карточек «с гридом» */
function initGridEntrance() {
  anime({
    targets: '.resume-card',
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
      // После первичной анимации — запускаем «пульс»
      animatePulse();
    }
  });
}

/** Главный слушатель, который всё запускает */
document.addEventListener('DOMContentLoaded', () => {
  // Прелоадер
  const preloader = document.querySelector('.preloader');

  // Когда window полностью загружено
  window.addEventListener('load', () => {
    anime({
      targets: preloader,
      opacity: 0,
      duration: 1000,
      easing: 'easeOutExpo',
      complete: () => {
        preloader.style.display = 'none';
      }
    });
  });

  // Инициализация всех компонентов
  initCanvas();          // Звёздный фон (с «взрывом»)

  // ------------------ Плавный переход от «5» к «1» ------------------
  setTimeout(() => {
    anime({
      targets: { factor: starExplosionFactor },
      factor: 1,
      duration: 3000,    // 3 секунды анимации
      easing: 'easeOutSine',
      update: anim => {
        starExplosionFactor = anim.animations[0].currentValue;
      }
    });
  }, 500); // через 0.5 сек после загрузки — даём чуть «броска», потом плавно уходим

  generateComets();      // Кометы (обычный режим)
  initPlanet();          // Планета
  initCircularText();    // Круговой текст (вращение против часовой)
  initResumeCards();     // «Магнитные» карточки
  // initCardInteractions(); // Если хотите tilt-эффект — раскомментируйте
  initHoverEffects();    // Hover эффект для ссылок
  initGridEntrance();    // Появление карточек + "пульс"
});
