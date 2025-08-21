#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_mouse;
uniform vec2        u_resolution;
uniform float       u_time;

const vec3 canadian_red = vec3(0.827, 0.110, 0.137);
const vec3 canadan_white = vec3(0.867);

// Auxiliary Functions --------------------------------------------------------

// Takes x-axis normalized device coordinates(0, 1) and converts to aspect ratio corrected coordinates
float X(float x) {
    float correction = u_resolution.x / u_resolution.y;
    return x * correction;
}

// ----------------------------------------------------------------------------

// SDFs -----------------------------------------------------------------------

float circleSDF(vec2 center, float radius) {
    float d = length(center) - radius;
    return d;
}

// Courtesy of https://iquilezles.org/articles/distfunctions2d/
float equilaterialTriangleSDF(in vec2 center, in float radius) {
    const float k = sqrt(3.0);
    center.x = abs(center.x) - radius;
    center.y = center.y + (radius / k);

    if (center.x + k * center.y > 0.0) {
        center = vec2(center.x - k * center.y, -k * center.x - center.y) / 2.0;
    }

    center.x -= clamp(center.x, -2.0 * radius, 0.0);
    return -length(center) * sign(center.y);
}
// ----------------------------------------------------------------------------

void main () {
    // Aspect ratio corrected UV coordinates
    vec2 uv = gl_FragCoord.xy / u_resolution.y;

    // Our canvas
    vec3 flag = vec3(1.0);

    // Paint flag's background
    vec3 background = X(0.25) > uv.x || uv.x > X(0.75) ? canadian_red : canadan_white;

    float c = step(0.001, circleSDF(vec2(X(0.5) , 0.5) - uv, 0.1));

    flag *= background;
    gl_FragColor = vec4(flag, 1.0);
}
