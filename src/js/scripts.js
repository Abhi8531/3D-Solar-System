import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Import textures
import starsTexture from "../images/stars.jpg";
import sunTexture from "../images/sun.jpg";
import mercuryTexture from "../images/mercury.jpg";
import venusTexture from "../images/venus.jpg";
import earthTexture from "../images/earth.jpg";
import marsTexture from "../images/mars.jpg";
import jupiterTexture from "../images/jupiter.jpg";
import saturnTexture from "../images/saturn.jpg";
import saturnRingTexture from "../images/saturn ring.png";
import uranusTexture from "../images/uranus.jpg";
import uranusRingTexture from "../images/uranus ring.png";
import neptuneTexture from "../images/neptune.jpg";
import plutoTexture from "../images/pluto.jpg";

// Initialize WebGL renderer with better settings
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

// Create a scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.00000025);

// Create a camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

// Initialize orbit controls
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(-90, 140, 140);
orbit.enableDamping = true;
orbit.dampingFactor = 0.05;
orbit.update();

// Time control variables
let timeSpeed = 1;
let isPaused = false;
let showOrbits = true;
let realisticScale = false;
let selectedPlanet = null;
let focusedObject = null; // Track the currently focused object
let isFocusLocked = false; // Track if camera should follow the object

// Create UI elements
createUI();

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

// Create starfield with particles
createStarfield();

// Initialize texture loader
const textureLoader = new THREE.TextureLoader();

// Load sun texture with glow effect
const sunMap = textureLoader.load(sunTexture);
sunMap.colorSpace = THREE.SRGBColorSpace;

