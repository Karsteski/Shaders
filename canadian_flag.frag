#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;

const float PI = 3.14159265359;

const vec2 grid_divisions = vec2(64.0, 32.0);
vec3 grid_grey = vec3(0.1);

const vec3 canadian_red = vec3(0.827, 0.110, 0.137);
const vec3 canadian_white = vec3(0.867);
// Auxiliary Functions --------------------------------------------------------

// Takes x-axis normalized device coordinates(0, 1) and converts to aspect ratio corrected coordinates
float X(float x) {
    // This is actually supposed to be the other way around, but let's leave it this way
    // Because the shader is designed with this error :')
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

float blendSDFs(float sdf1, float sdf2) {
    return min(sdf1, sdf2);
}

float subtractSDFs(float sdf1, float sdf2) {
    return max(-sdf1, sdf2);
}

float intersectSDFs(float sdf1, float sdf2) {
    return max(sdf1, sdf2);
}

// Calculates a coordinate system for a given shape
vec2 transformSDF(vec2 position, float theta, float scale, vec2 uv) {
    vec2 st = uv - vec2(X(position.x), position.y);
    st = rotate(theta, st);
    st /= scale;
    return st;
}

// For guiding lines
float gridLines(vec2 count, vec2 uv) {
    const float line_width = 0.1;
    float grid = step(line_width, fract(uv.y * count.y));
    grid *= step(line_width, fract(uv.x * count.x));
    return grid;
}

float gridCenters(vec2 uv) {
    const float line_width = 0.001;
    float line1 = smoothstep(0.5 - line_width, 0.5 + line_width, uv.x);
    line1 -= smoothstep(0.501 - line_width, 0.501 + line_width, uv.x);
    
    float line2 = smoothstep(0.5 - line_width, 0.5 + line_width, uv.y);
    line2 -= smoothstep(0.501 - line_width, 0.501 + line_width, uv.y);
    
    return (1.0 - line1) * (1.0 - line2);
}
// ----------------------------------------------------------------------------

// SDFs -----------------------------------------------------------------------
float circleSDF(vec2 center, float radius) {
    float d = length(center) - radius;
    return d;
}

// Courtesy of https://iquilezles.org/articles/distfunctions2d/
float isoscelesTriangleSDF(vec2 p, vec2 q){
    p.x = abs(p.x);
    vec2 a = p - q*clamp( dot(p,q)/dot(q,q), 0.0, 1.0 );
    vec2 b = p - q*vec2( clamp( p.x/q.x, 0.0, 1.0 ), 1.0 );
    float s = -sign( q.y );
    vec2 d = min( vec2( dot(a,a), s*(p.x*q.y-p.y*q.x) ),
                  vec2( dot(b,b), s*(p.y-q.y)  ));
    return -sqrt(d.x)*sign(d.y);
}

float roundedTriangleSDF(vec2 p, vec2 q, float k) { 
    return isoscelesTriangleSDF(p, q) - k;
}

float mapleLeafSDF(vec2 p) {
    // Thanks to CodingDuff on ShaderToy for the idea of using the negative SDF!

    // Where p = center of sdf
    // Movement of 1/64 in the x-direction is 0.025
    // Movement of 1/32 in the y-direction is 0.03

    // Mirroring the SDF about its center
    p.x = -abs(p.x);

    // Negative SDF of the maple leaf
    float sdf = roundedTriangleSDF(p - vec2(-0.075, 0.29), vec2(0.15, 0.31), 0.02);
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(30.0, p - vec2(-0.34, 0.452)), vec2(0.2, 0.23), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.4, p - vec2(-0.12, 0.13)), vec2(0.05, 0.3), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.65, p - vec2(-0.12, 0.13)), vec2(0.05, 0.3), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.3, p - vec2(-0.275, 0.17)), vec2(0.1, 0.1), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.5, p - vec2(-0.275, 0.17)), vec2(0.1, 0.1), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.5, p - vec2(-0.37, 0.035)), vec2(0.05, 0.2), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(1.5, p - vec2(-0.37, 0.035)), vec2(0.05, 0.2), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(1., p - vec2(-0.23, -0.18)), vec2(0.05, 0.25), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(2.3, p - vec2(-0.23, -0.18)), vec2(0.05, 0.1), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(1.95, p - vec2(-0.04, -0.24)), vec2(0.05, 0.25), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(2.95, p - vec2(-0.04, -0.24)), vec2(0.03, 0.20), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.0, p - vec2(-0.39, 0.2)), vec2(0.2, 0.3), 0.02));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.35, p - vec2(-0.39, -0.50)), vec2(0.15, 0.3), 0.07));
    sdf = blendSDFs(sdf, roundedTriangleSDF(rotate(0.0, p - vec2(-0.25, -0.65)), vec2(0.15, 0.3), 0.07));

    // Form positive SDF of the beautiful maple leaf
    float circle_sdf = circleSDF(p - vec2(0.0, 0.05), 0.437);
    float maple_leaf = subtractSDFs(sdf, circle_sdf);
    return maple_leaf; 
}
// ----------------------------------------------------------------------------

void main () {
    // Aspect ratio corrected UV coordinates
    vec2 uv = gl_FragCoord.xy / u_resolution.y;

    const float scaling = 0.9;
    const vec2 center = vec2(0.5);
    float maple_leaf = mapleLeafSDF(transformSDF(center, 0.0, scaling, uv));

    bool flag = X(0.25) > uv.x || uv.x > X(0.75) ? true: false; // Borders
    flag = flag || maple_leaf < 0.0 ? true : false;

    vec3 colour = canadian_white;
    if (flag) colour = canadian_red;
    gl_FragColor = vec4(colour, 1.0);
}
