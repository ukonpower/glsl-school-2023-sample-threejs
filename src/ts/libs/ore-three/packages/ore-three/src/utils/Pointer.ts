import * as THREE from "three";
import { Lethargy } from 'lethargy';

export class Pointer extends THREE.EventDispatcher {

	protected isSP: boolean;
	protected isTouching: boolean;

	public element: HTMLElement | null = null;

	// cursor

	public position: THREE.Vector2;
	public delta: THREE.Vector2;

	// wheel

	protected lethargy: any;
	protected memDelta: number = 0.0;
	protected riseDelta: boolean = false;
	protected trackpadMemDelta = 0;
	protected trackpadMax = false;

	constructor() {

		super();

		this.position = new THREE.Vector2( NaN, NaN );
		this.delta = new THREE.Vector2( NaN, NaN );

		const userAgent = navigator.userAgent;
		this.isSP = userAgent.indexOf( 'iPhone' ) >= 0 || userAgent.indexOf( 'iPad' ) >= 0 || userAgent.indexOf( 'Android' ) >= 0 || navigator.platform == "iPad" || ( navigator.platform == "MacIntel" && navigator.userAgent.indexOf( "Safari" ) != - 1 && navigator.userAgent.indexOf( "Chrome" ) == - 1 && ( navigator as any ).standalone !== undefined );

		this.position.set( NaN, NaN );
		this.isTouching = false;

		/*-------------------------------
			WindowEvent
		-------------------------------*/

		const onTouchMove = this.onTouch.bind( this, "move" );
		const onPointerMove = this.onPointer.bind( this, "move" );
		const onToucEnd = this.onTouch.bind( this, "end" );
		const onPointerUp = this.onPointer.bind( this, "end" );

		window.addEventListener( 'touchmove', onTouchMove, { passive: false } );
		window.addEventListener( 'pointermove', onPointerMove );
		window.addEventListener( 'touchend', onToucEnd, { passive: false } );
		window.addEventListener( 'pointerup', onPointerUp );
		window.addEventListener( "dragend", onPointerUp );

		const onDispose = () => {

			if ( this.element ) this.unregisterElement( this.element );

			window.removeEventListener( 'touchmove', onTouchMove );
			window.removeEventListener( 'pointermove', onPointerMove );
			window.removeEventListener( 'touchend', onToucEnd );
			window.removeEventListener( 'pointerup', onPointerUp );
			window.removeEventListener( "dragend", onPointerUp );

			this.removeEventListener( 'dispose', onDispose );

		};

		this.addEventListener( 'dispose', onDispose );

		/*-------------------------------
			Lethargy
		-------------------------------*/

		this.lethargy = new Lethargy();

	}

	public registerElement( elm: HTMLElement ) {

		if ( this.element ) this.unregisterElement( this.element );

		this.element = elm;

		const onTouchStart = this.onTouch.bind( this, "start" );
		const onPointerDown = this.onPointer.bind( this, "start" );
		const onWheel = this.wheel.bind( this );

		elm.addEventListener( 'touchstart', onTouchStart, { passive: false } );
		elm.addEventListener( 'pointerdown', onPointerDown );
		elm.addEventListener( "wheel", onWheel, { passive: false } );

		const onUnRegister = ( e: any ) => {

			if ( elm.isEqualNode( e.elm ) ) {

				elm.removeEventListener( 'touchstart', onTouchStart );
				elm.removeEventListener( 'pointerdown', onPointerDown );
				elm.removeEventListener( "wheel", onWheel );

				this.removeEventListener( 'unregister', onUnRegister );

			}

		};

		this.addEventListener( 'unregister', onUnRegister );

	}

	public unregisterElement( elm: HTMLElement ) {

		this.dispatchEvent( {
			type: 'unregister',
			elm: elm,
		} );

	}

