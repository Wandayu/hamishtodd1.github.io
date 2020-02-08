function initOperationInterface()
{
	var activeOperator = OperatorAppearance()

	var operands = [
		MultivectorAppearance(function(){}),
		MultivectorAppearance(function(){}) ]
	scene.remove(operands[0],operands[1])
	var operandAndActiveOperatorPositions = [
		new THREE.Vector3( 0.,1.,0.),
		new THREE.Vector3( 1.,0.,0.),
		new THREE.Vector3( 0.,0.,0.)]
	var operandsAndActiveOperator = [
		operands[0],
		operands[1],
		activeOperator
	]

	let lastAssignedOperand = 0
	ScopeMultivector = function(elements, sendToScopeImmediately)
	{
		let newScopeMultivector = MultivectorAppearance(function(multivecToCopy)
		{
			if(animationStage !== -1.)
				completeAnimation()

			let operandToUse = operands[1-lastAssignedOperand]
			lastAssignedOperand = 1 - lastAssignedOperand

			operandToUse.copyElements(multivecToCopy.elements)
			operandToUse.position.copy(multivecToCopy.position)
			scene.add(operandToUse)

			if(scopeIsLimited)
				removeFromScope(multivecToCopy)

			potentiallyTriggerAnimation()
		},elements)
		multivectorScope.push(newScopeMultivector)

		if(sendToScopeImmediately)
			getMultivectorScopePosition(multivectorScope.length-1,newScopeMultivector.position)

		return newScopeMultivector
	}

	ScopeOperator = function(func,eventualScopeSize)
	{
		let newScopeOperator = OperatorAppearance(func)
		clickables.push(newScopeOperator)
		newScopeOperator.onClick = function()
		{
			if(animationStage !== -1.)
				completeAnimation()

			activeOperator.material.color.copy(newScopeOperator.material.color)
			activeOperator.material.map = newScopeOperator.material.map
			activeOperator.position.copy(newScopeOperator.position)
			activeOperator.function = newScopeOperator.function
			scene.add(activeOperator)

			if(scopeIsLimited)
				removeFromScope(newScopeOperator)

			potentiallyTriggerAnimation()
		}

		newScopeOperator.position.y = -camera.topAtZZero + .9

		operatorScope.push( newScopeOperator )

		scene.add(newScopeOperator)

		newScopeOperator.position.x = getOperatorScopeX(operatorScope.length-1,eventualScopeSize)

		return newScopeOperator
	}

	initScope()

	let animationMultivector = MultivectorAppearance(function(){})
	let animationStage = -1.;
	updateFunctions.push(function()
	{
		for(let i = 0; i < 3; i++)
			operandsAndActiveOperator[i].position.lerp(operandAndActiveOperatorPositions[i],.1)

		if(animationStage !== -1.) switch(Math.floor(animationStage))
		{
			case 0: //creating new thing
				{
					let newMultivectorElements = activeOperator.function(operands[0].elements,operands[1].elements)
					copyMultivector(newMultivectorElements, animationMultivector.elements)
					animationMultivector.updateAppearance()
					scene.remove(animationMultivector)

					// if( searchArray(multivectorScope,newMultivectorElements) ) //already in multivectorScope, could do something here

					animationStage++;
				}
				break;

			case 1: //waiting til they get into place then a little staring to clarify what's going to happen
				{
					let secondsThisSectionTakes = .9;
					animationStage += frameDelta / secondsThisSectionTakes
				}
				break;

			case 2:
				reactToNewMultivector(animationMultivector.elements)
				scene.add(animationMultivector)
				scene.remove(operands[0],operands[1],activeOperator)
				animationStage++;
				break;

			case 3: //admiring result
				{
					let secondsThisSectionTakes = 1.1;
					animationStage += frameDelta / secondsThisSectionTakes
				}
				break;

			case 4:
				completeAnimation()
				break;

			default:
				console.error("shouldn't be here")
				break;
		}
	})

	function potentiallyTriggerAnimation()
	{
		animationStage = 0.
		for(let i = 0; i < 3; i++)
		{
			if(operandsAndActiveOperator[i].parent !== scene)
				animationStage = -1.
		}
	}

	function completeAnimation()
	{
		scene.remove(operands[0],operands[1],activeOperator)
		scene.remove(animationMultivector)

		let newMultivector = ScopeMultivector(animationMultivector.elements)
		animationStage = -1.;
	}
}