// Create sun mesh with emissive material
const sunGeo = new THREE.SphereGeometry(16, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({
  map: sunMap,
  emissive: 0xffff00,
  emissiveIntensity: 1
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.castShadow = false;
sun.receiveShadow = false;
sun.name = 'Sun';
scene.add(sun);

// Create sun glow effect
const sunGlowGeo = new THREE.SphereGeometry(20, 64, 64);
const sunGlowMat = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0.3,
  side: THREE.BackSide
});
const sunGlow = new THREE.Mesh(sunGlowGeo, sunGlowMat);
sun.add(sunGlow);

// Add sun label
const sunLabel = createTextSprite('Sun');
sunLabel.scale.set(0.15, 0.075, 1);  // Same scale as planets for consistency
sun.add(sunLabel);
sunLabel.position.y = 20;

// Add multiple point lights for better sun lighting
const sunLight = new THREE.PointLight(0xffffff, 50000, 500);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const sunLight2 = new THREE.PointLight(0xffd700, 30000, 400);
sunLight2.position.set(0, 10, 0);
scene.add(sunLight2);

// Planet information data
const planetInfo = {
  'Sun': {
    diameter: '1.39 million km',
    dayLength: '25 Earth days',
    yearLength: 'N/A (Center of Solar System)',
    moons: 0,
    temperature: '5,500°C (surface) / 15 million°C (core)',
    fact: 'The Sun contains 99.86% of all mass in our solar system.'
  },
  'Mercury': {
    diameter: '4,879 km',
    dayLength: '58.6 Earth days',
    yearLength: '88 Earth days',
    moons: 0,
    temperature: '430°C (day) / -180°C (night)',
    fact: 'Mercury is the smallest planet in our solar system.'
  },
  'Venus': {
    diameter: '12,104 km',
    dayLength: '243 Earth days',
    yearLength: '225 Earth days',
    moons: 0,
    temperature: '462°C',
    fact: 'Venus rotates backwards compared to most planets.'
  },
  'Earth': {
    diameter: '12,742 km',
    dayLength: '24 hours',
    yearLength: '365.25 days',
    moons: 1,
    temperature: '15°C average',
    fact: 'Earth is the only planet known to harbor life.'
  },
  'Mars': {
    diameter: '6,779 km',
    dayLength: '24.6 hours',
    yearLength: '687 Earth days',
    moons: 2,
    temperature: '-63°C average',
    fact: 'Mars has the largest dust storms in the solar system.'
  },
  'Jupiter': {
    diameter: '139,820 km',
    dayLength: '9.9 hours',
    yearLength: '12 Earth years',
    moons: 79,
    temperature: '-108°C',
    fact: 'Jupiter has a Great Red Spot storm larger than Earth.'
  },
  'Saturn': {
    diameter: '116,460 km',
    dayLength: '10.7 hours',
    yearLength: '29 Earth years',
    moons: 82,
    temperature: '-139°C',
    fact: 'Saturn could float in water because of its low density.'
  },
  'Uranus': {
    diameter: '50,724 km',
    dayLength: '17.2 hours',
    yearLength: '84 Earth years',
    moons: 27,
    temperature: '-197°C',
    fact: 'Uranus rotates on its side at a 98-degree angle.'
  },
  'Neptune': {
    diameter: '49,244 km',
    dayLength: '16.1 hours',
    yearLength: '165 Earth years',
    moons: 14,
    temperature: '-201°C',
    fact: 'Neptune has the fastest winds in the solar system.'
  },
  'Pluto': {
    diameter: '2,376 km',
    dayLength: '6.4 Earth days',
    yearLength: '248 Earth years',
    moons: 5,
    temperature: '-223°C',
    fact: 'Pluto was reclassified as a dwarf planet in 2006.'
  }
};

// Function to create UI elements
function createUI() {
  // Create control panel
  const controlPanel = document.createElement('div');
  controlPanel.style.position = 'absolute';
  controlPanel.style.top = '20px';
  controlPanel.style.left = '20px';
  controlPanel.style.background = 'rgba(0, 0, 0, 0.7)';
  controlPanel.style.padding = '20px';
  controlPanel.style.borderRadius = '10px';
  controlPanel.style.color = 'white';
  controlPanel.style.fontFamily = 'Arial, sans-serif';
  controlPanel.style.minWidth = '250px';
  controlPanel.innerHTML = `
    <h3 style="margin-top: 0;">Solar System Controls</h3>
    <div style="margin-bottom: 15px;">
      <label>Time Speed: <span id="speedValue">1x</span></label><br>
      <input type="range" id="timeSpeed" min="0" max="10" value="1" step="0.1" style="width: 100%;">
    </div>
    <div style="margin-bottom: 15px;">
      <button id="pauseBtn" style="padding: 5px 10px; margin-right: 10px;">Pause</button>
      <button id="resetBtn" style="padding: 5px 10px;">Reset View</button>
    </div>
    <div style="margin-bottom: 15px;">
      <label><input type="checkbox" id="showOrbits" checked> Show Orbits</label><br>
      <label><input type="checkbox" id="realisticScale"> Realistic Scale</label>
    </div>
    <div style="margin-bottom: 10px;">
      <h4>Camera Modes:</h4>
      <button class="cameraMode" data-mode="free" style="padding: 5px 10px; margin: 2px;">Free</button>
      <button class="cameraMode" data-mode="top" style="padding: 5px 10px; margin: 2px;">Top View</button>
      <button class="cameraMode" data-mode="cinematic" style="padding: 5px 10px; margin: 2px;">Cinematic</button>
    </div>
  `;
  document.body.appendChild(controlPanel);

  // Create info panel
  const infoPanel = document.createElement('div');
  infoPanel.id = 'infoPanel';
  infoPanel.style.position = 'absolute';
  infoPanel.style.top = '20px';
  infoPanel.style.right = '20px';
  infoPanel.style.background = 'rgba(0, 0, 0, 0.8)';
  infoPanel.style.padding = '20px';
  infoPanel.style.borderRadius = '10px';
  infoPanel.style.color = 'white';
  infoPanel.style.fontFamily = 'Arial, sans-serif';
  infoPanel.style.maxWidth = '300px';
  infoPanel.style.display = 'none';
  document.body.appendChild(infoPanel);

  // Add event listeners
  document.getElementById('timeSpeed').addEventListener('input', (e) => {
    timeSpeed = parseFloat(e.target.value);
    document.getElementById('speedValue').textContent = timeSpeed.toFixed(1) + 'x';
  });

  document.getElementById('pauseBtn').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').textContent = isPaused ? 'Resume' : 'Pause';
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    camera.position.set(-90, 140, 140);
    orbit.target.set(0, 0, 0);
    orbit.update();
  });

  document.getElementById('showOrbits').addEventListener('change', (e) => {
    showOrbits = e.target.checked;
    updateOrbitVisibility();
  });

  document.getElementById('realisticScale').addEventListener('change', (e) => {
    realisticScale = e.target.checked;
    updatePlanetScales();
  });

  document.querySelectorAll('.cameraMode').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchCameraMode(e.target.dataset.mode);
    });
  });
}

