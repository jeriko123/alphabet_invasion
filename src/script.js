import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";
import { fromEvent, pluck } from "rxjs";

const wordGenerator = function* () {
  let arr = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "j",
    "k",
    "h",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "z",
    "y",
    "w"
  ];
  let random = () => Math.ceil(Math.random() * (arr.length - 1));

  while (true) {
    yield arr[random()];
  }
};

let random = () => Math.ceil(Math.random() * 4) - 2.5;

const keys$ = fromEvent(document, "keydown").pipe(pluck("key"));

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const matcap1Texture = textureLoader.load("/textures/matcaps/3.png");
const matcap2Texture = textureLoader.load("/textures/matcaps/12.png");
const matcap3Texture = textureLoader.load("/textures/matcaps/9.png");
const matcap4Texture = textureLoader.load("/textures/matcaps/8.png");
const matcap5Texture = textureLoader.load("/textures/matcaps/7.png");
const matcap6Texture = textureLoader.load("/textures/matcaps/6.png");

let score = 0,
  text1,
  text2,
  word1,
  word2,
  scoreText;

const fontLoader = new THREE.FontLoader();
const createWord = (font) => {
  let word = wordGenerator();
  let wordRandom = word.next().value;

  const textGeometry = new THREE.TextBufferGeometry(wordRandom, {
    font: font,
    size: 0.4,
    height: 0.2,
    curveSegments: 8
  });
  textGeometry.center();

  let material = matcap4Texture;
  console.log(score);
  if (score > 20) {
    material = matcap3Texture;
  }

  if (score > 30) {
    material = matcap2Texture;
  }

  const textMaterial = new THREE.MeshMatcapMaterial({
    matcap: material
  });
  const text = new THREE.Mesh(textGeometry, textMaterial);
  scene.add(text);
  text.position.set(random(), 5, 0);

  return [text, wordRandom];
};

const updateScore = (font) => {
  const textGeometry = new THREE.TextBufferGeometry(`score: ${score}`, {
    font: font,
    size: 0.5,
    height: 0.1,
    curveSegments: 8
  });
  textGeometry.center();

  const textMaterial = new THREE.MeshMatcapMaterial({
    matcap: matcap5Texture
  });
  const text = new THREE.Mesh(textGeometry, textMaterial);
  text.position.set(-3, 1, 0);
  text.rotation.y = Math.PI * 0.5;
  scene.add(text);
  return text;
};

fontLoader.load("/fonts/helvetiker_bold.typeface.json", (font) => {
  [text1, word1] = createWord(font);
  [text2, word2] = createWord(font);
  scoreText = updateScore(font);

  let tetPosition1 = 2;
  let tetPosition2 = 3;

  let pressedKey;
  keys$.subscribe((v) => {
    pressedKey = v;
  });

  const tick = () => {
    text1.position.y = tetPosition1;
    text2.position.y = tetPosition2;
    tetPosition1 = tetPosition1 - 0.01 * tetPosition1;
    tetPosition2 = tetPosition2 - 0.02 * tetPosition2;

    if (pressedKey == word1) {
      scene.remove(text1);
      scene.remove(scoreText);
      scoreText = updateScore(font);
      score++;
      [text1, word1] = createWord(font);
      tetPosition1 = 4;
    }

    if (pressedKey == word2) {
      scene.remove(text2);
      scene.remove(scoreText);
      scoreText = updateScore(font);
      score++;
      [text2, word2] = createWord(font);
      tetPosition2 = 4;
    }

    if (tetPosition1 < 0.2) {
      tetPosition1 = 4;
      scene.remove(scoreText);
      scoreText = updateScore(font);
      score--;
      scene.remove(text1);
      [text1, word1] = createWord(font);
    }

    if (tetPosition2 < 0.2) {
      scene.remove(scoreText);
      scoreText = updateScore(font);
      score--;
      tetPosition2 = 4;
      scene.remove(text2);
      [text2, word2] = createWord(font);
    }

    window.requestAnimationFrame(tick);
  };

  tick();
});

/**
 * Floor
 */
const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(5, 250),
  new THREE.MeshStandardMaterial({
    color: new THREE.Color("rgb(126, 181, 199)"),
    metalness: 0,
    roughness: 0.5
  })
);
floor.receiveShadow = true;
floor.rotation.x = -Math.PI * 0.5;
scene.add(floor);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-2, 2, 2);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
// controls.target.set(0, 0.75, 0);
controls.enableDamping = true;
controls.maxDistance = 4;
controls.minDistance = 4;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI * 0.2;
controls.minPolarAngle = Math.PI * 0.3;

controls.minAzimuthAngle = Math.PI * 0.1;
controls.maxAzimuthAngle = Math.PI * 0.2;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  previousTime = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
