import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, Navigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { getToken, hasRole, me, setToken } from './lib';
import { ApprovalInbox, PrForm, PrList } from './pages1';
import { GoodsReceipt, PoCreate, PoView, RfqCompare, RfqCreate } from './pages2';
import { Audit, SpendReport, Vendors } from './pages3';

/** Authentication (ADR-05) happens at the SSO; this page is where an expired token lands (every screen: 401 row).
 *  The test profile (CNV-10) lets a token be pasted. */
function Login() {
  const [q] = useSearchParams(); const [t, setT] = useState('');
  return (
    <div>
      <h1>ยืนยันตัวตน</h1>
      <p>เซสชันหมดอายุหรือยังไม่ได้เข้าสู่ระบบ กรุณายืนยันตัวตนผ่าน SSO แล้วกลับมาที่ {q.get('returnTo') ?? '/'}</p>
      <label>token (โปรไฟล์ทดสอบ) <input value={t} onChange={(e) => setT(e.target.value)} /></label>
      <button onClick={() => { setToken(t); location.assign(q.get('returnTo') ?? '/'); }}>เข้าสู่ระบบ</button>
    </div>
  );
}

function Nav() {
  const u = me();
  if (!u) return null;
  return (
    <nav aria-label="เมนู" style={{ display: 'flex', gap: 12, padding: 8, borderBottom: '1px solid #ccc' }}>
      <Link to="/purchase-requests">ใบขอซื้อ</Link>
      {hasRole('DEPT_APPROVER', 'PROCUREMENT_HEAD', 'COMMITTEE') && <Link to="/approvals">งานรออนุมัติ</Link>}
      {hasRole('PROCUREMENT', 'PROCUREMENT_HEAD', 'ADMIN') && <Link to="/vendors">ผู้ขาย</Link>}
      {hasRole('PROCUREMENT_HEAD', 'ADMIN') && <Link to="/reports/spend">รายงาน</Link>}
      {hasRole('ADMIN') && <Link to="/audit">Audit</Link>}
      <span style={{ marginLeft: 'auto' }}>{u.email} ({u.roles.join(', ')})</span>
    </nav>
  );
}

/** every screen except /login needs a token */
const Guard = ({ el }: { el: JSX.Element }) => (getToken() ? el : <Navigate to={'/login?returnTo=' + encodeURIComponent(location.pathname + location.search)} replace />);

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Nav />
    <main style={{ padding: 12 }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/purchase-requests" replace />} />
        <Route path="/purchase-requests" element={<Guard el={<PrList />} />} />
        <Route path="/purchase-requests/new" element={<Guard el={<PrForm />} />} />
        <Route path="/purchase-requests/:prId" element={<Guard el={<PrForm />} />} />
        <Route path="/purchase-requests/:prId/rfq/new" element={<Guard el={<RfqCreate />} />} />
        <Route path="/approvals" element={<Guard el={<ApprovalInbox />} />} />
        <Route path="/rfqs/:rfqId" element={<Guard el={<RfqCompare />} />} />
        <Route path="/purchase-orders/new" element={<Guard el={<PoCreate />} />} />
        <Route path="/purchase-orders/:poId" element={<Guard el={<PoView />} />} />
        <Route path="/purchase-orders/:poId/receipt" element={<Guard el={<GoodsReceipt />} />} />
        <Route path="/vendors" element={<Guard el={<Vendors />} />} />
        <Route path="/reports/spend" element={<Guard el={<SpendReport />} />} />
        <Route path="/audit" element={<Guard el={<Audit />} />} />
        <Route path="*" element={<p>ไม่พบหน้า</p>} />
      </Routes>
    </main>
  </BrowserRouter>
);
