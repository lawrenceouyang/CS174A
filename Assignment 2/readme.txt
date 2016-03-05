Lawrence Ouyang
504128219
CS174A Assignment 2

*Note: This game is best experienced when the browser is "locked" to the canvas. Clicking on the screen will cause a prompt to appear asking if you will permit the hiding of your cursor. 

*Note2: Because I was an idiot and didn't take into account time constraints as well as way over-estimated the scope of my project, several things are poorly inmplemented:

- Objects: there are not as many things as I wanted to include (spent way too much time on camera controls), but it is very easy to integrate new objects into the game.
- Lighting and Shading: by default, the light source is at the top of the world. I wanted a "night" and "day" cycle, but there was no time to implement.
- Controls: The crosshair is a lie. I failed to implement a camera raycast into the world coordinates in time, so the block simply spawns 2 blocks in front of the player. sorry.


Minicraft

Inspired by Minecraft by Mojang, Minicraft is a webgl block building game where a player is a given a variety of blocks and objects and are allowed to place them wherever they desire in the limited-sized world. 

Requirements:

Camera:
The camera motion is entirely based on mouse movement. In first person, eye follows the player, and at follows the mouse. In third person, eye is behind the player and at is further from the mouse.

Heirarchical Object:
Pressing "O" will show the player in a 3rd person POV, and it can be seen that the arms and legs are two level hierarchical objects.

Polygonal Object(s):
-Pyramid: similar to tetrahedron
-Hemisphere: similar to sphere
-Capped Cylinder: not quite the one shown on piazza (since I did it way before the post)
- Weighted Capped Cylinder: allows one side of the cylinder to be smaller

-Cube: Since the cube that was given to me was not handling texture coordinates the way I wanted it to, I created my own cube and called it "my_cube". This handles textures in a specific way that I designed them to.

-Textured Objects:
Pretty much everything except the "chalice" item is textured. They cylinders and cubes are textured where the middle section of the texture is the "cylinder" and the top and bottom sections are the caps.

-Shaded Objects:
Since blocks are pretty much...well...flat, there was not much shading to show. However, my light source is located at the very top of the world, and as such the tops of the cubes are shown brighter than the edges. The same can be said for all gold items, especially the cap (pyramid) and cube.

I only tested this game with the latest version of firefox. To my understanding, some of my canvas event listeners do not work with chrome.