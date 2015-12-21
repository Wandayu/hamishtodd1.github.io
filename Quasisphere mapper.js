/*
 * one way to fill in the shapes would be to just have an array like "first shapes filled in is red, second is white, third is blue, fourth..."
 */

function Map_To_Quasisphere() {
	var lowest_unused_vertex = 0;
	
	var axis = new THREE.Vector3(0,0,-1);
	var left_triangle_cutout_vector = new THREE.Vector3(cutout_vector1.x, cutout_vector1.y, 0);
	left_triangle_cutout_vector.applyAxisAngle(z_central_axis, -TAU/5);
	
	var right_triangle_cutout_vector = new THREE.Vector3(cutout_vector0.x, cutout_vector0.y, 0);
	right_triangle_cutout_vector.applyAxisAngle(z_central_axis, TAU/5);
	
	//TODO round off errors may mean things on the triangle edge are not in the triangle
	//TODO seriously, at least the top right might be that
	for( var i = 0; i < quasilattice_default_vertices.length; i++ ) {
		if( !point_in_inflated_triangle(	quasilattice_default_vertices[i].x, quasilattice_default_vertices[i].y,
				0, 0, cutout_vector0.x, cutout_vector0.y, cutout_vector1.x, cutout_vector1.y, 
				true) )
			continue;
		
//		if(cutout_vector0.distanceTo(quasilattice_default_vertices[i]) < 0.001 ||cutout_vector1.distanceTo(quasilattice_default_vertices[i]) < 0.001)
//			continue; //real pity... if you have them it screws up STMV... but this is meant to be about shapes...
		//wait, really STMV? check that one again
		
		quasicutout_intermediate_vertices[lowest_unused_vertex].copy(quasilattice_default_vertices[i]);
		quasicutout_intermediate_vertices[lowest_unused_vertex].applyAxisAngle(z_central_axis,-TAU/5); //rotates you to the left
		quasicutouts_vertices_components[lowest_unused_vertex][0] = quasicutout_intermediate_vertices[lowest_unused_vertex].x * quasi_shear_matrix[0] + quasicutout_intermediate_vertices[lowest_unused_vertex].y * quasi_shear_matrix[1];
		quasicutouts_vertices_components[lowest_unused_vertex][1] = quasicutout_intermediate_vertices[lowest_unused_vertex].x * quasi_shear_matrix[2] + quasicutout_intermediate_vertices[lowest_unused_vertex].y * quasi_shear_matrix[3];
		lowest_unused_vertex++;
		mirror_point_along_base(quasicutout_intermediate_vertices[lowest_unused_vertex-1], cutout_vector1, left_triangle_cutout_vector,lowest_unused_vertex);
		lowest_unused_vertex++;
		
		quasicutout_intermediate_vertices[lowest_unused_vertex].copy(quasilattice_default_vertices[i]);
		quasicutouts_vertices_components[lowest_unused_vertex][0] = quasicutout_intermediate_vertices[lowest_unused_vertex].x * quasi_shear_matrix[0] + quasicutout_intermediate_vertices[lowest_unused_vertex].y * quasi_shear_matrix[1];
		quasicutouts_vertices_components[lowest_unused_vertex][1] = quasicutout_intermediate_vertices[lowest_unused_vertex].x * quasi_shear_matrix[2] + quasicutout_intermediate_vertices[lowest_unused_vertex].y * quasi_shear_matrix[3];
		lowest_unused_vertex++;
		mirror_point_along_base(quasicutout_intermediate_vertices[lowest_unused_vertex-1], cutout_vector0, cutout_vector1,lowest_unused_vertex);
		lowest_unused_vertex++;
		
		quasicutout_intermediate_vertices[lowest_unused_vertex].copy(quasilattice_default_vertices[i]);
		quasicutout_intermediate_vertices[lowest_unused_vertex].applyAxisAngle(z_central_axis,TAU/5); //rotates you to the right
		quasicutouts_vertices_components[lowest_unused_vertex][0] = quasicutout_intermediate_vertices[lowest_unused_vertex].x * quasi_shear_matrix[0] + quasicutout_intermediate_vertices[lowest_unused_vertex].y * quasi_shear_matrix[1];
		quasicutouts_vertices_components[lowest_unused_vertex][1] = quasicutout_intermediate_vertices[lowest_unused_vertex].x * quasi_shear_matrix[2] + quasicutout_intermediate_vertices[lowest_unused_vertex].y * quasi_shear_matrix[3];
		lowest_unused_vertex++;
		mirror_point_along_base(quasicutout_intermediate_vertices[lowest_unused_vertex-1], right_triangle_cutout_vector, cutout_vector0,lowest_unused_vertex);
		lowest_unused_vertex++;
	}
	
	var lowest_unused_edgepair = 0;
	
	var index_index_triangle_triplets = Array();
	
	var left_triangle_mirrored_top = new THREE.Vector3();
	left_triangle_mirrored_top.addVectors(cutout_vector1, left_triangle_cutout_vector);
	var right_triangle_mirrored_top = new THREE.Vector3();
	right_triangle_mirrored_top.addVectors(right_triangle_cutout_vector, cutout_vector0);
	var center_triangle_mirrored_top = new THREE.Vector3();
	center_triangle_mirrored_top.addVectors(cutout_vector1, cutout_vector0);
	
	var interior_wiggleroom = 0.000000000000003; //...00018 is an important minimum!
	for( var i = 0; i < lowest_unused_vertex; i++) {
		//TODO so should we have inflation everywhere?
		if( !point_in_inflated_triangle( quasicutout_intermediate_vertices[i].x, quasicutout_intermediate_vertices[i].y,
				0, 0, cutout_vector0.x, cutout_vector0.y, cutout_vector1.x, cutout_vector1.y, 
				true) )
			continue;
		
		for( var j = 0; j < lowest_unused_vertex; j++) {
			var edgelength_minus_1 = quasicutout_intermediate_vertices[i].distanceTo(quasicutout_intermediate_vertices[j]) - 1;
			if( Math.abs( edgelength_minus_1 ) < interior_wiggleroom )
			{
				var inrighttriangle = point_in_inflated_triangle(	quasicutout_intermediate_vertices[j].x, quasicutout_intermediate_vertices[j].y,
						0, 0, right_triangle_cutout_vector.x, right_triangle_cutout_vector.y, cutout_vector0.x, cutout_vector0.y, 
						true);
				var inactualtriangle = point_in_inflated_triangle(	quasicutout_intermediate_vertices[j].x, quasicutout_intermediate_vertices[j].y,
						0, 0, cutout_vector0.x, cutout_vector0.y, cutout_vector1.x, cutout_vector1.y, 
						true);
				var inlefttriangle =  point_in_inflated_triangle(	quasicutout_intermediate_vertices[j].x, quasicutout_intermediate_vertices[j].y,
						0, 0, cutout_vector1.x, cutout_vector1.y, left_triangle_cutout_vector.x, left_triangle_cutout_vector.y, 
						true);
				
				if( inactualtriangle || inlefttriangle || inrighttriangle ) {
					quasicutout_line_pairs[ lowest_unused_edgepair*2 ] = i;
					quasicutout_line_pairs[lowest_unused_edgepair*2+1] = j;
					lowest_unused_edgepair++;
				}
				else{
					var mytriangle = ((j%6)-1)/2;
					if((point_in_triangle(	quasicutout_intermediate_vertices[j].x, quasicutout_intermediate_vertices[j].y,
						cutout_vector1.x, cutout_vector1.y, left_triangle_mirrored_top.x, left_triangle_mirrored_top.y, left_triangle_cutout_vector.x, left_triangle_cutout_vector.y, 
						true) && mytriangle == 0 )
					 ||(point_in_triangle(	quasicutout_intermediate_vertices[j].x, quasicutout_intermediate_vertices[j].y,
						cutout_vector0.x, cutout_vector0.y, center_triangle_mirrored_top.x, center_triangle_mirrored_top.y, cutout_vector1.x, cutout_vector1.y, 
						true) && mytriangle == 1 )
					 ||(point_in_triangle(	quasicutout_intermediate_vertices[j].x, quasicutout_intermediate_vertices[j].y,
						right_triangle_cutout_vector.x, right_triangle_cutout_vector.y, right_triangle_mirrored_top.x, right_triangle_mirrored_top.y, cutout_vector0.x, cutout_vector0.y, 
						true) && mytriangle == 2 )
					   ) {
						var j_equivalent = j-j%6+2;
						index_index_triangle_triplets.push(Array(i,j_equivalent,mytriangle));
						//TODO you don't really want ones on the very edge like on HPV, gives lots of nasty crossing lines when it's open
						//deflating the above by a negative amount gets rid of some but not all 
					}
				}
			}
		}
	}
	for(var i = lowest_unused_edgepair*2; i < quasicutout_line_pairs.length; i++)
		quasicutout_line_pairs[i] = 0;
	
	//Speedup opportunity: we could do a pass of "check there aren't duplicate pairs, or unconnected points. And maybe not interior ones with only one edge attached either"
	
	var ourcenter_veclength = 0.5 * Math.tan(Math.atan(PHI) + dodeca_faceflatness*(TAU/4 - Math.atan(PHI))) / Math.tan(TAU/10);

	for( var i = 0; i < dodeca_triangle_vertex_indices.length; i++) {
		var rightindex = dodeca_triangle_vertex_indices[i][0];
		var leftindex = dodeca_triangle_vertex_indices[i][1]; 
		var topindex = dodeca_triangle_vertex_indices[i][2];
		
		var basis_vectors = Array(3);
		basis_vectors[0] = new THREE.Vector3(
			dodeca_vertices_numbers[rightindex*3+0] - dodeca_vertices_numbers[topindex*3+0],
			dodeca_vertices_numbers[rightindex*3+1] - dodeca_vertices_numbers[topindex*3+1],
			dodeca_vertices_numbers[rightindex*3+2] - dodeca_vertices_numbers[topindex*3+2] );
		basis_vectors[1] = new THREE.Vector3(
			dodeca_vertices_numbers[leftindex*3+0] - dodeca_vertices_numbers[topindex*3+0],
			dodeca_vertices_numbers[leftindex*3+1] - dodeca_vertices_numbers[topindex*3+1],
			dodeca_vertices_numbers[leftindex*3+2] - dodeca_vertices_numbers[topindex*3+2] );
		basis_vectors[2] = new THREE.Vector3( //the one that gets them onto the face
			dodeca_vertices_numbers[topindex*3+0],
			dodeca_vertices_numbers[topindex*3+1],
			dodeca_vertices_numbers[topindex*3+2]);
		
		var downward_vector = basis_vectors[0].clone();
		downward_vector.cross(basis_vectors[1]);
		downward_vector.normalize();
		var ourcenter = downward_vector.clone();		
		ourcenter.multiplyScalar(ourcenter_veclength);
		ourcenter.add(basis_vectors[2]);
		var radius = Math.sqrt(basis_vectors[0].lengthSq() + ourcenter_veclength * ourcenter_veclength );
		
		for( var j = 0; j < quasicutouts[i].geometry.attributes.position.array.length; j++)
			quasicutouts[i].geometry.attributes.position.array[j] = 0;
		
		for( var vertex_index = 0; vertex_index < lowest_unused_vertex; vertex_index++) {
			var ourvertex = new THREE.Vector3(0,0,0);
			for( var component = 0; component < basis_vectors.length; component++) {
				ourvertex.x += quasicutouts_vertices_components[vertex_index][component] * basis_vectors[component].x;
				ourvertex.y += quasicutouts_vertices_components[vertex_index][component] * basis_vectors[component].y;
				ourvertex.z += quasicutouts_vertices_components[vertex_index][component] * basis_vectors[component].z;
			}
			
			
			//spherically project. TODO ~30-fold opportunity, store lengths or something?
			if( dodeca_faceflatness < 0.999 ) { //randomly chosen number
				ourvertex.sub(ourcenter);
				
				var radius_ratio;
				var max_lengthening = radius / ourvertex.length(); //this is how much you would lengthen it by if surface was closed
				radius_ratio = 1 - max_lengthening;
				radius_ratio *= dodeca_faceflatness;
				radius_ratio += max_lengthening;
				
				ourvertex.multiplyScalar(radius_ratio);
				ourvertex.add(ourcenter);
			}
			quasicutouts[i].geometry.attributes.position.array[vertex_index*3+0] = ourvertex.x;
			quasicutouts[i].geometry.attributes.position.array[vertex_index*3+1] = ourvertex.y;
			quasicutouts[i].geometry.attributes.position.array[vertex_index*3+2] = ourvertex.z;
			
//			quasicutouts[i].localToWorld(ourvertex);
			/*
			 * So what to do about 
			 */
			
			stitchup.geometry.attributes.position.array[lowest_unused_vertex * i * 3 + vertex_index*3+0] = ourvertex.x;
			stitchup.geometry.attributes.position.array[lowest_unused_vertex * i * 3 + vertex_index*3+1] = ourvertex.y;
			stitchup.geometry.attributes.position.array[lowest_unused_vertex * i * 3 + vertex_index*3+2] = ourvertex.z;
		}
		
		quasicutouts[i].geometry.attributes.position.needsUpdate = true;
		quasicutouts[i].geometry.index.needsUpdate = true;
	}
	
	//The indices in stitchup of vertex i are i+num_stitchup_vertices_in_one_quasicutout*x for x = 0,1...
	var lowest_unused_stitchup_edgepair = 0;
	for(var i = 0; i < 55; i++){ //one quasicutout at a time
		if((i % 11 > 2 && i % 11 != 5) && dodeca_openness != 0)
			continue;
		for(var j = 0; j < index_index_triangle_triplets.length; j++){
			var quasicutout_containing_index2 = nearby_quasicutouts[i][ index_index_triangle_triplets[j][2] ];
			if(quasicutout_containing_index2 === 666 || ((quasicutout_containing_index2 % 11 > 2 && quasicutout_containing_index2 % 11 != 5) && dodeca_openness != 0))
				continue; //not in the picture
			stitchup_line_pairs[ lowest_unused_stitchup_edgepair*2 ] = index_index_triangle_triplets[j][0] + lowest_unused_vertex * i;
			stitchup_line_pairs[lowest_unused_stitchup_edgepair*2+1] = index_index_triangle_triplets[j][1] + lowest_unused_vertex * quasicutout_containing_index2;
//			if(!logged)console.log(index_index_triangle_triplets[j][2],quasicutout_containing_index2);
			lowest_unused_stitchup_edgepair++;
		}
	}
	logged = 1;
	for(var i = lowest_unused_stitchup_edgepair*2; i < stitchup_line_pairs.length; i++)
		stitchup_line_pairs[i] = 0;
	stitchup.geometry.attributes.position.needsUpdate = true;
	stitchup.geometry.index.needsUpdate = true;
}