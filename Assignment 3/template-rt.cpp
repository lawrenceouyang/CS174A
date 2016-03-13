//
// template-rt.cpp
//

#define _CRT_SECURE_NO_WARNINGS
#include "matm.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <math.h>
#include <algorithm>
using namespace std;

int g_width;
int g_height;

struct Ray
{
    vec4 origin;
    vec4 dir;
};

// DONE: add structs for spheres, lights and anything else you may need.

struct Sphere
{
	string name;
	float posX;		float posY;		float posZ;
	float scaleX;	float scaleY;	float scaleZ;
	float colR;		float colG;		float colB;
	float Ka;		float Kd;		float Ks;		float Kr;
	float n;
	mat4 inverse;

	Sphere(float x, float y, float z, float sX, float sY, float sZ, 
		   float cR, float cG, float cB, float a, float d, float s, float r, float initN)
	{
		posX = x;		posY = y;		posZ = z;
		scaleX = sX;	scaleY = sY;	scaleZ = sZ;
		colR = cR;		colG = cG;		colB = cB;
		Ka = a;			Kd = d;			Ks = s;			Kr = r;
		n = initN;

		mat4 mTransform = mat4()*Translate(x, y, z)*Scale(scaleX, scaleY, scaleZ);
		InvertMatrix(mTransform, inverse);
	}
};

struct Light 
{
	string name;
	float posX;		float posY;		float posZ;
	float intR;		float intG;		float intB;

	Light(float x, float y, float z, float r, float g, float b)
	{
		posX = x; 	posY = y;	posZ = z;
		intR = r;	intG = g;	intB = b;
	}
};

vector<vec4> g_colors;

float g_left;
float g_right;
float g_top;
float g_bottom;
float g_near;

vector<Sphere> g_sphere;
vector<Light> g_light;

vec4 g_bgColor;
vec3 g_amIntesity; 
string g_outputName;
// -------------------------------------------------------------------
// Input file parsing

vec4 toVec4(const string& s1, const string& s2, const string& s3)
{
    stringstream ss(s1 + " " + s2 + " " + s3);
    vec4 result;
    ss >> result.x >> result.y >> result.z;
    result.w = 1.0f;
    return result;
}

float toFloat(const string& s)
{
    stringstream ss(s);
    float f;
    ss >> f;
    return f;
}

void parseLine(const vector<string>& vs)
{
	//DONE: add parsing of NEAR, LEFT, RIGHT, BOTTOM, TOP, SPHERE, LIGHT, BACK, AMBIENT, OUTPUT.
	const int num_labels = 11;//0       1       2         3       4      5       6         7       8         9         10
	const string labels[] = {"NEAR", "LEFT", "RIGHT", "BOTTOM", "TOP", "RES", "SPHERE", "LIGHT", "BACK", "AMBIENT", "OUTPUT"};
	unsigned label_id = find( labels, labels + num_labels, vs[0]) - labels;

	switch(label_id) {
		case 0:		g_near 	 = toFloat(vs[1]); 				break;
		case 1:		g_left   = toFloat(vs[1]); 				break;
		case 2:		g_right  = toFloat(vs[1]); 				break;
		case 3:		g_bottom = toFloat(vs[1]); 				break;
		case 4:		g_top    = toFloat(vs[1]); 				break;
		case 5:		g_width  = (int)toFloat(vs[1]);
					g_height = (int)toFloat(vs[2]); 
					g_colors.resize(g_width * g_height);	break;

		case 6:		g_sphere.push_back(Sphere(toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4]), toFloat(vs[5]),
											  toFloat(vs[6]), toFloat(vs[7]), toFloat(vs[8]), toFloat(vs[9]), toFloat(vs[10]), 
											  toFloat(vs[11]),toFloat(vs[12]), toFloat(vs[13]), toFloat(vs[14]), toFloat(vs[15]))); 	break;

		case 7:		g_light.push_back(Light(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3]), 
											toFloat(vs[4]), toFloat(vs[5]), toFloat(vs[6]))); break;

		case 8:		g_bgColor = vec4(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3]), 1);	break;
		case 9:		g_amIntesity = vec3(toFloat(vs[1]), toFloat(vs[2]), toFloat(vs[3])); 	break;
		case 10:	g_outputName = vs[1]; 		break;
	}
}

