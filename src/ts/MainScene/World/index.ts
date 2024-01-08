import * as THREE from 'three';
import * as ORE from 'ore-three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Carpenter } from './Carpenter';
import { BLidger } from '../BLidge/BLidger';
import { BLidge } from '../BLidge';
import { Components } from './Components';

export class World extends THREE.Object3D {

	private blidge: BLidge;

	private gltf?: GLTF;

	private carpenter: Carpenter;

	private camera: THREE.Camera;
	private commonUniforms: ORE.Uniforms;

	constructor( camera: THREE.Camera, parentUniforms: ORE.Uniforms ) {

		super();

		this.blidge = window.glCanvas.gManager.blidge;

		this.camera = camera;

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		this.carpenter = new Carpenter( this, this.camera, this.commonUniforms );

		/*-------------------------------
			Light
		-------------------------------*/

		let light = new THREE.SpotLight();
		light.lookAt( 0, 0, 0 );
		light.shadow.bias = - 0.001;
		light.castShadow = true;
		light.position.set( 1, 10, 1 );
		light.angle = Math.PI / 3;
		light.penumbra = 1;
		this.add( light );

	}

	public setGltf( gltf: GLTF ) {

		this.gltf = gltf;

		this.carpenter.setGltf( this.gltf );

	}

	public update( deltaTime: number ) {

		let blidgeRoot = this.carpenter.blidgeRoot;

		if ( blidgeRoot && blidgeRoot.userData.components ) {

			let components = blidgeRoot.userData.components as Components;

			components.update( {} );

		}

	}

	public resize( info: ORE.LayerInfo ) {
	}

	public dispose() {
	}

}
