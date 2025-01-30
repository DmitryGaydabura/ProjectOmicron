/************************************
 omicron.js — сборный файл скриптов
 ************************************/

let scene, camera, renderer;
let planet, atmosphere;

// «Взрыв» звёзд
let starExplosionFactor = 5;

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
      this.z = Math.random() * 500;
      this.speed = Math.random() * 0.02 + 0.01;
      this.size = Math.random() * 1.5 + 0.5;
    }
    update() {
      this.z -= this.speed * starExplosionFactor;
      if (this.z <= 0) {
        this.reset();
        this.z = 500;
      }
      const factor = 100 / this.z;
      this.drawX = (this.x - canvas.width / 2) * factor + canvas.width / 2;
      this.drawY = (this.y - canvas.height / 2) * factor + canvas.height / 2;
      this.radius = this.size * factor;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.drawX, this.drawY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${this.z * 0.2}, 80%, 60%)`;
      ctx.fill();
    }
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 2000 }, () => new Star());
  }

  function animate() {
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

function initPlanet() {
  const container = document.getElementById('three-container');
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
  );
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  const textureLoader = new THREE.TextureLoader();
  const planetTexture = textureLoader.load('assets/textures/Swamp.png');

  const geometry = new THREE.SphereGeometry(1.3, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: planetTexture,
    metalness: 0.2,
    roughness: 0.7
  });
  planet = new THREE.Mesh(geometry, material);
  scene.add(planet);

  const atmosphereGeo = new THREE.SphereGeometry(1.35, 64, 64);
  const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x7ec0ee,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
  scene.add(atmosphere);

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

function initCircularText() {
  const circularTextElem = document.querySelector('.circular-text');
  if (!circularTextElem) return;

  const text = circularTextElem.textContent.trim();
  circularTextElem.textContent = '';

  const container = document.createElement('div');
  container.classList.add('text-container');
  container.classList.add('rotate-container');
  circularTextElem.appendChild(container);

  const letters = text.split('');
  const total = letters.length;
  const angleStep = 360 / total;
  const radius = 100;

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

function generateComets() {
  const cometsContainer = document.querySelector('.comets');
  if (!cometsContainer) return;

  const MAX_COMETS = 100;
  const COMET_INTERVAL = 1000;

  function createComet() {
    if (cometsContainer.children.length >= MAX_COMETS) {
      return;
    }
    const comet = document.createElement('div');
    comet.classList.add('comet');
    const colors = ['blue', 'purple', 'white'];
    const colorClass = colors[Math.floor(Math.random() * colors.length)];
    comet.classList.add(colorClass);

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
    comet.style.animationDuration = `${Math.random() * 0.5 + 1.5}s`;
    cometsContainer.appendChild(comet);
    comet.addEventListener('animationend', () => {
      comet.remove();
    });
  }

  setInterval(createComet, COMET_INTERVAL);
  for (let i = 0; i < 3; i++) {
    setTimeout(createComet, Math.random() * COMET_INTERVAL);
  }
}

/* ------------------------------------------------------------------
   Ниже — вместо initResumeCards() делаем setupTabs() +
   можете добавить эффекты на саму .frame, если пожелаете.
------------------------------------------------------------------ */

/** Настраиваем логику вкладок (панелей) */
function setupTabs() {
  // Находим все кнопки, у которых есть data-panel
  const buttons = document.querySelectorAll('[data-panel]');
  const panels = document.querySelectorAll('.panel');
  const frame = document.querySelector('.frame'); // будем вращать/трансформировать

  // Функция включения нужной панели
  function activatePanel(panelName) {
    // Сначала выключаем все
    panels.forEach((p) => {
      p.classList.remove('active');
      p.style.pointerEvents = 'none';
    });

    // Включаем нужную
    const target = document.querySelector(`.panel-${panelName}`);
    if (target) {
      target.classList.add('active');
      target.style.pointerEvents = 'auto';
    }
  }

  // Пример анимации 3D при переходе
  function goToPanel(panelName) {
    let rotateY = 0;
    let rotateX = 0;
    let translateZ = 0;

    // Главная панель
    if (panelName === 'main') {
      rotateY = 0;
      rotateX = 0;
      translateZ = 0;
    }
    else if (panelName === 'projects') {
      // например, повернём вправо
      rotateY = -90;
      translateZ = -400;
    }
    else if (panelName === 'tech') {
      // повернём влево
      rotateY = 90;
      translateZ = -400;
    }
    else if (panelName === 'about') {
      // повернём вверх
      rotateX = -90;
      translateZ = -400;
    }

    // Делаем анимацию через anime.js
    anime({
      targets: frame,
      rotateY: rotateY,
      rotateX: rotateX,
      translateZ: translateZ,
      duration: 1000,
      easing: 'easeInOutExpo',
      complete: () => {
        // По окончании анимации включаем нужную панель
        activatePanel(panelName);
      }
    });
  }

  // Вешаем обработчики клика
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const panelName = btn.getAttribute('data-panel');
      goToPanel(panelName);
    });
  });

  // При загрузке включим главную
  activatePanel('main');
}


function initHoverEffects() {
  const links = document.querySelectorAll('.contact-link, .tabs button, .back-btn');
  links.forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      link.style.setProperty('--x', `${x}px`);
      link.style.setProperty('--y', `${y}px`);
    });
  });
}

/** Главная точка входа */
document.addEventListener('DOMContentLoaded', () => {
  const preloader = document.querySelector('.preloader');

  // Когда окно полностью загружено (включая ресурсы)
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

  // Звёздный фон
  initCanvas();

  // Плавный переход «взрыва» к спокойному состоянию
  setTimeout(() => {
    anime({
      targets: { factor: starExplosionFactor },
      factor: 1,
      duration: 3000,
      easing: 'easeOutSine',
      update: anim => {
        starExplosionFactor = anim.animations[0].currentValue;
      }
    });
  }, 500);

  // Кометы
  generateComets();
  // Планета
  initPlanet();
  // Вращающийся круговой текст
  initCircularText();
  // Вкладки
  setupTabs();
  // Hover-эффекты на кнопки/ссылки
  initHoverEffects();
});
