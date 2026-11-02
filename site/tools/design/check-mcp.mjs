import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['tools/design/node_modules/awwwards-mcp/dist/cli.js'],{stdio:['pipe','pipe','pipe']});
let buffer='',finished=false;
const timer=setTimeout(()=>finish(1,'MCP handshake timed out'),15000);
function finish(code,message){if(finished)return;finished=true;clearTimeout(timer);console.log(message);child.kill();process.exitCode=code;}
function send(message){child.stdin.write(JSON.stringify(message)+'\n');}
child.stdout.on('data',chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);try{const response=JSON.parse(line);if(response.id===1&&response.result){console.log('Initialized:',response.result.serverInfo);send({jsonrpc:'2.0',method:'notifications/initialized'});send({jsonrpc:'2.0',id:2,method:'tools/list',params:{}});}if(response.id===2){const tools=response.result?.tools||[];finish(tools.length?0:1,JSON.stringify({toolCount:tools.length,tools:tools.map(t=>t.name)}));}}catch{}}});
child.on('error',error=>finish(1,error.message));
send({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'tfam-design-check',version:'1.0.0'}}});
