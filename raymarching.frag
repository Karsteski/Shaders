#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;
uniform vec2        u_mouse;

const float PI = 3.14159265359;
const float TAU = 2. * PI;

const bool enable_movement = false;

// Auxiliary Functions --------------------------------------------------------

float circleSDF(vec3 stp, float radius) {
    return length(stp) - radius;
}

// Courtesy of iq
// https://iquilezles.org/articles/distfunctions/
float torusSDF(vec3 pos, vec2 t) {
    vec2 q = vec2(length(pos.xz) - t.x, t.y);
    return length(q) - t.y;
}

float boxSDF(vec3 pos, vec3 b) {
    vec3 q = abs(pos) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

// Exponential
// https://iquilezles.org/articles/smin/
float smin(float a, float b, float k) {
     k *= 1.0;
     float r = exp2(-a / k) + exp2(-b / k);
     return -k * log2(r);
}
// -----------------------------------------------------------------------------

// Distance to the scene. Literally a SDF.
float map(vec3 pos) {
    float ground = pos.y; // SDF of the xz-plane (think about it...)
    ground += 0.75; // Move ground lower than the camera
    
    float world = 1.0;
    
    vec3 box_pos = pos;
    // box_pos = fract(3* pos) - 0.4;
    world *= boxSDF(box_pos, vec3(0.5, 0.5, 0.9));

    world *= smin(ground, world, 0.01);

    return world;
}

vec3 transform(vec3 translate, float scale, vec3 stp) {
    stp -= translate;
    stp /= scale;

    return stp;
}

vec3 rotate3D(vec3 pos, vec3 axis, float theta) {
    // Rodrigues' rotation formula
    return mix(dot(axis, pos) * axis, pos, cos(theta))
        + cross(axis, pos) * sin(theta);
}

mat2 rotate2D(float theta) {
    return mat2(cos(theta), -sin(theta),
            sin(theta), cos(theta)
    );
}

void main(){
    // Aspect ratio corrected UV coordinates (-1, 1)
    vec2 uv =  (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    const float sensitivity = 0.5;
    vec2 mouse_uv = (2.0 * u_mouse - u_resolution.xy) / u_resolution.y * sensitivity;

    // Initialization ---------------------------------------------------------
    vec3 ro = vec3(0.0, 0.0, -3); // Ray origin: Corresponds to camera's position in the world

    // Ray direction: Each ray's direction from ro. 
    // If we used (0, 0, 1), each ray would follow the exact same path.
    // We can use uv since our world's (x, y) is aligned with our uv-coords.
    // The rays therefore spread out from the camera into the world through the "screen"
    // This creates a virtual canvas with which to project the screen to.
    // Note that the rd is normalized to ensure accurate distance calculations.
    vec2 fov = vec2(1.5);
    vec3 rd = normalize(vec3(uv * fov, 1));

    // Camera movement via the mouse
    // Vertical
    if(enable_movement) {
        ro.yz *= rotate2D(-mouse_uv.y);
        rd.yz *= rotate2D(-mouse_uv.y);

        // Horizontal
        ro.xz *= rotate2D(-mouse_uv.x);
        rd.xz *= rotate2D(-mouse_uv.x);
    }

    // Raymarching ------------------------------------------------------------
    const int max_steps = 100; // ray marching steps per frame
    const float epsilon = 0.001; // Distance from scene at which ray should stop.
    const float clip_distance = 100.0; // Stop the ray if it has travelled this distance.

    float travelled = 0.0; // Distance travelled by each ray
    int i = 0;
    for(;i < max_steps; ++i) {
        // Position along the ray as we march
        vec3 pos = ro + rd * travelled;
        
        float scaling = 1;
        float dist = map(transform(vec3(0, vec2(0)), scaling, pos)) * scaling; // Current distance to the scene

        travelled += dist; // Marching the ray

        if(dist < epsilon || travelled > clip_distance) break;
    }

    // Scale our distances so that further objects can be seen
    travelled /= 2;

    vec3 background = vec3(0.1, 0.1, 0.);
    vec3 colour = vec3(travelled) * background;
    gl_FragColor = vec4(colour, 1.0);
}
