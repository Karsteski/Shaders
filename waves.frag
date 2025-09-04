#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;

const float PI = 3.14159265359;
const float TAU = 2. * PI;

// Auxiliary Functions --------------------------------------------------------

// Takes x-axis normalized device coordinates(0, 1) and converts to aspect ratio corrected coordinates
float X(float x) {
    float correction = u_resolution.y / u_resolution.x;
    return x * correction;
}

// Wave Functions -------------------------------------------------------------
float wave(vec2 uv) {
    float x = (uv.x);
    float y = uv.y;

    float a = TAU * x + u_time;
    
    float z = sin(a);

    return z;
}

float plot(vec2 uv, float line) {
    float w = 0.01;
    float l = smoothstep(line  - w, line, uv.y) - smoothstep(line, line + w, uv.y); 
    return l;
}

void main() {
    // Aspect ratio corrected UV coordinates
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Remap to (-1, 1)
    uv = uv * 2 - 1;

    vec3 line_colour = vec3(0.0, 0.5, 0.0);

    float wave = wave(uv);
    float plot = plot(uv, wave);

    vec3 colour = (1.0 - plot) * wave + plot * line_colour;

    gl_FragColor = vec4(colour, 1.0);
}
