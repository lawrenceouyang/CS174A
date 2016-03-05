// *******************************************************
// CS 174a Graphics Example Code
// animation.js - The main file and program start point.  The class definition here describes how to display an Animation and how it will react to key and mouse input.  Right now it has 
// very little in it - you will fill it in with all your shape drawing calls and any extra key / mouse controls.  

// Now go down to display() to see where the sample shapes are drawn, and to see where to fill in your own code.

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
		
		gl.clearColor( 0, .7, 1, 1 );			// Background color

		self.m_cube = new cube();
		self.m_obj = new shape_from_file( "teapot.obj" )
		self.m_axis = new axis();
		self.m_sphere = new sphere( mat4(), 4 );	
		self.m_fan = new triangle_fan_full( 10, mat4() );
		self.m_strip = new rectangular_strip( 1, mat4() );
		self.m_cylinder = new cylindrical_strip( 10, mat4() );
		
		// 1st parameter is camera matrix.  2nd parameter is the projection:  The matrix that determines how depth is treated.  It projects 3D points onto a plane.
		self.graphicsState = new GraphicsState( translate(0, 0,-40), perspective(45, canvas.width/canvas.height, .1, 1000), 0 );

		gl.uniform1i( g_addrs.GOURAUD_loc, gouraud);		gl.uniform1i( g_addrs.COLOR_NORMALS_loc, color_normals);		gl.uniform1i( g_addrs.SOLID_loc, solid);
		
		self.context.render();	
	} ) ( this );	
	
	canvas.addEventListener('mousemove', function(e)	{		e = e || window.event;		movement = vec2( e.clientX - canvas.width/2, e.clientY - canvas.height/2, 0);	});
}

// *******************************************************	
// init_keys():  Define any extra keyboard shortcuts here
Animation.prototype.init_keys = function()
{
	shortcut.add( "Space", function() { thrust[1] = -1; } );			shortcut.add( "Space", function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "z",     function() { thrust[1] =  1; } );			shortcut.add( "z",     function() { thrust[1] =  0; }, {'type':'keyup'} );
	shortcut.add( "w",     function() { thrust[2] =  1; } );			shortcut.add( "w",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "a",     function() { thrust[0] =  1; } );			shortcut.add( "a",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "s",     function() { thrust[2] = -1; } );			shortcut.add( "s",     function() { thrust[2] =  0; }, {'type':'keyup'} );
	shortcut.add( "d",     function() { thrust[0] = -1; } );			shortcut.add( "d",     function() { thrust[0] =  0; }, {'type':'keyup'} );
	shortcut.add( "f",     function() { looking = !looking; } );
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
		var velocity = ( ( movement_minus[i] > 0 && movement_minus[i] ) || ( movement_plus[i] < 0 && movement_plus[i] ) ) * degrees_per_frame;	// Use movement's quantity unless the &&'s zero it out
		self.graphicsState.camera_transform = mult( rotate( velocity, i, 1-i, 0 ), self.graphicsState.camera_transform );			// On X step, rotate around Y axis, and vice versa.
	}
	self.graphicsState.camera_transform = mult( translate( scale_vec( meters_per_frame, thrust ) ), self.graphicsState.camera_transform );		// Now translation movement of camera, applied in local camera coordinate frame
}

// *******************************************************	
// display(): called once per frame, whenever OpenGL decides it's time to redraw.

//Parameters are set here

var purplePlastic = new Material(vec4(.4, 0, .9, 1), 1, 1, 1, 40),
	rubyRed = new Material(vec4(.8,0,0,1), 1, 1, 1, 40),
	greyPlastic = new Material(vec4(.5, .5, .5, 1), 1, 1, 1, 40),
    pureYellow = new Material(vec4(1, 1, 0, 1), 1, 1, 1, 40),
    grassGreen = new Material(vec4(0, .40, .1, 1), 1, 1, 0, 40),
    darkGrey = new Material(vec4(.2, .2, .2, 1), 1, 1, 1, 40),
    stickyBrown = new Material(vec4(.8 , .27, .1, 1), 1, 1, 1, 40);

var hover_height = 2;
var bee_rotation_speed = 75;
var bee_speed = 400; 
var leg_angle = 8;
var wing_angle = 60;
var swing_angle = 2;

Animation.prototype.display = function(time)
{
	if(!time) time = 0;
	this.animation_delta_time = time - prev_time;
	if(animate) this.graphicsState.animation_time += this.animation_delta_time;
	prev_time = time;
	
	update_camera( this, this.animation_delta_time );
		
	this.basis_id = 0;
	
	var model_transform = mat4();
	var model_stack = [];

	model_stack.push(model_transform);


    //Move downward to place plane and flower
	model_transform = mult(model_transform, translate(0, -10, 0));
    
	//draw the plane
   	this.draw_plane(model_transform);

   	//slightly move upward to avoid stem from clipping
   	model_transform = mult(model_transform, translate(0, 0.005, 0));

   	//draw the flower
   	this.draw_flower(model_transform);

   	//return to center
    model_transform = model_stack.pop();


    //Set bee to rotate and hover close to the center
    model_transform = mult(model_transform, translate(0, 10, 0));
	model_transform = mult(model_transform, rotate(this.graphicsState.animation_time / bee_rotation_speed, 0, 1, 0));
	model_transform = mult(model_transform, translate(0, 0, -15));
	model_transform = mult(model_transform, translate(0, Math.sin(this.graphicsState.animation_time/bee_speed)*hover_height, 0));
	
	//draw bee
	this.draw_bee(model_transform);
}	

