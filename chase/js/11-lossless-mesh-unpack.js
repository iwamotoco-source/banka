
const unpackedAssetLoad=AssetManager.prototype.load;
AssetManager.prototype.load=async function(name,asset){
 for(const mesh of asset.meshes)for(const key of ['position','normal','uv','index','color','positionQ','normalQ','uvQ','index16']){
  const value=mesh[key];if(typeof value!=='string'||!value.startsWith('gz:'))continue;
  const bytes=Uint8Array.from(atob(value.slice(3)),c=>c.charCodeAt(0));
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  mesh[key]=new Uint8Array(await new Response(stream).arrayBuffer());
 }
 return unpackedAssetLoad.call(this,name,asset);
};
