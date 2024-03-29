import * as THREE from 'three';

import { Uniforms } from '../utils/Uniforms';
import { PointerEventArgs } from './Controller';

export declare interface LayerParam extends THREE.WebGLRendererParameters {
	name: string;
	canvas?: HTMLCanvasElement;
	aspectSetting?: AspectSetting;
	wrapperElement?: HTMLElement | null;
	wrapperElementRect?: DOMRect | null;
	pixelRatio?: number
}

export declare interface LayerInfo extends LayerParam {
	size: LayerSize;
	aspectSetting: AspectSetting;
	canvas: HTMLCanvasElement;
}

export declare interface LayerSize {
	canvasAspectRatio: number;
	windowSize: THREE.Vector2;
	windowAspectRatio: number;
	canvasSize: THREE.Vector2;
	canvasPixelSize: THREE.Vector2;
	pixelRatio: number
	portraitWeight: number;
	wideWeight: number;
}

export declare interface AspectSetting {
	mainAspect: number;
	portraitAspect: number;
	wideAspect: number;
}

export declare interface TouchEventArgs {
	event: PointerEvent | TouchEvent;
	position: THREE.Vector2;
	delta: THREE.Vector2;
	screenPosition: THREE.Vector2;
	windowPosition: THREE.Vector2;
}

export class BaseLayer extends THREE.EventDispatcher {

	public info: LayerInfo;

	public renderer: THREE.WebGLRenderer;
	public scene: THREE.Scene;
	public camera: THREE.PerspectiveCamera;

	public time = 0;
	public commonUniforms: Uniforms;
	protected readyAnimate = false;