// Function to create starfield with particles
function createStarfield() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2000;
    positions[i + 1] = (Math.random() - 0.5) * 2000;
    positions[i + 2] = (Math.random() - 0.5) * 2000;
    
    const color = new THREE.Color();
    color.setHSL(Math.random() * 0.2 + 0.5, 0.5, Math.random() * 0.5 + 0.5);
    colors[i] = color.r;
    colors[i + 1] = color.g;
    colors[i + 2] = color.b;
  }
  
  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const starMaterial = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });
  
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// Function to create planet with enhanced features
function createPlanete(size, texture, position, ring, name, speed, moons = []) {
  const planetMap = textureLoader.load(texture);
  planetMap.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.SphereGeometry(size, 64, 64);
  const mat = new THREE.MeshPhongMaterial({
    map: planetMap,
    shininess: name === 'Earth' ? 10 : 5,
    specular: new THREE.Color(0x222222)
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;

  // Create orbit path with unique colors for each planet
  const orbitColors = {
    'Mercury': 0x888888,
    'Venus': 0xFFA500,
    'Earth': 0x0080FF,
    'Mars': 0xFF4500,
    'Jupiter': 0xFFD700,
    'Saturn': 0xF4A460,
    'Uranus': 0x40E0D0,
    'Neptune': 0x4169E1,
    'Pluto': 0xDDA0DD
  };
  
  const orbitCurve = new THREE.EllipseCurve(
    0, 0,
    position, position,
    0, 2 * Math.PI,
    false,
    0
  );
  const orbitPoints = orbitCurve.getPoints(200);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({ 
    color: orbitColors[name] || 0x444444,
    transparent: true,
    opacity: 0.6,
    linewidth: 2
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  orbitLine.rotation.x = Math.PI / 2;
  scene.add(orbitLine);

  const obj = new THREE.Object3D();
  obj.add(mesh);
  
  // Add atmosphere for certain planets
  if (name === 'Earth' || name === 'Venus') {
    const atmGeo = new THREE.SphereGeometry(size * 1.02, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: name === 'Earth' ? 0x0088ff : 0xffaa00,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmGeo, atmMat);
    mesh.add(atmosphere);
  }

  // Add ring if available
  if (ring) {
    const ringMap = textureLoader.load(ring.texture);
    ringMap.colorSpace = THREE.SRGBColorSpace;
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      128,  // More segments for smoother ring
      64
    );
    const ringMat = new THREE.MeshBasicMaterial({  // Use MeshBasicMaterial for better visibility
      map: ringMap,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,  // Full opacity
      alphaTest: 0.01  // Better transparency handling
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.castShadow = false;  // Rings don't cast shadows
    ringMesh.receiveShadow = true;
    ringMesh.renderOrder = 1;  // Render rings after planet
    mesh.add(ringMesh);  // Add ring to the planet mesh, not obj
    ringMesh.rotation.x = -0.5 * Math.PI;
    
    // Add slight tilt to Saturn's rings
    if (name === 'Saturn') {
      ringMesh.rotation.z = 0.4; // About 23 degrees tilt
      
      // Create a glow effect for Saturn's rings
      const glowRingGeo = new THREE.RingGeometry(
        ring.innerRadius - 0.5,
        ring.outerRadius + 0.5,
        128,
        64
      );
      const glowRingMat = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
      });
      const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
      glowRing.rotation.x = -0.5 * Math.PI;
      glowRing.rotation.z = 0.4;
      mesh.add(glowRing);
    }
    
    // Add tilt to Uranus rings too
    if (name === 'Uranus') {
      ringMesh.rotation.z = 0.15; // Slight tilt
    }
  }

  // Add moons
  const moonObjects = [];
  moons.forEach((moon, index) => {
    const moonGeo = new THREE.SphereGeometry(moon.size, 32, 32);
    const moonMat = new THREE.MeshPhongMaterial({
      color: moon.color,
      emissive: moon.color,
      emissiveIntensity: 0.1
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    
    const moonObj = new THREE.Object3D();
    moonObj.add(moonMesh);
    moonMesh.position.x = moon.distance;
    
    mesh.add(moonObj);
    moonObjects.push({ obj: moonObj, speed: moon.speed });
  });

  scene.add(obj);

  // Create text sprite for planet name
  const textSprite = createTextSprite(name);
  textSprite.scale.set(0.15, 0.075, 1);  // Adjusted scale for screen-space size
  mesh.add(textSprite);
  textSprite.position.y = size + 5;  // Slightly higher position

  return { mesh, obj, speed, name, orbitLine, moonObjects, position, textSprite, orbitAngle: 0 };
}

// Function to create text sprite
function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;  // Increased resolution
  canvas.height = 256;
  
  context.font = 'Bold 72px Arial';  // Larger font
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Draw black outline
  context.strokeStyle = 'black';
  context.lineWidth = 8;
  context.strokeText(text, 256, 128);
  
  // Draw white text
  context.fillStyle = 'white';
  context.fillText(text, 256, 128);
  
  // Add glow effect
  context.shadowColor = 'rgba(255, 255, 255, 0.5)';
  context.shadowBlur = 20;
  context.fillText(text, 256, 128);
  
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    sizeAttenuation: false,  // Disable size attenuation so text stays same size
    depthTest: false,  // Always render on top
    depthWrite: false
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  
  // Make sprite non-raycastable
  sprite.raycast = () => {};
  
  return sprite;
}

// Enhanced planet data with moons
const planetData = [
  { 
    size: 3.2, texture: mercuryTexture, position: 28, ring: null, 
    name: 'Mercury', speed: 0.004, orbitSpeed: 0.04, moons: []
  },
  { 
    size: 5.8, texture: venusTexture, position: 44, ring: null, 
    name: 'Venus', speed: 0.002, orbitSpeed: 0.015, moons: []
  },
  { 
    size: 6, texture: earthTexture, position: 62, ring: null, 
    name: 'Earth', speed: 0.01, orbitSpeed: 0.01, 
    moons: [{ size: 1.5, distance: 10, speed: 0.05, color: 0xcccccc }]
  },
  { 
    size: 4, texture: marsTexture, position: 78, ring: null, 
    name: 'Mars', speed: 0.018, orbitSpeed: 0.008,
    moons: [
      { size: 0.5, distance: 8, speed: 0.08, color: 0xaaaaaa },
      { size: 0.3, distance: 12, speed: 0.05, color: 0x888888 }
    ]
  },
  { 
    size: 12, texture: jupiterTexture, position: 100, ring: null, 
    name: 'Jupiter', speed: 0.04, orbitSpeed: 0.002,
    moons: [
      { size: 1.8, distance: 20, speed: 0.1, color: 0xffff99 },
      { size: 1.5, distance: 25, speed: 0.08, color: 0xcccccc },
      { size: 2, distance: 30, speed: 0.06, color: 0xffcc99 },
      { size: 1.2, distance: 35, speed: 0.04, color: 0xccccff }
    ]
  },
  { 
    size: 10, texture: saturnTexture, position: 138, 
    ring: { innerRadius: 14, outerRadius: 28, texture: saturnRingTexture }, 
    name: 'Saturn', speed: 0.038, orbitSpeed: 0.0009,
    moons: [
      { size: 2, distance: 30, speed: 0.09, color: 0xffffcc },
      { size: 0.8, distance: 35, speed: 0.07, color: 0xcccccc }
    ]
  },
  { 
    size: 7, texture: uranusTexture, position: 176, 
    ring: { innerRadius: 10, outerRadius: 15, texture: uranusRingTexture }, 
    name: 'Uranus', speed: 0.03, orbitSpeed: 0.0004,
    moons: [{ size: 1, distance: 18, speed: 0.06, color: 0xccffff }]
  },
  { 
    size: 7, texture: neptuneTexture, position: 200, ring: null, 
    name: 'Neptune', speed: 0.032, orbitSpeed: 0.0001,
    moons: [{ size: 1.2, distance: 18, speed: 0.08, color: 0x9999ff }]
  },
  { 
    size: 2.8, texture: plutoTexture, position: 216, ring: null, 
    name: 'Pluto', speed: 0.008, orbitSpeed: 0.00007,
    moons: [{ size: 0.8, distance: 8, speed: 0.1, color: 0xcccccc }]
  }
];

// Create planets with initial orbit angles
const planets = planetData.map((planet, index) => {
  const createdPlanet = createPlanete(planet.size, planet.texture, planet.position, planet.ring, 
    planet.name, planet.speed, planet.moons);
  // Add orbit properties
  createdPlanet.orbitSpeed = planet.orbitSpeed;
  createdPlanet.orbitRadius = planet.position;
  createdPlanet.orbitAngle = Math.random() * Math.PI * 2; // Random starting position
  return createdPlanet;
});

// Create asteroid belt
createAsteroidBelt();

// Create space station orbiting Earth
const spaceStation = createSpaceStation();
const earthPlanet = planets.find(p => p.name === 'Earth');
earthPlanet.mesh.add(spaceStation);

// Function to create asteroid belt
function createAsteroidBelt() {
  const asteroidCount = 500;
  const asteroidGeometry = new THREE.DodecahedronGeometry(0.5, 0);
  
  for (let i = 0; i < asteroidCount; i++) {
    const asteroidMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5)
    });
    const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
    
    const angle = Math.random() * Math.PI * 2;
    const radius = 85 + Math.random() * 10;
    asteroid.position.x = Math.cos(angle) * radius;
    asteroid.position.z = Math.sin(angle) * radius;
    asteroid.position.y = (Math.random() - 0.5) * 5;
    
    asteroid.rotation.x = Math.random() * Math.PI;
    asteroid.rotation.y = Math.random() * Math.PI;
    
    const scale = Math.random() * 0.5 + 0.5;
    asteroid.scale.set(scale, scale, scale);
    
    asteroid.userData = {
      angle: angle,
      radius: radius,
      speed: Math.random() * 0.001 + 0.0005,
      rotationSpeed: Math.random() * 0.01
    };
    
    scene.add(asteroid);
    asteroid.castShadow = true;
    asteroid.receiveShadow = true;
  }
}

// Function to create space station
function createSpaceStation() {
  const stationGroup = new THREE.Group();
  
  // Main body
  const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  stationGroup.add(body);
  
  // Solar panels
  const panelGeo = new THREE.BoxGeometry(3, 0.1, 1);
  const panelMat = new THREE.MeshPhongMaterial({ color: 0x000088 });
  
  const panel1 = new THREE.Mesh(panelGeo, panelMat);
  panel1.position.x = 2;
  stationGroup.add(panel1);
  
  const panel2 = new THREE.Mesh(panelGeo, panelMat);
  panel2.position.x = -2;
  stationGroup.add(panel2);
  
  stationGroup.position.set(12, 0, 0);
  stationGroup.scale.set(0.3, 0.3, 0.3);
  
  return stationGroup;
}

// Raycaster for planet selection
const raycaster = new THREE.Raycaster();
// Increase threshold for better click detection on smaller/distant objects
raycaster.params.Points.threshold = 0.1;
raycaster.params.Line.threshold = 0.1;
const mouse = new THREE.Vector2();

renderer.domElement.addEventListener('click', onPlanetClick);

function onPlanetClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  
  // Include sun in the clickable objects
  const planetMeshes = planets.map(p => p.mesh);
  planetMeshes.push(sun); // Add sun to clickable objects
  
  // Use recursive intersection to catch clicks on children too (atmosphere, rings, etc)
  const intersects = raycaster.intersectObjects(planetMeshes, true);
  
  if (intersects.length > 0) {
    // Find the planet that owns this intersected object
    let clickedPlanet = null;
    let planetName = null;
    
    for (let intersect of intersects) {
      const object = intersect.object;
      
      // Check if it's the sun
      if (object === sun || object.parent === sun) {
        clickedPlanet = sun;
        planetName = 'Sun';
        break;
      }
      
      // Check if it's a planet or part of a planet
      for (let planet of planets) {
        if (object === planet.mesh || object.parent === planet.mesh || 
            object.parent?.parent === planet.mesh) {
          clickedPlanet = planet.mesh;
          planetName = planet.name;
          break;
        }
      }
      
      if (clickedPlanet) break;
    }
    
    if (clickedPlanet && planetName) {
      showPlanetInfo(planetName);
      selectedPlanet = clickedPlanet;
    }
  } else {
    document.getElementById('infoPanel').style.display = 'none';
    selectedPlanet = null;
    // If clicking on empty space, unlock focus
    if (isFocusLocked) {
      unlockFocus();
    }
  }
}

