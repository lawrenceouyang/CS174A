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
#include <climits>
#include <typeinfo>
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

	Sphere() 
	{};

	Sphere(string l, float x, float y, float z, float sX, float sY, float sZ, 
		   float cR, float cG, float cB, float a, float d, float s, float r, float initN)
	{
		name = l;
		posX = x;		posY = y;		posZ = z;
		scaleX = sX;	scaleY = sY;	scaleZ = sZ;
		colR = cR;		colG = cG;		colB = cB;
		Ka = a;			Kd = d;			Ks = s;			Kr = r;
		n = initN;

		mat4 mTransform = Translate(x, y, z)*Scale(scaleX, scaleY, scaleZ);
		InvertMatrix(mTransform, inverse);
	}

};

struct Light 
{
	string name;
	float posX;		float posY;		float posZ;
	float intR;		float intG;		float intB;

	Light(string l, float x, float y, float z, float r, float g, float b)
	{
		name = l;
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

		case 6:		g_sphere.push_back(Sphere(vs[1], toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4]), toFloat(vs[5]),
											  toFloat(vs[6]), toFloat(vs[7]), toFloat(vs[8]), toFloat(vs[9]), toFloat(vs[10]), 
											  toFloat(vs[11]),toFloat(vs[12]), toFloat(vs[13]), toFloat(vs[14]), toFloat(vs[15]))); 	break;

		case 7:		g_light.push_back(Light(vs[1], toFloat(vs[2]), toFloat(vs[3]), toFloat(vs[4]),
											toFloat(vs[5]), toFloat(vs[6]), toFloat(vs[7]))); break;

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

// Solve the quadratic to find the intersection time.
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
	
	t = ans;
	return true;
}

// -------------------------------------------------------------------
// Ray tracing

// Build Color Model

//Add diffuse light, specular light, and account for shadow
vec4 addLight(Sphere *sphere, Ray ray, vec4 p, vec4 n)
{
	vec4 retVec = vec4();
	
	for (int i = 0; i < g_light.size(); i++) {
		bool shadow = false;
		Ray lightRay;
		lightRay.origin = vec4(g_light[i].posX, g_light[i].posY, g_light[i].posZ, 1.0f);
		lightRay.dir = lightRay.origin - p;

		//calculate L dot n for diffuse light
		float lightAngle = dot(normalize(lightRay.dir), n);
		if (lightAngle < 0) continue;
		
		//calculate r dot v for specular light
		vec4 r = 2 * lightAngle * n - normalize(lightRay.dir);
		vec4 v = ray.origin - p;
		float specularAngle = dot(normalize(r), normalize(v));
		specularAngle = pow(specularAngle, sphere->n);

		float t = 0;

		//check for intersection with another sphere for shadow
		for (int j = 0; j < g_sphere.size(); j++) {
		
			if (g_sphere[j].name == sphere->name) continue;

			Ray invLightRay;
			invLightRay.origin = g_sphere[j].inverse * lightRay.origin;
			invLightRay.dir    = g_sphere[j].inverse * lightRay.dir;

			// Check for shadow. If there is a block ignore all light contribution.
			if (solveQuad(invLightRay, t)) {
				if (abs(t) > 0.0001f && abs(t) <= 1) {
					shadow = true;
					break;
				}
			}
		}

		if (!shadow) {
		// Add Diffuse
		retVec += vec4(g_light[i].intR * sphere->Kd * lightAngle * sphere->colR, 
					   g_light[i].intG * sphere->Kd * lightAngle * sphere->colG,
					   g_light[i].intB * sphere->Kd * lightAngle * sphere->colB, 0.0f);

		// Add Specular
		retVec += vec4(g_light[i].intR * sphere->Ks * specularAngle,
					   g_light[i].intG * sphere->Ks * specularAngle,
					   g_light[i].intB * sphere->Ks * specularAngle, 0.0f);
		}
	}

	// Add Ambient
	retVec += vec4(g_amIntesity[0] * sphere->Ka * sphere->colR,
	  			   g_amIntesity[1] * sphere->Ka * sphere->colG, 
				   g_amIntesity[2] * sphere->Ka * sphere->colB, 0.0f);

	return retVec;
}

vec4 trace(const Ray& ray, int it)
{
    // DONE: implement your ray tracing routine here.

	//Check level of recursion
	if (it > 3) return vec4();

	vec4 retVec;
	//On extra levels of recursion, do not add background color
	if (it < 1)  retVec = g_bgColor;
	else retVec = vec4();	
	Sphere *closeSphere = nullptr;
	Ray closeInvRay;
	float t = FLT_MAX;
	float tMin = FLT_MAX;

	for (int i = 0; i < g_sphere.size(); i++) {
		Ray invRay;
		invRay.origin = g_sphere[i].inverse * ray.origin;
		invRay.dir 	  = g_sphere[i].inverse * ray.dir;
		if (solveQuad(invRay, tMin)) {
			if (tMin < t && tMin > 0.0001f) {
				t = tMin;
				closeSphere = &g_sphere[i];
				closeInvRay = invRay;
			}
		}
	}

	if (closeSphere) {

		// Calculate intersection point and normal
		vec4 p = closeInvRay.origin + t * closeInvRay.dir;
		vec4 pEye = ray.origin + t * ray.dir;
		
		vec4 n = transpose(closeSphere->inverse)*p;
		n[3] = 0;
		n = normalize(n);

		//Add ambient, diffuse, and specular light
		retVec = addLight(closeSphere, ray, pEye, n);

		// Calculate reflection ray
		Ray reflectRay;
		reflectRay.origin = pEye;
		reflectRay.dir = normalize(-2*dot(n, ray.dir)*n + ray.dir);

		// Add reflect light
		retVec += closeSphere->Kr * trace(reflectRay, it+1);
	}

    // Done: clamp values if out of range.
	if (retVec[0] > 1) retVec[0] = 1;
	if (retVec[1] > 1) retVec[1] = 1;
	if (retVec[2] > 1) retVec[2] = 1;
	retVec[3] = 1.0f;
	return retVec;
} 

vec4 getDir(int ix, int iy)
{
    // DONE. This should return the direction from the origin
    // to pixel (ix, iy), normalized.

    vec4 dir;
    dir = vec4((g_left + ((float)ix/g_width)*(g_right - g_left)), 
    		   (g_bottom + ((float)iy/g_height)*(g_top - g_bottom)), -g_near, 0.0f);
    return normalize(dir);
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    vec4 color = trace(ray, 0);
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

void saveFile(const char* filename)
{
    // Convert color components from floats to unsigned chars.
    unsigned char* buf = new unsigned char[g_width * g_height * 3];
    for (int y = 0; y < g_height; y++)
        for (int x = 0; x < g_width; x++)
            for (int i = 0; i < 3; i++)
                buf[y*g_width*3+x*3+i] = (unsigned char)(((float*)g_colors[y*g_width+x])[i] * 255.9f);
    
    // Done: change file name based on input file name.
    string outputName = filename;
    outputName[outputName.size() - 1] = 'm';
    outputName[outputName.size() - 2] = 'p';
    outputName[outputName.size() - 3] = 'p';
    const char* temp = outputName.c_str();
    char* output = new char[outputName.size()];
    strcpy(output, temp);
    savePPM(g_width, g_height, output, buf);
    delete[] output;
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
    saveFile(argv[1]);
	return 0;
}

