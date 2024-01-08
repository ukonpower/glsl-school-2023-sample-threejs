uniform sampler2D uBackBuffer;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	outColor = texture( uBackBuffer, vUv);

}