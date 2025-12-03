"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const CELL_SIZE = 20;
const WALL_THICKNESS = 2;

const START_POS = { x: 0, y: 0 };
const EXIT_POS = { x: 0, y: 0 };

function MazeGame() {
  const [level, setLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [walls, setWalls] = useState<Array<{ x: number; y: number; w: number; h: number }>>([]);
  const [path, setPath] = useState<Array<{ x: number; y: number }>>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawing = useRef(false);

  const generateMaze = () => {
    const cols = 10 + level * 2;
    const rows = 10 + level * 2;
    const mazeWalls: Array<{ x: number; y: number; w: number; h: number }> = [];
    for (let i = 0; i <= cols; i++) {
      mazeWalls.push({ x: i * CELL_SIZE, y: 0, w: WALL_THICKNESS, h: rows * CELL_SIZE });
    }
    for (let j = 0; j <= rows; j++) {
      mazeWalls.push({ x: 0, y: j * CELL_SIZE, w: cols * CELL_SIZE, h: WALL_THICKNESS });
    }
    for (let i = 1; i < cols; i++) {
      for (let j = 1; j < rows; j++) {
        if (Math.random() < 0.3) {
          mazeWalls.push({ x: i * CELL_SIZE, y: j * CELL_SIZE, w: WALL_THICKNESS, h: CELL_SIZE });
        }
      }
    }
    setWalls(mazeWalls);
    setStartExit(cols, rows);
  };

  const setStartExit = (cols: number, rows: number) => {
    START_POS.x = CELL_SIZE / 2;
    START_POS.y = CELL_SIZE / 2;
    EXIT_POS.x = cols * CELL_SIZE - CELL_SIZE / 2;
    EXIT_POS.y = rows * CELL_SIZE - CELL_SIZE / 2;
  };

  useEffect(() => {
    generateMaze();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = (10 + level * 2) * CELL_SIZE;
      canvas.height = (10 + level * 2) * CELL_SIZE;
      const ctx = canvas.getContext("2d");
      ctxRef.current = ctx;
      draw();
    }
  }, [level]);

  const draw = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "#0f0";
    walls.forEach((w) => ctx.fillRect(w.x, w.y, w.w, w.h));
    ctx.fillStyle = "#ff0";
    ctx.beginPath();
    ctx.arc(START_POS.x, START_POS.y, CELL_SIZE / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f00";
    ctx.beginPath();
    ctx.arc(EXIT_POS.x, EXIT_POS.y, CELL_SIZE / 4, 0, Math.PI * 2);
    ctx.fill();
    if (path.length > 0) {
      ctx.strokeStyle = "#0ff";
      ctx.lineWidth = CELL_SIZE / 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (status !== "playing") return;
    drawing.current = true;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPath([{ x, y }]);
    if (!timerActive) {
      setTimerActive(true);
      startTimer();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing.current || status !== "playing") return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (walls.some((w) => x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h)) {
      setStatus("lost");
      setTimerActive(false);
      return;
    }
    if (Math.hypot(x - EXIT_POS.x, y - EXIT_POS.y) < CELL_SIZE / 2) {
      setStatus("won");
      setTimerActive(false);
      return;
    }
    setPath((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = () => {
    drawing.current = false;
  };

  const startTimer = () => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStatus("lost");
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const restartLevel = () => {
    setLevel((prev) => prev);
    setTimeLeft(30 + (level - 1) * 10);
    setTimerActive(false);
    setStatus("playing");
    setPath([]);
    generateMaze();
  };

  const nextLevel = () => {
    setLevel((prev) => prev + 1);
    setTimeLeft(30 + level * 10);
    setTimerActive(false);
    setStatus("playing");
    setPath([]);
    generateMaze();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <span className="text-lg">Level: {level}</span>
        <span className="text-lg">Time: {timeLeft}s</span>
      </div>
      <canvas
        ref={canvasRef}
        className="border"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />
      <div className="flex gap-2">
        <Button onClick={restartLevel}>Restart Level</Button>
        {status === "won" && (
          <Button onClick={nextLevel}>Next Level</Button>
        )}
        {status === "won" && (
          <Share text={`I completed level ${level} in ${timeLeft}s! ${url}`} />
        )}
      </div>
      {status === "lost" && (
        <div className="text-red-500">You lost! Try again.</div>
      )}
      {status === "won" && (
        <div className="text-green-500">Level Complete!</div>
      )}
    </div>
  );
}

export default MazeGame;
