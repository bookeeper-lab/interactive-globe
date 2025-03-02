uniform sampler2D globeTexture;
uniform vec3 lightColor;
uniform float ambientStrength;

varying vec2 vertexUV;
varying vec3 vertexNormal;
varying vec3 lightDirection;

void main() {
    // Calcolo dell'illuminazione ambientale
    vec3 ambient = ambientStrength * vec3(1.0, 1.0, 1.0);
    
    // Calcolo dell'illuminazione diffusa
    float diff = max(dot(vertexNormal, lightDirection), 0.0);
    vec3 diffuse = diff * lightColor;
    
    // Combina illuminazione e texture
    vec3 textureColor = texture2D(globeTexture, vertexUV).xyz;
    vec3 result = (ambient + diffuse) * textureColor;
    
    gl_FragColor = vec4(result, 1.0);
}