void loadFile(const char* filename)
{
    ifstream is(filename);
    if (is.fail())
    {
        cout << "Could not open file " << filename << endl;
        exit(1);
    }
    string s;
    vector<string> vs;
    while(!is.eof())
    {
        vs.clear();
        getline(is, s);
        istringstream iss(s);
        while (!iss.eof())
        {
            string sub;
            iss >> sub;
            vs.push_back(sub);
        }
        parseLine(vs);
    }
}


// -------------------------------------------------------------------
// Utilities

void setColor(int ix, int iy, const vec4& color)
{
    int iy2 = g_height - iy - 1; // Invert iy coordinate.
    g_colors[iy2 * g_width + ix] = color;
}


// -------------------------------------------------------------------
// Intersection routine

// TODO: add your ray-sphere intersection routine here.


// -------------------------------------------------------------------
// Ray tracing

bool solveQuad(Ray ray, float& t)
{
	float originDot = dot(toVec3(ray.origin), toVec3(ray.origin));
	float dirDot = dot(toVec3(ray.dir), toVec3(ray.dir));
	float originDirDot = dot(toVec3(ray.origin), toVec3(ray.dir));
	float det = originDirDot*originDirDot - dirDot*(originDot - 1);
	float ans;
	if (det < 0)
		return false;
	else if(det == 0)
		ans = -(originDirDot/dirDot);
	else
		ans = min( -(originDirDot/dirDot) + sqrt(det)/dirDot,
		     	   -(originDirDot/dirDot) - sqrt(det)/dirDot );
	if (t == 0)
		t = ans;
	
	if (t < ans)
		return false;
	
	t = ans;
	return true;
}

vec4 trace(const Ray& ray)
{
    // TODO: implement your ray tracing routine here.
	vec4 retVec = g_bgColor;
	for (int i = 0; i < g_sphere.size(); i++){
		Ray invRay;
		invRay.origin = g_sphere[i].inverse*ray.origin;
		invRay.dir 	  = g_sphere[i].inverse*ray.dir;
		float t = 0;
		if(solveQuad(invRay, t))
			retVec = vec4(g_sphere[i].colR, g_sphere[i].colG, g_sphere[i].colB, 1.0f);
	}
	return retVec;
} 

vec4 getDir(int ix, int iy)
{
    // TODO: modify this. This should return the direction from the origin
    // to pixel (ix, iy), normalized.

    vec4 dir;
    dir = vec4((g_left + ((float)ix/g_width)*(g_right - g_left)), 
    		   (g_bottom + ((float)iy/g_height)*(g_top - g_bottom)), -g_near, 0.0f);
    //cout << dir[0] << " " << dir[1] << " " << dir[2] << " " << dir[3] << endl;
    return dir;
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    vec4 color = trace(ray);
    setColor(ix, iy, color);
}

void render()
{
    for (int iy = 0; iy < g_height; iy++)
        for (int ix = 0; ix < g_width; ix++)
            renderPixel(ix, iy);
}


// -------------------------------------------------------------------
// PPM saving

void savePPM(int Width, int Height, char* fname, unsigned char* pixels) 
{
    FILE *fp;
    const int maxVal=255;

    printf("Saving image %s: %d x %d\n", fname, Width, Height);
    fp = fopen(fname,"wb");
    if (!fp) {
        printf("Unable to open file '%s'\n", fname);
        return;
    }
    fprintf(fp, "P6\n");
    fprintf(fp, "%d %d\n", Width, Height);
    fprintf(fp, "%d\n", maxVal);

    for(int j = 0; j < Height; j++) {
        fwrite(&pixels[j*Width*3], 3, Width, fp);
    }

    fclose(fp);
}

void saveFile()
{
    // Convert color components from floats to unsigned chars.
    // TODO: clamp values if out of range.
    unsigned char* buf = new unsigned char[g_width * g_height * 3];
    for (int y = 0; y < g_height; y++)
        for (int x = 0; x < g_width; x++)
            for (int i = 0; i < 3; i++)
                buf[y*g_width*3+x*3+i] = (unsigned char)(((float*)g_colors[y*g_width+x])[i] * 255.9f);
    
    // TODO: change file name based on input file name.
    savePPM(g_width, g_height, "output.ppm", buf);
    delete[] buf;
}


// -------------------------------------------------------------------
// Main

int main(int argc, char* argv[])
{
    if (argc < 2)
    {
        cout << "Usage: template-rt <input_file.txt>" << endl;
        exit(1);
    }
    loadFile(argv[1]);
    render();
    saveFile();
	return 0;
}

