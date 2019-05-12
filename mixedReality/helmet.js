function initHelmet()
{
	let helmetRadius = 0.15
	var helmet = new THREE.Mesh(new THREE.SphereGeometry(helmetRadius,32,32,0,TAU,0,TAU*0.31), new THREE.MeshPhongMaterial({color:0xFF0000,opacity:0.96,transparent:true}))
	scene.add(helmet)

	var eyeRadius = 0.023;
	var eyeballs = Array(2);
	for(var i = 0; i < 2; i++)
	{
		eyeballs[i] = new Eyeball(eyeRadius);
		eyeballs[i].position.set(1,1,-1)
		if(i)
		{
			eyeballs[i].position.x *= -1
		}
		eyeballs[i].position.setLength(helmetRadius)

		helmet.add(eyeballs[i]);
	}

	let helmetHolder = new THREE.Object3D()
	scene.add(helmetHolder)
	updateFunctions.push(function()
	{
		helmetHolder.position.copy(camera.position)
		helmetHolder.quaternion.copy(camera.quaternion)
	})
	markPositionAndQuaternion(helmetHolder)

	helmetHolder.add(helmet)
	helmet.position.z += 0.13
	helmet.visible = false

	objectsToBeLookedAtByHelmet = [camera]
	alwaysUpdateFunctions.push(function()
	{
		if(!helmet.visible)
		{
			return
		}

		let betweenEyes = eyeballs[0].position.clone().lerp(eyeballs[1].position,0.5)
		let inHead = betweenEyes.clone().setComponent(2,0)
		helmet.localToWorld(betweenEyes)
		helmet.localToWorld(inHead)
		let sightRay = new THREE.Ray(inHead,betweenEyes.clone().sub(inHead))
		log(sightRay.origin.toArray().toString(),sightRay.direction.toArray().toString())

		let closestWorldPosition = null
		for(let i = 0; i < objectsToBeLookedAt.length; i++)
		{
			//don't be surprised if this screws some shit up because of updateMatrixWorld
			let worldPosition = objectsToBeLookedAt[i].getWorldPosition(new THREE.Vector3())

			let dist = sightRay.distanceSqToPoint( worldPosition )
			log(i,dist)
			if( closestWorldPosition === null || dist < sightRay.distanceSqToPoint( closestWorldPosition ) )
			{
				closestWorldPosition = worldPosition
			}
		}

		eyeballs[0].lookAt(closestWorldPosition)
		eyeballs[1].lookAt(closestWorldPosition)
	})

	return helmet
}