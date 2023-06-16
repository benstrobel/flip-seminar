import { useCallback, useEffect, useState } from "react";

interface PongProps {
  id: string;
  width: number;
  height: number;
  inputEnabled?: boolean;
  pause?: boolean;
}

interface Player {
  x: number;
  y: number;
  score: number;
}

interface Wall {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Ball {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
}

interface GameState {
  stop: boolean;
  tick: number;
  timeAtLastMeasurement: number;
  p0: Player;
  ball: Ball;
  wall: Wall;
  ctx?: CanvasRenderingContext2D;
  input: number;
}

const ticks_per_second = 60;
const ms_per_tick = 1000 / ticks_per_second;
const player_x_size = 15;
const player_y_size = 50;
const ball_size = 10;
const player_speed = 6;
const initial_ball_speed = 8;

export default function Pong({
  id,
  width,
  height,
  inputEnabled = false,
  pause = false,
}: PongProps) {
  const [state, setState] = useState<GameState>({
    stop: false,
    timeAtLastMeasurement: 0,
    tick: 0,
    p0: { score: 0, x: 25, y: 250 },
    ball: {
      speedX: initial_ball_speed / 2,
      speedY: Math.random() * initial_ball_speed + 2,
      x: 250,
      y: 250,
    },
    wall: { x: 450, y: 0, w: 25, h: 500 },
    input: 0,
  });

  useEffect(() => {
    if (inputEnabled) {
      window.addEventListener("keydown", inputPressed);
      window.addEventListener("keyup", inputReleased);
    }
    return () => {
      // state.stop = true;
      window.removeEventListener("keydown", inputPressed);
      window.removeEventListener("keyup", inputReleased);
    };
  }, [id]);

  const logicTick = useCallback(
    (state: GameState) => {
      // Handling player input
      if (state.input > 0) {
        if (state.p0.y + player_y_size / 2 + player_speed <= height) {
          state.p0.y += player_speed;
        }
      } else if (state.input < 0) {
        if (state.p0.y - player_y_size / 2 - player_speed >= 0) {
          state.p0.y -= player_speed;
        }
      }

      // Handling ball movement
      let newBallX = state.ball.x + state.ball.speedX;
      let newBallY = state.ball.y + state.ball.speedY;
      let newBallSpeedX = state.ball.speedX;
      let newBallSpeedY = state.ball.speedY;
      // Hit border
      if (newBallY + ball_size / 2 >= height) {
        newBallSpeedY = -newBallSpeedY;
      } else if (newBallY - ball_size / 2 <= 0) {
        newBallSpeedY = -newBallSpeedY;
      }
      // Hit goal
      if (newBallX <= 0) {
        newBallX = 250;
        newBallY = 250;
        newBallSpeedX = initial_ball_speed / 2;
        newBallSpeedY = Math.random() * initial_ball_speed;
      }
      // Hit wall
      if (
        state.wall.x < newBallX &&
        newBallX < state.wall.x + state.wall.w &&
        state.wall.y < newBallY &&
        newBallY < state.wall.y + state.wall.h
      ) {
        newBallSpeedX = -newBallSpeedX;
        newBallSpeedY = (Math.random() * 0.5 + 0.75) * newBallSpeedY;
      }
      // Hit player
      if (
        state.p0.x - player_x_size / 2 < newBallX &&
        newBallX < state.p0.x - player_x_size / 2 + player_x_size &&
        state.p0.y - player_y_size / 2 < newBallY &&
        newBallY < state.p0.y - player_y_size / 2 + player_y_size
      ) {
        newBallSpeedX = -newBallSpeedX;
        newBallSpeedY = (Math.random() * 0.5 + 0.75) * newBallSpeedY;
      }

      // Update state
      setState((state) => ({
        ...state,
        ball: {
          x: newBallX,
          y: newBallY,
          speedX: newBallSpeedX,
          speedY: newBallSpeedY,
        },
      }));
    },
    [height]
  );

  const inputPressed = useCallback((event: KeyboardEvent) => {
    let up = event.key === "w" || event.key === "ArrowUp";
    let down = event.key === "s" || event.key === "ArrowDown";
    setState((state) => ({
      ...state,
      input: Number(up) * -1 + Number(down) * 1,
    }));
  }, []);

  const inputReleased = useCallback((event: KeyboardEvent) => {
    if (event.key === "w" || event.key === "ArrowUp") {
      setState((state) => ({
        ...state,
        input: Math.max(state.input, 0),
      }));
    }
    if (event.key === "s" || event.key === "ArrowDown") {
      setState((state) => ({
        ...state,
        input: Math.min(state.input, 0),
      }));
    }
  }, []);

  const tick = useCallback(
    async (state: GameState) => {
      const start = performance.now();
      logicTick(state);
      const elapsed = performance.now() - start;
      if (ms_per_tick - elapsed < 0) {
        console.log("Cant keep up: " + (ms_per_tick - elapsed));
      }
      const timeout = setTimeout(() => {
        setState((state) => ({ ...state, tick: state.tick + 1 }));
        clearTimeout(timeout);
      }, Math.max(ms_per_tick - elapsed, 0));
    },
    [logicTick]
  );

  useEffect(() => {
    if (!pause) {
      if (state.tick % ticks_per_second === 0 && !pause) {
        console.log(
          id +
            " tps: " +
            ticks_per_second /
              ((performance.now() - state.timeAtLastMeasurement) / 1000)
        );
        setState((state) => ({
          ...state,
          timeAtLastMeasurement: performance.now(),
        }));
      }
      tick(state);
    }
  }, [state.tick, pause]);

  // return <canvas id={id} width={width} height={height}></canvas>;
  return (
    <div
      style={{
        width: width,
        height: height,
        backgroundColor: "black",
        position: "relative",
      }}
    >
      <div
        id="player"
        style={{
          position: "absolute",
          backgroundColor: "white",
          left: state.p0.x - player_x_size / 2,
          top: state.p0.y - player_y_size / 2,
          width: player_x_size,
          height: player_y_size,
        }}
      />
      <div
        id="ball"
        style={{
          position: "absolute",
          backgroundColor: "white",
          left: state.ball.x - ball_size / 2,
          top: state.ball.y - ball_size / 2,
          width: ball_size,
          height: ball_size,
        }}
      />
      <div
        id="wall"
        style={{
          position: "absolute",
          backgroundColor: "white",
          left: state.wall.x,
          top: state.wall.y,
          width: state.wall.w,
          height: state.wall.h,
        }}
      />
    </div>
  );
}
