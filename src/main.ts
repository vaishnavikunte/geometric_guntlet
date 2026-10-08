import './style.css'
import { GameEngine } from './core/GameEngine'

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  
  canvas.width = 1024;
  canvas.height = 768;

  const engine = new GameEngine(canvas);
  engine.start();
});
