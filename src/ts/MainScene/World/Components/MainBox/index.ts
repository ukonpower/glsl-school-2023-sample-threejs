import * as THREE from 'three';
import * as ORE from 'ore-three';
import { Component, ComponentOptions, ComponentUpdateEvent } from '../Component';

export class MainBox extends Component {

	constructor( opt?: ComponentOptions ) {

		super( opt );

	}

	protected onSetTarget( target: THREE.Object3D<THREE.Event> ): void {

		let mesh = target as THREE.Mesh;
		mesh.material = new THREE.MeshNormalMaterial();

	}

	protected updateImpl( event: ComponentUpdateEvent ): void {

		if ( this.target ) {

			this.target.rotation.y += 0.01;

		}

	}

}
