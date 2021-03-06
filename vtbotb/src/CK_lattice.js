var volumeDecreaseAmt = 0.05;

//Speedup opportunity: this. Profile it, it may be a huge thing
function updatelattice() {
	var costheta = Math.cos(LatticeAngle);
	var sintheta = Math.sin(LatticeAngle);

	for(var i = 1; i < number_of_lattice_points; i++) {
		flatlattice_vertices.array[i*3+0] = (flatlattice_default_vertices[i*3+0] * costheta - flatlattice_default_vertices[i*3+1] * sintheta) * LatticeScale;
		flatlattice_vertices.array[i*3+1] = (flatlattice_default_vertices[i*3+0] * sintheta + flatlattice_default_vertices[i*3+1] * costheta) * LatticeScale;
		flatlattice_vertices.array[i*3+2] = 0;
	}
	
	flatlattice.geometry.attributes.position.needsUpdate = true;
}

var framesSinceLatticeSizeDecrease = 0;
var framesSinceLatticeSizeIncrease = 0;

function HandleNetMovement()
{
	if(!isMouseDown && isMouseDown_previously && MousePosition.distanceTo(IrregButton.position) >= IrregButton.radius && !Sounds.vertexGrabbed.isPlaying )
		Sounds.vertexGrabbed.play();
	if(isMouseDown && !isMouseDown_previously && MousePosition.distanceTo(IrregButton.position) >= IrregButton.radius && !Sounds.vertexReleased.isPlaying )
		Sounds.vertexReleased.play();
	
	var LatticeScaleChange = 1;
	var LatticeAngleChange = 0;
	
	framesSinceLatticeSizeDecrease++;
	framesSinceLatticeSizeIncrease++;
	
	if( capsidopenness === 1 && isMouseDown )
	{
		var Mousedist = MousePosition.distanceTo(flatlattice_center);
		var OldMousedist = OldMousePosition.distanceTo(flatlattice_center); //unless the center is going to change?
		
		var active_radius = 0.18;
		
		if(Mousedist > active_radius && OldMousedist > active_radius && Mouse_delta.lengthSq() != 0 )
		{	
			LatticeGrabbed = true;
			
			var oldmouse_to_center = new THREE.Vector3(flatlattice_center.x - OldMousePosition.x,flatlattice_center.y - OldMousePosition.y,0);
			var oldmouse_to_newmouse = new THREE.Vector3(MousePosition.x - OldMousePosition.x,MousePosition.y - OldMousePosition.y,0);
			var ourangle = oldmouse_to_center.angleTo(oldmouse_to_newmouse);
			
			var oldLatticeScale = LatticeScale;
			
			var areaForRotating = TAU / 32 * 11; //between a quarter and a half
			
			if(Math.abs(ourangle) < TAU / 4 - areaForRotating / 2 || Math.abs(ourangle) > TAU / 4 + areaForRotating / 2 ){
				LatticeScaleChange = OldMousedist / Mousedist;
				var max_lattice_scale_change = 0.08;
				
				var min_lattice_scale_given_angle = get_min_lattice_scale(LatticeAngle);
				min_lattice_scale_given_angle /= Math.sqrt(7);
				
				LatticeScale *= LatticeScaleChange;
				theyKnowYouCanAlter = true;
				
				if( LatticeScaleChange > 1 )
				{
					if(LatticeScale > 1)
					{
						LatticeScale = 1;
						if( !Sounds.sizeLimitLower.isPlaying)
							Sounds.sizeLimitLower.play();
					}				
				}
				
				if( LatticeScaleChange < 1 )
				{
					if(LatticeScale < min_lattice_scale_given_angle  )
					{
						LatticeScale = min_lattice_scale_given_angle;
						if( !Sounds.sizeLimitUpper.isPlaying)
							Sounds.sizeLimitUpper.play();
					}
				}
			}
			
			//if you didn't change scale (or if your change was ineffectual) we'll change angle.
			if( oldLatticeScale == LatticeScale
//					&& !Story_states[Storypage].CK_scale_only //we're trying without this. Scale-only is SO boring that people think they're missing something, like why have it?
					)
			{
				var MouseAngle = Math.atan2( (MousePosition.x - flatlattice_center.x), (MousePosition.y - flatlattice_center.y) );
				if(MousePosition.x - flatlattice_center.x === 0 && MousePosition.y - flatlattice_center.y === 0)
					MouseAngle = 0; //well, undefined
				
				var OldMouseAngle = Math.atan2( (OldMousePosition.x - flatlattice_center.x), (OldMousePosition.y - flatlattice_center.y) );
				if(OldMousePosition.x - flatlattice_center.x === 0 && OldMousePosition.y - flatlattice_center.y === 0)
					OldMouseAngle = 0;
				
				//speed up opening. TODO Sensetive enough so you know it happens, not so sensetive that touchscreens don't see slow opening
				//if(Math.abs(OldMouseAngle - MouseAngle) > 0.08) capsidopeningspeed += 0.0045;
				
				//TODO remember where the original point the player clicked is, that's what you want to be moving. Currently that point is forgotten, in a sense, if the scale limit is hit
				
				LatticeAngleChange = MouseAngle - OldMouseAngle;
				LatticeAngle += LatticeAngleChange;
				theyKnowYouCanAlter = true;
			}
		}
	} else { //this is where snapping takes place. Can put in the contingency on the button here
		LatticeGrabbed = false;
		
		if( !IrregButton.capsidopen || LatticeScale < 0.2773500870617064 )
		{
			var firstnetvertex = new THREE.Vector3(setvirus_flatnet_vertices[3][3],setvirus_flatnet_vertices[3][ 4 ],0);
			firstnetvertex.multiplyScalar(1/LatticeScale);
			firstnetvertex.applyAxisAngle(z_central_axis,-LatticeAngle);
			
			var closestlatticevertices_indices = indices_of_closest_default_lattice_vertices(firstnetvertex.x,firstnetvertex.y); //TODO you don't want a lattice vertex not on the visible lattice.
			
			var scaleaugmentation;
			var angleaugmentation;
			var min_lattice_scale_given_angle;
			var ourchoice = 0;
			
			do {
				var close_latticevertex = new THREE.Vector3(flatlattice_default_vertices[closestlatticevertices_indices[ourchoice]*3+0],flatlattice_default_vertices[closestlatticevertices_indices[ourchoice]*3+1],0);
				
				//how much you WOULD augment to snap the net straight there
				scaleaugmentation = firstnetvertex.length()/close_latticevertex.length();
				angleaugmentation = close_latticevertex.angleTo(firstnetvertex);
				if(point_to_the_right_of_line(	close_latticevertex.x,close_latticevertex.y,
												firstnetvertex.x,firstnetvertex.y, 0,0) ===0 )
					angleaugmentation *= -1;
				
				min_lattice_scale_given_angle = get_min_lattice_scale(LatticeAngle+angleaugmentation);
				
				var full_scale_addition = LatticeScale * scaleaugmentation - LatticeScale;
				
				ourchoice++;
			} while(LatticeScale + full_scale_addition < min_lattice_scale_given_angle - 0.000001 && ourchoice < 7)
				
			var speed_towards_fix = 0.03 + 0.97 * Math.pow((1-capsidopenness), 10); //sure this won't change which one you're heading for?
			LatticeAngle += angleaugmentation*speed_towards_fix;
			LatticeScale += full_scale_addition*speed_towards_fix;
		}
	}
	
	if(LatticeAngleChange > 0 || LatticeScaleChange > 1 )
	{
		Sounds.rotateClockwise.play();
	}

	if(LatticeAngleChange < 0 || LatticeScaleChange < 1 )
	{
		Sounds.rotateAntiClockwise.play();
	}
	
	updatelattice();
}

