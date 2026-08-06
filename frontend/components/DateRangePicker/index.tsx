"use client";
export type DateRange = { from: string; to: string };
export default function DateRangePicker({ value, onChange }: { value: DateRange; onChange: (value: DateRange) => void }) { return <div className="flex flex-wrap gap-2"><input className="border border-black px-3 py-2 text-sm rounded-none" type="date" value={value.from} onChange={(e)=>onChange({...value,from:e.target.value})}/><input className="border border-black px-3 py-2 text-sm rounded-none" type="date" value={value.to} onChange={(e)=>onChange({...value,to:e.target.value})}/></div>; }
