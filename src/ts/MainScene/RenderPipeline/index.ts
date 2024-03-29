import * as THREE from 'three';
import * as ORE from 'ore-three';

import { PostProcessPass } from './PostProcessPass';
import { PostProcess } from './PostProcess';

import fxaaFrag from './shaders/fxaa.fs';
import bloomBlurFrag from './shaders/bloomBlur.fs';
import bloomBrightFrag from './shaders/bloomBright.fs';
import dofCoc from './shaders/dofCoc.fs';
import dofComposite from './shaders/dofComposite.fs';
import dofBokeh from './shaders/dofBokeh.fs';
import compositeFrag from './shaders/composite.fs';

export class RenderPipeline {

	// renderer

	private renderer: THREE.WebGLRenderer;

	// uniforms

	private commonUniforms: ORE.Uniforms;

	// renderTargets

	private sceneRenderTarget: THREE.WebGLRenderTarget;
	private depthTexture: THREE.DepthTexture;

	// postprocess

	private postProcess: PostProcess;

	// postprocess pass

	private fxaa: ORE.PostProcessPass;

	private bloomRenderCount: number;
	private bloomBright: PostProcessPass;
	private bloomBlur: PostProcessPass[];

	private dofParams: THREE.Vector4;
	public dofCoc: PostProcessPass;
	public dofBokeh: PostProcessPass;
	public dofComposite: PostProcessPass;

	private composite: PostProcessPass;

