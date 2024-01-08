import * as THREE from 'three';
import * as ORE from 'ore-three';

export class MipmapGeometry extends THREE.BufferGeometry {

	public count = 0;

	constructor( count = 7 ) {

		super();

		this.count = count;

		const posArray = [];
		const uvArray = [];
		const indexArray = [];

		const p = new THREE.Vector2( 0, 0 );
		let s = 1.0;

		// posArray.push( p.x, p.y, 0 );
		// posArray.push( p.x + s, p.y, 0 );
		// posArray.push( p.x + s, p.y - s, 0 );
		// posArray.push( p.x, p.y - s, 0 );

		// uvArray.push( 0.0, 1.0 );
		// uvArray.push( 1.0, 1.0 );
		// uvArray.push( 1.0, 0.0 );
		// uvArray.push( 0.0, 0.0 );

		// indexArray.push( 0, 2, 1, 0, 3, 2 );

		// p.set( s, 0 );

		for ( let i = 0; i < count; i ++ ) {

			posArray.push( p.x,		p.y,		0 );
			posArray.push( p.x + s, p.y,		0 );
			posArray.push( p.x + s, p.y - s,	0 );
			posArray.push( p.x,		p.y - s, 	0 );

			uvArray.push( 0.0, 1.0 );
			uvArray.push( 1.0, 1.0 );
			uvArray.push( 1.0, 0.0 );
			uvArray.push( 0.0, 0.0 );

			const indexOffset = ( i + 0.0 ) * 4;
			indexArray.push( indexOffset + 0, indexOffset + 2, indexOffset + 1, indexOffset + 0, indexOffset + 3, indexOffset + 2 );

			p.x += s;
			p.y = p.y - s;

			s *= 0.5;

		}

		const posAttr = new THREE.BufferAttribute( new Float32Array( posArray ), 3 );
		const uvAttr = new THREE.BufferAttribute( new Float32Array( uvArray ), 2 );
		const indexAttr = new THREE.BufferAttribute( new Uint16Array( indexArray ), 1 );

		const gs = 1;
		posAttr.applyMatrix4( new THREE.Matrix4().makeScale( ( 1.0 / 1.0 ), gs, gs ) );
		posAttr.applyMatrix4( new THREE.Matrix4().makeTranslation( - 1.0, 1.0, 0 ) );

		this.setAttribute( 'position', posAttr );
		this.setAttribute( 'uv', uvAttr );
		this.setIndex( indexAttr );

	}

}
