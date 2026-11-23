import * as THREE from 'three';
import { atmosphereFragment, atmosphereVertex, starFragment, starVertex } from './shaders';

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function createStarField(count = 3200) {
  const random = seededRandom(8417);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (random() - 0.5) * 170;
    positions[i * 3 + 1] = (random() - 0.5) * 110;
    positions[i * 3 + 2] = -15 - random() * 125;
    sizes[i] = 0.4 + Math.pow(random(), 7) * 3.5;
    phases[i] = random() * Math.PI * 2;
    const blue = random();
    colors[i * 3] = 0.62 + blue * 0.38;
    colors[i * 3 + 1] = 0.67 + blue * 0.3;
    colors[i * 3 + 2] = 0.82 + blue * 0.18;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: starVertex,
    fragmentShader: starFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

export function createAtmosphere(radius: number, color: string, intensity = 0.65) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 96, 96),
    new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        intensity: { value: intensity },
      },
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
}

export function createOrbit(radius: number, eccentricity = 0.8) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 256; i += 1) {
    const angle = (i / 256) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius * eccentricity));
  }
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: '#536780', transparent: true, opacity: 0.2 }),
  );
  line.rotation.z = 0.06;
  return line;
}

export function createNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d')!;
  const random = seededRandom(734);
  context.fillStyle = '#000';
  context.fillRect(0, 0, 1024, 1024);
  context.globalCompositeOperation = 'screen';
  for (let i = 0; i < 100; i += 1) {
    const x = 150 + random() * 720;
    const y = 200 + (x - 150) * 0.45 + (random() - 0.5) * 330;
    const radius = 50 + random() * 190;
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    const color = i % 3 === 0 ? '68,40,132' : '23,54,124';
    gradient.addColorStop(0, `rgba(${color},${0.06 + random() * 0.07})`);
    gradient.addColorStop(0.4, `rgba(${color},0.025)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    context.fillStyle = gradient;
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) value.dispose();
        }
        material.dispose();
      });
    }
  });
}