	public getScreenPosition( windowSize: THREE.Vector2 ) {

		if ( this.position.x != this.position.x ) return new THREE.Vector2( NaN, NaN );

		const p = this.position.clone()
			.divide( windowSize )
			.multiplyScalar( 2.0 )
			.subScalar( 1.0 );
		p.y *= - 1;

		return p;

	}

	public getRelativePosition( elm: HTMLElement, screen?: boolean ) {

		const rect: DOMRect = elm.getClientRects()[ 0 ] as DOMRect;

		let x = this.position.x - rect.left;
		let y = this.position.y - rect.top;

		if ( screen ) {

			x /= rect.width;
			y /= rect.height;

		}

		const p = new THREE.Vector2( x, y );

		return p;

	}

	protected setPos( x: number, y: number ) {

		if (
			! ( this.position.x !== this.position.x || this.position.y !== this.position.y )
		) {

			this.delta.set( x - this.position.x, y - this.position.y );

		}

		this.position.set( x, y );

	}

	protected onTouch( type: string, e: TouchEvent ) {

		const touch = e.touches[ 0 ];

		if ( touch ) {

			this.touchEventHandler( touch.pageX, touch.pageY, type, e );

		} else {

			if ( type == 'end' ) {

				this.touchEventHandler( NaN, NaN, type, e );

			}

		}

	}

	protected onPointer( type: string, e: PointerEvent | DragEvent ) {

		const pointerType = ( e as PointerEvent ).pointerType;

		if ( pointerType != null ) {

			if ( pointerType == 'mouse' && ( e.button == - 1 || e.button == 0 ) ) {

				this.touchEventHandler( e.pageX, e.pageY, type, e as PointerEvent );

			}

		} else {

			this.touchEventHandler( e.pageX, e.pageY, type, e );

		}

	}

	protected touchEventHandler( posX: number, posY: number, type: string, e: TouchEvent | PointerEvent | DragEvent ) {

		let dispatch = false;

		const x = posX - window.pageXOffset;
		const y = posY - window.pageYOffset;

		if ( type == "start" ) {

			this.isTouching = true;

			this.setPos( x, y );

			this.delta.set( 0, 0 );

			dispatch = true;

		} else if ( type == "move" ) {

			this.setPos( x, y );

			if ( this.isTouching ) {

				dispatch = true;

			}

		} else if ( type == "end" ) {

			if ( 'targetTouches' in e ) {

				if ( e.targetTouches.length == 0 ) {

					this.isTouching = false;

				}

			} else {

				this.isTouching = false;

			}

			dispatch = true;

		}

		if ( dispatch ) {

			this.dispatchEvent( {
				type: 'update',
				pointerEvent: e,
				pointerEventType: type,
				position: this.position.clone(),
				delta: this.delta.clone()
			} );

		}

	}

	public update() {

		if ( ! this.isSP ) {

			this.dispatchEvent( {
				type: 'update',
				pointerEvent: null,
				pointerEventType: 'hover',
				position: this.position.clone(),
				delta: this.delta.clone()
			} );

			this.delta.set( 0, 0, );

		}

	}

	protected wheelOptimized( event: WheelEvent ) {

		this.dispatchEvent( {
			type: 'wheelOptimized',
			wheelEvent: event,
		} );

	}

	public wheel( event: WheelEvent ): void {

		this.dispatchEvent( {
			type: 'wheel',
			wheelEvent: event,
		} );

		if ( this.lethargy.check( event ) !== false ) {

			this.wheelOptimized( event );

		} else {

			const d = event.deltaY - this.memDelta;

			if ( Math.abs( d ) > 50 ) {

				this.memDelta = d;
				this.wheelOptimized( event );
				this.riseDelta = true;

			} else if ( d == 0 ) {

				if ( this.riseDelta ) {

					this.wheelOptimized( event );

				}

			} else if ( d < 0 ) {

				this.riseDelta = false;

			}

			this.memDelta = ( event.deltaY );

		}

	}

	public dispose() {

		this.dispatchEvent( {
			type: "dispose"
		} );

	}

}
