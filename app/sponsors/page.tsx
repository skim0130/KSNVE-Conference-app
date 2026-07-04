import Link from 'next/link'; import Header from '@/components/Header';
const sponsors=['현대자동차','LIG D&A','LG전자','삼성전자','SK하이닉스','현대중공업','두산그룹','GS그룹'];
export default function Sponsors(){return <main className="shell detail-shell"><Header compact/><Link href="/" className="back">← 홈</Link><div className="section-heading"><div><span className="kicker">PARTNERS</span><h1>함께하는 후원사</h1></div></div><div className="sponsor-grid">{sponsors.map((name)=><article className="sponsor" key={name}><strong>{name}</strong></article>)}</div></main>}
