export type LogField={name:string;value:string;inline?:boolean};

export async function sendSiteLog(input:{title:string;description?:string;color?:number;fields:LogField[]}){
  const webhook=validWebhook(process.env.DISCORD_LOGS_WEBHOOK);
  if(!webhook)return false;
  try{
    const response=await fetch(`${webhook}?wait=true`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'EB DO MIG · Logs do Site',allowed_mentions:{parse:[]},embeds:[{title:input.title,description:input.description,color:input.color??0xBDA866,fields:input.fields.map(field=>({...field,value:field.value.slice(0,1024)})),footer:{text:'Central Militar · auditoria automática'},timestamp:new Date().toISOString()}]})});
    if(!response.ok){console.error('Discord recusou o log do site',response.status,await response.text());return false}
    return true;
  }catch(error){console.error('Falha ao enviar log do site',error);return false}
}

function validWebhook(value:string|undefined){
  if(!value)return null;
  try{const url=new URL(value.trim());return url.protocol==='https:'&&['discord.com','canary.discord.com','ptb.discord.com'].includes(url.hostname)&&/^\/api(?:\/v\d+)?\/webhooks\/\d+\/[A-Za-z0-9._-]+$/.test(url.pathname)?url.toString().replace(/\/$/,''):null}catch{return null}
}
