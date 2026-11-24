/** Presentation only. Never pass the result back to an editor, API write or seed. */
export function presentationPunctuation(value:string,missing='Not recorded'):string {
 if(!value)return '';
 if(/^\s*[\u2014\u2013]+\s*$/.test(value))return missing;
 // Preserve URLs, inline/fenced code and their punctuation verbatim.
 const protectedText=/(```[\s\S]*?```|`[^`\n]*`|(?:https?:\/\/|www\.)[^\s<>]+)/g;
 return value.split(protectedText).map((part,index)=>index%2?part:part
  .replace(/(^|\n)[\t ]*[\u2014\u2013][\t ]*/g,'$1')
  .replace(/[\t ]*[\u2014\u2013][\t ]*([^\u2014\u2013\n]+?)[\t ]*[\u2014\u2013][\t ]*/g,' ($1) ')
  .replace(/([,;:.!?])[\t ]*[\u2014\u2013][\t ]*/g,'$1 ')
  .replace(/[\t ]*[\u2014\u2013][\t ]*([,;:.!?])/g,'$1')
  .replace(/[\t ]*[\u2014\u2013][\t ]*$/g,'.')
  .replace(/[\t ]*[\u2014\u2013][\t ]*/g,', ')
  // Fix accidental spaces before punctuation and broken English possessives (e.g. "war ." or "desert ' s")
  .replace(/[\t ]+([.,;:!?])/g,'$1')
  .replace(/([A-Za-z])[\t ]+['\u2019][\t ]*s\b/g,"$1's")
  .replace(/ {2,}/g,' ')
 ).join('');
}
