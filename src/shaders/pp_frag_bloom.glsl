precision mediump float;

// Uniforms
uniform sampler2D tDiffuse; // Textura renderizada
uniform vec2 resolution;    // Resolución de la pantalla
uniform float intensity;    // Intensidad del Bloom
uniform float threshold;    // Umbral para áreas brillantes

// Varying
in vec2 vUv; // Coordenadas UV

// Output
out vec4 fragColor; // Color de salida

void main() {
    // Obtener el color original del píxel
    vec4 color = texture(tDiffuse, vUv);

    // Calcular la luminancia (brillo percibido)
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114)); // Fórmula estándar de luminancia

    // Filtrar por brillo usando el umbral
    vec4 bloomColor = brightness > threshold ? color : vec4(0.0);

    // Aplicar desenfoque a las áreas brillantes
    vec4 blurredColor = vec4(0.0);
    for (float x = -1.0; x <= 1.0; x++) {
        for (float y = -1.0; y <= 1.0; y++) {
            vec2 offset = vec2(x, y) / resolution; // Desplazamiento normalizado
            blurredColor += texture(tDiffuse, vUv + offset) * step(threshold, brightness);
        }
    }
    blurredColor /= 9.0; // Normalizar el promedio del kernel

    // Combina el color original con el Bloom desenfocado
    fragColor = color + blurredColor * intensity; // Ajusta el impacto del Bloom
}





