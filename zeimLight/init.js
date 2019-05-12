/*
	Send to haxiomic/mrdoob/wannerstedt, get "make it nicer looking for free by doing this:"
	
	Make something with bloody puzzles
	The youtube thing is a colossal perverse incentive
		Subtleties in interactive learning is your raison d'etre, but here we are, making something non-interactive
*/

function init()
{
	initButtons()

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setClearColor(0xCCCCCC) //youtube
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	document.body.appendChild( renderer.domElement );

	initCameraAndRendererResizeSystem(renderer);
	var stage = initSurroundings();
	initMouse();
	// initFaceMaker()

	{
		let randomTri = new THREE.Mesh(new THREE.Geometry(), new THREE.MeshBasicMaterial({side:THREE.DoubleSide}))
		for(let i = 0; i < 3; i++)
		{
			randomTri.geometry.vertices.push( new THREE.Vector3(
				(Math.random()-0.5)*0.5,
				(Math.random()-0.5)*0.5,
				-0.1) )
		}
		log(randomTri.geometry.vertices)
		randomTri.geometry.faces.push(new THREE.Face3(0,1,2))
		for(let i = 0; i < 3; i++)
		{
			let line = new THREE.Line(new THREE.Geometry())
			line.geometry.vertices.push(new THREE.Vector3(),randomTri.geometry.vertices[i])
			randomTri.add(line)
		}
		scene.add(randomTri)

		let balls = Array(3)
		for(let i = 0; i <3; i++)
		{
			balls[i] = new THREE.Mesh(new THREE.SphereGeometry(0.03))
			balls[i].position.set(
				(Math.random()-0.5)*0.5,
				(Math.random()-0.5)*0.5,
				(Math.random()-0.5)*0.5
				)
			scene.add(balls[i])
		}

		//aight, now your job is to find a position and orientation for the triangle
		//such that there is a point with
	}

	function render()
	{
		{
			frameDelta = clock.getDelta();
			
			mouse.updateFromAsyncAndCheckClicks();

			for(var i = 0; i < updateFunctions.length; i++)
			{
				updateFunctions[i]();
			}

			frameCount++;
		}

		requestAnimationFrame( render );
		renderer.render( scene, camera );
	}

	return render
}

function initButtons()
{
	var buttons = {};

	bindButton = function( buttonName, onDown, buttonDescription,whileDown )
	{
		if(buttons[buttonName] !== undefined)
		{
			console.error("attempted to bind a button that already has a binding")
		}

		console.log("\n",buttonName + ": " + buttonDescription)
		buttons[buttonName] = {
			down: false,
			onDown: onDown
		}
		if(whileDown)
		{
			buttons[buttonName].whileDown = whileDown
		}
	}

	var buttonIndexGivenName = {
		"enter":13,
		"alt":18,
		"shift":16,

		"left":37,
		"up":38,
		"right":39,
		"down":12,
		"space":32,

		"[":219,
		"]":221
	}
	var keycodeArray = "0123456789abcdefghijklmnopqrstuvwxyz";
	function getButton(keyCode)
	{
		for( var buttonName in buttons )
		{
			if( keyCode === buttonIndexGivenName[buttonName] )
			{
				return buttons[buttonName]
			}
		}
		if( 48 <= keyCode && keyCode <= 57 )
		{
			let buttonName = keycodeArray[keyCode - 48]
			return buttons[buttonName]
		}
		if( 65 <= keyCode && keyCode <= 90 )
		{
			let buttonName = keycodeArray[keyCode - 55]
			return buttons[buttonName]
		}
		return null
	}

	//don't use ctrl or other things that conflict
	document.addEventListener( 'keydown', function(event)
	{
		let button = getButton(event.keyCode)

		if(button === null)
		{
			return
		}

		if(!button.down)
		{
			button.onDown()
			button.down = true
		}
	}, false );
	document.addEventListener( 'keyup', function(event)
	{
		let button = getButton(event.keyCode)

		if(button === null)
		{
			return
		}

		if( button.down )
		{
			// button.onUp()
			button.down = false
		}
	}, false );

	updateFunctions.push(function()
	{
		for(var buttonName in buttons )
		{
			if( buttons[buttonName].down && buttons[buttonName].whileDown )
			{
				buttons[buttonName].whileDown()
			}
		}
	})
}