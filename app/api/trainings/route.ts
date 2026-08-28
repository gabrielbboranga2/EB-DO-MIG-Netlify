import{NextResponse}from'next/server';
import{getSessionUser}from'@/lib/auth';

export const dynamic='force-dynamic';
export const runtime='nodejs';

const COMMUNITIES=new Set(['EXÉRCITO','STAFF','BFE','CIE','BAC','BPE']);
const ALLOWED_TYPES=new Set(['image/jpeg','image/png','image/webp']);
const MAX_FILE_SIZE=8*1024*1024;
type Session={exp:number;id:string;username:string;rank?:string;isAdmin?:boolean;isCreator?:boolean};

export async function POST(request:Request){
  const session=await getSessionUser<Session>(request);
  if(!session)return NextResponse.json({error:'Sua sessão expirou. Entre novamente com o Roblox.'},{status:401});

  const webhook=validWebhook(process.env.DISCORD_TRAININGS_WEBHOOK);
  if(!webhook)return NextResponse.json({error:'O webhook de treinamentos ainda não foi configurado na Vercel.'},{status:503});

  try{
    const form=await request.formData();
    const community=clean(form.get('community'),30);
    const training=clean(form.get('training'),100);
    const observation=clean(form.get('observation'),1000);
    const proof=form.get('proof');
    let participants:string[]=[];
    try{participants=JSON.parse(String(form.get('participants')||'[]'))}catch{}
    participants=Array.from(new Set(participants.map(item=>clean(item,20)).filter(item=>/^[A-Za-z0-9_]{3,20}$/.test(item)))).slice(0,15);

    if(!COMMUNITIES.has(community)||!training||observation.length<10||participants.length<1)return NextResponse.json({error:'Os dados do treinamento estão incompletos ou inválidos.'},{status:400});
    if(!(proof instanceof File)||!ALLOWED_TYPES.has(proof.type)||proof.size<1||proof.size>MAX_FILE_SIZE)return NextResponse.json({error:'Anexe uma foto JPG, PNG ou WEBP de até 8 MB.'},{status:400});

    const extension=proof.type==='image/png'?'png':proof.type==='image/webp'?'webp':'jpg';
    const filename=`treinamento-${community.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,'-')}-${Date.now()}.${extension}`;
    const payload={
      username:'EB DO MIG · Registros',
      allowed_mentions:{parse:[]},
      embeds:[{
        title:'Treinamento concluído',
        color:0xBDA866,
        description:`**${training}** foi registrado com prova fotográfica.`,
        fields:[
          {name:'Comunidade',value:community,inline:true},
          {name:'Instrutor',value:`${escapeDiscord(session.username)}\n${escapeDiscord(session.rank||'Militar')}`,inline:true},
          {name:`Participantes (${participants.length})`,value:participants.map(name=>`• ${escapeDiscord(name)}`).join('\n')},
          {name:'Relatório',value:escapeDiscord(observation)},
        ],
        image:{url:`attachment://${filename}`},
        footer:{text:`Roblox ID do instrutor: ${session.id}`},
        timestamp:new Date().toISOString(),
      }],
      attachments:[{id:0,filename,description:'Prova do treinamento: formação em cunha com a bandeira do Brasil ao fundo.'}],
    };
    const discordForm=new FormData();
    discordForm.set('payload_json',JSON.stringify(payload));
    discordForm.set('files[0]',proof,filename);
    const response=await fetch(`${webhook}?wait=true`,{method:'POST',body:discordForm,cache:'no-store'});
    if(!response.ok){console.error('Discord recusou o registro de treinamento',response.status,await response.text());return NextResponse.json({error:'O Discord não aceitou o envio. Confira o webhook na Vercel.'},{status:502})}
    const message=await response.json()as{id?:string};
    return NextResponse.json({ok:true,messageId:message.id||null},{status:201,headers:{'cache-control':'no-store'}});
  }catch(error){console.error('Falha ao registrar treinamento',error);return NextResponse.json({error:'Não foi possível processar a foto do treinamento.'},{status:500})}
}

function clean(value:FormDataEntryValue|null,max:number){return typeof value==='string'?value.trim().slice(0,max):''}
function escapeDiscord(value:string){return value.replace(/([\\`*_{}\[\]()<>#+\-.!|])/g,'\\$1')}
function validWebhook(value:string|undefined){
  if(!value)return null;
  try{const url=new URL(value.trim());return url.protocol==='https:'&&['discord.com','canary.discord.com','ptb.discord.com'].includes(url.hostname)&&/^\/api(?:\/v\d+)?\/webhooks\/\d+\/[A-Za-z0-9._-]+$/.test(url.pathname)?url.toString().replace(/\/$/,''):null}catch{return null}
}
