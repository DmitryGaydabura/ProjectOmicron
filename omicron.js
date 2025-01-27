document.addEventListener('DOMContentLoaded', () => {
  const currentPage = 'index.html'; // Текущая страница

  const links = document.querySelectorAll('.letter-link');

  links.forEach(link => {
    // Получаем текущий путь страницы
    const page = window.location.pathname.split("/").pop();

    if (link.getAttribute('href') === page) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Генерация звёзд
  const starsContainer = document.querySelector('.stars');
  const numStars = 2000; // Количество звёзд

  for(let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.classList.add('star');

    // Случайное положение
    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;

    // Случайный размер
    const size = Math.random() * 2 + 1; // от 1px до 3px
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;

    // Случайная анимация задержки
    star.style.animationDelay = `${Math.random() * 5}s`;

    // Случайная продолжительность анимации
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;

    starsContainer.appendChild(star);
  }

  // Генерация комет
  const cometsContainer = document.querySelector('.comets');
  const cometInterval = 1000; // Интервал появления комет в миллисекундах (7 секунд)

  function createComet() {
    const comet = document.createElement('div');
    comet.classList.add('comet');

    // Рандомный цвет кометы
    const colors = ['blue', 'purple', 'white'];
    const colorClass = colors[Math.floor(Math.random() * colors.length)];
    comet.classList.add(colorClass);

    // Случайная начальная позиция (слева или справа)
    const startFromLeft = Math.random() < 0.5;
    if(startFromLeft) {
      comet.style.left = `-10px`; // Начинаем за пределами экрана слева
      comet.style.top = `${Math.random() * 100}%`;
    } else {
      comet.style.left = `100%`; // Начинаем за пределами экрана справа
      comet.style.top = `${Math.random() * 100}%`;
      comet.style.transform = `rotate(-45deg)`; // Поворачиваем комету в противоположную сторону
    }

    // Случайная анимационная задержка и длительность
    comet.style.animationDelay = `${Math.random() * 3}s`;
    comet.style.animationDuration = `${Math.random() * 2 + 2}s`; // от 2s до 4s

    // Добавляем комету в контейнер
    cometsContainer.appendChild(comet);

    // Удаляем комету после завершения анимации
    comet.addEventListener('animationend', () => {
      comet.remove();
    });
  }

  // Запускаем генерацию комет через заданные интервалы
  setInterval(createComet, cometInterval);

  // Создаём первую комету сразу при загрузке
  createComet();

  // Создание и анимация 3D-планеты с Three.js
  const container = document.getElementById('three-container');

  // Создаем сцену
  const scene = new THREE.Scene();

  // Создаем камеру
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  // Создаем рендерер
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Добавляем свет
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 3, 5);
  scene.add(directionalLight);

  // Загрузка текстур
  const textureLoader = new THREE.TextureLoader();
  const swampTexture = textureLoader.load('assets/textures/Swamp.png'); // Дополнительная текстура

  // Создаем геометрию и материал планеты
  const geometry = new THREE.SphereGeometry(1.5, 64, 64);
  const material = new THREE.MeshStandardMaterial({
    map: swampTexture,
  });
  const planet = new THREE.Mesh(geometry, material);
  scene.add(planet);

  // Добавление атмосферного слоя (опционально)
  const atmosphereGeometry = new THREE.SphereGeometry(1.55, 64, 64);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0x7ec0ee,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // Обработка изменения размера окна
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });

  // Анимация вращения планеты
  function animate() {
    requestAnimationFrame(animate);
    planet.rotation.y += 0.001; // Скорость вращения планеты
    atmosphere.rotation.y += 0.001;
    renderer.render(scene, camera);
  }

  animate();
});