function get_min_lattice_scale(ourangle) {
	//this value needs updating if you ever change hexagon_rings
//	var min_lattice_scale = 1/(2*Math.sqrt(2.5*2.5+3/4));
//	var angle_for_min_lattice = TAU/6 - Math.atan(Math.sqrt(3)/2 / 2.5);
//
//	var virtual_angle = ourangle - angle_for_min_lattice + TAU/12;
//	while(virtual_angle< -TAU/12) virtual_angle += TAU/6;
//	while(virtual_angle > TAU/12) virtual_angle -= TAU/6;
//	return min_lattice_scale / HS3 * Math.cos(virtual_angle);
	return 0.2773500870617064;
}

//vertex *destination*. Not vertex, which may be interesting.
function index_of_closest_default_lattice_vertex(x,y) {
	var closest_point_so_far_index = 66666;
	var lowest_quadrance_so_far = 66666;
	for( var j = 0; j < number_of_lattice_points; j++) {
		var quadrance = (x-flatlattice_default_vertices[j*3 + 0])*(x-flatlattice_default_vertices[j*3 + 0]) + 
						(y-flatlattice_default_vertices[j*3 + 1])*(y-flatlattice_default_vertices[j*3 + 1]);
		
		if( quadrance < lowest_quadrance_so_far) {
			closest_point_so_far_index = j;
			lowest_quadrance_so_far = quadrance;
		}
	}
	return closest_point_so_far_index;
}

function indices_of_closest_default_lattice_vertices(x,y) {
	var number_of_returns = 7; //all the points near a point, should be ok?
	var closest_points_indices = Array(number_of_returns);
	var lowest_quadrances_so_far = Array(number_of_returns );
	for(var i = 0; i<number_of_returns; i++){
		closest_points_indices[i] = 66666;
		lowest_quadrances_so_far[i] = 66666;
	}
	//speedup opportunity: only go through a sixth of them
	//speedup opportunity: discard those whose quadrance from the center of the lattice is larger than that of the closest one
	for( var i = 0; i < number_of_lattice_points; i++) {
		if(i > 60) //scale would be less than the 0.27735 limit
			continue;
		
		var quadrance = (x-flatlattice_default_vertices[i*3 + 0])*(x-flatlattice_default_vertices[i*3 + 0]) + 
						(y-flatlattice_default_vertices[i*3 + 1])*(y-flatlattice_default_vertices[i*3 + 1]);
		
		for(var j = number_of_returns - 1; j >= 0; j--) {
			if( quadrance < lowest_quadrances_so_far[j]) {
				//well this one is being shifted
				if(j < number_of_returns - 1){
					closest_points_indices[j+1] = closest_points_indices[j];
					lowest_quadrances_so_far[j+1] = lowest_quadrances_so_far[j];
				}
				if(j==0){
					closest_points_indices[0] = i;
					lowest_quadrances_so_far[0] = quadrance;
				}
			}
			else{
				if(j !== number_of_returns - 1) {
					//so we know we're in the list, we need to put them in the previous place
					closest_points_indices[j+1] = i;
					lowest_quadrances_so_far[j+1] = quadrance;
				}
				break;
			}
		}
	}
	return closest_points_indices;
}