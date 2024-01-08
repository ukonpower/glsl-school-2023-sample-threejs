import * as THREE from 'three';
import * as ORE from 'ore-three';
import EventEmitter from 'wolfy87-eventemitter';
import { ComponentsUpdateEvent } from '..';

export type ComponentOptions = {
	parentUniforms?: ORE.Uniforms,
}

export type ComponentUpdateEvent = ComponentsUpdateEvent & {
}

export type ComponentUpdateImplEvent = ComponentUpdateEvent & {
	target: THREE.Object3D;
}

export type ComponentResizeEvent = {
}

export type ComponentResizeEventImplEvent = ComponentResizeEvent & {
	target: THREE.Object3D;
}

export class Component extends EventEmitter {

	protected target: THREE.Object3D | null = null;
	protected commonUniforms: ORE.Uniforms;

	constructor( opt?: ComponentOptions ) {

		super();

		if ( opt && opt.parentUniforms ) {

			this.commonUniforms = ORE.UniformsLib.mergeUniforms( opt.parentUniforms );

		} else {

			this.commonUniforms = {};

		}

	}

	public setTarget( target: THREE.Object3D | null ) {

		if ( this.target ) {

			this.onRemoveTarget( this.target );

		}

		this.target = target;

		if ( this.target ) {

			this.onSetTarget( this.target );

		}

	}

	protected onSetTarget( target: THREE.Object3D ) {
	}

	protected onRemoveTarget( target: THREE.Object3D ) {
	}

	public update( event: ComponentUpdateEvent ) {

		if ( this.target ) {

			this.updateImpl( { ...event, target: this.target } );

		}

	}

	public resize( event: ComponentResizeEvent ) {

		if ( this.target ) {

			this.resizeImpl( { ...event, target: this.target } );

		}

	}

	protected updateImpl( event: ComponentUpdateImplEvent ) {}

	protected resizeImpl( event: ComponentResizeEventImplEvent ) {}

	public dispose() {

		this.emit( "dispose" );

	}

}
