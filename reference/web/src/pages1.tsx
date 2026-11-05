// SCR-01 PR list, SCR-02 PR form, SCR-03 approval inbox. Written from design/05-ui-desc (screens, interactions, wireframes).
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiErr, Badge, Err, Money, Problem, api, baht, beDate, beDateTime, chars, errText, fieldErr, hasRole, me, newKey, num, parseBe, round2, todayIso, toBeInput, useAsync } from './lib';

const STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_SOURCING', 'ORDERED', 'CLOSED', 'CANCELLED'];

// ------------------------------------------------------------------------------------------------ SCR-01
export function PrList() {
  const [q, setQ] = useSearchParams();                                   // filters live in the query string
  const status = q.get('status') ?? '', from = q.get('createdFrom') ?? '', to = q.get('createdTo') ?? '', requesterId = q.get('requesterId') ?? '';
  const [fromTxt, setFromTxt] = useState(from ? toBeInput(from) : ''), [toTxt, setToTxt] = useState(to ? toBeInput(to) : '');
  const [rows, setRows] = useState<any[]>([]); const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true); const [more, setMore] = useState(false); const [err, setErr] = useState<ApiErr>();
  const hasFilter = !!(status || from || to || requesterId);
  const dateRangeIncomplete = !!from !== !!to;                           // both dates before calling

  const load = async (cur?: string) => {
    if (dateRangeIncomplete) return;
    cur ? setMore(true) : setBusy(true); setErr(undefined);
    try {
      const p = new URLSearchParams({ limit: '50' });
      if (status) p.set('status', status); if (from) p.set('createdFrom', from); if (to) p.set('createdTo', to); if (requesterId) p.set('requesterId', requesterId); if (cur) p.set('cursor', cur);
      const r = await api('GET', '/purchase-requests?' + p);
      setRows((x) => (cur ? [...x, ...r.items] : r.items)); setCursor(r.nextCursor);
    } catch (e) { setErr(e as ApiErr); } finally { setBusy(false); setMore(false); }
  };
  useEffect(() => { setRows([]); setCursor(null); load(); }, [status, from, to, requesterId]);

  const set = (k: string, v: string) => { const n = new URLSearchParams(q); v ? n.set(k, v) : n.delete(k); setQ(n); };
  const applyDate = (k: string, txt: string, setTxt: (s: string) => void) => { setTxt(txt); const iso = parseBe(txt); if (txt === '') set(k, ''); else if (iso) set(k, iso); };
  const link = (r: any) => {
    if (r.status === 'APPROVED' && hasRole('PROCUREMENT')) return r.totalEstimated > 5000      // BR-01
      ? <Link to={`/purchase-requests/${r.prId}/rfq/new`}>สร้าง RFQ</Link>
      : <Link to={`/purchase-orders/new?prId=${r.prId}`}>สั่งซื้อตรง</Link>;
    if (r.status === 'IN_SOURCING' && r.rfqId) return <Link to={`/rfqs/${r.rfqId}`}>เปรียบเทียบราคา</Link>;
    if (r.status === 'ORDERED' && r.poId) return <Link to={`/purchase-orders/${r.poId}/receipt`}>รับของ</Link>;
    return null;
  };
  if (err?.status === 403) return <Problem e={err} />;
  return (
    <div>
      <h1>รายการใบขอซื้อ</h1>
      {hasRole('REQUESTER') && <Link to="/purchase-requests/new" role="button">สร้างใบขอซื้อ</Link>}
      <div style={{ display: 'flex', gap: 8, margin: '8px 0' }}>
        <label>สถานะ <select value={status} onChange={(e) => set('status', e.target.value)}><option value="">ทั้งหมด</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>สร้างตั้งแต่ <input value={fromTxt} placeholder="วว/ดด/พศพศ" onChange={(e) => applyDate('createdFrom', e.target.value, setFromTxt)} /></label>
        <label>ถึง <input value={toTxt} placeholder="วว/ดด/พศพศ" onChange={(e) => applyDate('createdTo', e.target.value, setToTxt)} /></label>
        <label>รหัสผู้ขอซื้อ <input value={requesterId} onChange={(e) => set('requesterId', e.target.value.replace(/\D/g, ''))} /></label>
      </div>
      {dateRangeIncomplete && <Err>ระบุช่วงวันที่ให้ครบทั้งสองค่า</Err>}
      {err && err.status !== 403 && <Problem e={err} retry={() => load()} />}
      <table>
        <thead><tr><th>เลขที่</th><th>หัวข้อ</th><th>สถานะ</th><th>วงเงิน</th><th>ผู้ขอซื้อ</th><th>หน่วยงาน</th><th>ต้องการใช้</th><th>ส่งอนุมัติ</th><th></th></tr></thead>
        <tbody>
          {busy && <tr><td colSpan={9}>กำลังโหลด...</td></tr>}
          {!busy && rows.map((r) => (
            <tr key={r.prId}>
              <td>{hasRole('RECEIVER') && !hasRole('REQUESTER', 'DEPT_APPROVER', 'PROCUREMENT', 'PROCUREMENT_HEAD', 'COMMITTEE', 'ADMIN') ? r.prNo : <Link to={`/purchase-requests/${r.prId}`}>{r.prNo}</Link>}</td><td>{r.title}</td><td><Badge s={r.status} /></td><td><Money v={r.totalEstimated} /></td>
              <td>{r.requesterName}</td><td>{r.departmentName}</td><td>{beDate(r.neededByDate)}</td><td>{beDateTime(r.submittedAt)}</td><td>{link(r)}</td>
            </tr>))}
        </tbody>
      </table>
      {!busy && !err && rows.length === 0 && !dateRangeIncomplete && (hasFilter
        ? <p>ไม่พบใบขอซื้อตามเงื่อนไข <button onClick={() => { setFromTxt(''); setToTxt(''); setQ(new URLSearchParams()); }}>ล้างตัวกรอง</button></p>
        : <p>ยังไม่มีใบขอซื้อ</p>)}
      {cursor && <button disabled={more} onClick={() => load(cursor)}>โหลดเพิ่ม</button>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-02
type Item = { description: string; quantity: string; unit: string; estUnitPrice: string };
const blank = (): Item => ({ description: '', quantity: '', unit: '', estUnitPrice: '' });
/** BR-03 thresholds, held as constants shared with the server (no endpoint to read them) */
const chainFor = (t: number) => (t <= 20000 ? ['DEPT_APPROVER'] : t <= 200000 ? ['DEPT_APPROVER', 'PROCUREMENT_HEAD'] : ['DEPT_APPROVER', 'PROCUREMENT_HEAD', 'COMMITTEE']);

export function PrForm() {
  const { prId } = useParams(); const nav = useNavigate();
  const [pr, setPr] = useState<any>(null);                               // loaded document (rowVersion, status, approvals)
  const [title, setTitle] = useState(''), [just, setJust] = useState(''), [need, setNeed] = useState('');
  const [items, setItems] = useState<Item[]>([blank()]);
  const [loading, setLoading] = useState(!!prId); const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({}); const [apiErr, setApiErr] = useState<ApiErr>(); const [note, setNote] = useState(''); const [dirty, setDirty] = useState(false);
  const [conflict, setConflict] = useState(false);

  const fill = (d: any) => { setPr(d); setTitle(d.title); setJust(d.justification); setNeed(toBeInput(d.neededByDate)); setItems(d.items.map((i: any) => ({ description: i.description, quantity: String(i.quantity), unit: i.unit, estUnitPrice: String(i.estUnitPrice) }))); setDirty(false); };
  const load = async () => { setLoading(true); try { fill(await api('GET', `/purchase-requests/${prId}`)); setApiErr(undefined); } catch (e) { setApiErr(e as ApiErr); } finally { setLoading(false); } };
  useEffect(() => { if (prId) load(); }, [prId]);

  const editable = !prId || (pr?.status === 'DRAFT' && hasRole('REQUESTER'));
  const lineTotals = items.map((i) => round2((Number(i.quantity) || 0) * (Number(i.estUnitPrice) || 0)));
  const total = round2(lineTotals.reduce((a, b) => a + b, 0));
  const touch = (f: () => void) => { f(); setDirty(true); };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim() || title.length > 200) e.title = 'หัวข้อ 1–200 ตัวอักษร';
    if (!just.trim() || just.length > 1000) e.justification = 'เหตุผล 1–1,000 ตัวอักษร';
    const iso = parseBe(need); if (!iso) e.neededByDate = 'วันที่ไม่ถูกต้อง (วว/ดด/พศพศ)'; else if (iso < todayIso()) e.neededByDate = 'วันที่ต้องการใช้ต้องไม่ก่อนวันนี้';
    items.forEach((i, n) => {
      if (!i.description.trim()) e[`items[${n}].description`] = 'ระบุรายการ';
      if (!(Number(i.quantity) > 0)) e[`items[${n}].quantity`] = 'จำนวนต้องมากกว่า 0';
      if (!i.unit.trim()) e[`items[${n}].unit`] = 'ระบุหน่วยนับ';
      if (i.estUnitPrice === '' || !(Number(i.estUnitPrice) >= 0)) e[`items[${n}].estUnitPrice`] = 'ราคาต้องไม่ติดลบ';
    });
    setErrs(e); return Object.keys(e).length === 0;
  };
  const payload = () => ({ title, justification: just, neededByDate: parseBe(need), items: items.map((i) => ({ description: i.description, quantity: Number(i.quantity), unit: i.unit, estUnitPrice: Number(i.estUnitPrice) })) });

  const apply422 = (e: ApiErr) => { const m: Record<string, string> = {}; (e.details ?? []).forEach((d) => (m[d.field] = e.message)); setErrs(m); setApiErr(e); };
  async function save(): Promise<any | null> {                           // create or update, returns the saved document
    try {
      if (!prId) { const r = await api('POST', '/purchase-requests', payload(), { key: newKey() }); setNote('บันทึกร่างแล้ว'); nav(`/purchase-requests/${r.prId}`, { replace: true }); return r; }
      const r = await api('PUT', `/purchase-requests/${prId}`, payload(), { key: newKey(), ifMatch: pr.rowVersion });
      setPr(r); setDirty(false); setNote('บันทึกร่างแล้ว'); return r;
    } catch (x) {
      const e = x as ApiErr;
      if (e.status === 422) apply422(e); else if (e.status === 409 && e.code === 'ERR-CONC-001') setConflict(true); else if (e.status === 409) { setApiErr(e); await load(); } else setApiErr(e);
      return null;
    }
  }
  const onSave = async () => { if (!validate()) return; setBusy(true); setNote(''); setApiErr(undefined); await save(); setBusy(false); };
  const onSubmit = async () => {
    if (!validate()) return; setBusy(true); setNote(''); setApiErr(undefined);
    try {
      let id = prId ? Number(prId) : 0;
      if (!prId || dirty) { const s = await save(); if (!s) return; id = s.prId; }
      const r = await api('POST', `/purchase-requests/${id}/submit`, undefined, { key: newKey() });
      alert('ส่งอนุมัติแล้ว ขั้นอนุมัติ: ' + r.approvals.map((a: any) => `${a.stepNo}. ${a.requiredRole}`).join(', '));
      nav('/purchase-requests');
    } catch (x) { const e = x as ApiErr; if (e.status === 409) { setApiErr(e); if (prId) await load(); } else if (e.status === 422) apply422(e); else setApiErr(e); }
    finally { setBusy(false); }
  };
  const onCancel = () => { if (confirm('ทิ้งการแก้ไขที่ยังไม่บันทึกและกลับไปรายการ?')) nav('/purchase-requests'); };

  if (loading) return <p>กำลังโหลด...</p>;
  if (apiErr && (apiErr.status === 404 || apiErr.status === 403) && !pr) return <Problem e={apiErr} />;
  const summary = Object.keys(errs).length > 0 || (apiErr && apiErr.status === 422);
  const ro = !editable;
  return (
    <div>
      <h1>{prId ? `ใบขอซื้อ ${pr?.prNo ?? ''}` : 'สร้างใบขอซื้อ'} {pr && <Badge s={pr.status} />}</h1>
      {summary && <div role="alert" style={{ color: '#b42318' }}>ข้อมูลไม่ผ่านการตรวจ: {apiErr ? errText(apiErr) : 'โปรดตรวจฟิลด์ที่มีข้อความแจ้ง'}</div>}
      {apiErr && apiErr.status !== 422 && <Problem e={apiErr} />}
      {conflict && <div role="alert">มีผู้อื่นแก้เอกสารนี้แล้ว <button onClick={async () => { setConflict(false); await load(); }}>โหลดข้อมูลล่าสุด</button></div>}
      {note && <div role="status">{note}</div>}
      <label>หัวข้อ <input value={title} disabled={ro} maxLength={200} onChange={(e) => touch(() => setTitle(e.target.value))} /></label><Err>{errs.title ?? fieldErr(apiErr, 'title')}</Err><br />
      <label>เหตุผลความจำเป็น <textarea value={just} disabled={ro} maxLength={1000} onChange={(e) => touch(() => setJust(e.target.value))} /></label><Err>{errs.justification ?? fieldErr(apiErr, 'justification')}</Err><br />
      <label>วันที่ต้องการใช้ <input value={need} disabled={ro} placeholder="วว/ดด/พศพศ" onChange={(e) => touch(() => setNeed(e.target.value))} /></label><Err>{errs.neededByDate ?? fieldErr(apiErr, 'neededByDate')}</Err>
      <table>
        <thead><tr><th>#</th><th>รายการ</th><th>จำนวน</th><th>หน่วยนับ</th><th>ราคาต่อหน่วย</th><th>รวม</th><th></th></tr></thead>
        <tbody>
          {items.map((it, n) => (
            <tr key={n}>
              <td>{n + 1}</td>
              <td><input aria-label={`รายการ ${n + 1}`} value={it.description} disabled={ro} onChange={(e) => touch(() => setItems(items.map((x, k) => (k === n ? { ...x, description: e.target.value } : x))))} /><Err>{errs[`items[${n}].description`]}</Err></td>
              <td><input aria-label={`จำนวน ${n + 1}`} inputMode="decimal" value={it.quantity} disabled={ro} onChange={(e) => touch(() => setItems(items.map((x, k) => (k === n ? { ...x, quantity: e.target.value } : x))))} /><Err>{errs[`items[${n}].quantity`]}</Err></td>
              <td><input aria-label={`หน่วยนับ ${n + 1}`} value={it.unit} disabled={ro} onChange={(e) => touch(() => setItems(items.map((x, k) => (k === n ? { ...x, unit: e.target.value } : x))))} /><Err>{errs[`items[${n}].unit`]}</Err></td>
              <td><input aria-label={`ราคาต่อหน่วย ${n + 1}`} inputMode="decimal" value={it.estUnitPrice} disabled={ro} onChange={(e) => touch(() => setItems(items.map((x, k) => (k === n ? { ...x, estUnitPrice: e.target.value } : x))))} /><Err>{errs[`items[${n}].estUnitPrice`]}</Err></td>
              <td><Money v={lineTotals[n]} /></td>
              <td>{!ro && items.length > 1 && <button onClick={() => touch(() => setItems(items.filter((_, k) => k !== n)))}>ลบแถว {n + 1}</button>}</td>
            </tr>))}
        </tbody>
      </table>
      {!ro && <button onClick={() => touch(() => setItems([...items, blank()]))}>เพิ่มรายการ</button>}
      <p>วงเงินรวม: <strong data-testid="total">{baht(total)}</strong> บาท</p>
      <p>สายอนุมัติที่จะเกิดขึ้น: {chainFor(total).map((r, n) => `${n + 1}. ${r}`).join(' → ')}</p>
      {pr?.approvals?.length > 0 && (
        <table aria-label="สายอนุมัติ"><thead><tr><th>ขั้น</th><th>บทบาท</th><th>ผล</th><th>ความเห็น</th><th>เมื่อ</th></tr></thead>
          <tbody>{pr.approvals.map((a: any) => <tr key={a.approvalId}><td>{a.stepNo}</td><td>{a.requiredRole}</td><td><Badge s={a.decision} /></td><td>{a.comment}</td><td>{beDateTime(a.decidedAt)}</td></tr>)}</tbody></table>)}
      {editable && <div style={{ marginTop: 8 }}>
        <button disabled={busy} onClick={onSave}>บันทึกร่าง</button> <button disabled={busy} onClick={onSubmit}>ส่งอนุมัติ</button> <button disabled={busy} onClick={onCancel}>ยกเลิก</button>
      </div>}
      {!editable && <p><Link to="/purchase-requests">กลับรายการ</Link></p>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-03
export function ApprovalInbox() {
  const list = useAsync(() => api<any[]>('GET', '/approvals'), []);
  const [rejecting, setRejecting] = useState<number | null>(null); const [reason, setReason] = useState('');
  const [msg, setMsg] = useState(''); const [rowErr, setRowErr] = useState<Record<number, string>>({}); const [reasonErr, setReasonErr] = useState(''); const [busy, setBusy] = useState(false);
  const self = me()?.sub;

  const decide = async (row: any, decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED') { if (!reason.trim()) { setReasonErr('ระบุเหตุผลการปฏิเสธ'); return; } if (chars(reason) > 500) { setReasonErr('ไม่เกิน 500 ตัวอักษร'); return; } }
    setBusy(true); setMsg(''); setReasonErr('');
    try {
      const r = await api('POST', `/approvals/${row.approvalId}/decision`, decision === 'REJECTED' ? { decision, comment: reason } : { decision }, { key: newKey() });
      setMsg(`${row.docNo}: ${r.decision === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}`); setRejecting(null); setReason(''); list.reload();
    } catch (x) {
      const e = x as ApiErr;
      if (e.status === 422) setReasonErr(e.message); else if (e.status === 403 && e.code === 'ERR-SOD-001') setRowErr((m) => ({ ...m, [row.approvalId]: e.message })); else if (e.status === 409) { setMsg('ขั้นนี้ถูกตัดสินแล้ว'); list.reload(); } else setMsg(e.message);
    } finally { setBusy(false); }
  };
  if (list.error?.status === 403) return <Problem e={list.error} />;
  return (
    <div>
      <h1>งานรออนุมัติ</h1>
      {msg && <div role="status">{msg}</div>}
      {list.error && <Problem e={list.error} retry={list.reload} />}
      {list.loading && !list.data && <p>กำลังโหลด...</p>}
      {list.data && list.data.length === 0 && <p>ไม่มีรายการรออนุมัติ</p>}
      {list.data && list.data.length > 0 && (
        <table><thead><tr><th>เอกสาร</th><th>หัวข้อ</th><th>ผู้ขอ/ผู้เสนอ</th><th>วงเงิน</th><th>ขั้น</th><th>ส่งเมื่อ</th><th></th></tr></thead>
          <tbody>{list.data.map((r) => {
            const mine = r.proposerId === self || !!rowErr[r.approvalId];
            return (
              <tr key={r.approvalId}>
                <td>{r.docType === 'PR' ? <Link to={`/purchase-requests/${r.docId}`}>{r.docNo}</Link> : <Link to={`/rfqs/${r.docId}`}>{r.docNo}</Link>}</td>
                <td>{r.docTitle}</td><td>{r.requesterName}</td><td><Money v={r.amount} /></td><td>{r.stepNo}</td><td>{beDateTime(r.submittedAt)}</td>
                <td>{mine ? <span>{rowErr[r.approvalId] ?? 'ผู้ขอหรือผู้เสนอผลอนุมัติเองไม่ได้'}</span> : rejecting === r.approvalId ? (
                  <span><label>เหตุผล <textarea value={reason} onChange={(e) => setReason(e.target.value)} /></label> <span>{chars(reason)}/500</span><Err>{reasonErr}</Err>
                    <button disabled={busy} onClick={() => decide(r, 'REJECTED')}>ยืนยันปฏิเสธ</button> <button onClick={() => { setRejecting(null); setReason(''); setReasonErr(''); }}>ยกเลิก</button></span>
                ) : (<span><button disabled={busy} onClick={() => decide(r, 'APPROVED')}>อนุมัติ</button> <button disabled={busy} onClick={() => { setRejecting(r.approvalId); setReason(''); setReasonErr(''); }}>ปฏิเสธ</button></span>)}</td>
              </tr>);
          })}</tbody></table>)}
    </div>
  );
}
