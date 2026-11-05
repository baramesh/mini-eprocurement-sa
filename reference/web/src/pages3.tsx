// SCR-08 vendor master, SCR-09 spend report, SCR-10 audit trail.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiErr, Badge, Err, Money, Problem, api, beDateTime, fieldErr, hasRole, newKey, parseBe, todayIso, toBeInput, useAsync, useDebounced } from './lib';

// ------------------------------------------------------------------------------------------------ SCR-08
export function Vendors() {
  const [q, setQ] = useState(''); const dq = useDebounced(q, 300); const [status, setStatus] = useState('');
  const list = useAsync(() => api<any[]>('GET', `/vendors?q=${encodeURIComponent(dq)}${status ? `&status=${status}` : ''}`), [dq, status]);
  const [adding, setAdding] = useState(false); const [f, setF] = useState({ nameTh: '', taxId: '', email: '' }); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiErr>(); const [local, setLocal] = useState<Record<string, string>>({});
  const [toggle, setToggle] = useState<any>(null); const [reason, setReason] = useState(''); const [tErr, setTErr] = useState('');

  const add = async () => {
    const e: Record<string, string> = {};
    if (!f.nameTh.trim()) e.nameTh = 'ระบุชื่อผู้ขาย';
    if (!/^\d{13}$/.test(f.taxId)) e.taxId = 'เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    setLocal(e); if (Object.keys(e).length) return;
    setBusy(true); setErr(undefined);
    try { await api('POST', '/vendors', { nameTh: f.nameTh, taxId: f.taxId, ...(f.email ? { email: f.email } : {}) }, { key: newKey() }); setAdding(false); setF({ nameTh: '', taxId: '', email: '' }); list.reload(); }
    catch (x) { setErr(x as ApiErr); } finally { setBusy(false); }
  };
  const change = async () => {
    const to = toggle.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (to === 'SUSPENDED' && !reason.trim()) { setTErr('ระบุเหตุผลการระงับ'); return; }
    setBusy(true); setTErr('');
    try { await api('PUT', `/vendors/${toggle.vendorId}/status`, { status: to, ...(reason ? { reason } : {}) }); setToggle(null); setReason(''); list.reload(); }
    catch (x) { const e = x as ApiErr; if (e.status === 404) { setToggle(null); list.reload(); } else setTErr(e.message); } finally { setBusy(false); }
  };
  if (list.error?.status === 403) return <Problem e={list.error} />;
  return (
    <div>
      <h1>ทะเบียนผู้ขาย</h1>
      <label>ค้นหา <input value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <label>สถานะ <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">ทั้งหมด</option><option>ACTIVE</option><option>SUSPENDED</option></select></label>
      {hasRole('PROCUREMENT') && <button onClick={() => setAdding(true)}>เพิ่มผู้ขาย</button>}
      {adding && <div aria-label="เพิ่มผู้ขาย">
        <label>ชื่อผู้ขาย <input value={f.nameTh} onChange={(e) => setF({ ...f, nameTh: e.target.value })} /></label><Err>{local.nameTh ?? fieldErr(err, 'nameTh')}</Err>
        <label>เลขประจำตัวผู้เสียภาษี <input value={f.taxId} onChange={(e) => setF({ ...f, taxId: e.target.value })} /></label><Err>{local.taxId ?? (err?.code === 'ERR-VND-001' ? err.message : fieldErr(err, 'taxId'))}</Err>
        <label>อีเมล <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label><Err>{fieldErr(err, 'email')}</Err>
        <button disabled={busy} onClick={add}>บันทึก</button> <button onClick={() => { setAdding(false); setErr(undefined); setLocal({}); }}>ยกเลิก</button>
      </div>}
      {list.error && <Problem e={list.error} retry={list.reload} />}
      <table><thead><tr><th>รหัส</th><th>ชื่อ</th><th>เลขผู้เสียภาษี</th><th>อีเมล</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>{list.loading && !list.data ? <tr><td colSpan={6}>กำลังโหลด...</td></tr> : (list.data ?? []).map((v) => (
          <tr key={v.vendorId}><td>{v.vendorCode}</td><td>{v.nameTh}</td><td>{v.taxId}</td><td>{v.email}</td><td><Badge s={v.status} /></td>
            <td>{hasRole('PROCUREMENT_HEAD') && <button onClick={() => { setToggle(v); setReason(''); setTErr(''); }}>{v.status === 'ACTIVE' ? 'ระงับ' : 'เปิดใช้'} {v.vendorCode}</button>}</td></tr>))}</tbody></table>
      {list.data && list.data.length === 0 && <p>ไม่พบผู้ขายตามเงื่อนไข <button onClick={() => { setQ(''); setStatus(''); }}>ล้างตัวกรอง</button></p>}
      {toggle && <div role="dialog" aria-label="ยืนยันการเปลี่ยนสถานะ">
        <p>ยืนยัน{toggle.status === 'ACTIVE' ? 'ระงับ' : 'เปิดใช้'} {toggle.nameTh}?</p>
        <label>เหตุผล <input value={reason} onChange={(e) => setReason(e.target.value)} /></label><Err>{tErr}</Err>
        <button disabled={busy} onClick={change}>ยืนยัน</button> <button onClick={() => setToggle(null)}>ยกเลิก</button></div>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-09
export function SpendReport() {
  const first = todayIso().slice(0, 8) + '01';
  const [from, setFrom] = useState(toBeInput(first)), [to, setTo] = useState(toBeInput(todayIso())), [by, setBy] = useState('department');
  const f = parseBe(from), t = parseBe(to);
  const bad = !f || !t ? 'วันที่ไม่ถูกต้อง' : f > t ? 'วันที่เริ่มต้องไม่เกินวันที่สิ้นสุด' : '';
  const rep = useAsync(() => (bad ? Promise.resolve(null) : api('GET', `/reports/spend-summary?from=${f}&to=${t}&groupBy=${by}`)), [f, t, by, bad]);
  if (rep.error?.status === 403) return <Problem e={rep.error} />;
  const rows: any[] = rep.data?.rows ?? [];
  const sum = (k: string) => rows.reduce((a, r) => a + r[k], 0);
  return (
    <div>
      <h1>รายงานสรุปการจัดซื้อ</h1>
      <label>ตั้งแต่ <input value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label>ถึง <input value={to} onChange={(e) => setTo(e.target.value)} /></label>
      <label>จัดกลุ่มตาม <select value={by} onChange={(e) => setBy(e.target.value)}><option value="department">หน่วยงาน</option><option value="vendor">ผู้ขาย</option><option value="month">เดือน</option></select></label>
      <Err>{bad}</Err>
      {rep.error && <Problem e={rep.error} retry={rep.reload} />}
      {rep.loading && <p>กำลังโหลด...</p>}
      {!bad && !rep.loading && rows.length === 0 && <p>ไม่มีรายการในช่วงที่เลือก</p>}
      {rows.length > 0 && <table aria-label="สรุป"><thead><tr><th>กลุ่ม</th><th>PR</th><th>PO</th><th>ประมาณการ</th><th>สั่งจริง</th><th>ประหยัด</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.group}><td>{r.group}</td><td>{r.prCount}</td><td>{r.poCount}</td><td><Money v={r.estimatedTotal} /></td><td><Money v={r.orderedTotal} /></td><td><Money v={r.savingVsEstimate} /></td></tr>)}
          <tr><td>รวม</td><td>{sum('prCount')}</td><td>{sum('poCount')}</td><td><Money v={sum('estimatedTotal')} /></td><td><Money v={sum('orderedTotal')} /></td><td><Money v={sum('savingVsEstimate')} /></td></tr></tbody></table>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-10
export function Audit() {
  const [q, setQ] = useSearchParams(); const entity = q.get('entity') ?? '', entityId = q.get('entityId') ?? '';
  const [e, setE] = useState(entity || 'PR'), [id, setId] = useState(entityId);
  const log = useAsync(() => (entity && entityId ? api<any[]>('GET', `/audit-logs?entity=${entity}&entityId=${entityId}`) : Promise.resolve(null)), [entity, entityId]);
  if (log.error?.status === 403) return <Problem e={log.error} />;
  return (
    <div>
      <h1>Audit trail</h1>
      <label>ชนิดเอกสาร <select value={e} onChange={(x) => setE(x.target.value)}><option>PR</option><option>RFQ</option><option>PO</option><option>VENDOR</option></select></label>
      <label>รหัสเอกสาร <input value={id} onChange={(x) => setId(x.target.value.replace(/\D/g, ''))} /></label>
      <button disabled={!id} onClick={() => setQ(new URLSearchParams({ entity: e, entityId: id }))}>ค้นหา</button>
      {log.error && <Problem e={log.error} retry={log.reload} />}
      {log.loading && entity && <p>กำลังโหลด...</p>}
      {log.data && log.data.length === 0 && <p>ไม่มีเหตุการณ์ของเอกสารนี้</p>}
      {log.data && log.data.length > 0 && <ol aria-label="เส้นเวลา">{log.data.map((a) => <li key={a.auditId}>{beDateTime(a.createdAt)} · {a.action} · ผู้ใช้ {a.actorId} · {a.detail}</li>)}</ol>}
    </div>
  );
}
