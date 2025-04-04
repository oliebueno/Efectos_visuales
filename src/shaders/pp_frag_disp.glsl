precision mediump float;

// Uniforms
uniform sampler2D tDiffuse; // Textura renderizada
uniform vec2 resolution;    // Resolución de la pantalla
uniform float dispersion;   // Nivel de dispersión de luz

// Varying
in vec2 vUv; // Coordenadas UV

// Output
out vec4 fragColor; // Color de salida

void main() {
    vec4 color = texture(tDiffuse, vUv);
    vec4 scatteredLight = vec4(0.0);

    // Simular dispersión radial
    int samples = 16; // Número de muestras para simular el halo
    for (int i = 0; i < samples; i++) {
        float angle = float(i) / float(samples) * 6.283185; // Ángulo en radianes (360°)
        vec2 offset = vec2(cos(angle), sin(angle)) * dispersion / resolution;
        scatteredLight += texture(tDiffuse, vUv + offset) * 0.1; // Atenuación por muestra
    }

    // Combinar la luz dispersa con el color original
    fragColor = color + scatteredLight;
}

