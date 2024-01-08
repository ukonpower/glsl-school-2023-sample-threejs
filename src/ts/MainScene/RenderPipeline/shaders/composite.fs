uniform sampler2D uBackBuffer;
uniform sampler2D uBloomTexture[4];

in vec2 vUv;

layout (location = 0) out vec4 outColor;

vec2 lens_distortion(vec2 r, float alpha) {
    return r * (1.0 - alpha * dot(r, r));
}

void main( void ) {

	vec2 uv = vUv;
	vec2 cuv = uv - 0.5;

	vec3 col = vec3( 0.0, 0.0, 0.0 );
	vec2 scaledUv = cuv * 0.99;

	for ( int i = 0; i < 8; i ++ ) {

		float d = -float( i ) / 8.0 * 0.1;
        col.x += texture( uBackBuffer, lens_distortion( scaledUv, d * 0.0 ) + 0.5 + vec2( (float( i ) / 8.0 - 0.5 ) * 0.002, 0.0 ) ).x;
        col.y += texture( uBackBuffer, lens_distortion( scaledUv, d * 3.0 ) + 0.5 ).y;
        col.z += texture( uBackBuffer, lens_distortion( scaledUv, d * 6.0 ) + 0.5 ).z;
	}
	
	col.xyz /= 8.0;

	#pragma unroll_loop_start
	for ( int i = 0; i < 4; i ++ ) {

		col += texture( uBloomTexture[ UNROLLED_LOOP_INDEX ], uv ).xyz * ( 0.5 + float(UNROLLED_LOOP_INDEX) * 0.5 ) * 0.3;

	}
	#pragma unroll_loop_end

	float len = length(cuv);
	col *= smoothstep( 0.9, 0.3, len );

	outColor = vec4( col, 1.0 );

}