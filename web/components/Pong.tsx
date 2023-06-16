import { getModel, modelPredict, trainModel } from "@/lib/oldlearning";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as tf from "@tensorflow/tfjs";

interface PongProps {
  id: string;
  width: number;
  height: number;
  inputEnabled?: boolean;
  pause?: boolean;
  debug?: boolean;
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  sampleRate?: number;
  sampleProviderCallback?: (sample: Sample) => void;
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

export interface SampleGameState {
  playerBallVec: { x: number; y: number };
  playerBallDistance: number;
}

export interface Sample {
  gameState: SampleGameState;
  resultInput: number;
}

export interface GameState {
  stop: boolean;
  tick: number;
  timeAtLastMeasurement: number;
  p0: Player;
  ball: Ball;
  wall: Wall;
  ctx?: CanvasRenderingContext2D;
  input: number;
  model?: tf.Sequential;
}

const ticks_per_second = 60;
const ms_per_tick = 1000 / ticks_per_second;
const player_x_size = 15;
const player_y_size = 50;
const ball_size = 10;
const player_speed = 6;
export const initial_ball_speed = 8;

function normalizeVector(vec: { x: number; y: number }): {
  x: number;
  y: number;
} {
  const magnitude = Math.sqrt(Math.pow(vec.x, 2) + Math.pow(vec.y, 2));
  return {
    x: vec.x / magnitude,
    y: vec.y / magnitude,
  };
}

function stateToSampleGameState(
  state: GameState,
  maxDistance: number
): SampleGameState {
  const vec = {
    x: state.ball.x - state.p0.x,
    y: state.ball.y - state.p0.y,
  };
  const normalizedVec = normalizeVector(vec);
  const distance =
    Math.sqrt(
      Math.pow(state.ball.x - state.p0.x, 2) +
        Math.pow(state.ball.y - state.p0.y, 2)
    ) / maxDistance;

  return {
    playerBallDistance: distance,
    playerBallVec: normalizedVec,
  };
}

export default function Pong({
  id,
  width,
  height,
  inputEnabled = false,
  pause = false,
  debug = false,
  state,
  setState,
  sampleRate,
  sampleProviderCallback,
}: PongProps) {
  /* useEffect(() => {
    const randomSamples: Sample[] = [];
    for (let i = 0; i < 50; i++) {
      randomSamples.push({
        resultInput: 0,
        gameState: {
          playerBallDistance: Math.random(),
          playerBallVec: {
            x: Math.random(),
            y: Math.random(),
          },
        },
      });
    }

    const f = async () => {
      let model = getModel();
      model = await trainModel(model, randomSamples);
      const prediction = await modelPredict(model, {
        playerBallDistance: 0,
        playerBallVec: { x: 0, y: 0 },
      });
      console.log(prediction);
    };
    f();
  }, []); */

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

  const maxDistance = useMemo(() => {
    return Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
  }, [height, width]);

  const logicTick = useCallback(
    async (state: GameState) => {
      // Handling player/model input
      let modelInput = 0;
      if (state.model) {
        modelInput = await modelPredict(
          state.model,
          stateToSampleGameState(state, maxDistance),
          false
        );
      }

      if (state.model ? modelInput > 0 : state.input > 0) {
        if (state.p0.y + player_y_size / 2 + player_speed <= height) {
          state.p0.y += player_speed;
        }
      } else if (state.model ? modelInput < 0 : state.input < 0) {
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
        newBallX = state.ball.x;
        newBallY = state.ball.y;
      } else if (newBallY - ball_size / 2 <= 0) {
        newBallSpeedY = -newBallSpeedY;
        newBallX = state.ball.x;
        newBallY = state.ball.y;
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
        newBallX = state.ball.x;
        newBallY = state.ball.y;
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

      // Push sample
      if (
        sampleRate &&
        sampleProviderCallback &&
        state.tick % sampleRate === 0
      ) {
        const vec = {
          x: state.ball.x - state.p0.x,
          y: state.ball.y - state.p0.y,
        };
        const normalizedVec = normalizeVector(vec);
        const distance =
          Math.sqrt(
            Math.pow(state.ball.x - state.p0.x, 2) +
              Math.pow(state.ball.y - state.p0.y, 2)
          ) / maxDistance;

        sampleProviderCallback({
          gameState: {
            playerBallDistance: distance,
            playerBallVec: normalizedVec,
          },
          resultInput: state.input,
        });
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
      await logicTick(state);
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
      if (state.tick % ticks_per_second === 0 && !pause && debug) {
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
