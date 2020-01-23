/*
	TODO for slack / Cambridge demo
		Every aspect of the multiplication and addition needs to be visualized
		Sandbox available
	
	Long term
		They should be able to scope things, and delete them
		QM
			a vector of complex numbers can separate into a vector and bivector (i*vector) parts?
		Bootstrapping!
			Maybe you should use GA for your camera projection and that should be considered part of the system
			After all, if you pick up a vector and rotate it it can be rotated to become its negative
			Rotating the basis vectors rotates eeeeverything
			If you rotate a vector, well, it is a different vector
		So how about when you have too many multivectors in your scope?
			Could rearrange to put recent ones at top
			Could pack rectangles
			Scrollbar
		Aesthetics/non-design
			DO NOT THINK ABOUT THIS
			SDF/raytrace
				Can at least consider it because the geometry of these objects, which the player will spend a lot of time looking at, is simple
				good shadows, reflections, colored lighting, transparency. Lights could originate in a texture.
				But mostly can think of stuff as being in the background. Leave that to a game engine?
				So anything that is more complicated gets an an sdf https://www.iquilezles.org/www/articles/intersectors/intersectors.htm
				Lights come from environment/cubemap
					Ideally one with XHR and all that. Maybe even a light field? Could just be a cylindrical one?
				Ray tracings
					https://www.shadertoy.com/view/MtcXWr
			Cubemap "background"
				Each pixel of which gets its own ray trace/sdf call, just the one to see if it is immediately accessible to the light
			Maybe you want a conventional thing
				Less time consuming, makes it so you can focus on what is important
				The frogs are a certain animation
				Particle systems
				Look dumbass, of course when you bring in an artist they'll want to put in non-mathematical shit with textures etc.
		Helping make shaders
			Ideally you paste and it tells you what it thinks you pasted
			Spit out glsl?
			Heh, have it be possible for the input and output to be arranged in a rectangle with x and y smoothly varying, i.e. a framebuffer
*/

