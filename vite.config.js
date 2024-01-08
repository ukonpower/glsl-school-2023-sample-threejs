import path from 'path';
import { defineConfig } from 'vite';
import glslify from 'rollup-plugin-glslify';

const pageList = [
	{ name: 'index', path: '/' },
];

const basePath = process.env.GITHUB_PAGES ? '/three-template-vite' : '';

const input = {
	...( () => {

		const exEntryList = {};

		pageList.forEach( ( page ) => {

			exEntryList[ page.name || page.path ] = path.resolve( __dirname, 'src/', page.path, '/index.html' );

		} );

		return exEntryList;

	} )(),
};

export default defineConfig( {
	root: 'src',
	publicDir: 'public',
	base: basePath,
	server: {
		port: 3000,
		host: "0.0.0.0",
	},
	build: {
		outDir: '../public/',
		rollupOptions: {
			input,
			output: {
				dir: './public',
			}
		}
	},
	resolve: {
		alias: {
			"ore-three": path.join( __dirname, "src/ts/libs/ore-three/packages/ore-three/src" ),
			"glpower": path.join( __dirname, "src/ts/libs/glpower/packages/glpower/src" )
		},
	},
	plugins: [
		{
			...glslify( {
				basedir: './src/ts/glsl-chunks/',
				transform: [
					[ 'glslify-hex' ],
					[ 'glslify-import' ]
				],
			} ),
			enforce: 'pre'
		}
	],
	define: {
		BASE_PATH: `"${basePath}"`
	}
} );
