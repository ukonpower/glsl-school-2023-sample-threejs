import { IVector3, IVector2, FCurveGroup, FCurve, FCurveKeyFrame, EventEmitter } from "glpower";
import { FCurveInterpolation } from "ore-three";

export type BLidgeNodeType = 'empty' | 'cube' | 'sphere' | 'cylinder' | 'mesh' | 'camera' | 'plane' | 'light';

// scene

export type BLidgeSceneParam = {
    animations: {[key: string]: BLidgeCurveParam[]};
	root: BLidgeNodeParam;
	frame: BLidgeFrame;
}

// node

export type BLidgeNodeParam = {
	name: string,
	type: BLidgeNodeType,
	param?: BLidgeCameraParam | BLidgeMeshParam | BLidgeLightParamCommon
	parent: string,
	children?: BLidgeNodeParam[],
	animation?: BLidgeAnimationAccessor,
	position: number[],
	rotation: number[],
	scale: number[],
	material?: {
		name?: string,
		uniforms?: BLidgeAnimationAccessor
	},
	visible: boolean,
}

export type BLidgeNode = {
	name: string,
	type: BLidgeNodeType,
	param?: BLidgeCameraParam | BLidgeMeshParam | BLidgeLightParamCommon
	parent: string,
	children: BLidgeNode[],
	animation: BLidgeAnimationAccessor,
	position: IVector3,
	rotation: IVector3,
	scale: IVector3,
	material: BLidgeMaterialParam
	visible: boolean,
}

// camera

export type BLidgeCameraParam = {
	fov: number
}

// mesh

export type BLidgeMeshParam = {
	position: number[],
	uv: number[],
	normal: number[],
	index: number[],
}

// light

type BLidgeLightParamCommon = {
	type: 'directional' | 'spot'
	color: IVector3,
	intensity: number,
	shadowMap: boolean,
}

export type BLidgeDirectionalLightParam = {
	type: 'directional'
} & BLidgeLightParamCommon

export type BLidgeSpotLightParam = {
	type: 'spot',
	angle: number,
	blend: number,
} & BLidgeLightParamCommon

export type BLidgeLightParam = BLidgeDirectionalLightParam | BLidgeSpotLightParam;

// material

export type BLidgeMaterialParam = {
	name: string,
	uniforms: BLidgeAnimationAccessor
}

// animation

export type BLidgeAnimationAccessor = { [key: string]: string }

export type BLidgeCurveAxis = 'x' | 'y' | 'z' | 'w'

export type BLidgeCurveParam = {
    k: BLidgeKeyFrameParam[];
	axis: BLidgeCurveAxis
}

export type BLidgeKeyFrameParam = {
    c: IVector2;
    h_l?: IVector2;
    h_r?: IVector2;
    e: string;
    i: "B" | "L" | "C";
}

// message

export type BLidgeMessage = BLidgeSyncSceneMessage | BLidgeSyncFrameMessage | BLidgeEventMessage

export type BLidgeSyncSceneMessage = {
	type: "sync/scene",
    data: BLidgeSceneParam;
}

export type BLidgeSyncFrameMessage = {
	type: "sync/timeline";
	data: BLidgeFrame;
}

export type BLidgeEventMessage = {
	type: "event";
	data: { type: string, data: any };
}

// frame

export type BLidgeFrame = {
	start: number;
	end: number;
	current: number;
	fps: number;
	playing: boolean;
}

export class BLidge extends EventEmitter {

	// ws

	private url?: string;
	private ws?: WebSocket;
	public connected: boolean = false;

	// frame

	public frame: BLidgeFrame = {
		start: - 1,
		end: - 1,
		current: - 1,
		fps: - 1,
		playing: false,
	};

	// animation

	public nodes: BLidgeNode[] = [];
	public curveGroups: FCurveGroup[] = [];
	public root: BLidgeNode | null;

	constructor( url?: string ) {

		super();

		this.root = null;

		if ( url ) {

			this.url = url;
			this.connect( this.url );

		}

	}

	/*-------------------------------
		Connect
	-------------------------------*/

	public connect( url: string ) {

		this.url = url;
		this.ws = new WebSocket( this.url );
		this.ws.onopen = this.onOpen.bind( this );
		this.ws.onmessage = this.onMessage.bind( this );
		this.ws.onclose = this.onClose.bind( this );

		this.ws.onerror = ( e ) => {

			console.error( e );

			this.emit( 'error' );

		};

	}