function showPlanetInfo(planetName) {
  const info = planetInfo[planetName];
  if (info) {
    const infoPanel = document.getElementById('infoPanel');
    const isCurrentlyFocused = isFocusLocked && focusedObject && 
      ((focusedObject === sun && planetName === 'Sun') || 
       (focusedObject.name === planetName));
    
    infoPanel.innerHTML = `
      <h2>${planetName}</h2>
      <p><strong>Diameter:</strong> ${info.diameter}</p>
      <p><strong>Day Length:</strong> ${info.dayLength}</p>
      <p><strong>Year Length:</strong> ${info.yearLength}</p>
      <p><strong>Moons:</strong> ${info.moons}</p>
      <p><strong>Temperature:</strong> ${info.temperature}</p>
      <p><strong>Fun Fact:</strong> ${info.fact}</p>
      ${isCurrentlyFocused ? 
        `<button onclick="unlockFocus()" style="padding: 5px 10px; margin-top: 10px; background: #ff4444;">Stop Following</button>` :
        `<button onclick="focusOnPlanet('${planetName}')" style="padding: 5px 10px; margin-top: 10px;">Focus Camera</button>`
      }
    `;
    infoPanel.style.display = 'block';
  }
}

// Global function to focus on planet
window.focusOnPlanet = function(planetName) {
  if (planetName === 'Sun') {
    focusedObject = sun;
    isFocusLocked = true;
    orbit.target.set(0, 0, 0);
    camera.position.set(50, 30, 50);
    orbit.update();
    return;
  }
  
  const planet = planets.find(p => p.name === planetName);
  if (planet) {
    focusedObject = planet;
    isFocusLocked = true;
    const targetPosition = new THREE.Vector3();
    planet.mesh.getWorldPosition(targetPosition);
    
    orbit.target.copy(targetPosition);
    camera.position.copy(targetPosition);
    camera.position.add(new THREE.Vector3(20, 10, 20));
    orbit.update();
  }
};

