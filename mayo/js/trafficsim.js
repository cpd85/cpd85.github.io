//canvas stuff
var c, ctx
var START_POS=700

//button variables
var reset = false;
var pause = false;
var firstStart = true;


//car characteristics
var MAX_SPEED= 1
var CAR_LEN = 20
var CAR_WID = 10

//car array stuff
var cars = [];
var LAST_CAR_INDEX=-1

//higher numbers = more frequent
var CAR_FREQ = .02

//called with start/pause button
function init(){
	if(firstStart){
		c = document.getElementById("canvas")
		ctx = c.getContext("2d")
		firstStart = false;
		return setInterval(simulate, 10);
	}
	else if(pause){
		pause = false;
	}
	else{
		pause = true;
	}
}

//draws dotted divider on road
function drawLane(){
	//dotted line rectangle x
	var lx=0
	ctx.fillStyle = "rgba(255, 255, 255, 1)"
	while(lx<700){
		ctx.beginPath()
		ctx.rect(lx, 149, 10, 3)
		ctx.closePath()
		ctx.fill()
		lx+=15
	}
}

//draws the entire scene
function renderScene(){
	ctx.fillStyle = "rgba(0, 255, 0, 1)"
	ctx.beginPath()
	ctx.rect(0, 0, 700, 100)
	ctx.closePath()
	ctx.fill()

	ctx.fillStyle = "rgba(0, 0, 0, .5)"
	ctx.beginPath()
	ctx.rect(0, 100, 700, 100)
	ctx.closePath()
	ctx.fill()

	ctx.fillStyle = "rgba(0, 255, 0, 1)"
	ctx.beginPath()
	ctx.rect(0, 200, 700, 100)
	ctx.closePath()
	ctx.fill()

	drawLane()

	ctx.fillStyle = "rgba(0, 0, 0, 1)"
	ctx.beginPath()
	//120 is "height" of lane 1
	ctx.rect(100, 100, CAR_LEN, CAR_WID)
	ctx.closePath()
	ctx.fill()

	drawCars()
}

/*sets speed of car based on space between current car and the car in front of it
and how curious the driver is of the broken car*/
function setSpeed(car,mSPEED){
	var dx;
	if(car.nCar != -1){
		var nextCar = cars[car.nCar]
		var space = car.x - nextCar.x - 20

		if(space<5){
			dx =0
		}
		else if(space>100){
			dx =mSPEED
		}
		else{
			dx =(mSPEED/2)+((space-20)/Math.sqrt(Math.pow((space-20),2)+50))*(mSPEED/2);
		}
	}
	else{
		dx = mSPEED;
	}
	car.dx = dx;
}


/*sets the "curiosity variable" which influences the speed of the car*/
function getCuriosityFactor(car){
	/*Background
	//120 is sight of accident
	//580 is 700 - (sight of accident)
	1/1000 and 1/5000 are scaling constants
	*/

	
	/*The following variables are based on these assumptions
		1) the driver is a she
		2) the closer the driver gets to the crash sight the quicker
		   her curiostity will get satisfied
		3) the more curious the the driver is the longer it will take 
		   to satisfy her curiosity
		4) the faster the driver is going the slower her curiosity
		    will be fulfilled*/
	

	/*df (distance factor) = distance car is from crash 
	sight represented as a % scaled by 1/1000*/
	var df = (1 - ((car.x -120)/580))*(1/1000);
	/*sC (specific curiosity of the current car) = current car's 
	curiosity scaled by 1/1000*/
	var sc = car.curious*(1/1000)
	/*sf (speed factor) = % of max speed the car's current speed 
	has to increase by in order to reach max speed scaled by 1/1000*/
	var sf = ((MAX_SPEED - car.dx)/MAX_SPEED)*(1/5000)

	/*dc = amount of curiosity satisfaction over
	current time interval */
	/*.000862 is essentially the amount a drivers curiosity satisfaction
	needs to be incremented by per time unit in order for the drivers speed
	to be "normal" EXACTLY as the driver passes the car

	calculations are complex but were made using these two equations
	Note: tu = time unit
	.5 = tu*dc     580 = .5*tu + (tu^2)*dc 
	*/
	var dc = .000862 + df - sc - sf;



	//increase total satisfaction by dc
	car.cf += dc;
	/*car.cf ranges from 0 to .5 such that MAX_SPEED can at most be halved
	in the function "update" when it is multiplied by (.5+car.cf)*/
	if(car.cf > .5){
		car.cf = .5;
	}
}

//updates the positions of each car being displated
function update(){
	i=0
	while(i<cars.length){
		car = cars[i]
		if(car !== undefined && car !== null)
		{
			//area in front of the broken car is between 120 and 700
			if(car.x > 120)
			{
				getCuriosityFactor(car);
				setSpeed(car,MAX_SPEED*(.5+car.cf));
			}
			//car has passed the obsicle
			else
			{
				/*
				For debugging...
				if(car.print){
					console.log(car.dx);
					car.print=false;
				}*/
				setSpeed(car,MAX_SPEED);
			}
			car.x -= car.dx

			//check if car has reached end of road
			if(car.x+CAR_LEN<0){
				if(car.i==LAST_CAR_INDEX)
				{
					//indicates that there are no cars on the road
					LAST_CAR_INDEX = -1
				}
				else{
					cars[car.pCar].nCar = -1 
				}
				cars[i] = null
			}
		}
		i++
	}
}

/*Checks if there is room in the environment for the car to spawn
(can only be called if cars array isn't empty)*/
function hasRoom(){
	return LAST_CAR_INDEX == -1 || cars[LAST_CAR_INDEX].x < 670;
}

/*finds an empty index in the "cars" array for new car info to be stored*/
function findCarIndex(){
	i=0
	while(i<=cars.length){
		if(cars[i] === undefined || cars[i] === null)
		{
			return i
		}
		i++;
	}
}

//adds a new car to the "cars"
function addCar(){
	if(hasRoom() && Math.random()<CAR_FREQ){
		var NEW_CAR_INDEX = findCarIndex();
		if(LAST_CAR_INDEX != -1){
			cars[LAST_CAR_INDEX].pCar = NEW_CAR_INDEX;
		}
		var newCar = {x:START_POS,
						dx:MAX_SPEED,
						pCar:-1,
						i:NEW_CAR_INDEX,
						nCar:LAST_CAR_INDEX,
						curious:Math.random(),
						space:null,
						cf:0,
						print:true}

		cars[NEW_CAR_INDEX] = newCar;
		//console.log(cars.length);
		LAST_CAR_INDEX = NEW_CAR_INDEX;
	}
}

//draw cars using car info in the "cars" array
function drawCars(){
	i=0
	while(i<cars.length){
		var car = cars[i];
		if(car !== null && car !== undefined)
		{
			ctx.fillStyle = "rgba(0, 0, 0, 1)"
			ctx.beginPath()
			//120 is "height" of lane 1
			ctx.rect(car.x, 120, CAR_LEN, CAR_WID)
			ctx.closePath()
			ctx.fill()
		}
		i++
	}
}

//simulate the traffic animation
function simulate(){
	ctx.clearRect(0,0,700,300)

	renderScene()
	
	if(reset){
		reset = false;
		cars = [];
		LAST_CAR_INDEX = -1;
	}

	if(!pause){
		addCar()
		update()
	}
}

