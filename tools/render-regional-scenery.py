"""Render pinned, credited 0 A.D. scenery (not the removed Cethiel tiles).
Run: blender -b --python tools/render-regional-scenery.py -- SOURCE_DIR OUTPUT_DIR
Input recipes.json records source meshes/textures; importer records the final hashes.
"""
import bpy, math, sys, pathlib, json, xml.etree.ElementTree as ET
from mathutils import Vector
source, output = map(pathlib.Path, sys.argv[sys.argv.index('--') + 1:])
ns = {'c': 'http://www.collada.org/2005/11/COLLADASchema'}

def mesh_from_dae(path):
    root = ET.parse(path).getroot()
    mesh = root.find('.//c:mesh', ns)
    arrays = {}
    for s in mesh.findall('c:source', ns):
        a = list(map(float, s.find('c:float_array', ns).text.split()))
        stride = int(s.find('c:technique_common/c:accessor', ns).get('stride'))
        arrays[s.get('id')] = [a[i:i+stride] for i in range(0, len(a), stride)]
    vertices = {v.get('id'): v.find('c:input', ns).get('source')[1:] for v in mesh.findall('c:vertices', ns)}
    faces, uvs = [], []
    positions = None
    for poly in list(mesh):
        if poly.tag.split('}')[-1] not in ('polygons', 'polylist', 'triangles'): continue
        inputs = poly.findall('c:input', ns)
        stride = max(int(i.get('offset')) for i in inputs)+1
        vi = next(i for i in inputs if i.get('semantic') == 'VERTEX')
        ti = next(i for i in inputs if i.get('semantic') == 'TEXCOORD' and i.get('set', '0') == '0')
        positions = arrays[vertices[vi.get('source')[1:]]]
        texcoords = arrays[ti.get('source')[1:]]
        chunks = [list(map(int, p.text.split())) for p in poly.findall('c:p', ns)]
        if poly.tag.endswith('polylist'):
            counts = list(map(int, poly.find('c:vcount', ns).text.split()))
            data = chunks[0]; chunks=[]; start=0
            for n in counts: chunks.append(data[start:start+n*stride]); start+=n*stride
        elif poly.tag.endswith('triangles'):
            data=chunks[0]; chunks=[data[i:i+3*stride] for i in range(0,len(data),3*stride)]
        for data in chunks:
            faces.append([data[i+int(vi.get('offset'))] for i in range(0,len(data),stride)])
            uvs.extend(texcoords[data[i+int(ti.get('offset'))]][:2] for i in range(0,len(data),stride))
    result=bpy.data.meshes.new(path.stem); result.from_pydata(positions,[],faces); result.update()
    layer=result.uv_layers.new(name='UVMap')
    for loop,uv in zip(layer.data,uvs): loop.uv=uv
    obj=bpy.data.objects.new(path.stem,result); bpy.context.collection.objects.link(obj)
    return obj

output.mkdir(parents=True, exist_ok=True)
recipes=json.loads((source/'recipes.json').read_text())
for recipe in recipes:
    name=recipe['name']
    if name=='scene_columns': continue
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
    components=[recipe]
    if name=='scene_sanctuary': components+=[r for r in recipes if r['name']=='scene_columns']
    objects=[]
    for part in components:
        obj=mesh_from_dae(source/'meshes'/part['mesh']); objects.append(obj)
        material=bpy.data.materials.new(name);material.use_nodes=True
        shader=material.node_tree.nodes.get('Principled BSDF');shader.inputs['Roughness'].default_value=.9
        image=material.node_tree.nodes.new('ShaderNodeTexImage');image.image=bpy.data.images.load(str(source/'textures/skins'/part['texture']))
        material.node_tree.links.new(image.outputs['Color'],shader.inputs['Base Color'])
        if name=='scene_dead_palm':
            material.node_tree.links.new(image.outputs['Alpha'],shader.inputs['Alpha']);material.blend_method='CLIP';material.use_nodes=True
            material.use_backface_culling=False
        obj.data.materials.append(material)
    coords=[Vector(v.co) for obj in objects for v in obj.data.vertices]
    low=Vector([min(v[i] for v in coords) for i in range(3)]);high=Vector([max(v[i] for v in coords) for i in range(3)])
    size=max(high-low);center=(low+high)/2
    for obj in objects:
        for v in obj.data.vertices:v.co=(v.co-center)/size
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=False
    scene.world.color=(.5,.5,.5)
    bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));bpy.context.object.data.energy=450;bpy.context.object.data.size=4
    bpy.ops.object.camera_add(location=(3,-4,3));camera=bpy.context.object;camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=1.45;scene.camera=camera
    scene.render.resolution_x=384;scene.render.resolution_y=384;scene.render.resolution_percentage=100
    scene.render.film_transparent=True;scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
    scene.view_settings.view_transform='Standard';scene.view_settings.look='Medium High Contrast'
    scene.render.filepath=str(output/(name+'.png'));bpy.ops.render.render(write_still=True)