// Global function to unlock focus
window.unlockFocus = function() {
  isFocusLocked = false;
  focusedObject = null;
  // Reset camera to default position
  camera.position.set(-90, 140, 140);
  orbit.target.set(0, 0, 0);
  orbit.update();
  
  // Update the info panel if it's showing
  if (selectedPlanet) {
    showPlanetInfo(selectedPlanet.name || 'Sun');
  }
};

function updateOrbitVisibility() {
  planets.forEach(planet => {
    planet.orbitLine.visible = showOrbits;
  });
}

function updatePlanetScales() {
  const scales = realisticScale ? 
    [0.38, 0.95, 1, 0.53, 11.2, 9.45, 4.01, 3.88, 0.19] : 
    [1, 1, 1, 1, 1, 1, 1, 1, 1];
    
  planets.forEach((planet, index) => {
    planet.mesh.scale.set(scales[index], scales[index], scales[index]);
  });
}

let cameraMode = 'free';
let cinematicAngle = 0;

function switchCameraMode(mode) {
  cameraMode = mode;
  
  switch(mode) {
    case 'top':
      camera.position.set(0, 300, 0);
      camera.lookAt(0, 0, 0);
      orbit.enabled = false;
      break;
    case 'cinematic':
      orbit.enabled = false;
      break;
    case 'free':
    default:
      orbit.enabled = true;
      camera.position.set(-90, 140, 140);
      orbit.update();
      break;
  }
}

