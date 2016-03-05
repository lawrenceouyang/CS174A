// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

//Global Constants and Modifiers
var BLOCK_SIZE = 1;

var start_screen = new Material(vec4(1,1,1,1), 1, .1, .1,40, "textures/start_screen.jpg"),
	gold_mat = new Material(vec4(1,.8, 0, 1), 1, 1, 1, 60);
	glass_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 40, "textures/window.png");
	grass_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 40, "textures/grass2.jpg"),
	wood_mat = new Material(vec4(1,1,1,1), 1, .1, .1,40, "textures/wood.jpg"),
	dirt_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 40, "textures/dirt.jpg"),
	bedrock_mat = new Material( vec4( 1, 1, 1, 1 ), 1, .1, .1, 20, "textures/bedrock.jpg"),
	sleeve_mat = new Material( vec4( 1, 1, 1, 1 ), 1, .1, .1, 20, "textures/sleeves.jpg"),
	shirt_mat = new Material( vec4( 1, 1, 1, 1 ), 1, .1, .1, 20, "textures/shirt.jpg"),
	legs_mat = new Material( vec4( 1, 1, 1, 1 ), 1, .1, .1, 20, "textures/legs.jpg"),
	face_mat = new Material( vec4( 1, 1, 1, 1 ), 1, .1, .1, 20, "textures/face.jpg"),
	stone_brick_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/stone_brick.jpg"),
	wood_plank_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/wood_plank.jpg"),
	leaves_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/leaves.jpg"),
	clay_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/clay.jpg"),
	clay_pot_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/clay_pot.jpg"),
	cactus_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/cactus.png"),
	cactus2_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/cactus2.png"),
	stone_mat = new Material(vec4(1,1,1,1), 1, .1, .1, 20, "textures/stone.jpg");


//Global Class Creator
var world = new World(11);
var player = new Player(0, 1, 0, 0.075*BLOCK_SIZE);
var camera = new Camera();

var block_type = ["grass", "dirt", "stone", "bedrock", "trunk", "treetop", "stone_brick", 
				  "stone_pillar", "wood_plank", "wood_pillar", "potted_plant", "table", "chalice", "window1", "window2",
				  "gold_block", "gold_cap", "gold_pillar"];
var start_screen_open = true;

var place_sound = [new Audio("./audio/stone1.wav"), new Audio("./audio/stone2.wav"), new Audio("./audio/stone3.wav")];
var bgm = new Audio("./audio/Haggstrom.mp3")
bgm.loop = true;
bgm.play();

//Create Bottom level
for (var i = 0; i < world.size; i++)
	for (var j = 0; j < world.size; j++) {
		world.world_coordinates[i][0][j] = new Block(i - Math.trunc(world.size/2), 0, j - Math.trunc(world.size/2), "grass");
	}

"use strict"
var canvas, canvas_size, gl = null, g_addrs,
	movement = vec2(),	thrust = vec3(), 	looking = false, prev_time = 0, animate = false, animation_time = 0;
		var gouraud = false, color_normals = false, solid = false;
function CURRENT_BASIS_IS_WORTH_SHOWING(self, model_transform) { self.m_axis.draw( self.basis_id++, self.graphicsState, model_transform, new Material( vec4( .8,.3,.8,1 ), 1, 1, 1, 40, "" ) ); }

// *******************************************************	
// When the web page's window loads it creates an "Animation" object.  It registers itself as a displayable object to our other class "GL_Context" -- which OpenGL is told to call upon every time a
// draw / keyboard / mouse event happens.

