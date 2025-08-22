#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_mouse;
uniform vec2        u_resolution;
uniform float       u_time;

const float PI = 3.14159265359;
const float TAU = 2. * PI;

const vec2 divisions = vec2(64.0, 32.0);
vec3 grid_grey = vec3(0.1);

const vec3 canadian_red = vec3(0.827, 0.110, 0.137);
const vec3 canadan_white = vec3(0.867);
// Auxiliary Functions --------------------------------------------------------

// Takes x-axis normalized device coordinates(0, 1) and converts to aspect ratio corrected coordinates
float X(float x) {
    float correction = u_resolution.x / u_resolution.y;
    return x * correction;
}

// Rotates the given coordinate space about (0, 0) for the given angle theta in radians
vec2 rotate(float theta, vec2 _st) {
    mat2 rotation = mat2(
            cos(theta), -sin(theta),
            sin(theta), cos(theta));

    return rotation * _st;
}

// Calculates a coordinate system for a given shape
vec2 calcPosition(vec2 position, float theta, vec2 uv) {
    vec2 st = uv - vec2(X(position.x), position.y);
    st = rotate(theta, st);
    return st;
}

float gridLines(vec2 count, vec2 uv) {
    const float line_width = 0.1;
    float grid = step(line_width, fract(uv.y * count.y));
    grid *= step(line_width, fract(uv.x * count.x));
    return grid;
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

    // Undistorted UV coordinates
    vec2 _UV = gl_FragCoord.xy / u_resolution.xy;

    // Our canvas
    vec3 flag = vec3(1.0);

    // Paint flag's background
    vec3 background = X(0.25) > uv.x || uv.x > X(0.75) ? canadian_red : canadan_white;

    float circle = step(0.001, circleSDF(vec2(X(0.5) , 0.5) - uv, 0.1));

    float triangle = equilaterialTriangleSDF(-calcPosition(vec2(0.5), PI, uv), 0.2);

    flag *= triangle > 0.0 ? canadan_white : canadian_red;
    flag *= background;

    float res = .3;
    float grid = gridLines(divisions, _UV);
    flag*= 0.99 + (grid_grey * grid);

    // flag *= 0.0; // Switch
    gl_FragColor = vec4(flag, 1.0);
}
