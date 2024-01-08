uniform sampler2D sampler0;
uniform sampler2D sampler1;
uniform sampler2D sampler2;
uniform sampler2D uLightShaftTexture;
uniform sampler2D uSSRTexture;

uniform vec3 cameraPosition;
uniform float cameraNear;
uniform float cameraFar;

in vec2 vUv;

layout (location = 0) out vec4 outColor;

void main( void ) {

	vec4 gCol0 = texture( sampler0, vUv );
	vec4 gCol1 = texture( sampler1, vUv );
	vec3 dir = normalize( cameraPosition - gCol0.xyz );
	float f = fresnel( dot( dir, gCol1.xyz ) );

	outColor = vec4( texture( sampler2, vUv ).xyz, 1.0 );
	outColor += texture( uLightShaftTexture, vUv ) * 0.3;
	outColor += texture( uSSRTexture, vUv ) * 0.3 * f;

}