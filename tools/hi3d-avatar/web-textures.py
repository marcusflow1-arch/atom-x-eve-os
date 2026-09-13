"""Make a smaller GPU texture variant; preserve UVs, rig, mesh and animation bytes."""
import sys,struct,json,io
from pathlib import Path
from PIL import Image

source,destination=sys.argv[1:3];limit=int(sys.argv[3]) if len(sys.argv)>3 else 4096
data=Path(source).read_bytes();length=struct.unpack_from('<I',data,12)[0];doc=json.loads(data[20:20+length]);binary=memoryview(data)[28+length:]
image_views={image['bufferView'] for image in doc['images']};chunks=[];offset=0
for index,view in enumerate(doc['bufferViews']):
 chunk=bytes(binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])
 if index in image_views:
  image=Image.open(io.BytesIO(chunk));image.thumbnail((limit,limit),Image.Resampling.LANCZOS);buffer=io.BytesIO();image.save(buffer,'JPEG',quality=95,subsampling=0);chunk=buffer.getvalue()
 view['byteOffset']=offset;view['byteLength']=len(chunk);chunks.append(chunk);offset+=len(chunk)
 padding=(4-offset%4)%4;chunks.append(bytes(padding));offset+=padding
doc['buffers'][0]['byteLength']=offset;doc['asset'].setdefault('extras',{})['textureMaxDimension']=limit
j=json.dumps(doc,separators=(',',':')).encode();j+=b' '*((4-len(j)%4)%4)
output=struct.pack('<5I',0x46546c67,2,28+len(j)+offset,len(j),0x4e4f534a)+j+struct.pack('<2I',offset,0x004e4942)+b''.join(chunks)
Path(destination).write_bytes(output);print(json.dumps({'path':destination,'bytes':len(output),'textureSize':limit}))
