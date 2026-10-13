from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).parent / 'dist' / 'assets'
OUT.mkdir(parents=True, exist_ok=True)
SIZE = 1000

def render_mesh(name, points, colors, rotation=(0.35, -0.3, -0.4), pad=.13):
    ax, ay, az = rotation
    rx=np.array([[1,0,0],[0,math.cos(ax),-math.sin(ax)],[0,math.sin(ax),math.cos(ax)]])
    ry=np.array([[math.cos(ay),0,math.sin(ay)],[0,1,0],[-math.sin(ay),0,math.cos(ay)]])
    rz=np.array([[math.cos(az),-math.sin(az),0],[math.sin(az),math.cos(az),0],[0,0,1]])
    p=points @ (rz@ry@rx).T
    lo=p[:,:,:2].min(axis=(0,1)); hi=p[:,:,:2].max(axis=(0,1))
    scale=SIZE*(1-pad*2)/max(hi-lo)
    q=p.copy(); q[:,:,0]=(p[:,:,0]-(hi[0]+lo[0])/2)*scale+SIZE/2; q[:,:,1]=SIZE/2-(p[:,:,1]-(hi[1]+lo[1])/2)*scale
    light=np.array([-0.5,0.7,1.3]);light/=np.linalg.norm(light)
    a=p[:-1,:-1];b=p[1:,:-1];c=p[1:,1:];d=p[:-1,1:]
    normals=np.cross(b-a,d-a); normals/=np.maximum(np.linalg.norm(normals,axis=2,keepdims=True),1e-10)
    diff=np.abs(normals@light)
    shade=.21+.77*diff
    spec=np.maximum(0,diff-.85)**3*210
    rgb=np.clip(colors[:-1,:-1]*shade[:,:,None]+spec[:,:,None],0,255).astype('uint8')
    depth=(a[:,:,2]+b[:,:,2]+c[:,:,2]+d[:,:,2])/4
    order=np.argsort(depth.ravel())
    im=Image.new('RGB',(SIZE,SIZE),(10,10,11)); draw=ImageDraw.Draw(im)
    cols=depth.shape[1]
    for idx in order:
        i,j=divmod(int(idx),cols)
        poly=[tuple(q[i,j,:2]),tuple(q[i+1,j,:2]),tuple(q[i+1,j+1,:2]),tuple(q[i,j+1,:2])]
        draw.polygon(poly,fill=tuple(rgb[i,j]))
    im.resize((900,900),Image.Resampling.LANCZOS).save(OUT / f'{name}.webp',quality=95)

u=np.linspace(-.4,5*math.pi,640);v=np.linspace(0,2*math.pi,180)
U,V=np.meshgrid(u,v,indexing='ij');r=.025*np.exp(.235*U)
t=.35*r*(1+.032*np.sin(63*U))
points=np.stack([(r+t*np.cos(V))*np.cos(U),(r+t*np.cos(V))*np.sin(U),t*np.sin(V)],axis=-1)
stripe=.5+.5*np.cos(32*U+1.3*np.sin(V))
base=np.empty(points.shape)
base[:,:,0]=190+52*stripe
base[:,:,1]=129+91*stripe
base[:,:,2]=103+113*stripe
blue=np.maximum(0,np.sin(V))*.55
base[:,:,0]*=1-.40*blue; base[:,:,1]+=22*blue;base[:,:,2]+=35*blue
render_mesh('shell',points,base,rotation=(.60,-.38,-.68),pad=.08)

u=np.linspace(-1,1,240);v=np.linspace(-1,1,240);X,Y=np.meshgrid(u,v,indexing='ij')
Z=(np.exp(-((X+.1)**2+(Y-.1)**2)*2.2)*(.36+.12*np.sin(7*X+3*Y)+.06*np.sin(19*X-8*Y))+.03*np.sin(48*X+16*Y))
points=np.stack([X,Y,Z],axis=-1)
tone=np.clip(130+Z*140,80,230);colors=np.stack([tone,tone,tone],axis=-1)
render_mesh('terrain',points,colors,rotation=(1.04,-.13,-.7),pad=.09)

# A sculptural ribbed portal, built from an original mathematical surface.
u=np.linspace(0,math.pi,380);v=np.linspace(0,2*math.pi,100);U,V=np.meshgrid(u,v,indexing='ij')
t=.20*(1+.055*np.cos(70*U));points=np.stack([(1+t*np.cos(V))*np.cos(U),(.98+t*np.cos(V))*np.sin(U)-.4,t*np.sin(V)],axis=-1)
colors=np.ones(points.shape)*215
render_mesh('arch',points,colors,rotation=(.32,-.56,-.15),pad=.16)

u=np.linspace(0,2*math.pi,460);v=np.linspace(0,2*math.pi,130);U,V=np.meshgrid(u,v,indexing='ij')
r=.70+.24*np.cos(3*U);t=.12+.015*np.sin(5*U)
points=np.stack([(r+t*np.cos(V))*np.cos(U),(r+t*np.cos(V))*np.sin(U),.29*np.sin(3*U)+t*np.sin(V)],axis=-1)
colors=np.ones(points.shape)*220
render_mesh('orbit',points,colors,rotation=(.7,.17,-.4),pad=.12)
print('Created four original mathematical artworks.')
