import type { PlanetData } from '../types';

export const planets: PlanetData[] = [
  {
    id: 'earth', name: 'Earth', type: 'Our home. A world of possibility.',
    description: 'An ocean world suspended in the dark. The only place we know where life writes its story among the stars.',
    distance: '149.6 million km', diameter: '12,742 km', year: '365.25 days', temperature: '15°C average',
    texture: '/textures/earth.jpg', position: [1.1, 0.25, 1.5], radius: 0.47, color: '#5b9eea', orbit: 4.5,
  },
  {
    id: 'mars', name: 'Mars', type: 'The red frontier.',
    description: 'Ancient riverbeds and towering volcanoes hint at a world that once held water—and may hold our future.',
    distance: '227.9 million km', diameter: '6,779 km', year: '687 Earth days', temperature: '−63°C average',
    texture: '/textures/mars.jpg', position: [-2.8, 0.8, -2], radius: 0.34, color: '#d98265', orbit: 6.4,
  },
  {
    id: 'jupiter', name: 'Jupiter', type: 'The giant among worlds.',
    description: 'A swirling giant of hydrogen and helium. Its Great Red Spot is a storm larger than Earth that has raged for centuries.',
    distance: '778.5 million km', diameter: '139,820 km', year: '11.86 Earth years', temperature: '−108°C average',
    texture: '/textures/jupiter.jpg', position: [2.5, 0.9, -4], radius: 1.05, color: '#d4b397', orbit: 8.5,
  },
  {
    id: 'saturn', name: 'Saturn', type: 'An icon of the cosmos.',
    description: 'Countless fragments of ice and rock form its luminous rings. A delicate architecture shaped by gravity and time.',
    distance: '1.43 billion km', diameter: '116,460 km', year: '29.45 Earth years', temperature: '−139°C average',
    texture: '/textures/saturn.jpg', position: [-0.5, 0.15, -9], radius: 0.82, color: '#e1cda6', orbit: 11,
  },
];
