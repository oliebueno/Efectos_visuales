precision mediump float;

// Uniform
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// Attrubute
in vec3 position;
in vec2 uv;

// Varying
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
