export type TabId = 'today' | 'program' | 'papers' | 'search' | 'my' | 'more';
const items: [TabId, string, string][] = [['today','오늘','⌂'],['program','프로그램','▦'],['papers','논문','▤'],['search','검색','⌕'],['my','내 일정','★'],['more','더보기','•••']];

export default function Tabs({ active, onChange, bottom = false }: { active: TabId; onChange: (id: TabId) => void; bottom?: boolean }) {
  if (bottom) return <nav className="bottom" aria-label="주 메뉴"><div className="bottom-inner">{items.map(([id,label,icon])=><button key={id} className={`navbtn ${active===id?'active':''}`} onClick={()=>onChange(id)}><span>{icon}</span>{label}</button>)}</div></nav>;
  return null;
}
