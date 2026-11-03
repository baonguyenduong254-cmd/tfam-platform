/** Presentation-only removal of production instructions. Source records remain untouched. */
export function exhibitDescription(value:string){
 return value
  .replace(/(?:^|[;,.]\s*)(?:no\s+(?:text|wearer|person|people|watermark|letters|logo|caption|hands|background)|without\s+(?:text|a wearer|a person|watermarks))(?=\s*(?:[,;.]|$))/gi,'')
  .replace(/\s*[,;]\s*[,;]/g,',').replace(/^[,;.\s]+|[,;\s]+$/g,'').trim();
}
export function exhibitCount(count:number){return count+' '+(count===1?'exhibit':'exhibits');}

/** Stored emphasis is presentation syntax, not reader-facing punctuation. */
export function exhibitEpigraph(value:string){return value.trim().replace(/^\*{1,3}|\*{1,3}$/g,'');}
