
uniform vec3 lunaSkin, lunaHair, lunaInk, lunaTattooInk;
uniform float lunaSkinOn, lunaHairOn, lunaMoustache, lunaComplexion, lunaTattoo, lunaSide, lunaOpacity;
varying vec3 vLunaRest;
varying float vLunaHair;
float lunaGauss(float x,float c,float s){return exp(-pow((x-c)/s,2.0));}
