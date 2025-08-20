#version 330

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2        u_mouse;
uniform vec2        u_resolution;
uniform float       u_time;

void main () {
    vec3 color = vec3(0.0);
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;

    gl_FragColor = vec4(uv.x, 0.0, 0.0, 1.0);
}
