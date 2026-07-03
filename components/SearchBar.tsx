export default function SearchBar({ value, onChange, placeholder = '제목, 저자, 발표자, 세션, 장소 검색' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="search-wrap"><span className="sr-only">학술대회 검색</span><span aria-hidden="true">⌕</span><input className="search" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} /></label>;
}
