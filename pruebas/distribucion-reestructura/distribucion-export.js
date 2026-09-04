export function exportJson(state){
  return JSON.stringify(state,null,2);
}

export function importJson(text){
  const parsed=JSON.parse(text);
  if(!parsed||typeof parsed!=='object'||!Array.isArray(parsed.tables)) throw new Error('JSON de Distribución inválido');
  return structuredClone(parsed);
}

export async function exportPng(){
  throw new Error('PNG pendiente de implementar en la reestructura limpia');
}
