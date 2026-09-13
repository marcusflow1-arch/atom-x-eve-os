"""CPU inspection render of the actual GLB mesh and sampled skeletal animation.
Lighting approximates the web renderer; this is not generated concept art.
Usage: python render.py model.glb output.png Wave 1.5 front [quality]
"""
import sys,struct,json,io
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
from scipy.spatial.transform import Rotation, Slerp

path,out,clip,time,view=sys.argv[1:6];t=float(time);quality=len(sys.argv)>6
data=Path(path).read_bytes();jl=struct.unpack_from('<I',data,12)[0];j=json.loads(data[20:20+jl]);binary=memoryview(data)[28+jl:]
def acc(k):
 a=j['accessors'][k];v=j['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
 return np.frombuffer(binary,dtype={5126:np.float32,5125:np.uint32,5123:np.uint16,5121:np.uint8}[a['componentType']],count=a['count']*width,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,width)
nodes=j['nodes'];translations=[np.array(n.get('translation',[0.,0.,0.])) for n in nodes];rotations=[np.array(n.get('rotation',[0.,0.,0.,1.])) for n in nodes];scales=[np.array(n.get('scale',[1.,1.,1.])) for n in nodes]
animation=next((a for a in j.get('animations',[]) if a['name']==clip),None)
if animation:
 for c in animation['channels']:
  s=animation['samplers'][c['sampler']];times=acc(s['input']).ravel();values=acc(s['output']);key=c['target']['node'];kind=c['target']['path'];tt=np.clip(t,times[0],times[-1])
  if kind=='rotation':rotations[key]=Slerp(times,Rotation.from_quat(values))(tt).as_quat()
  else:
   value=np.array([np.interp(tt,times,values[:,col]) for col in range(values.shape[1])]);(translations if kind=='translation' else scales)[key]=value
world=[None for _ in nodes]
def visit(k,parent):
 m=np.eye(4);m[:3,:3]=Rotation.from_quat(rotations[k]).as_matrix()*scales[k];m[:3,3]=translations[k];world[k]=parent@m
 for child in nodes[k].get('children',[]):visit(child,world[k])
for root in j['scenes'][j.get('scene',0)]['nodes']:visit(root,np.eye(4))
pr=j['meshes'][0]['primitives'][0];p=acc(pr['attributes']['POSITION']).astype(float);n=acc(pr['attributes']['NORMAL']).astype(float);uv=acc(pr['attributes']['TEXCOORD_0']);faces=acc(pr['indices']).reshape(-1,3)
if j.get('skins'):
 skin=j['skins'][0];inverse=acc(skin['inverseBindMatrices']).reshape(-1,4,4).transpose(0,2,1)
 matrices=np.array([world[k] for k in skin['joints']])@inverse
 joints=acc(pr['attributes']['JOINTS_0']);weights=acc(pr['attributes']['WEIGHTS_0']);hp=np.column_stack([p,np.ones(len(p))]);posed=np.zeros((len(p),4));normals=np.zeros_like(n)
 for c in range(4):
  posed+=np.einsum('nij,nj->ni',matrices[joints[:,c]],hp)*weights[:,c,None]
  normals+=np.einsum('nij,nj->ni',matrices[joints[:,c],:3,:3],n)*weights[:,c,None]
 p=posed[:,:3];n=normals/np.maximum(1e-8,np.linalg.norm(normals,axis=1,keepdims=True))
material=j['materials'][0]['pbrMetallicRoughness'];im=j['images'][j['textures'][material['baseColorTexture']['index']]['source']];v=j['bufferViews'][im['bufferView']]
texture=np.array(Image.open(io.BytesIO(binary[v['byteOffset']:v['byteOffset']+v['byteLength']])).convert('RGB'))
W,H=(1050,1250) if quality else (650,800)
angle={'front':0,'back':np.pi,'side':np.pi/2,'quarter':.62,'seated':.72}.get(view,0)
right=np.array([np.cos(angle),0,-np.sin(angle)]);fwd=np.array([np.sin(angle),.03,np.cos(angle)]);fwd/=np.linalg.norm(fwd);up=np.cross(fwd,right);up/=np.linalg.norm(up)
target=np.array([0.,.91,.03]);scale=H*.435
if view=='seated':
 target=np.array([0.,(p[:,1].min()+p[:,1].max())/2,.10]);projected=p@right
 scale=min(H*.72/max(.1,p[:,1].max()-p[:,1].min()),W*.83/max(.1,projected.max()-projected.min()))
screen=np.stack([W*.5+(p-target)@right*scale,H*.51-(p-target)@up*scale,(p-target)@fwd],axis=1)
base=np.array([16,25,34],float)/255;frame=np.broadcast_to(base,(H,W,3)).copy();depth=np.full((H,W),-np.inf);mask=np.zeros((H,W),bool)
light=np.array([-.4,.65,.8]);light/=np.linalg.norm(light)
def colors(normals,coords):
 tex=texture[np.clip((coords[:,1]*texture.shape[0]).astype(int),0,texture.shape[0]-1),np.clip((coords[:,0]*texture.shape[1]).astype(int),0,texture.shape[1]-1)]/255
 albedo=np.where(tex<=.04045,tex/12.92,((tex+.055)/1.055)**2.4)
 nd=np.maximum(0,normals@light);rim=(1-np.abs(normals@fwd))**3
 linear=albedo*(.55+nd[:,None]*.80)+rim[:,None]*np.array([.005,.012,.015])
 return np.clip(np.where(linear<=.0031308,linear*12.92,1.055*np.maximum(0,linear)**(1/2.4)-.055),0,1)
if not quality:
 image=Image.fromarray((frame*255).astype('uint8'));draw=ImageDraw.Draw(image)
 coords=uv[faces].mean(1);normal=n[faces].mean(1);normal/=np.maximum(1e-8,np.linalg.norm(normal,axis=1,keepdims=True));color=(colors(normal,coords)*255).astype('uint8')
 order=np.argsort(screen[faces,2].mean(1))
 for k in order:draw.polygon([tuple(q) for q in screen[faces[k],:2]],fill=tuple(color[k]))
else:
 for face in faces:
  s=screen[face];xmin=max(0,int(np.floor(s[:,0].min())));xmax=min(W-1,int(np.ceil(s[:,0].max())));ymin=max(0,int(np.floor(s[:,1].min())));ymax=min(H-1,int(np.ceil(s[:,1].max())))
  if xmin>xmax or ymin>ymax:continue
  x0,y0=s[0,:2];x1,y1=s[1,:2];x2,y2=s[2,:2];den=(y1-y2)*(x0-x2)+(x2-x1)*(y0-y2)
  if abs(den)<1e-8:continue
  yy,xx=np.mgrid[ymin:ymax+1,xmin:xmax+1];xx=xx+.5;yy=yy+.5
  a=((y1-y2)*(xx-x2)+(x2-x1)*(yy-y2))/den;b=((y2-y0)*(xx-x2)+(x0-x2)*(yy-y2))/den;c=1-a-b
  z=a*s[0,2]+b*s[1,2]+c*s[2,2];inside=(a>=-1e-5)&(b>=-1e-5)&(c>=-1e-5)&(z>depth[ymin:ymax+1,xmin:xmax+1])
  if not inside.any():continue
  iy,ix=np.where(inside);bc=np.stack([a[inside],b[inside],c[inside]],1);normal=bc@n[face];normal/=np.maximum(1e-8,np.linalg.norm(normal,axis=1,keepdims=True))
  frame[ymin+iy,xmin+ix]=colors(normal,bc@uv[face]);depth[ymin+iy,xmin+ix]=z[inside];mask[ymin+iy,xmin+ix]=True
 edge=mask&(~np.roll(mask,1,0)|~np.roll(mask,-1,0)|~np.roll(mask,1,1)|~np.roll(mask,-1,1));frame[edge]*=.72
 image=Image.fromarray((frame*255).astype('uint8'))
draw=ImageDraw.Draw(image)
def font(size):
 try:return ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',size)
 except OSError:return ImageFont.load_default()
draw.text((25,22),'YOUR HI3D WARRIOR / LUNA',font=font(17 if quality else 13),fill='#b2dfdc')
draw.text((25,49),f'{clip.replace("_"," ").upper()}  ·  {view.upper()}  ·  {t:.2f}s',font=font(13 if quality else 11),fill='#849eac')
draw.text((25,H-42),'Actual mesh and skeletal pose · approximate lighting',font=font(12 if quality else 10),fill='#829aa6')
image.save(out);print(out)