// Animation variables
let time = 0;

// Function to animate the scene
function animate() {
  requestAnimationFrame(animate);
  
  if (!isPaused) {
    time += timeSpeed;
    
    // Animate sun rotation and pulsing
    sun.rotateY(0.004 * timeSpeed);
    const pulseFactor = 1 + Math.sin(time * 0.001) * 0.05;
    sunGlow.scale.set(pulseFactor, pulseFactor, pulseFactor);
    
    // Animate planets
  planets.forEach(planet => {
      // Planet rotation on its axis
      planet.mesh.rotateY(planet.speed * timeSpeed);
      
      // Planet orbit around the sun - use trigonometric functions
      planet.orbitAngle = (planet.orbitAngle || 0) + (planet.orbitSpeed || planet.speed * 0.1) * timeSpeed;
      
      // Calculate new position based on orbit angle
      const x = Math.cos(planet.orbitAngle) * planet.position;
      const z = Math.sin(planet.orbitAngle) * planet.position;
      
      // Update the planet's position
      planet.obj.position.x = x;
      planet.obj.position.z = z;
      
      // Animate moons
      planet.moonObjects.forEach(moon => {
        moon.obj.rotateY(moon.speed * timeSpeed);
      });
    });
    
    // Animate asteroids
    scene.traverse((child) => {
      if (child.userData && child.userData.angle !== undefined) {
        child.userData.angle += child.userData.speed * timeSpeed;
        child.position.x = Math.cos(child.userData.angle) * child.userData.radius;
        child.position.z = Math.sin(child.userData.angle) * child.userData.radius;
        child.rotateY(child.userData.rotationSpeed * timeSpeed);
      }
    });
    
    // Animate space station
    spaceStation.rotateY(0.01 * timeSpeed);
    
    // Cinematic camera movement
    if (cameraMode === 'cinematic') {
      cinematicAngle += 0.001 * timeSpeed;
      camera.position.x = Math.cos(cinematicAngle) * 200;
      camera.position.z = Math.sin(cinematicAngle) * 200;
      camera.position.y = 50 + Math.sin(cinematicAngle * 2) * 30;
      camera.lookAt(0, 0, 0);
    }
    
    // Focus tracking - keep camera focused on selected object
    if (isFocusLocked && focusedObject) {
      if (focusedObject === sun) {
        // Sun is always at origin
        orbit.target.set(0, 0, 0);
      } else {
        // Get the planet's world position
        const targetPosition = new THREE.Vector3();
        focusedObject.mesh.getWorldPosition(targetPosition);
        
        // Update orbit controls target
        orbit.target.copy(targetPosition);
        
        // Maintain relative camera position
        const cameraOffset = new THREE.Vector3(30, 20, 30);
        camera.position.copy(targetPosition).add(cameraOffset);
      }
      orbit.update();
    }
  }
  
  // Update orbit controls
  if (orbit.enabled) {
    orbit.update();
  }

  // Render the scene
  renderer.render(scene, camera);
}

// Start animation loop
animate();

// Event listener for window resize
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
