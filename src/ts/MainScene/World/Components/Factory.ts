import * as THREE from 'three';
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';
import { BLidgeNode } from '../../BLidge';
import { Components } from '.';
import { MainBox } from './MainBox';
import { BLidger } from './BLidger';

export class ComponentFactory extends EventEmitter {

	private commonUniforms: ORE.Uniforms;

	constructor( parentUniforms: ORE.Uniforms ) {

		super();

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

	}

	public router( obj: THREE.Object3D, node: BLidgeNode ) {

		let components = obj.userData.components as Components;

		if ( ! components ) components = obj.userData.components = new Components( obj );

		// blidger

		let blidger = components.get( "blidger" );

		if ( blidger ) {

			blidger.dispose();

		}

		components.set( "blidger", new BLidger( node ) );

		// route

		if ( obj.name == 'MainBox' ) {

			! components.has( "MainBox" ) && components.set( "MainBox", new MainBox() );

		}

	}

}
