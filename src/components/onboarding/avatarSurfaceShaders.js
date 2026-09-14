// Keep GLSL as strings so it is never parsed as executable JavaScript.
export const surface = `
uniform vec3 lunaSkin, lunaHair, lunaInk, lunaTattooInk;
uniform float lunaSkinOn, lunaHairOn, lunaMoustache, lunaComplexion, lunaTattoo, lunaSide, lunaOpacity;
varying vec3 vLunaRest;
varying float vLunaHair;
float lunaGauss(float x,float c,float s){return exp(-pow((x-c)/s,2.0));}
`;

export const surfaceMap = `
#include <map_fragment>
{
 vec3 p=vLunaRest; float u=dot(p.xz-vec2(.044,.074),vec2(.932,-.362));
 float front=dot(p.xz-vec2(.044,.074),vec2(.362,.932));
 float warm=smoothstep(.015,.10,diffuseColor.r-diffuseColor.g)*smoothstep(-.01,.045,diffuseColor.g-diffuseColor.b);
 float mid=smoothstep(.045,.12,max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b)))*(1.0-smoothstep(.7,.9,min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b))));
 float legs=(1.0-smoothstep(.72,.80,p.y))*smoothstep(.06,.10,abs(p.x));
 float skin=warm*mid*(1.0-vLunaHair)*max(legs,max(smoothstep(1.50,1.56,p.y),smoothstep(.21,.28,abs(p.x))*(1.0-smoothstep(1.27,1.34,p.y))));
 diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*lunaSkin/max(vec3(.4969,.2874,.2016),vec3(.01)),skin*lunaSkinOn);
 diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*lunaHair/vec3(.032,.030,.030),vLunaHair*lunaHairOn);
 float frontGate=smoothstep(-.005,.012,front);
 float cheek=lunaGauss(abs(u),.032,.016)*lunaGauss(p.y,1.645,.016)*frontGate*skin;
 if(lunaComplexion>1.5) diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.50,.19,.14),cheek*.18);
 else if(lunaComplexion>.5) {
   float dots=step(.94,fract(sin(dot(floor(vec2(u,p.y)*1500.0),vec2(12.9898,78.233)))*43758.5453));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.15,.067,.025),cheek*dots*.5);
 }
 if(lunaMoustache>.5){
   float width=lunaMoustache>1.5?.003:.0017;
   float lip=(lunaGauss(u,-.014,.009)+lunaGauss(u,.006,.009))*lunaGauss(p.y,1.616,width)*frontGate*skin;
   diffuseColor.rgb=mix(diffuseColor.rgb,lunaInk,clamp(lip*.9,0.0,.9));
 }
 float arm=smoothstep(.225,.26,abs(p.x))*smoothstep(.95,.99,p.y)*(1.0-smoothstep(1.145,1.165,p.y))*skin;
 arm*=lunaSide>0.0?step(0.0,p.x):step(p.x,0.0);
 float bands=1.0-smoothstep(.13,.22,abs(sin((p.y-1.0)*110.0)));
 float branch=1.0-smoothstep(.007,.012,abs(p.z-.05-.015*sin(p.y*90.0)));
 if(lunaTattoo>.5) diffuseColor.rgb=mix(diffuseColor.rgb,lunaTattooInk,arm*(lunaTattoo>1.5?branch:bands)*lunaOpacity);
}
`;