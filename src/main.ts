import './style.css'
import { GameEngine } from './core/GameEngine'

function init() {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement;
  if (!canvas) return;

  canvas.width = 1024;
  canvas.height = 768;

  const engine = new GameEngine(canvas);
  engine.start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
