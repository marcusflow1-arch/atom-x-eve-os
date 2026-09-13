"""Fit the fused sword/shirt boundary using geometry, texture color, and graph cut.
Writes one uint8 label per vertex to stdout for the Node asset builder.
"""
import sys,json,struct,io
import numpy as np
from PIL import Image
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import maximum_flow, breadth_first_order

data=open(sys.argv[1],'rb').read();length=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+length]);binary=memoryview(data)[28+length:]
def accessor(k):
 a=doc['accessors'][k];v=doc['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']]
 return np.frombuffer(binary,dtype={5126:np.float32,5125:np.uint32}[a['componentType']],count=a['count']*w,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(-1,w)
pr=doc['meshes'][0]['primitives'][0];p=accessor(pr['attributes']['POSITION']).astype(float);p[:,1]-=p[:,1].min();p*=1.8/p[:,1].max();uv=accessor(pr['attributes']['TEXCOORD_0']);faces=accessor(pr['indices']).reshape(-1,3)
im=doc['images'][doc['textures'][doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']];v=doc['bufferViews'][im['bufferView']];tex=np.array(Image.open(io.BytesIO(binary[v['byteOffset']:v['byteOffset']+v['byteLength']])).convert('RGB'))
colors=tex[(uv[:,1]*tex.shape[0]).astype(int).clip(0,tex.shape[0]-1),(uv[:,0]*tex.shape[1]).astype(int).clip(0,tex.shape[1]-1)].astype(float)
unique,inverse=np.unique(np.round(p,5),axis=0,return_inverse=True);counts=np.bincount(inverse);color=np.stack([np.bincount(inverse,weights=colors[:,c])/counts for c in range(3)],1)
x,y,z=unique.T;eligible=(x>.095)&(x<.24)&(y>.985)&(y<1.22)&(z>.035);ids=np.where(eligible)[0];local=np.full(len(unique),-1);local[ids]=np.arange(len(ids));q=unique[ids];c=color[ids];x,y,z=q.T;N=len(ids);S=N;T=N+1
f=inverse[faces];e=np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]);e=np.unique(np.sort(e,axis=1),axis=0);e=e[eligible[e].all(1)];e=local[e];difference=np.linalg.norm(c[e[:,0]]-c[e[:,1]],axis=1);edgecap=(8+150*np.exp(-(difference/45)**2)).astype(int)
xc=np.where(y>1.08,.17-(y-1.08)*.24,.17+(1.08-y)*.19);zc=.14+(y-1.14)*.57;distance=((x-xc)/.045)**2+((z-zc)/.05)**2
prop_prior=np.clip(.90-distance*.35,.02,.98);bright=(c.mean(1)>150)&(c.max(1)-c.min(1)<35);prop_prior=np.where(bright&(y<1.115),prop_prior*.08,prop_prior)
source_cap=(50*prop_prior).astype(int)+1;sink_cap=(50*(1-prop_prior)).astype(int)+1
handle=(y>1.113)&(z>.112)&(x>.125)&(x<.213)
core=(distance<.30)&(c.mean(1)<115)&(z>.075)&(x>.15)
cloth=((y>1.03)&(y<1.11)&bright)|((x<.14)&(y>1.03)&(y<1.115)&(z<.13))|(z<.047)
source_cap[handle|core]=100000;sink_cap[handle|core]=0;sink_cap[cloth]=100000;source_cap[cloth]=0
rows=np.concatenate([e[:,0],e[:,1],np.full(N,S),np.arange(N)]);cols=np.concatenate([e[:,1],e[:,0],np.arange(N),np.full(N,T)]);values=np.concatenate([edgecap,edgecap,source_cap,sink_cap]);graph=coo_matrix((values,(rows,cols)),shape=(N+2,N+2)).tocsr();flow=maximum_flow(graph,S,T)
residual=graph-flow.flow;residual.data=(residual.data>0).astype(int);residual.eliminate_zeros();reachable=breadth_first_order(residual,S,directed=True,return_predecessors=False);selected=np.zeros(N+2,dtype=np.uint8);selected[reachable]=1
labels=np.zeros(len(unique),dtype=np.uint8);labels[ids]=selected[:N];sys.stdout.buffer.write(labels[inverse].tobytes())
