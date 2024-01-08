import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GlobalManager } from './GlobalManager';
import { RenderPipeline } from './RenderPipeline';
import { World } from './World';
import * as ORE from 'ore-three';
export class MainScene extends ORE.BaseLayer {

	private gManager: GlobalManager;
	private renderPipeline: RenderPipeline;

	private gltf?: GLTF;
	private world?: World;

	constructor( param: ORE.LayerParam ) {

		super( param );

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {} );

		/*-------------------------------
			Gmanager
		-------------------------------*/

		let gltfPath = BASE_PATH + '/assets/scene/scene.glb';

		this.gManager = new GlobalManager();

		this.gManager.assetManager.load( {
			assets: [
				{ name: 'scene', path: gltfPath, type: 'gltf' }
			]
		} );

		this.gManager.assetManager.addEventListener( 'loadMustAssets', ( e ) => {

			this.gltf = this.gManager.assetManager.getGltf( "scene" );

			this.initScene();
			this.onResize();

		} );

		this.gManager.blidge.on( "export_gltf", () => {

			new GLTFLoader().load( gltfPath, ( gltf ) => {

				this.gltf = gltf;

				if ( this.world ) {

					this.world.setGltf( this.gltf );

				}

			} );

		} );

		/*-------------------------------
			RenderPipeline
		-------------------------------*/

		this.renderer.shadowMap.enabled = true;

		this.renderPipeline = new RenderPipeline( this.renderer, this.commonUniforms );

	}

	onUnbind() {

		super.onUnbind();

		if ( this.world ) {

			this.world.dispose();

		}

	}

	private initScene() {

		/*-------------------------------
			World
		-------------------------------*/

		this.world = new World( this.camera, this.commonUniforms );

		if ( this.gltf ) {

			this.world.setGltf( this.gltf );

		}

		this.scene.add( this.world );

	}

	public animate( deltaTime: number ) {

		if ( this.gManager ) {

			this.gManager.update( deltaTime );

		}

		if ( this.world ) {

			this.world.update( deltaTime );

		}

		this.renderPipeline.render( this.scene, this.camera );

	}

	public onResize() {

		super.onResize();

		if ( this.world ) {

			this.world.resize( this.info );

		}

		this.renderPipeline.resize( this.info );

	}

	public onHover( args: ORE.TouchEventArgs ) {
	}

	public onTouchStart( args: ORE.TouchEventArgs ) {
	}

	public onTouchMove( args: ORE.TouchEventArgs ) {
	}

	public onTouchEnd( args: ORE.TouchEventArgs ) {
	}

	public onWheelOptimized( event: WheelEvent ) {
	}

}