	/*-------------------------------
		Load
	-------------------------------*/

	public loadJsonScene( jsonPath: string ) {

		const req = new XMLHttpRequest();

		req.onreadystatechange = () => {

			if ( req.readyState == 4 ) {

				if ( req.status == 200 ) {

					this.loadScene( JSON.parse( req.response ) );

				}

			}

		};

		req.open( 'GET', jsonPath );
		req.send( );

	}

	public loadScene( data: BLidgeSceneParam ) {

		// frame

		this.frame.start = data.frame.start;
		this.frame.end = data.frame.end;
		this.frame.fps = data.frame.fps;

		this.curveGroups.length = 0;
		this.nodes.length = 0;

		// actions

		const fcurveGroupNames = Object.keys( data.animations );

		for ( let i = 0; i < fcurveGroupNames.length; i ++ ) {

			const fcurveGroupName = fcurveGroupNames[ i ];
			const fcurveGroup = new FCurveGroup( fcurveGroupName );

			data.animations[ fcurveGroupName ].forEach( fcurveData => {

				const curve = new FCurve();

				curve.set( fcurveData.k.map( frame => {

					const interpolation = {
						"B": "BEZIER",
						"C": "CONSTANT",
						"L": "LINEAR",
					}[ frame.i ];

					return new FCurveKeyFrame( frame.c, frame.h_l, frame.h_r, interpolation as FCurveInterpolation );

				} ) );

				fcurveGroup.setFCurve( curve, fcurveData.axis );

			} );

			this.curveGroups.push( fcurveGroup );

		}

		// node

		this.nodes.length = 0;

		const _ = ( nodeParam: BLidgeNodeParam ): BLidgeNode => {

			const mat = { name: '', uniforms: {} };

			if ( nodeParam.material ) {

				mat.name = nodeParam.material.name || '';
				mat.uniforms = nodeParam.material.uniforms || {};

			}

			const node: BLidgeNode = {
				name: nodeParam.name,
				parent: nodeParam.parent,
				children: [],
				animation: nodeParam.animation || {},
				position: {
					x: nodeParam.position[ 0 ] || 0,
					y: nodeParam.position[ 1 ] || 0,
					z: nodeParam.position[ 2 ] || 0
				},
				rotation: {
					x: nodeParam.rotation[ 0 ] || 0,
					y: nodeParam.rotation[ 1 ] || 0,
					z: nodeParam.rotation[ 2 ] || 0
				},
				scale: {
					x: nodeParam.scale[ 0 ] || 1,
					y: nodeParam.scale[ 1 ] || 1,
					z: nodeParam.scale[ 2 ] || 1
				},
				material: mat,
				type: nodeParam.type,
				visible: nodeParam.visible,
				param: nodeParam.param
			};

			if ( nodeParam.children ) {

				nodeParam.children.forEach( item => {

					node.children.push( _( item ) );

				} );

			}

			this.nodes.push( node );

			return node;

		};

		this.root = _( data.root );

		// dispatch event

		this.emit( 'sync/scene', [ this ] );

	}

	private onSyncTimeline( data: BLidgeFrame ) {

		this.frame = data;

		this.emit( 'sync/timeline', [ this.frame ] );

	}

	/*-------------------------------
		WS Events
	-------------------------------*/

	private onOpen( event: Event ) {

		this.connected = true;

	}

	private onMessage( e: MessageEvent ) {

		const msg = JSON.parse( e.data ) as BLidgeMessage;

		if ( msg.type == 'sync/scene' ) {

			this.loadScene( msg.data );

		} else if ( msg.type == "sync/timeline" ) {

			this.onSyncTimeline( msg.data );

		} else if ( msg.type == "event" ) {

			this.emit( msg.data.type, [ msg.data.data ] );

		}

	}

	private onClose( e:CloseEvent ) {

		this.disposeWS();

	}

	/*-------------------------------
		API
	-------------------------------*/

	public getCurveGroup( name: string ) {

		return this.curveGroups.find( curve => curve.name == name );

	}

	public setFrame( frame: number ) {

		this.onSyncTimeline( {
			...this.frame,
			playing: true,
			current: frame,
		} );

	}

	/*-------------------------------
		Dispose
	-------------------------------*/

	public dispose() {

		this.disposeWS();

	}

	public disposeWS() {

		if ( this.ws ) {

			this.ws.close();
			this.ws.onmessage = null;
			this.ws.onclose = null;
			this.ws.onopen = null;

			this.connected = false;

		}

	}

}
