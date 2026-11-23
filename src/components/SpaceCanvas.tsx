import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import * as THREE from 'three';
import { planets } from '../data/planets';
import type { PlanetData } from '../types';
import { createAtmosphere, createNebulaTexture, createOrbit, createStarField, disposeObject } from '../scene/primitives';
import { galaxyFragment, galaxyVertex } from '../scene/shaders';

export interface JourneyProgress {
  hero: number;
  galaxy: number;
  worlds: number;
  pointerX: number;
  pointerY: number;
}

interface SpaceCanvasProps {
  journey: RefObject<JourneyProgress>;
  onReady: () => void;
  onPlanetSelect: (planet: PlanetData) => void;
  onLabelsUpdate: (positions: Record<string, { x: number; y: number; visible: boolean }>) => void;
}

const smoothstep = (start: number, end: number, value: number) => {
  const t = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
  return t * t * (3 - 2 * t);
};

export default function SpaceCanvas({ journey, onReady, onPlanetSelect, onLabelsUpdate }: SpaceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onPlanetSelect, onLabelsUpdate });
  callbacks.current = { onReady, onPlanetSelect, onLabelsUpdate };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      container.classList.add('webgl-unavailable');
      callbacks.current.onReady();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('#020308', 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.pointerEvents = 'auto';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.set(0, 0, 12);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let mobile = window.innerWidth < 768;
    const starField = createStarField(mobile ? 1900 : 3400);
    scene.add(starField);

    const nebula = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 65),
      new THREE.MeshBasicMaterial({
        map: createNebulaTexture(), transparent: true, opacity: 0.72,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    nebula.position.set(10, -10, -55);
    nebula.rotation.z = -0.4;
    scene.add(nebula);

    const ambient = new THREE.AmbientLight('#354469', 0.52);
    const sunlight = new THREE.DirectionalLight('#c6dcff', 3.8);
    sunlight.position.set(-6, 2, 5);
    scene.add(ambient, sunlight);

    // Hero: the planet has independent surface, clouds and atmospheric depth.
    const heroGroup = new THREE.Group();
    const heroScale = 1;
    heroGroup.position.set(mobile ? 0.7 : 3.15, mobile ? 1.4 : -0.3, mobile ? -5.5 : -0.8);
    heroGroup.scale.setScalar(heroScale);
    scene.add(heroGroup);
    const earthMaterial = new THREE.MeshStandardMaterial({
      color: '#94b9ef', roughness: 0.92, metalness: 0.02, transparent: true,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(2.45, 96, 96), earthMaterial);
    earth.rotation.z = -0.16;
    heroGroup.add(earth);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      color: '#b4d0f2', transparent: true, opacity: 0.4, alphaTest: 0.035, depthWrite: false,
    });
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(2.478, 80, 80), cloudMaterial);
    clouds.rotation.z = -0.16;
    heroGroup.add(clouds);
    const heroAtmosphere = createAtmosphere(2.61, '#356eff', 1.05);
    const heroGlow = createAtmosphere(2.77, '#3453ce', 0.28);
    heroGroup.add(heroAtmosphere, heroGlow);

    // Galaxy: two photographic layers and two star fields give optical parallax.
    const galaxyGroup = new THREE.Group();
    galaxyGroup.position.set(mobile ? 0.6 : 1.2, 0, -5);
    scene.add(galaxyGroup);
    const galaxyMaterial = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: null }, uOpacity: { value: 0 }, uTime: { value: 0 } },
      vertexShader: galaxyVertex, fragmentShader: galaxyFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const galaxyPlane = new THREE.Mesh(new THREE.PlaneGeometry(15, 12), galaxyMaterial);
    galaxyPlane.rotation.z = -0.3;
    galaxyGroup.add(galaxyPlane);
    const dustMaterial = galaxyMaterial.clone();
    dustMaterial.uniforms.uOpacity.value = 0;
    const dustPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), dustMaterial);
    dustPlane.position.z = -5;
    dustPlane.rotation.z = 0.12;
    galaxyGroup.add(dustPlane);

    // Solar system: intentionally compressed for cinematic readability, not to scale.
    const worldsGroup = new THREE.Group();
    worldsGroup.position.set(mobile ? 0 : 0.8, mobile ? -0.6 : -0.4, mobile ? -3 : -1);
    worldsGroup.rotation.x = 0.19;
    scene.add(worldsGroup);
    const solarLight = new THREE.PointLight('#e1eaff', 75, 70, 1.7);
    solarLight.position.set(-5, 2, 3);
    worldsGroup.add(solarLight);
    planets.forEach((planet) => worldsGroup.add(createOrbit(planet.orbit)));
    const clickable: THREE.Mesh[] = [];
    const worldMaterials: Array<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial> = [];
    const planetMeshes = planets.map((planet, index) => {
      const material = new THREE.MeshStandardMaterial({
        color: planet.color, roughness: 0.87, transparent: true, opacity: 0,
      });
      worldMaterials.push(material);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(planet.radius, 64, 64), material);
      mesh.position.set(...planet.position);
      if (mobile) {
        mesh.position.x *= 0.82;
        mesh.position.y *= 0.9;
      }
      mesh.rotation.z = index === 1 ? 0.25 : -0.14;
      mesh.userData.planet = planet;
      worldsGroup.add(mesh);
      clickable.push(mesh);
      if (planet.id === 'saturn') {
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: '#cbbba4', side: THREE.DoubleSide, transparent: true, opacity: 0,
        });
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.05, 1.85, 96), ringMaterial);
        ring.rotation.x = Math.PI / 2.6;
        ring.rotation.y = 0.25;
        mesh.add(ring);
        worldMaterials.push(ringMaterial);
      }
      if (planet.id === 'earth' || planet.id === 'jupiter') {
        const atmosphere = createAtmosphere(planet.radius * 1.09, planet.color, 0.8);
        mesh.add(atmosphere);
      }
      return mesh;
    });

    const textureLoader = new THREE.TextureLoader();
    const texturePaths = [
      '/textures/earth.jpg', '/textures/earth-clouds.jpg', '/images/spiral.webp',
      ...planets.map((planet) => planet.texture), '/textures/saturn-ring.png',
    ];
    let alive = true;
    Promise.all(texturePaths.map((path) => textureLoader.loadAsync(path).catch(() => null))).then((textures) => {
      if (!alive) {
        textures.forEach((texture) => texture?.dispose());
        return;
      }
      const [earthMap, cloudMap, galaxyMap, ...rest] = textures;
      if (earthMap) {
        earthMap.colorSpace = THREE.SRGBColorSpace;
        earthMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
        earthMaterial.map = earthMap;
        earthMaterial.color.set('#a6c2f3');
        earthMaterial.needsUpdate = true;
      }
      if (cloudMap) {
        cloudMaterial.alphaMap = cloudMap;
        cloudMaterial.needsUpdate = true;
      }
      if (galaxyMap) {
        galaxyMap.colorSpace = THREE.SRGBColorSpace;
        galaxyMaterial.uniforms.uMap.value = galaxyMap;
        dustMaterial.uniforms.uMap.value = galaxyMap;
      }
      planetMeshes.forEach((mesh, index) => {
        const map = rest[index];
        if (!map) return;
        map.colorSpace = THREE.SRGBColorSpace;
        (mesh.material as THREE.MeshStandardMaterial).map = map;
        (mesh.material as THREE.MeshStandardMaterial).color.set('#ffffff');
        (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;
      });
      const ringTexture = rest[planets.length];
      const saturn = planetMeshes.find((mesh) => mesh.userData.planet.id === 'saturn');
      const ring = saturn?.children.find((child) => child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) as THREE.Mesh | undefined;
      if (ring && ringTexture) {
        (ring.material as THREE.MeshBasicMaterial).map = ringTexture;
        (ring.material as THREE.MeshBasicMaterial).color.set('#ffffff');
        (ring.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
      callbacks.current.onReady();
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const projected = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();
    const labelPositions: Record<string, { x: number; y: number; visible: boolean }> = {};
    const reducedProgress = () => {
      const ids = ['home', 'galaxy', 'worlds'] as const;
      ids.forEach((id, index) => {
        const section = document.getElementById(id);
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const progress = THREE.MathUtils.clamp(-rect.top / Math.max(1, section.offsetHeight - window.innerHeight), 0, 1);
        if (index === 0) journey.current.hero = progress;
        if (index === 1) journey.current.galaxy = progress;
        if (index === 2) journey.current.worlds = progress;
      });
    };
    const onPointerMove = (event: PointerEvent) => {
      journey.current.pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      journey.current.pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    const onClick = (event: MouseEvent) => {
      const worldsSection = document.getElementById('worlds')?.getBoundingClientRect();
      if (!worldsSection || worldsSection.top > window.innerHeight * 0.2 || worldsSection.bottom < window.innerHeight * 0.8) return;
      pointer.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickable, false);
      if (hits.length) callbacks.current.onPlanetSelect(hits[0].object.userData.planet as PlanetData);
    };
    const onResize = () => {
      mobile = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      heroGroup.position.set(mobile ? 0.7 : 3.15, mobile ? 1.4 : -0.3, mobile ? -5.5 : -0.8);
      galaxyGroup.position.x = mobile ? 0.6 : 1.2;
      planetMeshes.forEach((mesh, index) => {
        mesh.position.set(...planets[index].position);
        if (mobile) {
          mesh.position.x *= 0.82;
          mesh.position.y *= 0.9;
        }
      });
      worldsGroup.position.set(mobile ? 0 : 0.8, mobile ? -0.6 : -0.4, mobile ? -3 : -1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    renderer.domElement.addEventListener('click', onClick);

    const clock = new THREE.Clock();
    let animationFrame = 0;
    const render = () => {
      animationFrame = requestAnimationFrame(render);
      if (document.hidden) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const time = clock.elapsedTime;
      if (reducedMotion) reducedProgress();
      const progress = journey.current;
      const heroOpacity = 1 - smoothstep(0.52, 0.96, progress.hero);
      const galaxyOpacity = smoothstep(0.48, 0.98, progress.hero) * (1 - smoothstep(0.55, 0.98, progress.galaxy));
      const worldsOpacity = smoothstep(0.5, 0.98, progress.galaxy) * (1 - smoothstep(0.65, 1, progress.worlds));

      heroGroup.visible = heroOpacity > 0.005;
      galaxyGroup.visible = galaxyOpacity > 0.005;
      worldsGroup.visible = worldsOpacity > 0.005;
      earthMaterial.opacity = heroOpacity;
      cloudMaterial.opacity = heroOpacity * 0.52;
      (heroAtmosphere.material as THREE.ShaderMaterial).uniforms.intensity.value = heroOpacity;
      (heroGlow.material as THREE.ShaderMaterial).uniforms.intensity.value = heroOpacity * 0.25;
      galaxyMaterial.uniforms.uOpacity.value = galaxyOpacity * 1.3;
      dustMaterial.uniforms.uOpacity.value = galaxyOpacity * 0.24;
      worldMaterials.forEach((material) => { material.opacity = worldsOpacity; });

      if (reducedMotion) {
        galaxyGroup.scale.setScalar(0.95);
        worldsGroup.scale.setScalar(0.8);
      } else {
        earth.rotation.y += delta * 0.045;
        clouds.rotation.y += delta * 0.054;
        heroGroup.position.x = (mobile ? 0.7 : 3.15) + progress.pointerX * 0.08;
        heroGroup.position.y = (mobile ? 1.4 : -0.3) - progress.pointerY * 0.06;
        heroGroup.rotation.y = progress.hero * 0.35;
        const approach = 1 + progress.hero * 0.75;
        heroGroup.scale.setScalar(heroScale * approach);
        starField.position.x = -progress.pointerX * 0.4;
        starField.position.y = progress.pointerY * 0.22;
        starField.rotation.z = progress.galaxy * 0.035 + progress.worlds * 0.025;
        galaxyMaterial.uniforms.uTime.value = time;
        dustMaterial.uniforms.uTime.value = -time * 0.65;
        galaxyGroup.rotation.z = progress.galaxy * 0.15;
        galaxyGroup.scale.setScalar(0.8 + progress.galaxy * 0.4);
        galaxyPlane.position.x = progress.galaxy * 0.6;
        dustPlane.position.x = -progress.galaxy * 0.8;
        worldsGroup.rotation.y = progress.worlds * 0.1;
        worldsGroup.scale.setScalar(0.86 + progress.worlds * 0.2);
        planetMeshes.forEach((mesh, index) => { mesh.rotation.y += delta * (0.025 + index * 0.009); });
      }
      (starField.material as THREE.ShaderMaterial).uniforms.uTime.value = reducedMotion ? 0 : time;
      scene.updateMatrixWorld();
      planetMeshes.forEach((mesh) => {
        const planet = mesh.userData.planet as PlanetData;
        mesh.getWorldPosition(worldPosition);
        projected.copy(worldPosition).project(camera);
        const scale = worldsGroup.scale.x;
        const radius = planet.radius * scale / Math.max(1, camera.position.z - worldPosition.z) * (window.innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
        labelPositions[planet.id] = {
          x: THREE.MathUtils.clamp(x + radius * 0.8, 18, window.innerWidth - (mobile ? 85 : 120)),
          y: THREE.MathUtils.clamp(y - radius - 20, mobile ? 275 : 225, window.innerHeight - (mobile ? 195 : 155)),
          visible: worldsOpacity > 0.7 && projected.z < 1,
        };
      });
      callbacks.current.onLabelsUpdate(labelPositions);
      renderer.render(scene, camera);
    };
    render();

    return () => {
      alive = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [journey]);

  return (
    <div className="space-canvas" ref={containerRef} aria-label="Interactive cinematic space environment">
      <img className="webgl-fallback" src="/images/andromeda.webp" alt="" />
    </div>
  );
}
