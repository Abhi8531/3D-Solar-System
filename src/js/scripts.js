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

// Initialize WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Initialize orbit controls
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(-90, 140, 140);
orbit.update();

// Add ambient light to the scene
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

// Load cube texture for the background
const cubeTextureLoader = new THREE.CubeTextureLoader();
scene.background = cubeTextureLoader.load([
  starsTexture,
  starsTexture,
  starsTexture,
  starsTexture,
  starsTexture,
  starsTexture,
]);

// Initialize texture loader
const textureLoader = new THREE.TextureLoader();

// Load sun texture
const sunMap = textureLoader.load(sunTexture);
sunMap.colorSpace = THREE.SRGBColorSpace;

// Create sun mesh
const sunGeo = new THREE.SphereGeometry(16, 30, 30);
const sunMat = new THREE.MeshBasicMaterial({
  map: sunMap,
});
const sun = new THREE.Mesh(sunGeo, sunMat);
scene.add(sun);

// Function to create planet with name and speed
function createPlanete(size, texture, position, ring, name, speed) {
  // Load planet texture
  const planetMap = textureLoader.load(texture);
  planetMap.colorSpace = THREE.SRGBColorSpace;

  // Create planet geometry
  const geo = new THREE.SphereGeometry(size, 30, 30);
  const mat = new THREE.MeshStandardMaterial({
    map: planetMap,
  });
  const mesh = new THREE.Mesh(geo, mat);

  // Create orbit ring
  const orbitRadius = position;
  const orbitRingGeo = new THREE.RingGeometry(
    orbitRadius,
    orbitRadius + 0.01,
    64
  );
  const orbitRingMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
  orbitRing.position.x = 0.5 * size;
  orbitRing.rotation.x = -0.5 * Math.PI;

  // Create parent object to hold planet and orbit ring
  const obj = new THREE.Object3D();
  obj.add(mesh);
  scene.add(orbitRing);

  // Add ring if available
  if (ring) {
    const ringMap = textureLoader.load(ring.texture);
    ringMap.colorSpace = THREE.SRGBColorSpace;
    const ringGeo = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      32
    );
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringMap,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    obj.add(ringMesh);
    ringMesh.position.x = position;
    ringMesh.rotation.x = -0.5 * Math.PI;
  }
  scene.add(obj);
  mesh.position.x = position;

  // Create text sprite for planet name
  const textSprite = createTextSprite(name);

  // Add text sprite to the planet object
  obj.add(textSprite);

  // Update text sprite position relative to the planet
  textSprite.position.set(position, size * 1.5, 0);

  // Return planet object with mesh, object, text sprite, name, and speed
  return { mesh, obj, textSprite, speed, name };
}

// Function to create text sprite
function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const fontSize = 40;
  context.font = `Bold ${fontSize}px Arial`;
  context.fillStyle = '#ffffff';
  context.fillText(text, 0, fontSize);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(20, 10, 1);
  return sprite;
}

// Define planet data with size, texture, position, ring, name, and speed
const planetData = [
  { size: 3.2, texture: mercuryTexture, position: 28, ring: null, name: 'Mercury', speed: 0.004 },
  { size: 5.8, texture: venusTexture, position: 44, ring: null, name: 'Venus', speed: 0.002 },
  { size: 6, texture: earthTexture, position: 62, ring: null, name: 'Earth', speed: 0.01 },
  { size: 4, texture: marsTexture, position: 78, ring: null, name: 'Mars', speed: 0.018 },
  { size: 12, texture: jupiterTexture, position: 100, ring: null, name: 'Jupiter', speed: 0.04 },
  { size: 10, texture: saturnTexture, position: 138, ring: { innerRadius: 10, outerRadius: 20, texture: saturnRingTexture }, name: 'Saturn', speed: 0.038 },
  { size: 7, texture: uranusTexture, position: 176, ring: { innerRadius: 7, outerRadius: 12, texture: uranusRingTexture }, name: 'Uranus', speed: 0.03 },
  { size: 7, texture: neptuneTexture, position: 200, ring: null, name: 'Neptune', speed: 0.032 },
  { size: 2.8, texture: plutoTexture, position: 216, ring: null, name: 'Pluto', speed: 0.008 }
];

// Create planets based on planet data
const planets = planetData.map(planet => createPlanete(planet.size, planet.texture, planet.position, planet.ring, planet.name, planet.speed));

// Add point light to the scene
const pointLight = new THREE.PointLight(0xffffff, 30000, 300);
scene.add(pointLight);

// Function to animate the scene
function animate() {
  planets.forEach(planet => {
    planet.mesh.rotateY(planet.speed);

    // Rotate planets around the sun
    switch (planet.name) {
      case 'Mercury':
        planet.obj.rotateY(0.04);
        break;
      case 'Venus':
        planet.obj.rotateY(0.015);
        break;
      case 'Earth':
        planet.obj.rotateY(0.01);
        break;
      case 'Mars':
        planet.obj.rotateY(0.008);
        break;
      case 'Jupiter':
        planet.obj.rotateY(0.002);
        break;
      case 'Saturn':
        planet.obj.rotateY(0.0009);
        break;
      case 'Uranus':
        planet.obj.rotateY(0.0004);
        break;
      case 'Neptune':
        planet.obj.rotateY(0.0001);
        break;
      case 'Pluto':
        planet.obj.rotateY(0.00007);
        break;
      default:
        break;
    }
  });

  // Render the scene
  renderer.render(scene, camera);
}

// Set animation loop
renderer.setAnimationLoop(animate);

// Event listener for window resize
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