	constructor( param: LayerParam ) {

		super();

		this.renderer = new THREE.WebGLRenderer( param );
		this.renderer.setPixelRatio( param.pixelRatio || window.devicePixelRatio );
		this.renderer.debug.checkShaderErrors = true;

		this.info = {
			canvas: this.renderer.domElement,
			aspectSetting: {
				mainAspect: 16 / 9,
				wideAspect: 10 / 1,
				portraitAspect: 1 / 2,
			},
			size: {
				windowSize: new THREE.Vector2(),
				windowAspectRatio: 1.0,
				canvasSize: new THREE.Vector2(),
				canvasPixelSize: new THREE.Vector2(),
				canvasAspectRatio: 1.0,
				pixelRatio: this.renderer.getPixelRatio(),
				portraitWeight: 0.0,
				wideWeight: 0.0
			},
			...param
		};

		if ( param.wrapperElement ) {

			this.setWrapperElement( param.wrapperElement || null, false );

		}

		this.commonUniforms = {
			time: {
				value: 0
			}
		};

		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 1000 );

	}

	public tick( deltaTime: number ) {

		this.time += deltaTime;

		this.commonUniforms.time.value = this.time;

		if ( this.readyAnimate ) {

			this.animate( deltaTime );

		}

	}

	public animate( deltaTime: number ) { }

	public onBind() {

		setTimeout( () => {

			this.onResize();
			this.readyAnimate = true;

		}, 0 );

	}

	public onUnbind() {

		this.dispatchEvent( {
			type: 'dispose'
		} );

		this.removeChildrens( this.scene );

		this.readyAnimate = false;

	}

	protected removeChildrens( object: THREE.Object3D ) {

		const length = object.children.length;

		for ( let i = length - 1; i >= 0; i -- ) {

			this.removeChildrens( object.children[ i ] );

			let geo: THREE.BufferGeometry | undefined = undefined;
			let mat: THREE.Material | undefined = undefined;

			if ( ( object.children[ i ] as THREE.Mesh ).isMesh ) {

				geo = ( object.children[ i ] as THREE.Mesh ).geometry;
				mat = ( ( object.children[ i ] as THREE.Mesh ).material as THREE.Material );

			}

			object.remove( ( object.children[ i ] ) );

			if ( geo ) {

				geo.dispose();

			}

			if ( mat ) {

				mat.dispose();

			}

		}

	}

	public setWrapperElement( wrapperElm: HTMLElement | null, dispatchResize: boolean = true ) {

		this.info.wrapperElement = wrapperElm;
		this.info.wrapperElementRect = wrapperElm ? wrapperElm.getBoundingClientRect() : null;

		if ( dispatchResize ) {

			this.onResize();

		}

	}

	public onResize() {

		if ( this.renderer == null ) return;

		const newWindowSize = new THREE.Vector2( document.body.clientWidth, window.innerHeight );
		const newCanvasSize = new THREE.Vector2();

		if ( this.info.wrapperElement ) {

			newCanvasSize.set( this.info.wrapperElement.clientWidth, this.info.wrapperElement.clientHeight );

		} else {

			newCanvasSize.copy( newWindowSize );

		}

		let portraitWeight = 1.0 - ( ( newCanvasSize.x / newCanvasSize.y ) - this.info.aspectSetting.portraitAspect ) / ( this.info.aspectSetting.mainAspect - this.info.aspectSetting.portraitAspect );
		portraitWeight = Math.min( 1.0, Math.max( 0.0, portraitWeight ) );

		let wideWeight = 1.0 - ( ( newCanvasSize.x / newCanvasSize.y ) - this.info.aspectSetting.wideAspect ) / ( this.info.aspectSetting.mainAspect - this.info.aspectSetting.wideAspect );
		wideWeight = Math.min( 1.0, Math.max( 0.0, wideWeight ) );

		this.info.size.windowSize.copy( newWindowSize );
		this.info.size.windowAspectRatio = newWindowSize.x / newWindowSize.y;
		this.info.size.canvasSize.copy( newCanvasSize );
		this.info.size.canvasPixelSize.copy( newCanvasSize.clone().multiplyScalar( this.renderer.getPixelRatio() ) );
		this.info.size.canvasAspectRatio = newCanvasSize.x / newCanvasSize.y;
		this.info.size.portraitWeight = portraitWeight;
		this.info.size.wideWeight = wideWeight;

		this.renderer.setPixelRatio( this.info.size.pixelRatio );
		this.renderer.setSize( this.info.size.canvasSize.x, this.info.size.canvasSize.y );
		this.camera.aspect = this.info.size.canvasAspectRatio;
		this.camera.updateProjectionMatrix();

		if ( this.info.wrapperElement ) {

			this.info.wrapperElementRect = this.info.wrapperElement.getBoundingClientRect();

		}

	}

	public pointerEvent( e: PointerEventArgs ) {

		const canvasPointerPos = new THREE.Vector2();
		canvasPointerPos.copy( e.position );

		const canvasRect = this.info.canvas.getBoundingClientRect();
		canvasPointerPos.sub( new THREE.Vector2( canvasRect.x, canvasRect.y ) );

		const screenPosition = canvasPointerPos.clone();
		screenPosition.divide( this.info.size.canvasSize );
		screenPosition.y = 1.0 - screenPosition.y;
		screenPosition.multiplyScalar( 2.0 ).subScalar( 1.0 );

		const args: TouchEventArgs = {
			event: e.pointerEvent,
			position: canvasPointerPos.clone(),
			delta: e.delta.clone(),
			screenPosition: screenPosition.clone(),
			windowPosition: e.position.clone()
		};

		if ( e.pointerEventType == 'hover' ) {

			this.onHover( args );

		} else if ( e.pointerEventType == 'start' ) {

			this.onTouchStart( args );

		} else if ( e.pointerEventType == 'move' ) {

			this.onTouchMove( args );

		} else if ( e.pointerEventType == 'end' ) {

			this.onTouchEnd( args );

		}

	}

	public onTouchStart( args: TouchEventArgs ) { }

	public onTouchMove( args: TouchEventArgs ) { }

	public onTouchEnd( args: TouchEventArgs ) { }

	public onHover( args: TouchEventArgs ) { }

	public onWheel( event: WheelEvent ) { }

	public onWheelOptimized( event: WheelEvent ) { }

}
