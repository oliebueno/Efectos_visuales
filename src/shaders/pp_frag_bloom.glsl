precision mediump float;

uniform sampler2D tDiffuse; // Textura renderizada
uniform float threshold;     // Umbral de brillo
uniform vec2 resolution;     // Resolución de la pantalla
in vec2 vUv;                // Coordenadas UV
out vec4 fragColor;         // Color de salida

void main() {
    // Usar la resolución para calcular las coordenadas UV
    vec4 color = texture(tDiffuse, vUv); // Color original de la textura

    // Calcular la luminancia
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Luminancia

    // Detectar áreas brillantes
    vec4 bloomColor = brightness > threshold ? color : vec4(0.0); // Áreas brillantes

    // Combina el color original con el Bloom
    fragColor = color + bloomColor * 0.5; // Ajusta el efecto de Bloom
}