	constructor( renderer: THREE.WebGLRenderer, parentUniforms: ORE.Uniforms ) {

		this.renderer = renderer;

		// rt

		this.depthTexture = new THREE.DepthTexture( 1, 1 );
		this.sceneRenderTarget = new THREE.WebGLRenderTarget( 1, 1, { depthTexture: this.depthTexture } );

		// uniforms

		this.commonUniforms = ORE.UniformsLib.mergeUniforms( parentUniforms, {
		} );

		// dof

		this.dofParams = new THREE.Vector4();

		this.dofCoc = new PostProcessPass( {
			fragmentShader: dofCoc,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uParams: {
					value: this.dofParams,
				},
				uDepthTex: {
					value: this.depthTexture
				}
			} ),
			renderTarget: new THREE.WebGLRenderTarget( 1, 1, { type: THREE.HalfFloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter } ),
			passThrough: true,
			resolutionRatio: 0.5
		} );

		this.dofBokeh = new PostProcessPass( {
			fragmentShader: dofBokeh,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uParams: {
					value: this.dofParams,
				},
				uCocTex: {
					value: this.dofCoc.renderTarget!.texture
				},
			} ),
			renderTarget: new THREE.WebGLRenderTarget( 1, 1, { type: THREE.HalfFloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter } ),
			passThrough: true,
			resolutionRatio: 0.5
		} );

		this.dofComposite = new PostProcessPass( {
			fragmentShader: dofComposite,
			uniforms: ORE.UniformsLib.mergeUniforms( {
				uBokehTex: {
					value: this.dofBokeh.renderTarget!.texture
				},
			} ),
			renderTarget: new THREE.WebGLRenderTarget( 1, 1, { type: THREE.HalfFloatType, magFilter: THREE.LinearFilter, minFilter: THREE.LinearFilter } ),
		} );

		// fxaa

		this.fxaa = new PostProcessPass( {
			fragmentShader: fxaaFrag,
			uniforms: this.commonUniforms,
		} );

		// bloom

		this.bloomRenderCount = 4;

		this.bloomBright = new PostProcessPass( {
			fragmentShader: bloomBrightFrag,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				threshold: {
					value: 0.5,
				},
			} ),
			passThrough: true,
		} );

		this.bloomBlur = [];

		// bloom blur

		let bloomInput: THREE.Texture = this.bloomBright.renderTarget!.texture;
		let blurRenderTargetList: THREE.Texture[] = [];

		let bloomCommonUniforms = ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
			uWeights: {
				value: this.guassWeight( this.bloomRenderCount )
			},
		} );

		let scale = 2.0;

		for ( let i = 0; i < this.bloomRenderCount; i ++ ) {

			let blurVertical = new PostProcessPass( {
				fragmentShader: bloomBlurFrag,
				uniforms: ORE.UniformsLib.mergeUniforms( bloomCommonUniforms, {
					uIsVertical: {
						value: true
					},
					uBloomBackBuffer: {
						value: bloomInput
					},
				} ),
				defines: {
					GAUSS_WEIGHTS: this.bloomRenderCount.toString()
				},
				resolutionRatio: 1.0 / scale,
				passThrough: true,
			} );

			let blurHorizontal = new PostProcessPass( {
				fragmentShader: bloomBlurFrag,
				uniforms: ORE.UniformsLib.mergeUniforms( bloomCommonUniforms, {
					uIsVertical: {
						value: false
					},
					uBloomBackBuffer: {
						value: blurVertical.renderTarget!.texture
					},
				} ),
				defines: {
					GAUSS_WEIGHTS: this.bloomRenderCount.toString()
				},
				resolutionRatio: 1.0 / scale,
				passThrough: true,
			} );

			this.bloomBlur.push( blurVertical, blurHorizontal );

			blurRenderTargetList.push( blurHorizontal.renderTarget!.texture );

			bloomInput = blurHorizontal.renderTarget!.texture;

			scale *= 2.0;

		}

		// composite

		this.composite = new PostProcessPass( {
			fragmentShader: compositeFrag,
			uniforms: ORE.UniformsLib.mergeUniforms( this.commonUniforms, {
				uBloomTexture: {
					value: blurRenderTargetList,
				},
			} ),
			defines: {
				BLOOM_COUNT: this.bloomRenderCount.toString()
			},
		} );

		// out

		let out = new PostProcessPass( {
			renderTarget: null
		} );

		this.postProcess = new PostProcess( {
			renderer: this.renderer,
			passes: [
				this.dofCoc,
				this.dofBokeh,
				this.dofComposite,
				this.fxaa,
				this.bloomBright,
				...this.bloomBlur,
				this.composite,
				out
			]
		} );

	}

	private guassWeight( num: number ) {

		const weight = new Array( num );

		// https://wgld.org/d/webgl/w057.html

		let t = 0.0;
		const d = 100;

		for ( let i = 0; i < weight.length; i ++ ) {

			const r = 1.0 + 2.0 * i;
			let w = Math.exp( - 0.5 * ( r * r ) / d );
			weight[ i ] = w;

			if ( i > 0 ) {

				w *= 2.0;

			}

			t += w;

		}

		for ( let i = 0; i < weight.length; i ++ ) {

			weight[ i ] /= t;

		}

		return weight;

	}

	public render( scene: THREE.Scene, camera: THREE.Camera ) {

		// dof

		let fov = ( camera as THREE.PerspectiveCamera ).isPerspectiveCamera ? ( camera as THREE.PerspectiveCamera ).fov : 50.0;

		const focusDistance = camera.getWorldPosition( new THREE.Vector3() ).length();
		const kFilmHeight = 0.006;
		const flocalLength = kFilmHeight / Math.tan( 0.5 * ( fov * THREE.MathUtils.DEG2RAD ) );
		const maxCoc = 1 / this.dofBokeh.renderTarget!.height * 6.0;
		const rcpMaxCoC = 1.0 / maxCoc;
		const coeff = flocalLength * flocalLength / ( 0.3 * ( focusDistance - flocalLength ) * kFilmHeight * 2 );

		this.dofParams.set( focusDistance, maxCoc, rcpMaxCoC, coeff );

		// render

		let rt = this.renderer.getRenderTarget();

		this.renderer.setRenderTarget( this.sceneRenderTarget );

		this.renderer.render( scene, camera );

		this.postProcess.render( this.sceneRenderTarget.texture, { camera } );

		this.renderer.setRenderTarget( rt );

	}

	public resize( info: ORE.LayerInfo ) {

		let resolution = info.size.canvasPixelSize;

		this.postProcess.resize( resolution );

		this.sceneRenderTarget.setSize( resolution.x, resolution.y );

	}


}
