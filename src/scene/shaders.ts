export const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = viewPosition.xyz;
    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const atmosphereFragment = /* glsl */ `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    float facing = abs(dot(normalize(vNormal), normalize(-vPosition)));
    float rim = pow(1.0 - facing, 3.2);
    gl_FragColor = vec4(glowColor, rim * intensity);
  }
`;

export const starVertex = /* glsl */ `
  uniform float uTime;
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = 0.55 + 0.35 * sin(uTime * 0.45 + aPhase);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * (48.0 / -viewPosition.z), 0.65, 4.5);
  }
`;

export const starFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
    if (distanceToCenter > 0.5) discard;
    float alpha = smoothstep(0.5, 0.08, distanceToCenter) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

export const galaxyVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const galaxyFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec2 centered = vUv - 0.5;
    float radius = length(centered);
    float angle = uTime * 0.004 * (1.0 - radius);
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 uv = rotation * centered + 0.5;
    vec4 color = texture2D(uMap, uv);
    float brightness = max(color.r, max(color.g, color.b));
    float vignette = 1.0 - smoothstep(0.32, 0.52, radius);
    gl_FragColor = vec4(color.rgb * vec3(0.78, 0.83, 1.2), brightness * uOpacity * vignette);
  }
`;
