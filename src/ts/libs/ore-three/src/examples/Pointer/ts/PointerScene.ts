import * as THREE from 'three';
import * as ORE from '@ore-three';

export class PointerScene extends ORE.BaseLayer {

	private box: THREE.Mesh;
	private weight: number = 5;

	constructor( param: ORE.LayerParam ) {

		super( param );

		this.camera.position.set( 0, 0, 10 );

		const geo = new THREE.BoxGeometry();
		const mat = new THREE.MeshNormalMaterial();

		this.box = new THREE.Mesh( geo, mat );
		this.scene.add( this.box );

	}

	public animate( deltaTime: number ) {

		if ( this.renderer == null ) return;

		this.renderer.render( this.scene, this.camera );

	}

	public onTouchStart( args: ORE.TouchEventArgs ) {

		if ( this.box ) {

			this.box.scale.setScalar( 1.5 );

		}

	}

	public onTouchMove( args: ORE.TouchEventArgs ) {

		const cursorPos = args.screenPosition;

		if ( this.box ) {

			this.box.position.set( cursorPos.x * this.weight, cursorPos.y * this.weight, 0 );

		}

		args.event.preventDefault();

	}

	public onTouchEnd( args: ORE.TouchEventArgs ) {

		if ( this.box ) {

			this.box.scale.setScalar( 1.0 );

		}

	}

	public onHover( args: ORE.TouchEventArgs ) {

		const cursorPos = args.screenPosition;

		if ( cursorPos.x != cursorPos.x ) return;

		if ( this.box ) {

			this.box.position.set( cursorPos.x * this.weight, cursorPos.y * this.weight, 0 );

		}

	}

}
