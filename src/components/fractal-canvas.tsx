import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

// Vertex Shader: Passes UV coordinates and sets up the screen-filling quad
// ... (rest of the FractalCanvas.js content from the earlier read_file call) ...
// Ensure the rest of the FractalCanvas.js content is pasted here
const vertexShader = `
  varying vec2 vUv; // Varying to pass UV coordinates to fragment shader

  void main() {
    vUv = uv; // UV coordinates from the geometry (a plane)
    // gl_Position is the final position of the vertex in clip space.
    // projectionMatrix and modelViewMatrix are provided by three.js.
    // position is the vertex position in object space.
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment Shader: Calculates and colors various fractal patterns, integrated with scrollEffect
const fragmentShader = `
  // Set precision to highp for float types. Crucial for fractal calculations
  // to avoid visual artifacts, especially on mobile or less powerful GPUs.
  precision highp float;

  // Uniforms: variables passed from JavaScript to the shader
  uniform vec2 u_resolution; // Canvas resolution (width, height)
  uniform float u_time;      // Time elapsed, for animations
  uniform vec2 u_mouse;      // Mouse coordinates (normalized: 0.0 to 1.0 for x and y)
  uniform float u_seed1;      // For major type/behavior changes (0.0 to 1.0)
  uniform float u_seed2;      // For parameter variations (0.0 to 1.0)
  uniform float u_seed3;      // For other subtle variations (0.0 to 1.0)
  uniform float u_scrollEffect; // Added for scroll interaction

  // --- START Simplex Noise 2D (aka Perlin noise variant) ---
  // This is a standard GLSL implementation of 2D Simplex Noise.
  // It's used to generate procedural noise patterns.
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  // snoise: Simplex noise function
  // v: input coordinate (vec2) for which to calculate noise
  // returns: noise value in the range [-1, 1]
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    // First corner
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    // Other corners
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    // Permutations
    i = mod289(i); // Avoid truncation effects in permutation
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
                   + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    // Gradients: 41 points uniformly over a line, mapped onto a diamond.
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    // Normalise gradients implicitly by scaling m
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    // Compute final noise value at P
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  // --- END Simplex Noise 2D ---

  // Helper function to map screen UV coordinates to a point in the complex plane
  vec2 toComplex(vec2 uv, vec2 center, float zoom) {
    float aspectRatio = u_resolution.x / u_resolution.y;
    return (uv - 0.5) * zoom * vec2(aspectRatio, 1.0) + center;
  }

  // Core iteration function
  float iteratePoint(vec2 z, vec2 initial_c, vec2 mouse_influence, int max_iter_val) {
    float mode = floor(u_seed1 * 4.0); 
    vec2 c = initial_c + (mouse_influence - 0.5) * (0.2 + u_seed2 * 0.6); 
    float escape_radius_sq = 4.0 + u_seed3 * 12.0; 

    if (mode == 0.0) { // Chaotic Julia / Mandelbrot-like
      for (int i = 0; i < max_iter_val; i++) {
        float xtemp = z.x * z.x - z.y * z.y + c.x;
        z.y = 2.0 * z.x * z.y + c.y;
        z.x = xtemp;
        if (dot(z, z) > escape_radius_sq) {
          float smooth_iter = float(i) - log2(log2(dot(z,z) / escape_radius_sq)) + 4.0;
          return clamp(smooth_iter / float(max_iter_val), 0.0, 1.0);
        }
      }
    } else if (mode == 1.0) { // Twisting / Spiralic Pattern
      float rotation_speed = (u_seed2 - 0.5) * 0.2 + mouse_influence.x * 0.1;
      float scale_factor = 0.95 + u_seed3 * 0.04 + (mouse_influence.y -0.5) * 0.02;
      for (int i = 0; i < max_iter_val; i++) {
        float angle = rotation_speed * float(i) * 0.2 + u_seed1 * 5.0;
        float cos_a = cos(angle);
        float sin_a = sin(angle);
        z = vec2(z.x * cos_a - z.y * sin_a, z.x * sin_a + z.y * cos_a);
        z *= scale_factor;
        z += c * 0.5; 
        if (dot(z, z) > escape_radius_sq) {
          float smooth_iter = float(i) - log2(log2(dot(z,z) / escape_radius_sq)) + 4.0;
          return clamp(smooth_iter / float(max_iter_val), 0.0, 1.0);
        }
      }
    } else if (mode == 2.0) { // Geometric / Symmetric variation
      float symmetry_factor = floor(u_seed2 * 3.0) + 2.0; 
      for (int i = 0; i < max_iter_val; i++) {
        float angle_sym = atan(z.y, z.x);
        float radius_sym = length(z);
        angle_sym = mod(angle_sym, 2.0 * 3.14159 / symmetry_factor); 
        if (fract(u_seed3*10.0) > 0.5) z.x = abs(z.x);
        if (fract(u_seed3*5.0) > 0.5) z.y = abs(z.y);
        z = vec2(radius_sym * cos(angle_sym), radius_sym * sin(angle_sym)); 
        float xtemp = z.x * z.x - z.y * z.y + c.x;
        z.y = 2.0 * z.x * z.y + c.y; 
        z.x = xtemp;
        z += (mouse_influence - 0.5) * 0.01;
        if (dot(z, z) > escape_radius_sq) {
          float smooth_iter = float(i) - log2(log2(dot(z,z) / escape_radius_sq)) + 4.0;
          return clamp(smooth_iter / float(max_iter_val), 0.0, 1.0);
        }
      }
    } else { // Mode 3: "Burning Ship" like variation
        for (int i = 0; i < max_iter_val; i++) {
            z = vec2(abs(z.x), abs(z.y)); 
            float xtemp = z.x * z.x - z.y * z.y + c.x;
            z.y = 2.0 * z.x * z.y + c.y;
            z.x = xtemp;
            if (dot(z, z) > escape_radius_sq) {
                float smooth_iter = float(i) - log2(log2(dot(z,z) / escape_radius_sq)) + 4.0;
                return clamp(smooth_iter / float(max_iter_val), 0.0, 1.0);
            }
        }
    }
    return 0.0; 
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Base 'c' for Julia-like, randomized by seeds, and influenced by scroll
    vec2 original_base_c = vec2((u_seed2 - 0.5) * 2.2, (u_seed3 - 0.5) * 2.2);
    float scroll_driven_cx_offset = -u_scrollEffect * 0.8; // e.g. scroll 0->1 shifts c.x by -0.8 (was -0.4)
    vec2 effective_base_c = vec2(original_base_c.x + scroll_driven_cx_offset, original_base_c.y);

    float zoom_val = 1.0 + u_seed1 * 3.0 + (u_mouse.y - 0.5) * (0.5 + u_seed2 * 1.0) ; 
    zoom_val = max(0.1, zoom_val); 

    int max_iter_val = int(80.0 + u_seed2 * 170.0); 

    vec2 complex_plane_center = vec2((fract(u_seed1*5.3)-0.5)*0.5, (fract(u_seed2*7.1)-0.5)*0.5);
    complex_plane_center += (vec2(u_mouse.x, u_mouse.y) - 0.5) * 0.1; // u_mouse.y is already 1.0 - screenY

    vec2 z_transformed = toComplex(uv, complex_plane_center, zoom_val);
    float iter_val = iteratePoint(z_transformed, effective_base_c, u_mouse, max_iter_val);

    // --- Coloring ---
    vec3 color = vec3(0.0);
    if (iter_val > 0.0001) { 
      // Scroll-influenced noise parameters
      float scroll_time_factor = (0.1 + u_seed2*0.3) + u_scrollEffect * 0.4; // Was 0.2
      float scroll_scale_factor = (3.0 + u_seed1*5.0) - u_scrollEffect * 4.0; // Was 2.0
      scroll_scale_factor = max(0.1, scroll_scale_factor); 
      
      float noise_val = (snoise(uv * scroll_scale_factor + u_time * scroll_time_factor) + 1.0) * 0.5;
      
      float current_noise_strength = 1.5 + u_seed3 * 1.5;
      float scroll_noise_strength_boost = u_scrollEffect * 2.0; // Was 1.0
      float final_noise_strength = current_noise_strength + scroll_noise_strength_boost;

      // Color palette seeds
      float R_phase = 3.0 + u_seed1 * 2.0;
      float G_phase = 3.5 + u_seed2 * 2.0;
      float B_phase = 4.0 + u_seed3 * 2.0;
      float R_freq = 15.0 + u_seed1 * 10.0;
      float G_freq = 17.0 + u_seed2 * 10.0;
      float B_freq = 19.0 + u_seed3 * 10.0;

      // Scroll-influenced color intensity
      float color_intensity_from_scroll = 0.3 + u_scrollEffect * 0.7; // Was 0.5 + u_scrollEffect * 0.5

      color = vec3(
          0.5 + 0.5 * cos(R_phase + iter_val * R_freq + u_time * 0.3 + noise_val * final_noise_strength),
          0.5 + 0.5 * cos(G_phase + iter_val * G_freq + u_time * 0.2 + noise_val * final_noise_strength * 1.2),
          0.5 + 0.5 * cos(B_phase + iter_val * B_freq + u_time * 0.1 + noise_val * final_noise_strength * 1.4)
      );
      color *= color_intensity_from_scroll;
      color = clamp(color, 0.0, 1.0);
    } else {
      color = vec3(0.0, 0.0, 0.0); 
    }
    gl_FragColor = vec4(color, 1.0);
  }