Animation.prototype.update_strings = function( debug_screen_object )		// Strings this particular class contributes to the UI
{
	debug_screen_object.string_map["time"] = "Animation Time: " + this.graphicsState.animation_time/1000 + "s";
	debug_screen_object.string_map["basis"] = "Showing basis: " + this.m_axis.basis_selection;
	debug_screen_object.string_map["animate"] = "Animation " + (animate ? "on" : "off") ;
	debug_screen_object.string_map["thrust"] = "Thrust: " + thrust;
}


Animation.prototype.draw_plane = function(model_transform) 
{
	model_transform = mult(model_transform, scale(200, .01, 200));
	this.m_cube.draw(this.graphicsState, model_transform, grassGreen);
}

Animation.prototype.draw_flower = function(model_transform)
{
	//draw the stems
	for (var i = 0; i < 8; i++) {
		model_transform = mult(model_transform, rotate(swing_angle*Math.sin(this.graphicsState.animation_time/1000), 0,0,1));
		model_transform = mult(model_transform, translate(0, 1, 0));
		this.draw_stem(model_transform);
		model_transform = mult(model_transform, translate(0,1,0));
	}

	//draw the flower
	model_transform = mult(model_transform, translate(0, 2, 0));
	model_transform = mult(model_transform, scale(2, 2,2));
	this.m_sphere.draw(this.graphicsState, model_transform, rubyRed);
}

Animation.prototype.draw_stem = function(model_transform)
{
	model_transform = mult(model_transform, scale(0.5, 2, 0.5));
	this.m_cube.draw(this.graphicsState, model_transform, stickyBrown);
}

Animation.prototype.draw_bee = function(model_transform) 
{
	//bee center is located at thorax, and will be the reference point for all other bee components
	var bee_center = model_transform;

	//draw thorax
	model_transform = mult(model_transform, scale(2,1,1));
	this.m_cube.draw(this.graphicsState, model_transform, darkGrey);
	model_transform = mult(model_transform, scale(0.5,1,1));

	//draw abdomen
	model_transform = mult(model_transform, translate(3,0,0));
	model_transform = mult(model_transform, scale(2, 1, 1));
	this.m_sphere.draw(this.graphicsState, model_transform, pureYellow);
	
	model_transform = bee_center;

	//draw head
	model_transform = mult(model_transform, translate(-1.5, 0, 0));
	model_transform = mult(model_transform, scale(0.5, 0.5, 0.5));
	this.m_sphere.draw(this.graphicsState, model_transform, purplePlastic);

	model_transform = bee_center;

	//move to bottom of thorax
	model_transform = mult(model_transform, translate(0, -0.5, 0.5));

	//draw all six legs
	for (var i = 0; i < 2; i++) {
		for (var j = -0.5; j < 1; j+=0.5) {
			this.draw_leg(mult(model_transform, translate(j, 0, 0)));
		}
		leg_angle = -leg_angle;
		model_transform = mult(model_transform, translate(0, 0, -1));
	}

	model_transform = bee_center;

	//move to top of thorax
	model_transform = mult(model_transform, translate(0, 0.55, 0.5));

	//draw left wing
	this.draw_wing(model_transform, wing_angle);
	model_transform = mult(model_transform, translate(0, 0, -1));
	this.draw_wing(model_transform, -wing_angle);

}

Animation.prototype.draw_leg = function(model_transform)
{
	//draw the first segment
	model_transform = mult(model_transform, rotate(leg_angle*Math.cos(this.graphicsState.animation_time/800) - leg_angle, -1,0,0));
	model_transform = mult(model_transform, translate(0, -0.5, 0));
	model_transform = mult(model_transform, scale(0.2, 1, 0.2));
	this.m_cube.draw(this.graphicsState, model_transform, darkGrey);
	model_transform = mult(model_transform, scale(5, 1, 5));

	//draw the second segment
	model_transform = mult(model_transform, translate(0, -0.5, -0.1*Math.sign(leg_angle)));	
	model_transform = mult(model_transform, rotate(leg_angle*Math.cos(this.graphicsState.animation_time/800) - leg_angle, -1,0,0));
	model_transform = mult(model_transform, translate(0, -0.5, 0.1*Math.sign(leg_angle)));
	model_transform = mult(model_transform, scale(0.2, 1, 0.2));
	this.m_cube.draw(this.graphicsState, model_transform, darkGrey);
}


Animation.prototype.draw_wing = function(model_transform, angle)
{
	model_transform = mult(model_transform, rotate(angle*Math.cos(this.graphicsState.animation_time/50), 1, 0, 0));
	model_transform = mult(model_transform, translate(0, 0, 1.5*Math.sign(angle)));
	model_transform = mult(model_transform, scale(1, 0.1, 3));
	this.m_cube.draw(this.graphicsState, model_transform, darkGrey);
}