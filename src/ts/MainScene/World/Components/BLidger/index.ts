import * as GLP from 'glpower';
import { Component, ComponentUpdateImplEvent } from '../Component';
import { BLidge, BLidgeNode } from '../../../BLidge';
import { Object3D, Event } from 'three';

export class BLidger extends Component {

	private blidge: BLidge;
	private node: BLidgeNode;

	// transform

	private rotOffsetX: number;

	// curves

	protected curvePosition?: GLP.FCurveGroup;
	protected curveScale?: GLP.FCurveGroup;
	protected curveRotation?: GLP.FCurveGroup;
	protected curveHide?: GLP.FCurveGroup;

	constructor( node: BLidgeNode ) {

		super();

		this.blidge = window.glCanvas.gManager.blidge;
		this.node = node;

		// rot offset

		if ( this.node.type == "light" ) {

			this.rotOffsetX = - Math.PI / 2;

		} else if ( this.node.type == "camera" ) {

			this.rotOffsetX = - Math.PI / 2;

		} else {

			this.rotOffsetX = 0;

		}

	}

	protected onSetTarget( target: Object3D<Event> ): void {

		target.position.set( this.node.position.x, this.node.position.y, this.node.position.z );
		target.scale.set( this.node.scale.x, this.node.scale.y, this.node.scale.z );
		target.rotation.set( this.node.rotation.x + this.rotOffsetX, this.node.rotation.y, this.node.rotation.z, "YZX" );

		target.castShadow = true;
		target.receiveShadow = true;

		// curves

		this.curvePosition = this.blidge.getCurveGroup( this.node.animation.position );
		this.curveRotation = this.blidge.getCurveGroup( this.node.animation.rotation );
		this.curveScale = this.blidge.getCurveGroup( this.node.animation.scale );
		this.curveHide = this.blidge.getCurveGroup( this.node.animation.hide );

		// type

		if ( this.node.type == 'camera' ) {

			let camera = target as THREE.PerspectiveCamera;
			let param = this.node.param as GLP.BLidgeCameraParam;

			if ( camera.isCamera ) {

				camera.fov = param.fov;

				camera.updateProjectionMatrix();

			}

		} else if ( this.node.type == 'light' ) {

			let light = target as THREE.Light;
			let param = this.node.param as GLP.BLidgeLightParam;

			if ( light.isLight ) {

				if ( param.type == "spot" ) {

					let spot = light as THREE.SpotLight;


					if ( spot.isSpotLight ) {

						light.intensity = param.intensity / 2;

					}

				}

				light.castShadow = param.shadowMap;
				light.shadow.bias = - 0.001;

			}

		}

	}

	public updateImpl( event: ComponentUpdateImplEvent ) {

		let target = event.target;
		let frame = this.blidge.frame.current;

		this.curvePosition && target.position.copy( this.curvePosition.setFrame( frame ).value as unknown as THREE.Vector3 );

		if ( this.curveRotation ) {

			let rot = this.curveRotation.setFrame( frame ).value;
			target.rotation.set( rot.x + this.rotOffsetX, rot.y, rot.z );

		}

		this.curveScale && target.scale.copy( this.curveScale.setFrame( frame ).value as unknown as THREE.Vector3 );

		this.emit( "update", [ event ] );

	}

	public dispose() {

	}

}
