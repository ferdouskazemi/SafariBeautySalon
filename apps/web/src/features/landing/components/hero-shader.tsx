'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';

/*
 * "Desert topography": animated contour lines over a domain-warped noise field,
 * like a terrain map of shifting dunes. Lines brighten around the pointer.
 * Plain WebGL2 (no three.js), rendered below native resolution at 30fps, paused off-screen.
 * Under reduced motion it renders a single still frame. Without WebGL2 the CSS gradient behind it shows.
 */

const VERTEX_SHADER = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
out vec4 fragColor;

const vec3 BG = vec3(0.051, 0.055, 0.047);
const vec3 LINE = vec3(0.839, 0.702, 0.439);

vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + 17.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  float t = uTime * 0.035;

  vec2 warp = vec2(fbm(uv * 1.1 + vec2(t, 0.0)), fbm(uv * 1.1 + vec2(4.2, -t)));
  float height = fbm(uv * 1.4 + warp * 1.6);

  float bands = height * 16.0;
  float dist = abs(fract(bands + 0.5) - 0.5);
  float line = 1.0 - smoothstep(0.0, fwidth(bands) * 1.25, dist);
  float major = 1.0 - step(0.5, mod(floor(bands + 0.5), 5.0));

  vec2 pointer = uPointer * vec2(uResolution.x / uResolution.y, 1.0);
  float glow = smoothstep(0.55, 0.0, distance(uv, pointer));

  // RTL layout: the copy sits on the right, so lines stay quieter there.
  float x = gl_FragCoord.x / uResolution.x;
  float side = mix(1.0, 0.35, smoothstep(0.35, 0.85, x));
  float bottomFade = smoothstep(0.0, 0.3, gl_FragCoord.y / uResolution.y);

  float intensity = line * (0.16 + 0.22 * major + 0.6 * glow) * side * bottomFade;
  fragColor = vec4(mix(BG, LINE, intensity), 1.0);
}`;

const TARGET_FPS = 30;
const RESOLUTION_SCALE = 0.6;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[hero-shader]', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

export function HeroShader({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Data Saver, a slow link or a very low-memory phone: keep the CSS gradient and spare the GPU.
    const { connection, deviceMemory } = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    if (connection?.saveData || (connection?.effectiveType ?? '4g') !== '4g') return;
    if (deviceMemory !== undefined && deviceMemory <= 2) return;

    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    });
    if (!canvas || !gl) return;
    const program = createProgram(gl);
    if (!program) return;

    // One triangle that covers the whole viewport.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);

    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uPointer = gl.getUniformLocation(program, 'uPointer');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const startedAt = performance.now();
    const pointer = { x: 0.25, y: 0.55 };
    const target = { ...pointer };
    let frameId = 0;
    let lastFrame = 0;
    let running = false;
    let onScreen = true;

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio, 1.5) * RESOLUTION_SCALE;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * scale));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      pointer.x += (target.x - pointer.x) * 0.06;
      pointer.y += (target.y - pointer.y) * 0.06;
      gl.uniform1f(uTime, (now - startedAt) / 1000 + 12);
      gl.uniform2f(uPointer, pointer.x, pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (!running) return;
      frameId = requestAnimationFrame(loop);
      if (now - lastFrame < 1000 / TARGET_FPS) return;
      lastFrame = now;
      draw(now);
    };

    const play = () => {
      if (running || reduceMotion) return;
      running = true;
      frameId = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };
    const sync = () => (onScreen && !document.hidden ? play() : pause());

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = 1 - (event.clientY - rect.top) / rect.height;
    };

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      sync();
    });
    const resizer = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });

    resize();
    draw(performance.now());
    canvas.dataset.ready = 'true';
    intersection.observe(canvas);
    resizer.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      pause();
      intersection.disconnect();
      resizer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('pointermove', onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn(
        'opacity-0 transition-opacity duration-[1500ms] data-[ready=true]:opacity-100',
        className,
      )}
    />
  );
}
