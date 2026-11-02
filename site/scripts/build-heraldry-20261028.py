"""Original TFAM flag layouts, scalable cloth plates and derived small standards."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];out=root/'public/heraldry';out.mkdir(exist_ok=True)
gold='#e6c779';ivory='#f2ead5';red='#8e2331';blue='#152e60';green='#154c40'
defs='''<defs><linearGradient id="silk"><stop stop-color="#fff" stop-opacity=".14"/><stop offset=".18" stop-color="#000" stop-opacity=".04"/><stop offset=".34" stop-color="#fff" stop-opacity=".12"/><stop offset=".56" stop-color="#000" stop-opacity=".16"/><stop offset=".75" stop-color="#fff" stop-opacity=".09"/><stop offset="1" stop-color="#000" stop-opacity=".13"/></linearGradient><pattern id="weave" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 1H4M1 0V4" stroke="#fff" stroke-opacity=".045" stroke-width=".5"/></pattern>
<symbol id="castle" viewBox="0 0 100 100"><path d="M16 87V29H9V12H20V20H29V12H40V29H34V48H66V29H60V12H71V20H80V12H91V29H84V87H62V69Q50 51 38 69V87Z" fill="currentColor"/><path d="M44 17V6H56V17H64V43H36V17Z" fill="currentColor"/><path d="M20 46H28M72 46H80M43 31H57M20 69H28M72 69H80" stroke="#34252b" stroke-width="5"/></symbol>
<symbol id="lion" viewBox="0 0 100 100"><path d="M44 25L40 15L48 10L57 13L63 8L70 16L65 23L75 29L69 36L57 33L55 44L69 51L83 37L91 41L83 52L70 62L55 58L48 70L63 81L60 91L47 88L41 76L32 84L18 86L15 79L29 73L31 59L39 43L32 38L22 46L12 45L13 36L27 31L36 24ZM36 56Q16 66 12 54Q8 47 15 39Q4 41 3 51Q1 70 23 70L32 67Z" fill="currentColor"/><path d="M48 9L45 2L54 5L59 0L64 6L73 4L70 13Z" fill="currentColor"/></symbol>
<symbol id="fleur" viewBox="0 0 100 100"><path d="M50 3C24 29 48 46 43 62C31 20 2 37 15 61C23 51 31 58 36 70H24V80H42L34 94L50 87L66 94L58 80H76V70H64C69 58 77 51 85 61C98 37 69 20 57 62C52 46 76 29 50 3Z" fill="currentColor"/></symbol>
<symbol id="eagle" viewBox="0 0 100 100"><path d="M46 31L43 20L49 13L63 13L68 20L57 23L57 34L76 15L96 8L90 29L71 42L94 32L89 48L68 54L89 52L81 66L62 65L58 79L70 91L54 88L50 96L46 88L30 91L42 79L38 65L19 66L11 52L32 54L11 48L6 32L29 42L10 29L4 8L24 15Z" fill="currentColor"/></symbol>
<symbol id="ship" viewBox="0 0 100 100"><path d="M10 72H93L79 88H25ZM48 8H54V70H48ZM45 16L16 57H45ZM59 22V59H86Z" fill="currentColor"/><path d="M8 94Q19 87 30 94T52 94T74 94T96 94" fill="none" stroke="currentColor" stroke-width="4"/></symbol>
<symbol id="sun" viewBox="0 0 100 100"><circle cx="50" cy="50" r="24" fill="currentColor"/><path d="M50 2V17M50 83V98M2 50H17M83 50H98M16 16L27 27M73 73L84 84M16 84L27 73M73 27L84 16" stroke="currentColor" stroke-width="6"/></symbol>
<symbol id="bird" viewBox="0 0 100 100"><path d="M44 55L13 30L2 7L37 31L53 43L78 35L96 41L80 46L62 49L48 70L23 90L9 89L29 64L39 63L53 50L28 58L6 53L34 48Z" fill="currentColor"/></symbol>
<symbol id="cross" viewBox="0 0 100 100"><path d="M41 3H59V40H97V59H59V97H41V59H3V40H41Z" fill="currentColor"/></symbol>
<symbol id="crescent" viewBox="0 0 100 100"><path d="M79 12A44 44 0 1 0 79 88A36 36 0 0 1 79 12Z" fill="currentColor"/></symbol>
<symbol id="star" viewBox="0 0 100 100"><path d="M50 3L61 36L96 36L68 57L78 91L50 70L22 91L32 57L4 36L39 36Z" fill="currentColor"/></symbol>
<symbol id="tree" viewBox="0 0 100 100"><path d="M44 62H56V97H44ZM50 2L20 35H34L9 65H36L16 83H84L64 65H91L66 35H80Z" fill="currentColor"/></symbol>
<symbol id="lotus" viewBox="0 0 100 100"><path d="M50 4Q21 34 50 69Q79 34 50 4ZM9 24Q5 75 48 83Q31 42 9 24ZM91 24Q95 75 52 83Q69 42 91 24ZM3 65Q15 99 50 90Q85 99 97 65Q75 62 50 87Q25 62 3 65Z" fill="currentColor"/></symbol></defs>'''
defs=defs.replace('</defs>', '<symbol id="harp" viewBox="0 0 100 100"><path d="M18 10Q60 0 88 20L78 88H52Q37 65 18 10Z" fill="none" stroke="currentColor" stroke-width="8"/><path d="M30 20L57 83M43 18L62 84M56 19L66 84M69 21L71 84M78 25L75 83" stroke="currentColor" stroke-width="3"/></symbol><symbol id="dragon" viewBox="0 0 100 100"><path d="M68 20Q25 7 24 36Q24 51 49 48Q82 40 80 64Q78 84 40 79Q21 76 15 91Q6 68 35 64Q61 66 60 57Q58 52 39 58Q6 62 8 36Q11 6 59 9L56 0L67 7L77 0L78 11L95 14L91 25L79 30L73 39L62 35Z" fill="currentColor"/><path d="M27 40L9 51M49 74L45 94M72 54L92 42M34 22L29 5M15 50L8 59M12 51L2 52M44 91L36 95M47 90L53 98M89 43L98 39M89 44L96 49" stroke="currentColor" stroke-width="5"/><circle cx="79" cy="17" r="2" fill="#5d2735"/></symbol></defs>')
def rect(x,y,w,h,c):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>'
def motif(kind,x=205,y=105,size=190,color=gold):return f'<use href="#{kind}" x="{x}" y="{y}" width="{size}" height="{size}" color="{color}"/>'
def band(c):return rect(0,0,600,400,c)
def disc(c=gold,x=300,y=200,r=116):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="{c}" stroke-width="3"/>'
flags={
 'castilian_empire':band(red)+rect(300,0,300,200,ivory)+rect(0,200,300,200,ivory)+motif('castle',80,30,140)+motif('castle',380,230,140)+motif('lion',380,30,140,'#642b59')+motif('lion',80,230,140,'#642b59'),
 'holy_french_kingdom':band(blue)+motif('fleur',145,70,120)+motif('fleur',335,70,120)+motif('fleur',240,225,120),
 'western_roman_empire':band('#63202c')+rect(0,0,600,30,'#b49148')+rect(0,370,600,30,'#b49148')+disc()+motif('eagle',185,85,230),
 'sultanate_of_morocco':band(green)+rect(0,0,90,400,red)+disc()+motif('crescent',225,110,180)+motif('star',315,154,84),
 'habsburg_poland':band('#d5b45d')+rect(300,0,300,400,red)+motif('eagle',55,90,210,'#1b2224')+motif('eagle',340,90,210,ivory),
 'novgorod_union':band('#f1e7d4')+rect(0,270,600,130,'#612f51')+motif('tree',215,70,170,'#243e39')+rect(100,260,400,5,gold),
 'ottoman_empire':band('#24533b')+motif('crescent',85,130,140)+motif('crescent',245,75,140)+motif('crescent',365,200,140),
 'danes_kingdom':band('#8c2a35')+rect(155,0,45,400,ivory)+rect(0,165,600,45,ivory)+motif('lion',310,105,180,gold),
 'scotland_ireland_union':band('#193c64')+'<path d="M0 0L600 400M0 400L600 0" stroke="#efe7d5" stroke-width="55"/>'+rect(0,0,110,400,green)+motif('harp',15,160,80,gold),
 'england_ruins':band('#d4d0bd')+rect(266,0,68,400,'#712f36')+rect(0,166,600,68,'#712f36')+motif('lion',75,42,112,'#73583a')+motif('lion',415,245,112,'#73583a'),
 'new_portuguese_empire':band('#f0e5c8')+rect(0,0,180,400,'#164f46')+disc('#a98239',360,200,108)+motif('ship',270,108,180,'#8c2b36'),
 'british_east_india_company':''.join(rect(0,i*400/9,600,400/9,red if i%2==0 else ivory) for i in range(9))+rect(0,0,250,220,blue)+motif('ship',53,30,150),
 'annam_empire':band('#9e2436')+rect(0,320,600,80,'#c7a155')+disc()+motif('bird',188,90,224),
 'ming_celestial_empire':band('#d4af52')+rect(0,0,86,400,'#9a2935')+disc('#9a2935',336,200,112)+motif('dragon',235,95,200,'#9a2935'),
 'nusantara_sultanate':band('#164b48')+rect(0,285,600,115,'#f0dfbc')+motif('ship',180,60,220)+motif('crescent',70,75,84),
 'tokugawa_empire':band('#e9dfc8')+rect(0,0,600,45,'#402c57')+rect(0,355,600,45,'#402c57')+''.join(f'<ellipse cx="300" cy="153" rx="43" ry="78" fill="#402c57" transform="rotate({a} 300 200)"/>' for a in [0,120,240])+f'<circle cx="300" cy="200" r="20" fill="{gold}"/>',
 'eternal_sky_khanate':band('#286681')+rect(0,330,600,70,'#172b3e')+motif('eagle',190,60,220)+motif('sun',263,280,70),
 'safavid_empire':band('#174b43')+rect(0,0,600,45,'#712f49')+rect(0,355,600,45,'#712f49')+motif('sun',300,85,160)+motif('lion',180,115,190),
 'aksumite_empire':band('#772c38')+rect(0,0,105,400,'#d3ab53')+rect(495,0,105,400,'#d3ab53')+disc()+motif('cross',210,110,180),
 'songhai_empire':band('#bd8750')+rect(0,130,600,140,'#1c4545')+motif('sun',215,110,180)+rect(18,18,564,6,'#512c2e')+rect(18,376,564,6,'#512c2e'),
 'kongo_confederation':band('#e9dfc5')+'<path d="M0 0L600 400M0 400L600 0" stroke="#842e34" stroke-width="48"/>'+disc('#1d5040')+motif('tree',220,100,160,'#1d5040'),
 'swahili_league':band('#14656a')+rect(0,300,600,100,ivory)+motif('ship',195,60,210)+''.join(f'<path d="M0 {y}Q75 {y-24} 150 {y}T300 {y}T450 {y}T600 {y}" fill="none" stroke="#afbfaa" stroke-width="7"/>' for y in [320,350,380]),
 'cape_republic':band('#eadfc4')+rect(0,0,600,125,'#b67a40')+rect(0,275,600,125,'#2b4758')+motif('ship',225,120,150,'#2b4758'),
 'merina_empire':band('#912f45')+rect(0,0,170,400,ivory)+rect(170,210,430,190,'#235847')+disc(gold,380,200,107)+motif('bird',285,105,190,gold)
}
for id,body in flags.items():
    border=f'<rect x="10" y="10" width="580" height="380" rx="1" fill="none" stroke="{gold}" stroke-width="4"/><rect x="19" y="19" width="562" height="362" fill="none" stroke="{ivory}" stroke-opacity=".6" stroke-dasharray="3 5"/>'
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">{defs}{body}<rect width="600" height="400" fill="url(#silk)"/><rect width="600" height="400" fill="url(#weave)"/>{border}</svg>'
    (out/f'{id}.svg').write_text(svg)
(out/'manifest.json').write_text(json.dumps({'version':'20261028','design':'Original TFAM textile flag layouts. Historical heraldic vocabulary; no game/franchise assets.','flags':{id:'/heraldry/'+id+'.svg' for id in flags}},indent=2))
print('Created',len(flags),'original flag plates')
