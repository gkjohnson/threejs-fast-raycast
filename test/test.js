/* global
    describe it beforeAll beforeEach expect
*/

import * as THREE from '../node_modules/three/build/three.module.js';
import '../index.js';

describe( 'Bounds Tree', () => {

	it( 'should be generated when calling BufferGeometry.computeBoundsTree', () => {

		const geom = new THREE.SphereBufferGeometry( 1, 1, 1 );
		expect( geom.boundsTree ).not.toBeDefined();

		geom.computeBoundsTree();
		expect( geom.boundsTree ).toBeDefined();

	} );

	it( 'should be generated when calling Geometry.computeBoundsTree', () => {

		const geom = new THREE.SphereGeometry( 1, 1, 1 );
		expect( geom.boundsTree ).not.toBeDefined();

		geom.computeBoundsTree();
		expect( geom.boundsTree ).toBeDefined();

	} );

	it( 'should use the boundsTree when raycasting if available', () => {

		const geom = new THREE.SphereBufferGeometry( 1, 1, 1 );
		const mesh = new THREE.Mesh( geom, new THREE.MeshBasicMaterial() );
		const raycaster = new THREE.Raycaster();

		raycaster.ray.origin.set( 0, 0, 10 );
		raycaster.ray.direction.set( 0, 0, - 1 );

		let calledRaycast = false;
		let calledRaycastFirst = false;
		geom.boundsTree = {

			raycast: () => calledRaycast = true,
			raycastFirst: () => calledRaycastFirst = true

		};

		mesh.raycast( raycaster, [] );
		expect( calledRaycast ).toBeTruthy();

		raycaster.firstHitOnly = true;
		mesh.raycast( raycaster, [] );
		expect( calledRaycastFirst ).toBeTruthy();

	} );

} );

describe( 'Raycaster', () => {

	let geometry = null;
	let mesh = null;
	let scene = null;
	let raycaster = null;
	beforeEach( () => {

		raycaster = new THREE.Raycaster();
		raycaster.ray.origin.set( 0, 0, - 100 );
		raycaster.ray.direction.set( 0, 0, 1 );

		scene = new THREE.Scene();
		geometry = new THREE.TorusBufferGeometry( 1, 1, 40, 10 );
		mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial() );

		scene.add( mesh );

		for ( let i = 0; i < 10; i ++ ) {

			scene.add( mesh.clone() );

		}

	} );

	describe( 'firstHitOnly = false', () => {

		beforeEach( () => {

			raycaster.firstHitOnly = false;

		} );

		it( 'should yield all hits on an a mesh without a bounds tree', () => {

			const arr = [];
			mesh.raycast( raycaster, arr );
			expect( arr.length ).toBe( 10 );

		} );

		it( 'should yield all hits on an a mesh with a bounds tree', () => {

			geometry.computeBoundsTree();

			const arr = [];
			mesh.raycast( raycaster, arr );
			expect( arr.length ).toBe( 10 );

		} );

		it( 'should yield all hits in a scene', () => {

			const res = raycaster.intersectObject( scene, true );
			expect( res.length ).toBe( 110 );

		} );

	} );

	describe( 'firstHitOnly = true', () => {

		// TODO: The BVH is not returning the same closest point, possibly because the ray
		// is intersecting at the seam between multiple triangles / between multiple nodes
		// and that case is not being handled properly
		it.skip( 'should yield closest hit only with a bounds tree', () => {

			const allHits = [];
			const bvhHits = [];

			raycaster.firstHitOnly = false;
			mesh.raycast( raycaster, allHits );

			raycaster.firstHitOnly = true;
			geometry.computeBoundsTree();
			mesh.raycast( raycaster, bvhHits );

			expect( allHits.length ).toEqual( 10 );
			expect( bvhHits.length ).toEqual( 1 );

			expect( bvhHits[ 0 ] ).toEqual( allHits[ 0 ] );

		} );

	} );

} );

describe( 'BoundsTree API', () => {

	it.skip( 'test bounds tree and node apis directly', () => {} );

} );

describe( 'Random intersections comparison', () => {

	let scene = null;
	let raycaster = null;
	let geometry = null;
	let boundsTree = null;
	beforeAll( () => {

		geometry = new THREE.TorusBufferGeometry( 1, 1, 40, 10 );
		geometry.computeBoundsTree();
		boundsTree = geometry.boundsTree;
		geometry.boundsTree = null;

		scene = new THREE.Scene();
		raycaster = new THREE.Raycaster();

		for ( var i = 0; i < 10; i ++ ) {

			let mesh = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial() );
			mesh.rotation.x = Math.random() * 10;
			mesh.rotation.y = Math.random() * 10;
			mesh.rotation.z = Math.random() * 10;

			mesh.position.x = Math.random() * 1;
			mesh.position.y = Math.random() * 1;
			mesh.position.z = Math.random() * 1;

			scene.add( mesh );
			mesh.updateMatrix( true );
			mesh.updateMatrixWorld( true );

		}

	} );


	for ( let i = 0; i < 100; i ++ ) {

		it( 'cast ' + i, () => {

			raycaster.ray.origin.set( Math.random() * 10, Math.random() * 10, Math.random() * 10 );
			raycaster.ray.direction.copy( raycaster.ray.origin ).multiplyScalar( - 1 ).normalize();

			geometry.boundsTree = null;
			const ogHits = raycaster.intersectObject( scene, true );

			geometry.boundsTree = boundsTree;
			const bvhHits = raycaster.intersectObject( scene, true );

			expect( ogHits ).toEqual( bvhHits );

		} );

		it.skip( 'firstHitOnly cast', () => {} );


	}

} );