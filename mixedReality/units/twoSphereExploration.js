//each take gets a letter A-Z. draw it through air
//monitoring should probably be a diff

// monitoring - better off marking the controller? Jon Blow says "pain in the ass"

function initTwoSphereExploration(fish, visiBox)
{
	let designatedHand = handControllers[RIGHT_CONTROLLER_INDEX]

	// camera.position.multiplyScalar(10)

	let assemblage = new THREE.Group()
	scene.add(assemblage)

	assemblage.add(fish)
	markObjectProperty(fish,"visible")
	bindButton("2",function()
	{
		fish.visible = !fish.visible
		for(let i = 0; i < visiBox.faces.length; i++)
		{
			faces[i].visible = !faces[i].visible
		}
	})

	visiBox.scale.z *= 0.001
	visiBox.scale.multiplyScalar(1/1000)
	assemblage.add(visiBox)

	let s2 = new THREE.Group()
	bindButton("1",function(){s2.visible = !s2.visible})
	s2.radius = 0.1
	s2.scale.setScalar(s2.radius)
	s2.correctPosition = new THREE.Vector3(0,0,-s2.radius)
	s2.position.copy(s2.correctPosition)
	s2.add( new THREE.Mesh(new THREE.SphereGeometry(0.96,64,64), new THREE.MeshBasicMaterial(
	{
		color:0xCCCCCC,
		transparent:true,
		opacity:0.93
		// side:THREE.BackSide
	} ) ) )
	// markQuaternion(s2)
	markMatrix(s2.matrix)
	scene.add(s2)
	meshesWithProjections = []
	makeProjectableSpheres( meshesWithProjections )

	let extraRotationMatrix = new THREE.Matrix4()

	let bulb = new THREE.Group()
	bindButton("3",function(){bulb.visible = !bulb.visible})
	bulb.position.z = -2 * s2.radius
	markPositionAndQuaternion(bulb)
	scene.add(bulb)

	let hackEngaged = false
	let hackPosition = new THREE.Vector3(0,1.6,0)
	let thingsInScene = [s2,assemblage,bulb]
	for(let i = 0; i < thingsInScene.length; i++)
	{
		let matrixPosition = new THREE.Vector3().setFromMatrixPosition(thingsInScene[i].matrix)
		matrixPosition.add(hackPosition)
		thingsInScene[i].matrix.setPosition(matrixPosition)

		thingsInScene[i].position.add(hackPosition)
	}

	let projectionIndicators = new THREE.LineSegments(new THREE.Geometry(),new THREE.MeshBasicMaterial({
		color: 0x00FF00,
		clippingPlanes: visiBox.planes
	}))
	projectionIndicators.geometry.vertices.push(new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3())
	assemblage.add( projectionIndicators )

	new THREE.OBJLoader().load("data/Lamp_Fluorescent_Illuminated.obj",function(obj)
	{
		bulb.scale.multiplyScalar(0.0007)

		let bottom = obj.children[0]
		bulb.add(new THREE.Mesh(bottom.geometry,new THREE.MeshStandardMaterial({
			color:0x000000
		})))

		let bowlGeo = new THREE.Geometry().fromBufferGeometry(obj.children[1].geometry)
		bowlGeo.mergeVertices()
		bowlGeo.computeFaceNormals()
		bowlGeo.computeVertexNormals()
		bulb.add(new THREE.Mesh(bowlGeo,new THREE.MeshLambertMaterial({
			color:0xFFFFFF
		})))

		let screw = obj.children[4]
		bulb.add(new THREE.Mesh(screw.geometry,new THREE.MeshStandardMaterial({
			color:0xCCCCCC
		})))

		bulb.lightBit = obj.children[2]
		// bulb.lightBit.geometry.merge(obj.children[3].geometry)
		bulb.lightBit.material = new THREE.MeshLambertMaterial({
			color: 0xFFFFA0, emissive:0xFFFF80, emissiveIntensity:0.5} )
		bulb.add(bulb.lightBit)

		for(let i = 0; i < bulb.children.length; i++)
		{
			bulb.children[i].position.y -= 90
		}
	},function(){},function(e){console.log(e)})

	updateFunctions.push(function()
	{
		for(let i = 0; i < thingsInScene.length; i++)
		{
			let matrixPosition = new THREE.Vector3().setFromMatrixPosition(thingsInScene[i].matrix)
			matrixPosition.sub(hackPosition)
			thingsInScene[i].matrix.setPosition(matrixPosition)

			thingsInScene[i].position.sub(hackPosition)
		}
		hackEngaged = true

		let t = frameCount*0.03

		//could do this shit differently
		//test, so it's not even off by a frame
		if( designatedHand.grippingTop )
		{
			let justGripped = (s2.matrixAutoUpdate !== false)
			s2.matrixAutoUpdate = false

			let newBasis = getHandBasis2D()
			if(newBasis !== null)
			{
				newBasis.setPosition( s2.position )

				if(justGripped)
				{
					s2.updateMatrix()
					extraRotationMatrix.getInverse(newBasis).multiply(s2.matrix)
				}
				newBasis.multiply(extraRotationMatrix)

				s2.matrix.copy(newBasis)
			}
		}
		else
		{
			if(designatedHand.grippingTopOld)
			{
				s2.matrix.decompose(s2.position,s2.quaternion,s2.scale)
				s2.matrixAutoUpdate = true
			}

			if( designatedHand.button1 )
			{
				s2.quaternion.copy( designatedHand.quaternion )
				s2.position.copy( designatedHand.position ).sub(hackPosition)
			}
			else
			{
				s2.position.copy(s2.correctPosition)
			}
		}

		if(designatedHand.thumbstickButton && !designatedHand.thumbstickButtonOld)
		{
			cycleTwoSphereTextures()
		}

		projectionIndicators.visible = designatedHand.grippingTop
	})

	alwaysUpdateFunctions.push(function()
	{
		if(!hackEngaged)
		{
			for(let i = 0; i < thingsInScene.length; i++)
			{
				let matrixPosition = new THREE.Vector3().setFromMatrixPosition(thingsInScene[i].matrix)
				matrixPosition.sub(hackPosition)
				thingsInScene[i].matrix.setPosition(matrixPosition)

				thingsInScene[i].position.sub(hackPosition)
			}
			hackEngaged = true
		}

		let assemblageMatrixInverse = new THREE.Matrix4().getInverse(assemblage.matrix)
		for(let i = 0; i < meshesWithProjections.length; i++)
		{
			let mesh = meshesWithProjections[i]
			if(mesh.visible === false || bulb.visible === false)
			{
				mesh.projection.visible = false
				continue
			}
			mesh.projection.visible = true

			let plane = new THREE.Plane()
			plane.setFromNormalAndCoplanarPoint( new THREE.Vector3(0,0,1), new THREE.Vector3(1,0,assemblage.position.z) )
			
			let line = new THREE.Line3(bulb.position.clone(), new THREE.Vector3())
			let intersection = new THREE.Vector3()
			for(let i = 0; i < mesh.projection.geometry.vertices.length; i++)
			{
				line.end.copy(mesh.geometry.vertices[i])
				line.end.applyMatrix4(s2.matrix)

				plane.intersectLine(line,intersection)
				mesh.projection.geometry.vertices[i].lerpVectors(line.end,intersection,1)
				mesh.projection.geometry.vertices[i].applyMatrix4(assemblageMatrixInverse)

				//to stop weirdness in singularity
				if( i % 2 === 1 && mesh.projection.geometry.vertices[i].distanceToSquared(mesh.projection.geometry.vertices[i-1]) > 4 )
				{
					mesh.projection.geometry.vertices[i].copy(mesh.projection.geometry.vertices[i-1])
				}
			}
			// console.log(mesh.projection.geometry.vertices[4])
			mesh.projection.geometry.verticesNeedUpdate = true
		}

		{
			for(let i = 0; i < 2; i++)
			{
				projectionIndicators.geometry.vertices[i*2].copy(bulb.position)
				projectionIndicators.geometry.vertices[i*2].applyMatrix4(assemblageMatrixInverse)

				let v = projectionIndicators.geometry.vertices[1+i*2].set(0.03,0,0)
				if(i)
				{
					v.x *= -1
				}
				fish.updateMatrix()
				v.applyMatrix4(fish.matrix)
			}
			projectionIndicators.geometry.verticesNeedUpdate = true
		}

		for(let i = 0; i < thingsInScene.length; i++)
		{
			let matrixPosition = new THREE.Vector3().setFromMatrixPosition(thingsInScene[i].matrix)
			matrixPosition.add(hackPosition)
			thingsInScene[i].matrix.setPosition(matrixPosition)

			thingsInScene[i].position.add(hackPosition)
		}
		hackEngaged = false
	})

	function stereographicallyUnproject2D(worldV)
	{
		let s2Position = new THREE.Vector3().setFromMatrixPosition(s2.matrix)
		let sphereIntersections = sphereLineIntersection(bulb.position, worldV, s2Position, s2.radius )
		if(sphereIntersections.length === 0)
		{
			return null
		}
		else
		{
			let index = sphereIntersections[0].distanceToSquared(bulb.position) < sphereIntersections[1].distanceToSquared(bulb.position) ? 1:0
			let pointInSphereSpace = sphereIntersections[ index ].sub(s2Position)
			//not exactly in sphere space because scale
			return pointInSphereSpace
		}
	}

	function getHandBasis2D(target)
	{
		if(target === undefined)
		{
			target = new THREE.Matrix4()
		}

		//may wanna do some projecting

		fish.updateMatrix()
		let worldPosition = new THREE.Vector3().applyMatrix4(fish.matrix).applyMatrix4(assemblage.matrix)
		let unprojectedHandPosition = stereographicallyUnproject2D( worldPosition )
		if( unprojectedHandPosition === null)
		{
			return null
		}

		{
			let unitVector = new THREE.Vector3(0.00001,0,0)
			unitVector.applyMatrix4(fish.matrix)
			let curvedAwayUnitVector = stereographicallyUnproject2D( unitVector )
			if( curvedAwayUnitVector === null)
			{
				return null
			}

			let orth = unprojectedHandPosition.clone().cross(curvedAwayUnitVector)
			let basisVector = orth.clone().cross(unprojectedHandPosition).setLength(s2.radius)

			target.setBasisVector(0,basisVector)

			let otherBasisVector = basisVector.clone().cross(unprojectedHandPosition).setLength(s2.radius)
			target.setBasisVector(1,otherBasisVector)
		}
		target.setBasisVector(2,unprojectedHandPosition)

		// for(let i = 0; i < vecs.length; i++)
		// {
		// 	for(let j = i+1; j < vecs.length; j++)
		// 	{
		// 		if(!basicallyEqual(vecs[i].dot(vecs[j]),0))
		// 		{
		// 			log(vecs[i].dot(vecs[j]))
		// 		}
		// 	}
		// }

		return target
	}

	for(let i = 0; i < meshesWithProjections.length; i++ )
	{
		meshesWithProjections[i].visible = false
	}
	// bindButton( "c", function()
	// {
	// 	cycleTwoSphereTextures()
	// }, "cycle 2-sphere textures" )

	markObjectProperty( bulb,"visible" )
	for(let i = 0; i < meshesWithProjections.length; i++)
	{
		markObjectProperty( meshesWithProjections[i],"visible" )
	}

	function cycleTwoSphereTextures()
	{
		let visibleIndex = 0
		for(let i = 0; i < meshesWithProjections.length; i++)
		{
			if( meshesWithProjections[i].visible )
			{
				visibleIndex = i
				break;
			}
		}

		visibleIndex++
		if(visibleIndex >=meshesWithProjections.length)
		{
			visibleIndex = 0
		}

		for(let i = 0; i < meshesWithProjections.length; i++)
		{
			meshesWithProjections[i].visible = (i===visibleIndex)
		}
	}

	function makeProjectableSpheres(meshesWithProjections)
	{
		let mat = new THREE.LineBasicMaterial({color:0x0F0CC0})
		let projectionMat = new THREE.LineBasicMaterial({color:0x000000})
		projectionMat.clippingPlanes = visiBox.planes 

		function addProjectableSphere(geo)
		{
			let mesh = new THREE.LineSegments(geo, mat)
			s2.add(mesh)

			mesh.projection = new THREE.LineSegments(geo.clone(),projectionMat)
			assemblage.add(mesh.projection)
			meshesWithProjections.push(mesh)
		}

		let latitudesAndLontitudesGeo = new THREE.Geometry()
		let numLongtitude = 12
		let numLatitude = 8
		for(let i = 0; i < numLongtitude; i++)
		{
			let longtitude = TAU * i / numLongtitude
			for(let j = 0; j < numLatitude; j++)
			{
				let latitude = j / numLatitude * TAU / 2
				let p = new THREE.Vector3(0,1,0).applyAxisAngle(xUnit,latitude).applyAxisAngle(yUnit,longtitude)
				latitudesAndLontitudesGeo.vertices.push(p)

				let nextLatitude = (j+1) / numLatitude * TAU / 2
				let q = new THREE.Vector3(0,1,0).applyAxisAngle(xUnit,nextLatitude).applyAxisAngle(yUnit,longtitude)
				latitudesAndLontitudesGeo.vertices.push(q)

				if(j)
				{
					latitudesAndLontitudesGeo.vertices.push(p)
					let nextLongtitude = TAU * (i+1) / numLongtitude
					let r = new THREE.Vector3(0,1,0).applyAxisAngle(xUnit,latitude).applyAxisAngle(yUnit,nextLongtitude)
					latitudesAndLontitudesGeo.vertices.push(r)
				}
			}
		}
		addProjectableSphere(latitudesAndLontitudesGeo)

		let twoCirclesGeo = new THREE.Geometry()
		let radialSegements = 128
		for(let i = 0; i < 2; i++)
		{
			let start = new THREE.Vector3().setComponent(i,1)
			let axis = new THREE.Vector3().setComponent((i+1)%3,1)
			for(let j = 0; j < radialSegements; j++)
			{
				let latitude = j / radialSegements * TAU
				let p = start.clone().applyAxisAngle(axis,latitude)
				twoCirclesGeo.vertices.push(p)

				let nextLatitude = (j+1) / radialSegements * TAU
				let q = start.clone().applyAxisAngle(axis,nextLatitude)
				twoCirclesGeo.vertices.push(q)
			}
		}
		addProjectableSphere(twoCirclesGeo)

		let sphericalOctahedronGeo = new THREE.Geometry()
		for(let i = 0; i < 3; i++)
		{
			let start = new THREE.Vector3().setComponent(i,1)
			let axis = new THREE.Vector3().setComponent((i+1)%3,1)
			for(let j = 0; j < radialSegements; j++)
			{
				let latitude = j / radialSegements * TAU
				let p = start.clone().applyAxisAngle(axis,latitude)
				sphericalOctahedronGeo.vertices.push(p)

				let nextLatitude = (j+1) / radialSegements * TAU
				let q = start.clone().applyAxisAngle(axis,nextLatitude)
				sphericalOctahedronGeo.vertices.push(q)
			}
		}
		addProjectableSphere(sphericalOctahedronGeo)

		let sourceGeo = new THREE.IcosahedronGeometry(1,2 )
		let goldbergGeo = new THREE.Geometry()
		for(let i = 0; i < sourceGeo.faces.length; i++)
		{
			let f = sourceGeo.faces[i]
			for(let j = 0; j < 3; j++)
			{
				goldbergGeo.vertices.push(sourceGeo.vertices[ f.getCorner(j) ])
				goldbergGeo.vertices.push(sourceGeo.vertices[ f.getCorner((j+1)%3) ])
			}
		}
		addProjectableSphere(goldbergGeo)

		new THREE.OBJLoader().load("data/worldMap.obj",function(obj)
		{
			let transform = new THREE.Matrix4().makeRotationX(-TAU/4)
			// transform.elements[0] *= -1 //mirror
			let geo = obj.children[0].geometry.applyMatrix(transform)
			
			new THREE.FileLoader().load("data/coastlineIndices.txt", function(coastlineTxt)
			{
				let globeGeo = new THREE.Geometry()
				let coastlineIndices = JSON.parse(coastlineTxt)

				for(let i = 0; i < coastlineIndices.length; i += 2)
				{
					let index = coastlineIndices[i]
					let otherIndex = coastlineIndices[i] % 3 === 2 ? coastlineIndices[i] - 2 : coastlineIndices[i] + 1

					globeGeo.vertices.push( geo.attributes.position.getXYZ(index).setLength(1), geo.attributes.position.getXYZ(otherIndex).setLength(1) )
				}

				addProjectableSphere(globeGeo)
			})
		})
	}

	{
		let spacing = 0.07
		let grid = new THREE.LineSegments( new THREE.Geometry(), new THREE.MeshBasicMaterial({
			color:0x333333,
			clippingPlanes: visiBox.planes
		}) )
		let numWide = 36
		let numTall = 20
		let verticalExtent = numTall/2*spacing
		let horizontalExtent = numWide/2*spacing
		for(let i = 0; i < numWide+1; i++)
		{
			let x = (i-numWide/2)*spacing
			grid.geometry.vertices.push(new THREE.Vector3(x,-verticalExtent,0),new THREE.Vector3(x,verticalExtent,0))
		}
		for( let i = 0; i < numTall+1; i++)
		{
			let y = (i-numTall/2)*spacing
			grid.geometry.vertices.push(new THREE.Vector3(-horizontalExtent,y,0),new THREE.Vector3(horizontalExtent,y,0))
		}
		assemblage.add(grid)

		let heptagon = new THREE.Mesh(new THREE.CylinderBufferGeometry(0.1,0.1,0.0001,7), new THREE.MeshBasicMaterial({color:0xFFA500}))
		heptagon.material.clippingPlanes = visiBox.planes
		heptagon.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(TAU/4))
		assemblage.add(heptagon)
		updateFunctions.push(function()
		{
			if(designatedHand.thumbstickLeft)
			{
				heptagon.position.add(designatedHand.deltaPosition)
				heptagon.position.z = 0

				grid.visible = heptagon.position.length() < 0.6
			}
		})
		markObjectProperty(grid,"visible")
		markPosition(heptagon)
	}
}