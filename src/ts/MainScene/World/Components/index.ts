import { Component } from "./Component";

export type ComponentsUpdateEvent = {}

export class Components extends Map<string, Component> {

	protected target: THREE.Object3D;

	constructor( target: THREE.Object3D ) {

		super();

		this.target = target;

	}

	public update( event: ComponentsUpdateEvent ) {

		let childs = this.target.children;

		this.forEach( c => {

			c.update( { target: this.target } );

		} );

		for ( let i = 0; i < childs.length; i ++ ) {

			let c = childs[ i ];

			let cComponent = c.userData.components as Components;

			if ( cComponent ) {

				cComponent.update( event );

			}

		}

	}

	public set( key: string, component: Component ) {

		this.delete( key );

		super.set( key, component );

		component.setTarget( this.target );

		return this;

	}

	public delete( key: string ) {

		let component = this.get( key );

		if ( ! component ) return false;

		let res = super.delete( key );

		component.setTarget( null );

		return res;

	}

	public clear() {

		this.forEach( ( component ) => {

			component.setTarget( null );

		} );

		return super.clear();

	}

	public disposeAll() {

		this.forEach( component => {

			component.dispose();

		} );

	}

}
