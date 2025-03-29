precision highp float;

uniform sampler2D tDiffuse;
uniform float noiseIntensity;
uniform float contrast;
uniform float time;

varying vec2 vUv;

// Función para generar ruido pseudoaleatorio
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    // Obtener el color original
    vec4 color = texture2D(tDiffuse, vUv);
    
    // Convertir a escala de grises con mayor sensibilidad al verde
    float gray = dot(color.rgb, vec3(0.2, 0.7, 0.1));
    
    // Aplicar tono verdoso
    vec3 nightColor = vec3(0.1, gray * 0.8, 0.1);
    
    // Aplicar contraste
    nightColor = (nightColor - 0.5) * contrast + 0.5;
    
    // Añadir ruido/grano
    float noise = rand(vUv + time) * noiseIntensity;
    nightColor += noise * 0.2;
    
    // Añadir efecto de escaneo (línea vertical que se mueve)
    float scanLine = sin(vUv.y * 1000.0 + time * 5.0) * 0.02;
    nightColor += scanLine;
    
    // Añadir viñeta (oscurecimiento en los bordes)
    vec2 uvCenter = vUv - 0.5;
    float vignette = 1.0 - dot(uvCenter, uvCenter);
    nightColor *= vignette * 0.7 + 0.3;
    
    gl_FragColor = vec4(nightColor, 1.0);
}