// SCR-04 RFQ create, SCR-05 quotations and comparison, SCR-06 purchase order, SCR-07 goods receipt.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiErr, Badge, Err, Money, Problem, api, baht, beDateTime, chars, hasRole, newKey, num, useAsync, useDebounced } from './lib';

// ------------------------------------------------------------------------------------------------ SCR-04
export function RfqCreate() {
  const { prId } = useParams(); const nav = useNavigate();
  const pr = useAsync(() => api('GET', `/purchase-requests/${prId}`), [prId]);
  const [q, setQ] = useState(''); const dq = useDebounced(q, 300);
  const vendors = useAsync(() => api<any[]>('GET', `/vendors?status=ACTIVE&q=${encodeURIComponent(dq)}`), [dq]);
  const [picked, setPicked] = useState<Record<number, string>>({});      // vendorId -> name (kept across searches)
  const [due, setDue] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiErr>();

  const count = Object.keys(picked).length;
  const dueIso = due ? new Date(due).toISOString() : '';
  const dueOk = !!due && new Date(due).getTime() > Date.now();
  const create = async () => {
    setBusy(true); setErr(undefined);
    try {
      const r = await api('POST', '/rfqs', { prId: Number(prId), dueAt: dueIso, vendorIds: Object.keys(picked).map(Number) }, { key: newKey() });
      alert(`สร้าง RFQ ${r.rfqNo} แล้ว`); nav(`/rfqs/${r.rfqId}`);
    } catch (x) {
      const e = x as ApiErr; setErr(e);
      if (e.code === 'ERR-VND-002') { /* drop suspended vendors from the selection: refresh the list of ACTIVE vendors and keep only those */ const act = await api<any[]>('GET', '/vendors?status=ACTIVE'); const ok = new Set(act.map((v) => v.vendorId)); setPicked((p) => Object.fromEntries(Object.entries(p).filter(([id]) => ok.has(Number(id))))); vendors.reload(); }
      if (e.code === 'ERR-STATE-002') nav('/purchase-requests');
    } finally { setBusy(false); }
  };
  if (pr.error) return <Problem e={pr.error} retry={pr.reload} />;
  if (!pr.data) return <p>กำลังโหลด...</p>;
  return (
    <div>
      <h1>สร้าง RFQ</h1>
      <p>PR ต้นทาง: {pr.data.prNo} {pr.data.title} <Badge s={pr.data.status} /> วงเงิน <strong>{baht(pr.data.totalEstimated)}</strong></p>
      <ul>{pr.data.items.map((i: any) => <li key={i.prItemId}>{i.description} {num(i.quantity)} {i.unit}</li>)}</ul>
      <label>วันปิดรับใบเสนอราคา <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></label>
      <h2>เชิญผู้ขาย</h2>
      <label>ค้นหาผู้ขาย <input value={q} onChange={(e) => setQ(e.target.value)} /></label>
      {vendors.error && <Problem e={vendors.error} retry={vendors.reload} />}
      <ul>{(vendors.data ?? []).map((v) => (
        <li key={v.vendorId}><label><input type="checkbox" checked={v.vendorId in picked} onChange={(e) => setPicked((p) => { const n = { ...p }; e.target.checked ? (n[v.vendorId] = v.nameTh) : delete n[v.vendorId]; return n; })} /> {v.vendorCode} {v.nameTh}</label></li>))}</ul>
      <p>เลือกแล้ว <span data-testid="picked">{count}</span> ราย</p>
      {count < 3 && <Err>ต้องเชิญผู้ขายอย่างน้อย 3 ราย</Err>}
      {!!due && !dueOk && <Err>วันปิดรับต้องอยู่ในอนาคต</Err>}
      {err && err.code !== 'ERR-RFQ-001' && <Problem e={err} />}
      {err?.code === 'ERR-RFQ-001' && <Err>{err.message}</Err>}
      {err?.code === 'ERR-RFQ-006' && <p>ใช้ซื้อตรงที่ <Link to={`/purchase-orders/new?prId=${prId}`}>หน้าใบสั่งซื้อ</Link></p>}
      <button disabled={busy || count < 3 || !dueOk} onClick={create}>สร้าง RFQ</button>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-05
export function RfqCompare() {
  const { rfqId } = useParams(); const nav = useNavigate();
  const rfq = useAsync(() => api('GET', `/rfqs/${rfqId}`), [rfqId]);
  const cmp = useAsync(() => api('GET', `/rfqs/${rfqId}/comparison`), [rfqId]);
  const [form, setForm] = useState<{ vendorId: number; lead: string; prices: Record<number, string> } | null>(null);
  const [winner, setWinner] = useState<number | null>(null); const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [formErr, setFormErr] = useState<ApiErr>(); const [awardErr, setAwardErr] = useState<ApiErr>();
  const reloadAll = () => { rfq.reload(); cmp.reload(); };

  if (rfq.error) return <Problem e={rfq.error} retry={rfq.reload} />;
  if (cmp.error) return <Problem e={cmp.error} retry={cmp.reload} />;
  if (!rfq.data || !cmp.data) return <p>กำลังโหลด...</p>;
  const r = rfq.data, qs: any[] = cmp.data.quotations, open = r.status === 'OPEN', proc = hasRole('PROCUREMENT');
  const lowest = cmp.data.lowestQuotationId;
  const needReason = winner != null && winner !== lowest;
  const reasonOk = !needReason || chars(reason) >= 20;
  const canAward = open && proc && qs.length >= 2 && winner != null && reasonOk;
  const price = (q: any, itemId: number) => q.itemPrices.find((p: any) => p.prItemId === itemId)?.unitPrice;

  const openForm = (vendorId: number) => setForm({ vendorId, lead: '', prices: {} });
  const saveQuotation = async () => {
    if (!form) return; setBusy(true); setFormErr(undefined); setMsg('');
    try {
      await api('POST', `/rfqs/${rfqId}/quotations`, { vendorId: form.vendorId, leadTimeDays: Number(form.lead), items: r.items.map((i: any) => ({ prItemId: i.prItemId, unitPrice: Number(form.prices[i.prItemId]) })) }, { key: newKey() });
      setMsg('บันทึกใบเสนอราคาแล้ว'); setForm(null); setWinner(null); cmp.reload();
    } catch (x) { const e = x as ApiErr; setFormErr(e); if (e.status === 409) reloadAll(); } finally { setBusy(false); }
  };
  const award = async () => {
    setBusy(true); setAwardErr(undefined); setMsg('');
    try { await api('POST', `/rfqs/${rfqId}/award`, needReason ? { quotationId: winner, reason } : { quotationId: winner }, { key: newKey() }); setMsg('ส่งอนุมัติผลแล้ว'); reloadAll(); }
    catch (x) { const e = x as ApiErr; setAwardErr(e); if (e.status === 409) reloadAll(); } finally { setBusy(false); }
  };
  return (
    <div>
      <h1>ใบเสนอราคา {r.rfqNo} <Badge s={r.status} /></h1>
      <p>PR ต้นทาง: {r.prNo} {r.prTitle} · ปิดรับ {beDateTime(r.dueAt)}</p>
      {msg && <div role="status">{msg}</div>}
      {qs.length === 0 && <p>ยังไม่มีใบเสนอราคา</p>}
      <table aria-label="เปรียบเทียบราคา">
        <thead><tr><th>รายการ</th>{qs.map((q) => <th key={q.quotationId} data-lowest={q.quotationId === lowest} data-proposed={q.quotationId === r.awardedQuotationId}>{q.vendorName}{q.quotationId === lowest ? ' (ต่ำสุด)' : ''}{q.quotationId === r.awardedQuotationId ? ' (เสนอเป็นผู้ชนะ)' : ''}</th>)}</tr></thead>
        <tbody>
          {r.items.map((i: any) => <tr key={i.prItemId}><td>{i.description} ({num(i.quantity)} {i.unit})</td>{qs.map((q) => <td key={q.quotationId}><Money v={price(q, i.prItemId)} /></td>)}</tr>)}
          <tr><td>ราคารวม</td>{qs.map((q) => <td key={q.quotationId}><Money v={q.totalAmount} /></td>)}</tr>
          <tr><td>ส่งมอบ (วัน)</td>{qs.map((q) => <td key={q.quotationId}>{q.leadTimeDays}</td>)}</tr>
          {open && proc && <tr><td>ผู้ชนะ</td>{qs.map((q) => <td key={q.quotationId}><label><input type="radio" name="winner" checked={winner === q.quotationId} onChange={() => setWinner(q.quotationId)} /> เลือก {q.vendorName}</label></td>)}</tr>}
        </tbody>
      </table>
      {open && proc && <div>
        <h2>บันทึกใบเสนอราคาของผู้ขาย</h2>
        {r.vendors.map((v: any) => <button key={v.vendorId} onClick={() => openForm(v.vendorId)}>บันทึกใบเสนอราคา {v.vendorName}</button>)}
        {form && <div aria-label="แบบกรอกใบเสนอราคา">
          <label>ระยะเวลาส่งมอบ (วัน) <input value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })} /></label>
          {r.items.map((i: any) => <div key={i.prItemId}><label>ราคาต่อหน่วย {i.description} <input value={form.prices[i.prItemId] ?? ''} onChange={(e) => setForm({ ...form, prices: { ...form.prices, [i.prItemId]: e.target.value } })} /></label></div>)}
          {formErr && <Problem e={formErr} />}
          <button disabled={busy} onClick={saveQuotation}>ยืนยันบันทึก</button> <button onClick={() => setForm(null)}>ยกเลิก</button>
        </div>}
        {needReason && <div><label>เหตุผลที่ไม่เลือกราคาต่ำสุด <textarea value={reason} onChange={(e) => setReason(e.target.value)} /></label> <span>{chars(reason)}/20</span>{!reasonOk && <Err>ระบุเหตุผลอย่างน้อย 20 ตัวอักษร</Err>}</div>}
        {qs.length < 2 && <p>ต้องมีใบเสนอราคาอย่างน้อย 2 ราย จึงเสนอผลได้</p>}
        {awardErr && <Problem e={awardErr} />}
        <button disabled={busy || !canAward} onClick={award}>เสนอผล</button>
      </div>}
      {r.awardedQuotationId != null && r.awardReason && <p>เหตุผลที่เสนอ: {r.awardReason}</p>}
      {r.status === 'AWARD_PENDING' && <p>รออนุมัติผล</p>}
      {r.status === 'AWARDED' && proc && <button onClick={() => nav(`/purchase-orders/new?prId=${r.prId}&rfqId=${r.rfqId}`)}>ไปออก PO</button>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-06
export function PoCreate() {
  const [q] = useSearchParams(); const prId = q.get('prId'), rfqId = q.get('rfqId'); const nav = useNavigate();
  const pr = useAsync(() => api('GET', `/purchase-requests/${prId}`), [prId]);
  const [vq, setVq] = useState(''); const dq = useDebounced(vq, 300);
  const rfq = useAsync(() => (rfqId ? api('GET', `/rfqs/${rfqId}`) : Promise.resolve(null)), [rfqId]);
  const cmp = useAsync(() => (rfqId ? api('GET', `/rfqs/${rfqId}/comparison`) : Promise.resolve(null)), [rfqId]);
  const vendors = useAsync(() => (rfqId ? Promise.resolve([]) : api<any[]>('GET', `/vendors?status=ACTIVE&q=${encodeURIComponent(dq)}`)), [dq, rfqId]);
  const [vendorId, setVendorId] = useState<number | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiErr>();
  const create = async () => {
    setBusy(true); setErr(undefined);
    try {
      const r = await api('POST', '/purchase-orders', rfqId ? { prId: Number(prId), rfqId: Number(rfqId) } : { prId: Number(prId), vendorId }, { key: newKey() });
      nav(`/purchase-orders/${r.poId}`, { replace: true });
    } catch (x) { const e = x as ApiErr; setErr(e); if (e.code === 'ERR-STATE-002') nav('/purchase-requests'); } finally { setBusy(false); }
  };
  if (pr.error) return <Problem e={pr.error} retry={pr.reload} />;
  if (!pr.data) return <p>กำลังโหลด...</p>;
  const total = pr.data.totalEstimated;
  return (
    <div>
      <h1>สร้างใบสั่งซื้อ {rfqId ? '(จากผลประกวด)' : '(ซื้อตรง)'}</h1>
      <p>PR: {pr.data.prNo} {pr.data.title} วงเงิน <strong>{baht(total)}</strong></p>
      <table><thead><tr><th>รายการ</th><th>จำนวน</th><th>หน่วย</th>{!rfqId && <th>ราคาประมาณการ</th>}</tr></thead>
        <tbody>{pr.data.items.map((i: any) => <tr key={i.prItemId}><td>{i.description}</td><td>{num(i.quantity)}</td><td>{i.unit}</td>{!rfqId && <td><Money v={i.estUnitPrice} /></td>}</tr>)}</tbody></table>
      {rfqId ? (() => {
        const w = cmp.data?.quotations.find((x: any) => x.quotationId === rfq.data?.awardedQuotationId);
        return w ? <p>ผู้ชนะ: <strong>{w.vendorName}</strong> ราคารวม <strong>{baht(w.totalAmount)}</strong> (เลือกผู้ขายเองไม่ได้)</p> : <p>กำลังโหลดผู้ชนะ...</p>;
      })() : (
        <div><label>ค้นหาผู้ขาย <input value={vq} onChange={(e) => setVq(e.target.value)} /></label>
          <ul>{(vendors.data ?? []).map((v) => <li key={v.vendorId}><label><input type="radio" name="vendor" checked={vendorId === v.vendorId} onChange={() => setVendorId(v.vendorId)} /> {v.vendorCode} {v.nameTh}</label></li>)}</ul></div>)}
      {err && (err.code === 'ERR-PO-001' ? <Err>{err.message}</Err> : <Problem e={err} />)}
      <button disabled={busy || (!rfqId && vendorId == null)} onClick={create}>สร้าง PO</button>
    </div>
  );
}

export function PoView() {
  const { poId } = useParams();
  const po = useAsync(() => api('GET', `/purchase-orders/${poId}`), [poId]);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiErr>();
  const issue = async () => { setBusy(true); setErr(undefined); try { await api('POST', `/purchase-orders/${poId}/issue`, undefined, { key: newKey() }); po.reload(); } catch (x) { setErr(x as ApiErr); if ((x as ApiErr).status === 409) po.reload(); } finally { setBusy(false); } };
  if (po.error && !po.data) return <Problem e={po.error} retry={po.reload} />;
  if (!po.data) return <p>กำลังโหลด...</p>;
  const p = po.data;
  return (
    <div>
      <h1>ใบสั่งซื้อ {p.poNo} <Badge s={p.status} /></h1>
      <p>ผู้ขาย: {p.vendorName} · มูลค่ารวม <strong>{baht(p.totalAmount)}</strong>{p.issuedAt && <> · ออกเมื่อ {beDateTime(p.issuedAt)}</>}</p>
      <table><thead><tr><th>รายการ</th><th>หน่วย</th><th>จำนวน</th><th>ราคาต่อหน่วย</th></tr></thead>
        <tbody>{p.items.map((i: any) => <tr key={i.poItemId}><td>{i.description}</td><td>{i.unit}</td><td>{num(i.quantity)}</td><td><Money v={i.unitPrice} /></td></tr>)}</tbody></table>
      {err && <Problem e={err} />}
      {p.status === 'DRAFT' && hasRole('PROCUREMENT') && <button disabled={busy} onClick={issue}>ออก PO</button>}
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ SCR-07
export function GoodsReceipt() {
  const { poId } = useParams();
  const po = useAsync(() => api('GET', `/purchase-orders/${poId}`), [poId]);
  const [rec, setRec] = useState<Record<number, string>>({}), [rej, setRej] = useState<Record<number, string>>({}), [note, setNote] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<ApiErr>(); const [msg, setMsg] = useState('');
  if (po.error && !po.data) return <Problem e={po.error} retry={po.reload} />;
  if (!po.data) return <p>กำลังโหลด...</p>;
  const p = po.data; const receivable = ['ISSUED', 'PARTIALLY_RECEIVED'].includes(p.status);
  const over = (i: any) => Number(rec[i.poItemId] || 0) > i.qtyRemaining;
  const neg = (i: any) => Number(rej[i.poItemId] || 0) < 0 || Number(rec[i.poItemId] || 0) < 0;
  const any = p.items.some((i: any) => Number(rec[i.poItemId] || 0) > 0);
  const valid = any && !p.items.some((i: any) => over(i) || neg(i));
  const save = async () => {
    setBusy(true); setErr(undefined); setMsg('');
    try {
      const items = p.items.filter((i: any) => rec[i.poItemId] || rej[i.poItemId]).map((i: any) => ({ poItemId: i.poItemId, qtyReceived: Number(rec[i.poItemId] || 0), qtyRejected: Number(rej[i.poItemId] || 0) }));
      const r = await api('POST', `/purchase-orders/${poId}/receipts`, { ...(note ? { note } : {}), items }, { key: newKey() });
      setMsg(`บันทึกรับของแล้ว เลขที่ ${r.grNo}`); setRec({}); setRej({}); setNote(''); po.reload();
    } catch (x) { const e = x as ApiErr; setErr(e); if (e.status === 422 && e.code === 'ERR-GR-001') po.reload(); if (e.status === 409) po.reload(); } finally { setBusy(false); }
  };
  return (
    <div>
      <h1>รับของ {p.poNo} <Badge s={p.status} /></h1>
      <p>ผู้ขาย: {p.vendorName}</p>
      {msg && <div role="status">{msg}</div>}
      <table><thead><tr><th>รายการ</th><th>หน่วย</th><th>สั่ง</th><th>รับสะสม</th><th>คงเหลือ</th>{receivable && <><th>รับครั้งนี้</th><th>ปฏิเสธ</th></>}</tr></thead>
        <tbody>{p.items.map((i: any) => (
          <tr key={i.poItemId}><td>{i.description}</td><td>{i.unit}</td><td>{num(i.quantity)}</td><td>{num(i.qtyReceived)}</td><td>{num(i.qtyRemaining)}</td>
            {receivable && <><td><input aria-label={`รับ ${i.description}`} inputMode="decimal" value={rec[i.poItemId] ?? ''} onChange={(e) => setRec({ ...rec, [i.poItemId]: e.target.value })} />{over(i) && <Err>เกินจำนวนคงเหลือ</Err>}</td>
              <td><input aria-label={`ปฏิเสธ ${i.description}`} inputMode="decimal" value={rej[i.poItemId] ?? ''} onChange={(e) => setRej({ ...rej, [i.poItemId]: e.target.value })} /></td></>}</tr>))}</tbody></table>
      {p.status === 'RECEIVED' && <p>รับครบแล้ว</p>}
      {!receivable && p.status !== 'RECEIVED' && <p>PO นี้ยังไม่อยู่ในสถานะที่รับของได้</p>}
      {err && (err.status === 422 && err.code === 'ERR-GR-001' ? <Err>{err.message}</Err> : <Problem e={err} />)}
      {receivable && <div><label>หมายเหตุ <input value={note} onChange={(e) => setNote(e.target.value)} /></label> <button disabled={busy || !valid} onClick={save}>บันทึกรับของ</button></div>}
    </div>
  );
}