`

interface SeedSet {
  name: string
  s1: number
  s2: number
  s3: number
}

const knownGoodSeedSets: SeedSet[] = [
  { name: 'Oceanic Swirls', s1: 0.12, s2: 0.35, s3: 0.78 },
  // { name: "Spiral Galaxy", s1: 0.28, s2: 0.65, s3: 0.42 }, // Removed: Problematic
  { name: 'Geometric Web', s1: 0.55, s2: 0.1, s3: 0.9 },
  { name: 'Burning Embers', s1: 0.82, s2: 0.88, s3: 0.2 },
  // { name: "Crystal Feathers", s1: 0.40, s2: 0.22, s3: 0.60 }, // Removed: Problematic
  { name: 'Vibrant Chaos', s1: 0.05, s2: 0.75, s3: 0.5 },
  { name: 'Delicate Filigree', s1: 0.65, s2: 0.3, s3: 0.15 },
  // You can add more known good sets here as you find them
]

interface GlobalMousePos {
  x: number
  y: number
}

interface FractalPlaneProps {
  scrollProgress: number
  globalMousePos: GlobalMousePos | null
}

// This component sets up the shader material and geometry
const FractalPlane: FC<FractalPlaneProps> = ({
  scrollProgress,
  globalMousePos,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { size, viewport } = useThree()
  const [chosenSeeds, setChosenSeeds] = useState<SeedSet>(() => {
    if (knownGoodSeedSets.length === 0) {
      console.warn(
        'No known good seed sets available! Falling back to full random.',
      )
      return {
        name: 'Fallback Random',
        s1: Math.random(),
        s2: Math.random(),
        s3: Math.random(),
      }
    }
    const randomIndex = Math.floor(Math.random() * knownGoodSeedSets.length)
    return knownGoodSeedSets[randomIndex]
  })

  // Log initial and subsequent seed selections
  useEffect(() => {
    console.log(
      `%cSelected Fractal Seed Set: %c${chosenSeeds.name}`,
      'font-weight: bold;',
      'font-weight: normal;',
      { s1: chosenSeeds.s1, s2: chosenSeeds.s2, s3: chosenSeeds.s3 },
    )
  }, [chosenSeeds])

  // Effect to change seeds periodically
  useEffect(() => {
    const RESEED_INTERVAL_MS: number = 10000 // Change seeds every 10 seconds

    const intervalId = setInterval(() => {
      setChosenSeeds(() => {
        if (knownGoodSeedSets.length === 0) {
          // This case should ideally not be hit if the initial state is handled
          return {
            name: 'Fallback Random periodic',
            s1: Math.random(),
            s2: Math.random(),
            s3: Math.random(),
          }
        }
        const randomIndex = Math.floor(Math.random() * knownGoodSeedSets.length)
        // Ensure we don't pick the same set consecutively if possible, to make changes more obvious
        // This is a simple way, for more robust "different" selection, more logic would be needed
        // but random chance usually makes it different enough with a few options.
        return knownGoodSeedSets[randomIndex]
      })
    }, RESEED_INTERVAL_MS)

    return () => clearInterval(intervalId) // Cleanup on unmount
  }, []) // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const uniforms = useMemo(() => {
    return {
      u_time: { value: 0.0 },
      u_resolution: {
        value: new THREE.Vector2(
          size.width * viewport.dpr,
          size.height * viewport.dpr,
        ),
      },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_seed1: { value: chosenSeeds.s1 },
      u_seed2: { value: chosenSeeds.s2 },
      u_seed3: { value: chosenSeeds.s3 },
      u_scrollEffect: { value: 0.0 },
    }
  }, [size.width, size.height, viewport.dpr, chosenSeeds])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.getElapsedTime()
      materialRef.current.uniforms.u_scrollEffect.value = scrollProgress
      if (globalMousePos) {
        materialRef.current.uniforms.u_mouse.value.set(
          globalMousePos.x,
          1.0 - globalMousePos.y,
        )
      }
    }
  })

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_resolution.value.set(
        size.width * viewport.dpr,
        size.height * viewport.dpr,
      )
    }
  }, [size.width, size.height, viewport.dpr])

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        key={chosenSeeds.name}
      />
    </mesh>
  )
}

interface FractalCanvasProps {
  scrollProgress: number
  globalMousePos: GlobalMousePos | null
}

// Main component to host the R3F Canvas
const FractalCanvasComponent: FC<FractalCanvasProps> = ({
  scrollProgress,
  globalMousePos,
}) => {
  return (
    <Canvas orthographic camera={{ zoom: 1, position: [0, 0, 100] }}>
      <FractalPlane
        scrollProgress={scrollProgress}
        globalMousePos={globalMousePos}
      />
    </Canvas>
  )
}

export default FractalCanvasComponent
