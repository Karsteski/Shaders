#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_resolution;
uniform float       u_time;

const float PI = 3.14159265359;
const float TAU = 2. * PI;

// Auxiliary Functions --------------------------------------------------------

float circleSDF(vec3 stp, float radius) {
    return length(stp) - radius;
}

// Distance to the scene. Literally a SDF.
float map(vec3 p) {
    return length(p) - 1;
}

void main(){
    // Aspect ratio corrected UV coordinates (-1, 1)
    vec2 uv =  (2.0 * gl_FragCoord.xy - u_resolution.xy) / u_resolution.y;

    // Initialization ---------------------------------------------------------
    vec3 ro = vec3(0.0, 0.0, -3); // Ray origin: Corresponds to camera's position in the world

    // Ray direction: Each ray's direction from ro. 
    // If we used (0, 0, 1), each ray would follow the exact same path.
    // We can use uv since our world's (x, y) is aligned with our uv-coords.
    // The rays therefore spread out from the camera into the world through the "screen"
    // This creates a virtual canvas with which to project the screen to.
    // Note that the rd is normalized to ensure accurate distance calculations.
    vec3 rd = normalize(vec3(uv, 1));

    float t = 0.0; // Distance travelled by each ray

    // Raymarching ------------------------------------------------------------
    const int steps = 100; // ray marching steps per frame

    for(int i = 0; i < steps; ++i) {
        // Position along the ray as we march
        vec3 p = ro + rd * t;

        float dist = map(p); // Current distance to the scene

        t += dist; // Marching the ray
    }

    // Scale our distances so that further objects can be seen
    t /= 6;

    vec3 colour = vec3(t);
    gl_FragColor = vec4(colour, 1.0);
}
