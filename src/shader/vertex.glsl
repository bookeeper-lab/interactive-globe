varying vec2 vertexUV;
varying vec3 vertexNormal;

uniform vec3 lightPosition;
varying vec3 lightDirection;

void main(){
    vertexUV = uv;
    vertexNormal = normalize(normalMatrix*normal);

    vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);
    lightDirection = normalize(lightPosition - worldPosition.xyz);

 
    gl_Position = projectionMatrix* modelViewMatrix * vec4 (position,1.0);
}

