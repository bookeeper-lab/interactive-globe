varying vec3 vertexNormal;

void main(){

    float intensity = pow(0.6 - dot(vertexNormal, normalize(vec3(0.0, 0.0, 1.5))), 2.0);
    gl_FragColor = vec4(0.45, 0.3, 0.15, 0) * intensity;
}