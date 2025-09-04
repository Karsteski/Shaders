#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;

const float PI = 3.14159265359;
const float TAU = 2. * PI;

// Auxiliary Functions --------------------------------------------------------


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
    // Aspect ratio corrected UV coordinates (-1, 1)
    vec2 uv =  (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    vec3 line_colour = vec3(0.0, 0.5, 0.0);

    float wave = wave(uv);
    float plot = plot(uv, wave);

    vec3 colour = (1.0 - plot) * wave + plot * line_colour;

    gl_FragColor = vec4(colour, 1.0);
}