window.onload = function init() {	var anim = new Animation();	}
function Animation()
{
	( function init (self) 
	{
		self.context = new GL_Context( "gl-canvas" );
		self.context.register_display_object( self );
		
		gl.clearColor( 0, 0, 0, 1 );			// Background color

		self.m_hemisphere = new half_sphere(mat4(), 4);
		self.m_pyramid = new pyramid(mat4());
		self.m_weighted_cylinder = new weighted_capped_cylinder(0.75, 10, mat4());
		self.m_capped_cylinder = new capped_cylinder(10, mat4());
		self.m_cube = new my_cube(mat4());
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 40, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );

		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translate(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );
		
		//UI components
		self.UI = new GraphicsState( mat4(), mat4(), 0 );
		self.UI_transform = mult(mat4(), rotate(-90, 0, 1, 0));
		self.UI_transform = mult(self.UI_transform, scale(1, .15, .09));

		//UI Block Selector
		self.UI_selector = 0;
		self.UI_selector_transform = mult(self.UI_transform, translate(0, -5, -8));
		self.UI_selector_transform = mult(self.UI_selector_transform, scale(2,2,2));
		//gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		
		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		//Music & Sound
		self.music = new Audio("./audio/Haggstrom.mp3");

		self.music.loop = true;
		self.music.addEventListener("loadeddata", function(){self.music.currentTime=3;});


		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', rotate_camera);

	canvas.requestPointerLock = canvas.requestPointerLock ||
							 	canvas.mozRequestPointerLock ||
							 	canvas.webkitRequestPointerLock;

	canvas.addEventListener('click', function() {
		canvas.requestPointerLock();
		start_screen_open = false;
	});
	
	canvas.addEventListener('mousedown', function(e) {
			if (camera.direction_x > 225 && camera.direction_x <= 315 ) {
				if (e.button === 0 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) - 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] == null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) - 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] = new Block(Math.trunc(player.pos_x) - 2, 
										   																	 Math.trunc(player.pos_y), 
										   																	 Math.trunc(player.pos_z), block_type[player.selector]);
					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}
				else if (e.button === 2 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) - 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] != null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) - 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] = null;

   					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}
			}

			else if (camera.direction_x > 135 && camera.direction_x <= 225) {
				if (e.button === 0 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) + 2] == null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) + 2] = new Block(Math.trunc(player.pos_x), 
										   																	 Math.trunc(player.pos_y), 
										   																	 Math.trunc(player.pos_z) + 2, block_type[player.selector]);
					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}
				else if (e.button === 2  && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) + 2] != null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) + 2] = null;

					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}	
			}

			else if (camera.direction_x > 45 && camera.direction_x <= 135) {
				if (e.button === 0 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) + 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] == null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) + 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] = new Block(Math.trunc(player.pos_x) + 2, 
										   																	 Math.trunc(player.pos_y), 
										   																	 Math.trunc(player.pos_z), block_type[player.selector]);
					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}
				else if (e.button === 2 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) + 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] != null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2) + 2]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2)] = null;

					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}
			}						   
						
			else if (camera.direction_x > 0 && camera.direction_x <= 45 || camera.direction_x > 315 && camera.direction_x <= 360) {
				if (e.button === 0 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) - 2] == null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) - 2] = new Block(Math.trunc(player.pos_x), 
										    																		 Math.trunc(player.pos_y), 
										   																		 Math.trunc(player.pos_z) - 2, block_type[player.selector]);
					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}				   
				else if (e.button === 2 && world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) - 2] != null) {
					world.world_coordinates[Math.trunc(player.pos_x) + Math.trunc(world.size/2)]
										   [Math.trunc(player.pos_y)]
										   [Math.trunc(player.pos_z) + Math.trunc(world.size/2) - 2] = null;
					place_sound[getRandomInt(0, place_sound.length - 1)].play();
					}
			}
 	}, false);

	canvas.addEventListener('DOMMouseScroll', function(e) {
		if (e.detail > 0)
			player.selector++;
		else if (e.detail < 0)
			player.selector--;
		if (player.selector == -1) player.selector = block_type.length - 1;
		if (player.selector == block_type.length) player.selector = 0;
	});

	document.exitPointerLock = document.exitPointerLock ||
							   document.mozExitPointerLock ||
							   document.webkitExitPointerLock;

}
Animation.prototype.closeStartScreen = function() 
{

}
function rotate_camera(e) {
	var mov_x = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
	var mov_y = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

	camera.direction_x = (camera.direction_x + mov_x/8) % 360;
	if (camera.direction_x < 0)
		camera.direction_x = camera.direction_x + 360;
	camera.direction_y = camera.direction_y + mov_y/8;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here

Animation.prototype.init_keys = function()
{
	shortcut.add( "q",	   function() { thrust[1] = -1; } );			shortcut.add( "q", 	   function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "/",     function() { thrust[1] =  1; } );			shortcut.add( "/",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "up",     function() { thrust[2] =  1; } );			shortcut.add( "up",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "left",     function() { thrust[0] =  1; } );			shortcut.add( "left",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "down",     function() { thrust[2] = -1; } );			shortcut.add( "down",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "right",     function() { thrust[0] = -1; } );		shortcut.add( "right",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( ",",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0,  1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;
	shortcut.add( ".",     ( function(self) { return function() { self.graphicsState.camera_transform = mult( rotate( 3, 0, 0, -1 ), self.graphicsState.camera_transform ); }; } ) (this) ) ;

	shortcut.add( "r",     ( function(self) { return function() { self.graphicsState.camera_transform = mat4(); }; } ) (this) );
	shortcut.add( "ALT+s", function() { solid = !solid;					gl.uniform1i( g_addrs.SOLID_loc, solid);	
																		gl.uniform4fv( g_addrs.SOLID_COLOR_loc, vec4(Math.random(), Math.random(), Math.random(), 1) );	 } );
	shortcut.add( "ALT+g", function() { gouraud = !gouraud;				gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);	} );
	shortcut.add( "ALT+n", function() { color_normals = !color_normals;	gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);	} );
	shortcut.add( "ALT+a", function() { animate = !animate; } );
	
	shortcut.add( "p",     ( function(self) { return function() { self.m_axis.basis_selection++; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );
	shortcut.add( "m",     ( function(self) { return function() { self.m_axis.basis_selection--; console.log("Selected Basis: " + self.m_axis.basis_selection ); }; } ) (this) );	

	shortcut.add( "d",	function() {player.movement[0] =  1; player.moving = true;});		shortcut.add( "d",	function() {if (player.movement[0] ==  1) player.movement[0] = 0; player.moving = false;}, {'type':'keyup'});
	shortcut.add( "w", 	function() {player.movement[1] = -1; player.moving = true;});		shortcut.add( "w", 	function() {if (player.movement[1] == -1) player.movement[1] = 0; player.moving = false;}, {'type':'keyup'});	
	shortcut.add( "a", 	function() {player.movement[0] = -1; player.moving = true;});		shortcut.add( "a", 	function() {if (player.movement[0] == -1) player.movement[0] = 0; player.moving = false;}, {'type':'keyup'});		
	shortcut.add( "s", 	function() {player.movement[1] =  1; player.moving = true;}); 		shortcut.add( "s", 	function() {if (player.movement[1] ==  1) player.movement[1] = 0; player.moving = false;}, {'type':'keyup'});
	shortcut.add( "Space", 	function() {player.movement[2] = 1; player.moving = true;});	shortcut.add( "Space", function() {if (player.movement[2] == 1) player.movement[2] = 0; player.moving = false;}, {'type':'keyup'});
	shortcut.add( "z", function() {player.movement[2] = -1; player.moving = true;}); shortcut.add( "z", function() {if(player.movement[2] == -1) player.movement[2] = 0; player.moving = false;}, {'type':'keyup'});

	shortcut.add( "o", function() { if (camera.mode > 0) camera.mode = 0; else camera.mode = camera.mode + 1;});
	shortcut.add( ";", function() { camera.mode = 3;}); //debug camera

}

function update_camera( self, animation_delta_time )
	{
		var leeway = 70, border = 50;
		var degrees_per_frame = .0005 * animation_delta_time;
		var meters_per_frame  = .03 * animation_delta_time;
																					// Determine camera rotation movement first
		var movement_plus  = [ movement[0] + leeway, movement[1] + leeway ];		// movement[] is mouse position relative to canvas center; leeway is a tolerance from the center.
		var movement_minus = [ movement[0] - leeway, movement[1] - leeway ];
		var outside_border = false;
		
		for( var i = 0; i < 2; i++ )
			if ( Math.abs( movement[i] ) > canvas_size[i]/2 - border )	outside_border = true;		// Stop steering if we're on the outer edge of the canvas.

		for( var i = 0; looking && outside_border == false && i < 2; i++ )			// Steer according to "movement" vector, but don't start increasing until outside a leeway window from the center.
		{
			var velocity = ( ( w_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
			self.graphicsState.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
		}
		self.graphicsState.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
	}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

Animation.prototype.display = function(time)
{
	if(!time) time = 0;
	this.animation_delta_time = time - prev_time;
	if(animate) this.graphicsState.animation_time += this.animation_delta_time;
	prev_time = time;
	
	update_camera( this, this.animation_delta_time );
		
	this.basis_id = 0;

	if (start_screen_open) {
		start_transform = mult(this.UI_transform, scale(14,14,14));
		start_transform = mult(start_transform, rotate(180, 0, 1, 0));
		this.m_strip.draw(this.UI, start_transform, start_screen);
	}
	else {
	//draw UI
	this.m_strip.draw(this.UI, this.UI_transform, new Material(vec4(1,1,1,1), 1,0,0, 50, "textures/c_hair.png"));

	this.draw_block(this.UI, this.UI_selector_transform, block_type[player.selector]);

	//Initialize world bounds
	this.draw_world(world);
	//Draw all objects that currently exist
	this.draw_objects(world);

	//Draw player
	player.update_location(this.graphicsState.animation_time);
	this.move_cam();
	this.draw_player(player);
}

}	


//world defines the limits of the world and contains world information
function World(world_size)
{
	this.world_coordinates = new Array(world_size);
	for (var i = 0; i < world_size; i++) {
			this.world_coordinates[i] = new Array(world_size);
			for (var j = 0; j < world_size; j++) {
				this.world_coordinates[i][j] = new Array(world_size);
			}
		}

	this.size = world_size;
	this.rotation_angle = 0;
	this.sky_texture = new Material( vec4( 1, 1, 1, 1), 1, 0, 0, 40, "textures/sky.jpg");
}

//Player functions
function Player(x, y, z, speed)
{
	this.pos_x = x;
	this.pos_y = y;
	this.pos_z = z;
	this.direction = 0;

	this.movement_speed = speed;
	this.movement = [0, 0, 0];

	this.selector = 0;

	this.moving = false;
	this.left_arm_forward = true;
	this.left_arm_backward = false;
	this.left_arm_angle = 0;

	this.right_arm_forward = false;
	this.right_arm_backward = true;
	this.right_arm_angle = 0;
}

Player.prototype.update_location = function(time)
{
	var prev_x = this.pos_x;
	var prev_y = this.pos_y;
	var prev_z = this.pos_z;

	this.pos_x = this.pos_x + this.movement[1]*this.movement_speed*-1*Math.sin(camera.direction_x*Math.PI/180)
							+ this.movement[0]*this.movement_speed*-1*Math.sin((camera.direction_x - 90)*Math.PI/180);
	this.pos_y = this.pos_y + this.movement[2]*this.movement_speed;
	this.pos_z = this.pos_z + this.movement[1]*this.movement_speed*Math.cos(camera.direction_x*Math.PI/180)
							+ this.movement[0]*this.movement_speed*Math.cos((camera.direction_x - 90)*Math.PI/180);

	//Check if player is within bounds of world
	if (this.pos_x > world.size/2 || this.pos_x < -world.size/2) this.pos_x = prev_x;
	if (this.pos_y > world.size || this.pos_y < 0) 				 this.pos_y = prev_y;
	if (this.pos_z > world.size/2 || this.pos_z < -world.size/2) this.pos_z = prev_z;
}

function Camera() 
{
	//swap between free camera, first person, and third person
	this.mode = 0;
	this.direction_x = 0;
	this.direction_y = 0;
}

function Block(x, y, z, type)
{
	this.pos_x = x;
	this.pos_y = y;
	this.pos_z = z;
	this.type = type;
}

Animation.prototype.move_cam = function()
{
	/* if (camera.direction > camera.target_direction)
		camera.direction = camera.direction - 2;
	else if (camera.direction < camera.target_direction)
		camera.direction = camera.direction - 2;
	*/
	if (camera.direction_y < -60) camera.direction_y = -60;
	if (camera.direction_y > 53) camera.direction_y = 53;

	var y_roll = -camera.direction_x*Math.PI/180;
	var x_roll = -camera.direction_y*Math.PI/180;

	var eye = new vec3(player.pos_x - Math.sin(y_roll), player.pos_y + 1, player.pos_z - Math.cos(y_roll));
	var at  = new vec3(player.pos_x - 10*Math.sin(y_roll), player.pos_y + 10*Math.sin(x_roll), player.pos_z - 10*Math.cos(y_roll));
	var up  = new vec3(Math.sin(y_roll), 1, Math.cos(y_roll));

	if (camera.mode == 0) 
		this.graphicsState.camera_transform = lookAt(eye, at, up);
	if (camera.mode == 1) 
		this.graphicsState.camera_transform = lookAt(vec3(player.pos_x + 6*Math.sin(y_roll), player.pos_y + 3, player.pos_z + 6*Math.cos(y_roll)), 
													 at,
													 vec3(-Math.sin(y_roll), 1, -Math.cos(y_roll)));
}

//Model drawing functions
Animation.prototype.draw_world = function(world)
{
	world.rotation_angle = world.rotation_angle + this.animation_delta_time/400;
	var model_transform = mult(new mat4(), rotate(world.rotation_angle, 0, 1, 0));
		model_transform = mult(model_transform, rotate(90, 1, 0, 0));
	model_transform = mult(model_transform, scale(2*world.size*BLOCK_SIZE*BLOCK_SIZE, 2*world.size*BLOCK_SIZE*BLOCK_SIZE, 2*world.size*BLOCK_SIZE*BLOCK_SIZE));
	this.m_capped_cylinder.draw(this.graphicsState, model_transform, world.sky_texture);
}


//probably change to draw_objects since not all placeable objects are blocks

Animation.prototype.draw_objects = function(world)
{
	var model_transform = mult(new mat4(), scale(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE));
	for (var i = 0; i < world.size; i++)
		for (var j = 0; j < world.size; j++)
			for (var k = 0; k < world.size; k++)
				if (world.world_coordinates[i][j][k] != null) {
					model_transform = mult(mat4(),translate(world.world_coordinates[i][j][k].pos_x,
																	 world.world_coordinates[i][j][k].pos_y,
																	 world.world_coordinates[i][j][k].pos_z));
				this.draw_block(this.graphicsState, model_transform, world.world_coordinates[i][j][k].type);
				}
}

Animation.prototype.draw_block = function(graphicsState, model_transform, type) 
{
	switch(type) {
		case"stone_brick":
			this.m_cube.draw(graphicsState, model_transform, stone_brick_mat);
			break;
		case"wood_plank":
			this.m_cube.draw(graphicsState, model_transform, wood_plank_mat);
			break;
		case"gold_block":
			this.m_cube.draw(graphicsState, model_transform, gold_mat);
			break;
		case "bedrock":
			this.m_cube.draw(graphicsState, model_transform, bedrock_mat);
			break;
		case "dirt":
			this.m_cube.draw(graphicsState, model_transform, dirt_mat);
			break;
		case "grass":
			this.m_cube.draw(graphicsState, model_transform, grass_mat);
			break;
		case "stone":
			this.m_cube.draw(graphicsState, model_transform, stone_mat);
			break;
		case "trunk":
			model_transform = mult(model_transform, rotate(-90, 1,0,0));
			model_transform = mult(model_transform, scale(.25,.25,.5));
			this.m_capped_cylinder.draw(graphicsState, model_transform, wood_mat);
			break;
		case "wood_pillar":
			model_transform = mult(model_transform, rotate(-90, 1,0,0));
			model_transform = mult(model_transform, scale(.375,.375,.5));
			this.m_capped_cylinder.draw(graphicsState, model_transform, wood_plank_mat);
			break;
		case "stone_pillar":
			model_transform = mult(model_transform, rotate(-90, 1,0,0));
			model_transform = mult(model_transform, scale(.375,.375,.5));
			this.m_capped_cylinder.draw(graphicsState, model_transform, stone_brick_mat);
			break;
		case "gold_pillar":
			model_transform = mult(model_transform, rotate(-90, 1,0,0));
			model_transform = mult(model_transform, scale(.375,.375,.5));
			this.m_capped_cylinder.draw(graphicsState, model_transform, gold_mat);
			break;
		case "gold_cap":
			this.m_pyramid.draw(graphicsState, model_transform, gold_mat);
			break;
		case "treetop":
			this.m_pyramid.draw(graphicsState, mult(model_transform, scale(2, 1, 2)), leaves_mat);
			model_transform = mult(model_transform, translate(0, 0.5, 0));
			model_transform = mult(model_transform, scale(1.5, 1, 1.5));
			this.m_pyramid.draw(graphicsState, model_transform, leaves_mat);
			break;
		case "potted_plant":
			mt = model_transform;
			model_transform = mult(model_transform, translate(0, -0.385, 0));
			model_transform = mult(model_transform, rotate(-90, 1,0,0));
			model_transform = mult(model_transform, scale(.25,.25,.1));
			this.m_cylinder.draw(graphicsState, mult(model_transform, translate(0, 0, 1.25)), clay_mat);
			this.m_weighted_cylinder.draw(graphicsState, model_transform, clay_pot_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(0, -0.2, 0));
			model_transform = mult(model_transform, rotate(-25, 0,1,0));
			model_transform = mult(model_transform, rotate(-90, 1,0,0));
			model_transform = mult(model_transform, scale(.125,.125,.5));
			this.m_cylinder.draw(graphicsState, model_transform, cactus2_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(0, 0.05, 0));
			model_transform = mult(model_transform, scale(.125,.125,.125));
			this.m_hemisphere.draw(graphicsState, model_transform, cactus_mat);
			break;
		case "table":
			model_transform = mult(model_transform, translate(0, 0.4, 0));
			var mt = model_transform;
			model_transform = mult(model_transform, rotate(-90, 0, 0, 1));
			model_transform = mult(model_transform, scale(0.2, 1, 1));
			this.m_cube.draw(graphicsState, model_transform, wood_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(0.4, -0.5, 0.4));
			model_transform = mult(model_transform, scale(0.2, 0.8, 0.2));
			this.m_cube.draw(graphicsState, model_transform, wood_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(-0.4, -0.5, 0.4));
			model_transform = mult(model_transform, scale(0.2, 0.8, 0.2));
			this.m_cube.draw(graphicsState, model_transform, wood_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(0.4, -0.5, -0.4));
			model_transform = mult(model_transform, scale(0.2, 0.8, 0.2));
			this.m_cube.draw(graphicsState, model_transform, wood_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(-0.4, -0.5, -0.4));
			model_transform = mult(model_transform, scale(0.2, 0.8, 0.2));
			this.m_cube.draw(graphicsState, model_transform, wood_mat);
			break;
		case "chalice":
			var mt = model_transform;
			model_transform = mult(model_transform, translate(0, -0.495, 0));
			model_transform = mult(model_transform, rotate(-90, 1, 0, 0));
			model_transform = mult(model_transform, scale(.1, .1, .01))
			this.m_capped_cylinder.draw(graphicsState, model_transform, gold_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(0, -0.375, 0));
			model_transform = mult(model_transform, rotate(-90, 1, 0, 0));
			model_transform = mult(model_transform, scale(.01, .01, 0.125));
			this.m_capped_cylinder.draw(graphicsState, model_transform, gold_mat);
			model_transform = mt;
			model_transform = mult(model_transform, translate(0, -0.1, 0));
			model_transform = mult(model_transform, rotate(180, 1, 0, 0));
			model_transform = mult(model_transform, scale(.125, .2, .125));
			this.m_hemisphere.draw(graphicsState, model_transform, gold_mat);
			break;
		case "window1":
			model_transform = mult(model_transform, scale(0.1, .999, .999));
			this.m_cube.draw(graphicsState, model_transform, glass_mat);
			break;
		case "window2":
			model_transform = mult(model_transform, rotate(90, 0, 1, 0));
			model_transform = mult(model_transform, scale(0.1, .999, .999));
			this.m_cube.draw(graphicsState, model_transform, glass_mat);
			break;
			

	}
}

Animation.prototype.draw_player = function(player)
{
	var model_transform = mult(new mat4(), translate(player.pos_x, player.pos_y, player.pos_z));

	model_transform = mult(model_transform, rotate(-camera.direction_x, 0, 1, 0));

	model_transform = mult(model_transform, translate(0, .6, 0));
	this.draw_body(model_transform);


	model_transform = mult(model_transform, translate(0, 0.125, 0));
	this.draw_head(model_transform);

	this.draw_left_arm(model_transform);
	this.draw_right_arm(model_transform);

	model_transform = mult(model_transform, translate(0, -0.125, 0));
	this.draw_left_leg(model_transform);
	this.draw_right_leg(model_transform);
}

Animation.prototype.draw_body = function(model_transform) 
{
	model_transform = mult(model_transform, scale(0.4, .6, 0.25));
	this.m_cube.draw(this.graphicsState, model_transform, shirt_mat);
}

Animation.prototype.draw_head = function(model_transform)
{
	model_transform = mult(model_transform, rotate(-camera.direction_y, 1, 0, 0));
	model_transform = mult(model_transform, rotate(90, 0, 1, 0));
	model_transform = mult(model_transform, translate(0, 0.375, 0));
	model_transform = mult(model_transform, scale(0.25, 0.25, 0.25));
	this.m_sphere.draw(this.graphicsState, model_transform, face_mat);
}

Animation.prototype.draw_left_arm = function(model_transform)
{
	model_transform = mult(model_transform, translate(0.2, 0, 0));

	if (player.moving) {
		if (player.left_arm_forward) {
			player.left_arm_angle = player.left_arm_angle + this.animation_delta_time/4;
			if (player.left_arm_angle >= 45) {
				player.left_arm_forward = false;
				player.left_arm_backward = true;
			}
		}
		if (player.left_arm_backward) {
			player.left_arm_angle = player.left_arm_angle - this.animation_delta_time/4;
			if (player.left_arm_angle <= -45) {
				player.left_arm_backward = false;
				player.left_arm_forward = true;
			}
		}
	}
	else {
		if (player.left_arm_angle < 0) 
			player.left_arm_angle = player.left_arm_angle + this.animation_delta_time/4;
		else if (player.left_arm_angle > 0)
			player.left_arm_angle = player.left_arm_angle - this.animation_delta_time/4;

		if (Math.abs(Math.trunc(player.left_arm_angle)) < 3)
			player.left_arm_angle = 0;
	}

	model_transform = mult(model_transform, translate(.1, 0, 0));

	model_transform = mult(model_transform, rotate(player.left_arm_angle, 1,0,0));
	var mt = model_transform;
	model_transform = mult(model_transform, scale(.2, .3, .2));
	this.m_cube.draw(this.graphicsState, model_transform, shirt_mat);
	model_transform = mt;
	model_transform = mult(model_transform, translate(0, -.15, 0));
	model_transform = mult(model_transform, rotate(Math.abs(player.left_arm_angle*1.5), 1, 0, 0));
	model_transform = mult(model_transform, translate(0, -.15, 0));
	model_transform = mult(model_transform, scale(.2, .3, .2));
	this.m_cube.draw(this.graphicsState, model_transform, sleeve_mat);

}

Animation.prototype.draw_right_arm = function(model_transform)
{
	model_transform = mult(model_transform, translate(-0.4, 0, 0));
	model_transform = mult(model_transform, translate(.1, 0, 0));

	model_transform = mult(model_transform, rotate(-player.left_arm_angle, 1,0,0));
	var mt = model_transform;
	model_transform = mult(model_transform, scale(.2, .3, .2));
	this.m_cube.draw(this.graphicsState, model_transform, shirt_mat);
	model_transform = mt;
	model_transform = mult(model_transform, translate(0, -.15, 0));
	model_transform = mult(model_transform, rotate(Math.abs(player.left_arm_angle*1.5), 1, 0, 0));
	model_transform = mult(model_transform, translate(0, -.15, 0));
	model_transform = mult(model_transform, scale(.2, .3, .2));
	this.m_cube.draw(this.graphicsState, model_transform, sleeve_mat);
}

Animation.prototype.draw_left_leg = function(model_transform)
{
	model_transform = mult(model_transform, rotate(player.left_arm_angle, 1,0,0));
	model_transform = mult(model_transform, translate(-.1, -.5, 0));
	var mt = model_transform;
	model_transform = mult(model_transform, scale(.2, .4, .2));
	this.m_cube.draw(this.graphicsState, model_transform, shirt_mat);
	model_transform = mt;
	model_transform = mult(model_transform, translate(0, -.2, 0));
	model_transform = mult(model_transform, rotate(-Math.abs(player.left_arm_angle*1.5), 1,0,0));
	model_transform = mult(model_transform, translate(0, -.2, 0));
	model_transform = mult(model_transform, scale(.2, .4, .2));
	this.m_cube.draw(this.graphicsState, model_transform, legs_mat);
}

Animation.prototype.draw_right_leg = function(model_transform)
{
	model_transform = mult(model_transform, rotate(-player.left_arm_angle, 1,0,0));
	model_transform = mult(model_transform, translate(.1, -.5, 0));
	var mt = model_transform;
	model_transform = mult(model_transform, scale(.2, .4, .2));
	this.m_cube.draw(this.graphicsState, model_transform, shirt_mat);
	model_transform = mt;
	model_transform = mult(model_transform, translate(0, -.2, 0));
	model_transform = mult(model_transform, rotate(-Math.abs(player.left_arm_angle*1.5), 1,0,0));
	model_transform = mult(model_transform, translate(0, -.2, 0));
	model_transform = mult(model_transform, scale(.2, .4, .2));
	this.m_cube.draw(this.graphicsState, model_transform, legs_mat);

}


Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_object.string_map["player"] = "Player " + Math.trunc(player.pos_x) + ", " + Math.trunc(player.pos_y) + ", " + Math.trunc(player.pos_z);
	debug_screen_object.string_map["FPS"] = Math.round(1/(this.animation_delta_time/1000),1) + "fps";
	debug_screen_object.string_map["camera"] = "Camera " + Math.round(camera.direction_x) + ", " + Math.round(camera.direction_y);
}