async function init()
{
	// await initBivectorAppearance()
	// return

	await initMenu()

	// let otherThingToCheckDistanceTo = []
	// let littleScene = await initWheelScene()
	// otherThingToCheckDistanceTo.push(littleScene.hummingbird)

	initMultivectorAppearances()

	var scope = []
	{
		let lastAssignedOperand = 0
		var scopeOnClick = function(multivecToCopy)
		{
			if(animationStage !== null)
			{
				log("not doin nothing")
				return
			}
			//better: fastforward animation

			operandToUse = operands[1-lastAssignedOperand]

			operandToUse.copyElements(multivecToCopy.elements)
			operandToUse.position.copy(multivecToCopy.position)
			scene.add(operandToUse)

			lastAssignedOperand = 1 - lastAssignedOperand
		}

		let xBasisElement = MultivectorAppearance(scopeOnClick)
		scope.push(xBasisElement)
		xBasisElement.setTo1Blade(xUnit)
		let yBasisElement = MultivectorAppearance(scopeOnClick)
		scope.push(yBasisElement)
		yBasisElement.setTo1Blade(yUnit)
		// let zBasisElement = MultivectorAppearance(scopeOnClick)
		// scope.push(zBasisElement)
		// zBasisElement.setTo1Blade(zUnit)

		// let trivec = MultivectorAppearance(scopeOnClick)
		// scope.push(trivec)
		// trivec.elements[7] = 1.
		// trivec.updateTrivectorAppearance()

		var operands = [
			MultivectorAppearance(function(){}),
			MultivectorAppearance(function(){}) ]
		scene.remove(operands[0],operands[1])

		var operandPositions = Array(2)
		operandPositions[0] = new THREE.Vector3( 0.,1.,0.)
		operandPositions[1] = new THREE.Vector3( 1.,0.,0.)
	}

	// initInputOutputGoal(scope,scopeOnClick)

	let goalElements = new Float32Array(8)
	goalElements[1] = 1.
	goalElements[2] = 1.
	initSingularGoal( goalElements,scope )

	{
		await initOperatorAppearance()

		addOperatorOriginal = OperatorAppearance()
		multiplyOperatorOriginal = OperatorAppearance()

		addOperatorOriginal.function = geometricSum
		multiplyOperatorOriginal.function = geometricProduct

		let operatorOriginals = [addOperatorOriginal,multiplyOperatorOriginal];
		var activeOperator = OperatorAppearance()

		for(let i = 0; i < operatorOriginals.length; ++i )
		{
			let o = operatorOriginals[i]

			if(i)
				o.material.color.setRGB(1.,0.,0.)

			o.position.y = camera.topAtZZero - .4
			o.position.x = (i - 0.5 * (operatorOriginals.length-1) ) * 2.
			scene.add(o)

			clickables.push(o)
			o.onClick = function()
			{
				if(animationStage !== null)
				{
					log("not doin nothing")
					return
				}

				activeOperator.material.color.copy(this.material.color)
				activeOperator.position.copy(o.position)
				activeOperator.function = o.function
				scene.add(activeOperator)
			}
		}
	}

	let scopePosition = new THREE.Vector3()

	let animationStage = null;
	updateFunctions.push(function()
	{
		scopePosition.x = -camera.rightAtZZero + .7

		if(animationStage === null)
		{
			scopePosition.y = camera.topAtZZero
			for(let i = 0; i < scope.length; i++ )
			{
				let halfHeight = scope[i].getHeightWithPadding() / 2.;

				scopePosition.y -= halfHeight
				scope[i].position.lerp(scopePosition,.1)
				scopePosition.y -= halfHeight
			}

			let ready = true
			let distanceRequirement = .03

			for(let i = 0; i < operands.length; i++)
			{
				if(operands[i].parent !== scene)
					ready = false
				else
				{
					operands[i].position.lerp(operandPositions[i],0.1)
					if( operands[i].position.distanceTo(operandPositions[i] ) > distanceRequirement )
						ready = false
				}
			}

			if( activeOperator.parent !== scene )
				ready = false
			else
			{
				activeOperator.position.lerp(zeroVector,0.1)
				if( activeOperator.position.distanceTo(zeroVector ) > distanceRequirement )
					ready = false
			}

			if(ready)
				animationStage = 0.
		}
		else
		{
			// if( mouse.clicking && !mouse.oldClicking )
			// 	animationStage = 1. - frameDelta * .001

			switch(Math.floor(animationStage))
			{
				case 0: //just staring, til the end
					{
						let secondsThisSectionTakes = .3;
						let increment = frameDelta / secondsThisSectionTakes

						animationStage += increment
					}
					break;

				case 1:
					let newMultivectorElements = activeOperator.function(operands[0].elements,operands[1].elements)
					if( searchArray(scope,newMultivectorElements) )
					{
						console.error("already got that in the scope, can do something here")
					}

					let newMultivector = MultivectorAppearance(scopeOnClick, newMultivectorElements)
					clickables.push(newMultivector)
					
					newMultivector.updateAppearance()

					scene.remove(operands[0],operands[1],activeOperator)
					scene.add(newMultivector)
					log(newMultivector.elements)

					//goal
					{
						if(singularGoalMultivector !== null)
						{
							if( equalsMultivector(singularGoalMultivector.elements,newMultivector.elements) )
							{
								setGoalAchievement(true)
							}
							else
							{
								setGoalIrritation(1.)
								scope.push(newMultivector)
							}
						}
						else
						{
							scope.push(newMultivector)
						}
					}
					animationStage = 2.;
					break;

				case 2:
					{
						let secondsThisSectionTakes = 1.1;
						animationStage += frameDelta / secondsThisSectionTakes
					}
					break;

				case 3:
					animationStage = null;
					break;
			}
		}
	})
}