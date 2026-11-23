export type SceneName = 'home' | 'galaxy' | 'worlds' | 'weightless' | 'beyond';

export interface PlanetData {
  id: string;
  name: string;
  type: string;
  description: string;
  distance: string;
  diameter: string;
  year: string;
  temperature: string;
  texture: string;
  position: [number, number, number];
  radius: number;
  color: string;
  orbit: number;
}
