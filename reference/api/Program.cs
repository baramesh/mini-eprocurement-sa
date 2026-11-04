// Reference implementation of the Mini e-Procurement API, written from the design documents:
// runtime views V-03..V-14, OpenAPI, business rules, conventions CNV-02..CNV-11, sql/schema.sql.
// Stack per ADR-01: ASP.NET Core 8, SQL Server 2022 (Dapper), Redis for the idempotency cache (ADR-04).
using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.SetMinimumLevel(LogLevel.Warning);
var app = builder.Build();

var cfg = app.Configuration;
var testProfile = cfg["APP_PROFILE"] == "test";
var appCs = cfg["ConnectionStrings:App"]!;
var adminCs = cfg["ConnectionStrings:Admin"]!;
var redis = await ConnectionMultiplexer.ConnectAsync(cfg["Redis"]!);
var cache = redis.GetDatabase();
var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["TEST_JWT_SECRET"] ?? "unset-unset-unset-unset-unset-0000"));
var jwt = new JsonWebTokenHandler();
var jsonOpts = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

string[] ALL = { "REQUESTER", "DEPT_APPROVER", "PROCUREMENT", "PROCUREMENT_HEAD", "COMMITTEE", "ADMIN" };
string[] APPROVERS = { "DEPT_APPROVER", "PROCUREMENT_HEAD", "COMMITTEE" };
string[] WIDE = { "PROCUREMENT", "PROCUREMENT_HEAD", "COMMITTEE", "ADMIN" };

// ---------------------------------------------------------------------------------------------------- plumbing
Dictionary<string, object?> Row(IDictionary<string, object> r) => r.ToDictionary(k => k.Key, k => k.Value is DBNull ? null : k.Value);
async Task<List<Dictionary<string, object?>>> Q(IDbConnection db, string sql, object? p = null, IDbTransaction? tx = null)
    => (await db.QueryAsync(sql, p, tx)).Select(r => Row((IDictionary<string, object>)r)).ToList();
async Task<Dictionary<string, object?>?> Q1(IDbConnection db, string sql, object? p = null, IDbTransaction? tx = null)
    => (await Q(db, sql, p, tx)).FirstOrDefault();

Exception Err(int status, string code, string msg, params (string field, string issue)[] details)
    => new ApiError(status, code, msg, details.Select(d => new { field = d.field, issue = d.issue }).ToArray());
Exception Val(string field, string issue) => Err(422, "ERR-VAL-001", "ข้อมูลไม่ถูกต้อง", (field, issue));

string Iso(DateTime t) => t.ToString("yyyy-MM-dd'T'HH:mm:ss'Z'");
const string TS = "CONVERT(VARCHAR(19), {0}, 126) + 'Z'";       // datetime2(0) -> ISO 8601 UTC (CNV-02)
string Ts(string col) => string.Format(TS, col);
string Hex(object? rv) => rv is byte[] b ? Convert.ToHexString(b) : "";
decimal Money(decimal x) => Math.Round(x, 2, MidpointRounding.AwayFromZero);   // CNV-02: half-up
decimal LineAmount(decimal qty, decimal price) => Money(qty * price);

async Task<string> NextDocNo(string type)
{   // outside the business transaction: a number issued is never reused, even if the caller rolls back (V-08 step 2)
    await using var c = new SqlConnection(appCs);
    var p = new DynamicParameters();
    p.Add("@doc_type", type); p.Add("@doc_no", dbType: DbType.String, size: 20, direction: ParameterDirection.Output);
    await c.ExecuteAsync("usp_next_doc_no", p, commandType: CommandType.StoredProcedure);
    return p.Get<string>("@doc_no");
}

async Task Audit(IDbConnection db, IDbTransaction tx, Ctx c, string entity, long id, string action, string? detail = null)
    => await db.ExecuteAsync("INSERT audit_log (entity, entity_id, action, actor_id, detail, created_at) VALUES (@entity, @id, @action, @actor, @detail, @at)",
        new { entity, id, action, actor = c.U.Id, detail = detail ?? "", at = c.Now }, tx);

// ---------------------------------------------------------------------------------------------------- request context
async Task<(int, object?)> Run(HttpContext http, string[] roles, bool idem, Func<Ctx, Task<(int, object?)>> fn)
{
    var req = http.Request;
    var c = new Ctx { Req = req };
    c.Now = DateTime.UtcNow; c.Now = new DateTime(c.Now.Ticks - c.Now.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);
    if (testProfile && req.Headers.TryGetValue("X-Test-Now", out var tn) && DateTime.TryParse(tn.ToString(), null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var fake))
        c.Now = new DateTime(fake.Ticks - fake.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);

    // 1-3: token, user, role (V-06)
    var auth = req.Headers.Authorization.ToString();
    if (!auth.StartsWith("Bearer ")) throw Err(401, "ERR-AUTH-001", "ไม่มี token");
    var res = await jwt.ValidateTokenAsync(auth[7..], new TokenValidationParameters
    {
        ValidateIssuer = false, ValidAudience = "eprocurement", ValidateAudience = true, ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero, IssuerSigningKey = jwtKey, ValidAlgorithms = new[] { "HS256" },
    });
    if (!res.IsValid) throw Err(401, "ERR-AUTH-001", "token ไม่ถูกต้องหรือหมดอายุ");
    var tok = (JsonWebToken)res.SecurityToken;
    var email = tok.GetPayloadValue<string>("email");
    tok.TryGetPayloadValue<string[]>("roles", out var claimRoles);
    claimRoles ??= Array.Empty<string>();

    await using var db = new SqlConnection(appCs);
    await db.OpenAsync();
    c.Db = db;
    var u = await Q1(db, "SELECT user_id id, department_id dept, full_name name FROM app_user WHERE email = @email AND is_active = 1", new { email });
    if (u is null) throw Err(403, "ERR-AUTH-002", "ไม่พบผู้ใช้");
    if (!claimRoles.Any(r => roles.Contains(r))) throw Err(403, "ERR-AUTH-002", "บทบาทไม่อนุญาต");
    c.U = new User(Convert.ToInt32(u["id"]), Convert.ToInt32(u["dept"]), (string)u["name"]!, claimRoles);

    foreach (var (k, v) in req.Query) c.Query[k] = v.ToString();
    string raw = "";
    if (req.ContentLength is > 0 || req.Headers.ContainsKey("Transfer-Encoding"))
    {
        using var sr = new StreamReader(req.Body, Encoding.UTF8); raw = await sr.ReadToEndAsync();
    }
    if (raw.Length > 0)
    {
        try { c.Body = JsonDocument.Parse(raw).RootElement.Clone(); } catch (JsonException) { throw Val("body", "invalid JSON"); }
    }
    foreach (var (k, v) in http.GetRouteData().Values)
        if (long.TryParse(v?.ToString(), out var n)) c.P[k] = n; else if (v is not null) throw Err(404, "ERR-NF-001", "ไม่พบ");

    // 5: idempotency (CNV-05)
    string? ikey = null, hash = null;
    if (idem)
    {
        ikey = req.Headers["Idempotency-Key"].ToString();
        if (string.IsNullOrEmpty(ikey)) throw Val("Idempotency-Key", "required");
        hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(req.Method + req.Path + raw)));
        var seen = await cache.StringGetAsync($"idem:{c.U.Id}:{ikey}");
        if (seen.HasValue)
        {
            var doc = JsonDocument.Parse(seen.ToString()).RootElement;
            if (doc.GetProperty("hash").GetString() != hash) throw Err(422, "ERR-IDEM-001", "payload ต่างจากคำขอเดิมที่ใช้คีย์นี้");
            return (doc.GetProperty("status").GetInt32(), JsonSerializer.Deserialize<JsonElement>(doc.GetProperty("body").GetRawText()));
        }
    }
    var (status, body) = await fn(c);
    if (idem && status < 300)
        await cache.StringSetAsync($"idem:{c.U.Id}:{ikey}", JsonSerializer.Serialize(new { hash, status, body }, jsonOpts), TimeSpan.FromHours(24));
    return (status, body);
}

void Op(string method, string pattern, string[] roles, bool idem, Func<Ctx, Task<(int, object?)>> fn)
    => app.MapMethods("/api/v1" + pattern, new[] { method }, async (HttpContext http) =>
    {
        try
        {
            var (status, body) = await Run(http, roles, idem, fn);
            http.Response.StatusCode = status; http.Response.ContentType = "application/json; charset=utf-8";
            await http.Response.WriteAsync(JsonSerializer.Serialize(body, jsonOpts));
        }
        catch (ApiError e) { await Fail(http, e); }
        catch (SqlException e) when (e.Number is 2627 or 2601) { await Fail(http, new ApiError(409, "ERR-STATE-001", "ข้อมูลซ้ำหรือขัดแย้งกับสถานะปัจจุบัน")); }
        catch (SqlException e) when (e.Number is 1205) { await Fail(http, new ApiError(409, "ERR-STATE-001", "ธุรกรรมชนกัน ลองใหม่")); }
    });
async Task Fail(HttpContext http, ApiError e)
{
    http.Response.StatusCode = e.Status; http.Response.ContentType = "application/json; charset=utf-8";
    await http.Response.WriteAsync(JsonSerializer.Serialize(e.Details is null ? (object)new { code = e.Code, message = e.Message } : new { code = e.Code, message = e.Message, details = e.Details }, jsonOpts));
}

// ---------------------------------------------------------------------------------------------------- validation helpers
List<(string field, string issue)> Bad() => new();
void Throw(List<(string field, string issue)> bad)
{
    if (bad.Count > 0) throw new ApiError(422, "ERR-VAL-001", "ข้อมูลไม่ถูกต้อง", bad.Select(b => new { field = b.field, issue = b.issue }).ToArray());
}
bool Dec(JsonElement e, int scale, out decimal v)
{
    v = 0; if (e.ValueKind != JsonValueKind.Number || !e.TryGetDecimal(out v)) return false;
    return Math.Round(v, scale) == v;
}
int Chars(string s) => s.Normalize(NormalizationForm.FormC).EnumerateRunes().Count();     // CNV-02: code points after NFC
DateOnly BkkDay(DateTime utc) => DateOnly.FromDateTime(utc.AddHours(7));

// ---------------------------------------------------------------------------------------------------- purchase requests
string ScopeSql(User u)
{
    if (u.Roles.Any(WIDE.Contains)) return "1=1";
    var parts = new List<string>();
    if (u.Roles.Contains("REQUESTER")) parts.Add("p.requester_id = @uid");
    if (u.Roles.Contains("DEPT_APPROVER")) parts.Add("p.department_id = @dept");
    return parts.Count == 0 ? "1=0" : "(" + string.Join(" OR ", parts) + ")";
}
const string PR_COLS = @"p.pr_id prId, p.pr_no prNo, p.status, p.title, CONVERT(VARCHAR(10), p.needed_by_date, 23) neededByDate,
    p.total_estimated totalEstimated, ur.full_name requesterName, d.name_th departmentName,
    CASE WHEN p.submitted_at IS NULL THEN NULL ELSE CONVERT(VARCHAR(19), p.submitted_at, 126) + 'Z' END submittedAt,
    (SELECT TOP 1 r.rfq_id FROM rfq r WHERE r.pr_id = p.pr_id ORDER BY r.rfq_id DESC) rfqId,
    (SELECT TOP 1 o.po_id FROM purchase_order o WHERE o.pr_id = p.pr_id AND o.status <> 'CANCELLED' ORDER BY o.po_id) poId";
const string PR_FROM = " FROM purchase_request p JOIN app_user ur ON ur.user_id = p.requester_id JOIN department d ON d.department_id = p.department_id ";

async Task<Dictionary<string, object?>> PrFull(Ctx c, long id, IDbTransaction? tx = null)
{
    var r = (await Q1(c.Db, "SELECT " + PR_COLS + ", p.justification, p.row_version rowVersion " + PR_FROM + "WHERE p.pr_id = @id", new { id }, tx))!;
    r["rowVersion"] = Hex(r["rowVersion"]);
    r["items"] = await Q(c.Db, "SELECT description, quantity, unit, est_unit_price estUnitPrice, pr_item_id prItemId, line_no AS [lineNo] FROM pr_item WHERE pr_id = @id ORDER BY line_no", new { id }, tx);
    r["approvals"] = await Approvals(c, "PR", id, tx);
    return r;
}
Task<List<Dictionary<string, object?>>> Approvals(Ctx c, string type, long id, IDbTransaction? tx = null)
    => Q(c.Db, "SELECT approval_id approvalId, doc_type docType, doc_id docId, step_no stepNo, required_role requiredRole, decision, comment, CASE WHEN decided_at IS NULL THEN NULL ELSE " + Ts("decided_at") + " END decidedAt FROM approval WHERE doc_type = @type AND doc_id = @id ORDER BY step_no", new { type, id }, tx);

void ValidatePr(Ctx c)
{
    var bad = Bad();
    if (c.Body.ValueKind != JsonValueKind.Object) { bad.Add(("body", "object required")); Throw(bad); }
    var title = c.Str("title"); if (string.IsNullOrEmpty(title) || title.Length > 200) bad.Add(("title", "required, max 200"));
    var just = c.Str("justification"); if (string.IsNullOrEmpty(just) || just.Length > 1000) bad.Add(("justification", "required, max 1000"));
    var nb = c.Str("neededByDate");
    if (nb is null || !DateOnly.TryParseExact(nb, "yyyy-MM-dd", out var nd) || nd < BkkDay(c.Now)) bad.Add(("neededByDate", "date not before today (Asia/Bangkok)"));
    if (c.Prop("items") is not { ValueKind: JsonValueKind.Array } items || items.GetArrayLength() < 1 || items.GetArrayLength() > 100) bad.Add(("items", "minItems: 1, maxItems: 100"));
    else
    {
        var i = 0;
        foreach (var it in items.EnumerateArray())
        {
            string D(string n) => it.ValueKind == JsonValueKind.Object && it.TryGetProperty(n, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()! : "";
            if (D("description").Length is 0 or > 300) bad.Add(($"items[{i}].description", "required, max 300"));
            if (D("unit").Length is 0 or > 30) bad.Add(($"items[{i}].unit", "required, max 30"));
            if (!(it.ValueKind == JsonValueKind.Object && it.TryGetProperty("quantity", out var q) && Dec(q, 3, out var qv) && qv > 0 && qv <= 999999999m)) bad.Add(($"items[{i}].quantity", "exclusiveMinimum: 0, up to 3 decimals"));
            if (!(it.ValueKind == JsonValueKind.Object && it.TryGetProperty("estUnitPrice", out var pr) && Dec(pr, 2, out var pv) && pv >= 0 && pv <= 999999999999m)) bad.Add(($"items[{i}].estUnitPrice", "minimum: 0, up to 2 decimals"));
            i++;
        }
        if (bad.Count == 0 && items.EnumerateArray().Sum(x => LineAmount(x.GetProperty("quantity").GetDecimal(), x.GetProperty("estUnitPrice").GetDecimal())) > 999999999999.99m)
            bad.Add(("items", "total exceeds DECIMAL(14,2)"));
    }
    Throw(bad);
}
decimal PrTotal(Ctx c) => c.Body.GetProperty("items").EnumerateArray().Sum(it => LineAmount(it.GetProperty("quantity").GetDecimal(), it.GetProperty("estUnitPrice").GetDecimal()));
async Task WriteItems(Ctx c, IDbTransaction tx, long prId)
{
    await c.Db.ExecuteAsync("DELETE FROM pr_item WHERE pr_id = @prId", new { prId }, tx);
    var n = 1;
    foreach (var it in c.Body.GetProperty("items").EnumerateArray())
        await c.Db.ExecuteAsync("INSERT pr_item (pr_id, line_no, description, quantity, unit, est_unit_price) VALUES (@prId, @n, @d, @q, @u, @p)",
            new { prId, n = n++, d = it.GetProperty("description").GetString(), q = it.GetProperty("quantity").GetDecimal(), u = it.GetProperty("unit").GetString(), p = it.GetProperty("estUnitPrice").GetDecimal() }, tx);
}

Op("GET", "/purchase-requests", ALL, false, async c =>
{
    var limit = 50;
    if (c.Query.TryGetValue("limit", out var l) && (!int.TryParse(l, out limit) || limit < 1 || limit > 100)) throw Val("limit", "1..100");
    var where = new StringBuilder(ScopeSql(c.U));
    var prm = new DynamicParameters(new { uid = c.U.Id, dept = c.U.Dept, take = limit + 1 });
    if (c.Query.TryGetValue("status", out var st)) { where.Append(" AND p.status = @st"); prm.Add("st", st); }
    if (c.Query.TryGetValue("requesterId", out var rq)) { if (!long.TryParse(rq, out var rid)) throw Val("requesterId", "integer"); where.Append(" AND p.requester_id = @rid"); prm.Add("rid", rid); }
    foreach (var (name, op) in new[] { ("createdFrom", ">="), ("createdTo", "<=") })
        if (c.Query.TryGetValue(name, out var dv)) { if (!DateOnly.TryParseExact(dv, "yyyy-MM-dd", out var dd)) throw Val(name, "date"); where.Append($" AND CAST(DATEADD(HOUR, 7, p.created_at) AS DATE) {op} @{name}"); prm.Add(name, dd.ToDateTime(TimeOnly.MinValue)); }
    if (c.Query.TryGetValue("cursor", out var cur))
    {
        try { var parts = Encoding.UTF8.GetString(Convert.FromBase64String(cur)).Split('|'); prm.Add("cAt", DateTime.Parse(parts[0], null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal)); prm.Add("cId", long.Parse(parts[1])); }
        catch { throw Val("cursor", "invalid"); }
        where.Append(" AND (p.created_at < @cAt OR (p.created_at = @cAt AND p.pr_id < @cId))");
    }
    var rows = await Q(c.Db, "SELECT TOP (@take) " + PR_COLS + ", p.created_at createdAtRaw " + PR_FROM + "WHERE " + where + " ORDER BY p.created_at DESC, p.pr_id DESC", prm);
    string? next = null;
    if (rows.Count > limit)
    {
        rows = rows.Take(limit).ToList(); var last = rows[^1];
        next = Convert.ToBase64String(Encoding.UTF8.GetBytes(((DateTime)last["createdAtRaw"]!).ToString("yyyy-MM-dd'T'HH:mm:ss") + "|" + last["prId"]));
    }
    foreach (var r in rows) r.Remove("createdAtRaw");
    return (200, new { items = rows, nextCursor = next });
});

Op("POST", "/purchase-requests", new[] { "REQUESTER" }, true, async c =>
{
    ValidatePr(c);
    var no = await NextDocNo("PR");
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var id = await c.Db.ExecuteScalarAsync<long>(@"INSERT purchase_request (pr_no, requester_id, department_id, title, justification, needed_by_date, total_estimated, status, created_at)
        OUTPUT INSERTED.pr_id VALUES (@no, @uid, @dept, @title, @just, @nb, @total, 'DRAFT', @now)",
        new { no, uid = c.U.Id, dept = c.U.Dept, title = c.Str("title"), just = c.Str("justification"), nb = DateTime.ParseExact(c.Str("neededByDate")!, "yyyy-MM-dd", null), total = PrTotal(c), now = c.Now }, tx);
    await WriteItems(c, tx, id);
    await Audit(c.Db, tx, c, "PR", id, "CREATE");
    await tx.CommitAsync();
    return (201, await PrFull(c, id));
});

async Task<long> ScopedPr(Ctx c, long id, bool ownerOnly, IDbTransaction? tx = null)
{
    var where = ownerOnly ? "p.requester_id = @uid" : ScopeSql(c.U);
    var r = await Q1(c.Db, "SELECT p.pr_id id FROM purchase_request p WHERE p.pr_id = @id AND " + where, new { id, uid = c.U.Id, dept = c.U.Dept }, tx);
    if (r is null) throw Err(404, "ERR-NF-001", "ไม่พบเอกสาร");   // V-06 step 4: out of scope looks like absent
    return id;
}
Op("GET", "/purchase-requests/{prId}", ALL, false, async c => { await ScopedPr(c, c.P["prId"], false); return (200, await PrFull(c, c.P["prId"])); });

Op("PUT", "/purchase-requests/{prId}", new[] { "REQUESTER" }, true, async c =>
{
    var id = await ScopedPr(c, c.P["prId"], true);
    ValidatePr(c);
    var ifm = c.Req.Headers["If-Match"].ToString();
    if (string.IsNullOrEmpty(ifm)) throw Val("If-Match", "required");
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync(IsolationLevel.ReadCommitted);
    var cur = (await Q1(c.Db, "SELECT status, row_version rv FROM purchase_request WITH (UPDLOCK, ROWLOCK) WHERE pr_id = @id", new { id }, tx))!;
    if (Hex(cur["rv"]) != ifm.Trim('"')) throw Err(409, "ERR-CONC-001", "เอกสารถูกแก้โดยผู้อื่น โหลดใหม่ก่อนแก้");
    if ((string)cur["status"]! != "DRAFT") throw Err(409, "ERR-STATE-001", "แก้ไขได้เฉพาะฉบับร่าง");
    await c.Db.ExecuteAsync("UPDATE purchase_request SET title = @t, justification = @j, needed_by_date = @n, total_estimated = @total WHERE pr_id = @id",
        new { t = c.Str("title"), j = c.Str("justification"), n = DateTime.ParseExact(c.Str("neededByDate")!, "yyyy-MM-dd", null), total = PrTotal(c), id }, tx);
    await WriteItems(c, tx, id);
    await Audit(c.Db, tx, c, "PR", id, "UPDATE");
    var res = await PrFull(c, id, tx);
    await tx.CommitAsync();
    return (200, res);
});

Op("POST", "/purchase-requests/{prId}/submit", new[] { "REQUESTER" }, true, async c =>
{
    var id = await ScopedPr(c, c.P["prId"], true);
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var pr = (await Q1(c.Db, "SELECT status, total_estimated total, (SELECT COUNT(*) FROM pr_item WHERE pr_id = @id) itemCount FROM purchase_request WITH (UPDLOCK, ROWLOCK) WHERE pr_id = @id", new { id }, tx))!;
    if ((string)pr["status"]! != "DRAFT" || Convert.ToInt32(pr["itemCount"]) < 1) throw Err(409, "ERR-STATE-001", "ส่งอนุมัติได้เฉพาะฉบับร่างที่มีรายการ");
    var total = (decimal)pr["total"]!;
    var chain = total <= 20000m ? new[] { "DEPT_APPROVER" } : total <= 200000m ? new[] { "DEPT_APPROVER", "PROCUREMENT_HEAD" } : new[] { "DEPT_APPROVER", "PROCUREMENT_HEAD", "COMMITTEE" };
    for (var i = 0; i < chain.Length; i++)
        await c.Db.ExecuteAsync("INSERT approval (doc_type, doc_id, step_no, required_role, decision) VALUES ('PR', @id, @n, @role, 'PENDING')", new { id, n = i + 1, role = chain[i] }, tx);
    await c.Db.ExecuteAsync("UPDATE purchase_request SET status = 'SUBMITTED', submitted_at = @now WHERE pr_id = @id", new { id, now = c.Now }, tx);
    await Audit(c.Db, tx, c, "PR", id, "SUBMIT", "ส่งอนุมัติ");
    var res = await PrFull(c, id, tx);
    await tx.CommitAsync();
    return (200, res);
});

// ---------------------------------------------------------------------------------------------------- approvals
Op("GET", "/approvals", APPROVERS, false, async c =>
{
    var rows = await Q(c.Db, $@"SELECT a.approval_id approvalId, a.doc_type docType, a.doc_id docId, a.step_no stepNo, a.required_role requiredRole, a.decision, a.comment, NULL decidedAt,
        CASE a.doc_type WHEN 'PR' THEN p.pr_no ELSE r.rfq_no END docNo,
        CASE a.doc_type WHEN 'PR' THEN p.title ELSE p2.title END docTitle,
        CASE a.doc_type WHEN 'PR' THEN ur.full_name ELSE ua.full_name END requesterName,
        CASE a.doc_type WHEN 'PR' THEN p.total_estimated ELSE q.total_amount END amount,
        CASE a.doc_type WHEN 'PR' THEN {Ts("p.submitted_at")} ELSE {Ts("aw.awarded_at")} END submittedAt,
        CASE a.doc_type WHEN 'PR' THEN p.requester_id ELSE aw.awarded_by END proposerId
        FROM approval a
        LEFT JOIN purchase_request p ON a.doc_type = 'PR' AND p.pr_id = a.doc_id
        LEFT JOIN rfq r ON a.doc_type = 'AWARD' AND r.rfq_id = a.doc_id
        LEFT JOIN purchase_request p2 ON p2.pr_id = r.pr_id
        LEFT JOIN award aw ON aw.rfq_id = r.rfq_id
        LEFT JOIN quotation q ON q.quotation_id = aw.quotation_id
        LEFT JOIN app_user ur ON ur.user_id = p.requester_id
        LEFT JOIN app_user ua ON ua.user_id = aw.awarded_by
        WHERE a.decision = 'PENDING' AND a.required_role IN @roles
          AND NOT EXISTS (SELECT 1 FROM approval o WHERE o.doc_type = a.doc_type AND o.doc_id = a.doc_id AND o.step_no < a.step_no AND o.decision = 'PENDING')
          AND (a.required_role <> 'DEPT_APPROVER' OR a.doc_type <> 'PR' OR p.department_id = @dept)
        ORDER BY 13, a.approval_id", new { roles = c.U.Roles, dept = c.U.Dept });
    return (200, rows);
});

Op("POST", "/approvals/{approvalId}/decision", APPROVERS, true, async c =>
{
    var id = c.P["approvalId"];
    var a = await Q1(c.Db, "SELECT doc_type docType, doc_id docId, required_role role FROM approval WHERE approval_id = @id", new { id });
    if (a is null) throw Err(404, "ERR-NF-001", "ไม่พบงานอนุมัติ");
    var type = (string)a["docType"]!; var docId = Convert.ToInt64(a["docId"]); var role = (string)a["role"]!;
    long proposer;
    if (type == "PR")
    {
        var pr = (await Q1(c.Db, "SELECT requester_id r, department_id d FROM purchase_request WHERE pr_id = @docId", new { docId }))!;
        if (role == "DEPT_APPROVER" && !c.Has("PROCUREMENT_HEAD") && !c.Has("COMMITTEE") && Convert.ToInt32(pr["d"]) != c.U.Dept) throw Err(404, "ERR-NF-001", "ไม่พบงานอนุมัติ");   // V-04 step 1
        proposer = Convert.ToInt64(pr["r"]);
    }
    else proposer = Convert.ToInt64((await Q1(c.Db, "SELECT awarded_by x FROM award WHERE rfq_id = @docId", new { docId }))!["x"]);
    if (!c.Has(role)) throw Err(403, "ERR-AUTH-002", "บทบาทไม่ตรงกับขั้นอนุมัติ");
    if (proposer == c.U.Id) throw Err(403, "ERR-SOD-001", "ห้ามอนุมัติเอกสารของตนเอง");
    var decision = c.Str("decision");
    if (decision is not ("APPROVED" or "REJECTED")) throw Val("decision", "enum: APPROVED, REJECTED");
    var comment = c.Str("comment");
    if (comment is { Length: > 500 }) throw Val("comment", "maxLength: 500");
    if (decision == "REJECTED" && string.IsNullOrWhiteSpace(comment)) throw Val("comment", "required when REJECTED");

    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var cur = await Q1(c.Db, @"SELECT a.step_no, a.decision, (SELECT COUNT(*) FROM approval o WHERE o.doc_type = a.doc_type AND o.doc_id = a.doc_id AND o.step_no < a.step_no AND o.decision = 'PENDING') earlier
        FROM approval a WITH (UPDLOCK, ROWLOCK) WHERE a.approval_id = @id", new { id }, tx);
    if (cur is null || (string)cur["decision"]! != "PENDING" || Convert.ToInt32(cur["earlier"]) > 0) throw Err(409, "ERR-STATE-001", "ขั้นนี้ตัดสินไม่ได้ในสถานะปัจจุบัน");
    var step = Convert.ToInt32(cur["step_no"]);
    await c.Db.ExecuteAsync("UPDATE approval SET decision = @decision, comment = @comment, approver_id = @uid, decided_at = @now WHERE approval_id = @id", new { decision, comment, uid = c.U.Id, now = c.Now, id }, tx);
    var result = (await Approvals(c, type, docId, tx)).First(r => Convert.ToInt64(r["approvalId"]) == id);
    var entity = type == "PR" ? "PR" : "RFQ";
    await Audit(c.Db, tx, c, entity, docId, decision == "APPROVED" ? "APPROVE" : "REJECT", string.IsNullOrWhiteSpace(comment) ? $"ขั้น {step}" : comment);
    if (decision == "REJECTED")
    {
        await c.Db.ExecuteAsync("DELETE FROM approval WHERE doc_type = @type AND doc_id = @docId", new { type, docId }, tx);   // V-04 step 7: history lives in audit_log
        if (type == "PR") await c.Db.ExecuteAsync("UPDATE purchase_request SET status = 'DRAFT' WHERE pr_id = @docId", new { docId }, tx);
        else { await c.Db.ExecuteAsync("DELETE FROM award WHERE rfq_id = @docId", new { docId }, tx); await c.Db.ExecuteAsync("UPDATE rfq SET status = 'OPEN' WHERE rfq_id = @docId", new { docId }, tx); }
    }
    else
    {
        var left = await c.Db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM approval WHERE doc_type = @type AND doc_id = @docId AND decision = 'PENDING'", new { type, docId }, tx);
        if (left == 0)
        {
            if (type == "PR") await c.Db.ExecuteAsync("UPDATE purchase_request SET status = 'APPROVED' WHERE pr_id = @docId", new { docId }, tx);
            else await c.Db.ExecuteAsync("UPDATE rfq SET status = 'AWARDED' WHERE rfq_id = @docId", new { docId }, tx);
        }
    }
    await tx.CommitAsync();
    return (200, result);
});

// ---------------------------------------------------------------------------------------------------- RFQ and quotations
async Task<Dictionary<string, object?>> RfqOut(Ctx c, long id, IDbTransaction? tx = null)
{
    var r = (await Q1(c.Db, $"SELECT rfq_id rfqId, rfq_no rfqNo, pr_id prId, status, {Ts("due_at")} dueAt FROM rfq WHERE rfq_id = @id", new { id }, tx))!;
    r["vendorIds"] = (await Q(c.Db, "SELECT vendor_id v FROM rfq_vendor WHERE rfq_id = @id ORDER BY vendor_id", new { id }, tx)).Select(x => x["v"]).ToList();
    return r;
}
async Task<long> RfqExists(Ctx c, long id)
{ if (await Q1(c.Db, "SELECT 1 x FROM rfq WHERE rfq_id = @id", new { id }) is null) throw Err(404, "ERR-NF-001", "ไม่พบ RFQ"); return id; }

Op("POST", "/rfqs", new[] { "PROCUREMENT" }, true, async c =>
{
    var bad = Bad();
    if (c.Prop("prId") is not { ValueKind: JsonValueKind.Number } pj || !pj.TryGetInt64(out var prId)) { bad.Add(("prId", "integer required")); prId = 0; }
    DateTime due = default;
    if (c.Str("dueAt") is not { } ds || !DateTime.TryParse(ds, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out due)) bad.Add(("dueAt", "date-time required"));
    var ids = new List<long>();
    if (c.Prop("vendorIds") is not { ValueKind: JsonValueKind.Array } va) bad.Add(("vendorIds", "array required"));
    else foreach (var v in va.EnumerateArray()) { if (v.ValueKind == JsonValueKind.Number && v.TryGetInt64(out var x)) ids.Add(x); else bad.Add(("vendorIds", "integers only")); }
    Throw(bad);
    due = new DateTime(due.Ticks - due.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);

    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var pr = await Q1(c.Db, "SELECT status, total_estimated total FROM purchase_request WITH (UPDLOCK, ROWLOCK) WHERE pr_id = @prId", new { prId }, tx);
    if (pr is null) throw Val("prId", "not found");
    if ((string)pr["status"]! != "APPROVED") throw Err(409, "ERR-STATE-002", "PR ยังไม่อยู่ในสถานะอนุมัติ");
    if (!((decimal)pr["total"]! > 5000m)) throw Err(422, "ERR-RFQ-006", "วงเงินไม่เกิน 5,000 บาท ใช้ซื้อตรง");
    if (ids.Distinct().Count() != ids.Count || ids.Count < 3) throw Err(422, "ERR-RFQ-001", "ต้องเชิญผู้ขายอย่างน้อย 3 ราย", ("vendorIds", "minItems: 3"));
    if (due <= c.Now) throw Val("dueAt", "must be in the future");
    var active = await c.Db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM vendor WHERE vendor_id IN @ids AND status = 'ACTIVE'", new { ids }, tx);
    if (active != ids.Count) throw Err(422, "ERR-VND-002", "มีผู้ขายที่ไม่พบหรือถูกระงับ");
    var no = await NextDocNo("RFQ");
    var id = await c.Db.ExecuteScalarAsync<long>("INSERT rfq (rfq_no, pr_id, status, due_at, created_by, created_at) OUTPUT INSERTED.rfq_id VALUES (@no, @prId, 'OPEN', @due, @uid, @now)", new { no, prId, due, uid = c.U.Id, now = c.Now }, tx);
    foreach (var v in ids) await c.Db.ExecuteAsync("INSERT rfq_vendor (rfq_id, vendor_id, invited_at) VALUES (@id, @v, @now)", new { id, v, now = c.Now }, tx);
    await c.Db.ExecuteAsync("UPDATE purchase_request SET status = 'IN_SOURCING' WHERE pr_id = @prId", new { prId }, tx);
    await Audit(c.Db, tx, c, "RFQ", id, "CREATE");
    var res = await RfqOut(c, id, tx);
    await tx.CommitAsync();
    return (201, res);
});

Op("GET", "/rfqs/{rfqId}", new[] { "PROCUREMENT", "PROCUREMENT_HEAD", "COMMITTEE" }, false, async c =>
{
    var id = await RfqExists(c, c.P["rfqId"]);
    var r = await RfqOut(c, id);
    var pr = (await Q1(c.Db, "SELECT p.pr_no prNo, p.title prTitle FROM rfq r JOIN purchase_request p ON p.pr_id = r.pr_id WHERE r.rfq_id = @id", new { id }))!;
    r["prNo"] = pr["prNo"]; r["prTitle"] = pr["prTitle"];
    r["items"] = await Q(c.Db, "SELECT i.pr_item_id prItemId, i.description, i.quantity, i.unit FROM pr_item i JOIN rfq r ON r.pr_id = i.pr_id WHERE r.rfq_id = @id ORDER BY i.line_no", new { id });
    r["vendors"] = await Q(c.Db, "SELECT v.vendor_id vendorId, v.name_th vendorName FROM rfq_vendor rv JOIN vendor v ON v.vendor_id = rv.vendor_id WHERE rv.rfq_id = @id ORDER BY v.vendor_id", new { id });
    return (200, r);
});

Op("POST", "/rfqs/{rfqId}/quotations", new[] { "PROCUREMENT" }, true, async c =>
{
    var rfqId = await RfqExists(c, c.P["rfqId"]);
    var bad = Bad();
    long vendorId = 0; int lead = 0;
    if (c.Prop("vendorId") is not { ValueKind: JsonValueKind.Number } vj || !vj.TryGetInt64(out vendorId)) bad.Add(("vendorId", "integer required"));
    if (c.Prop("leadTimeDays") is not { ValueKind: JsonValueKind.Number } lj || !lj.TryGetInt32(out lead) || lead < 0 || lead > 32767) bad.Add(("leadTimeDays", "integer >= 0 required"));
    var given = new List<(long item, decimal price)>();
    if (c.Prop("items") is not { ValueKind: JsonValueKind.Array } ia || ia.GetArrayLength() < 1) bad.Add(("items", "minItems: 1"));
    else foreach (var it in ia.EnumerateArray())
    {
        if (it.ValueKind == JsonValueKind.Object && it.TryGetProperty("prItemId", out var pi) && pi.TryGetInt64(out var pid) && it.TryGetProperty("unitPrice", out var up) && Dec(up, 2, out var upv) && upv >= 0) given.Add((pid, upv));
        else bad.Add(("items[]", "prItemId and unitPrice (>= 0, 2 decimals) required"));
    }
    Throw(bad);

    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var r = (await Q1(c.Db, "SELECT status, due_at due, pr_id prId FROM rfq WITH (UPDLOCK, ROWLOCK) WHERE rfq_id = @rfqId", new { rfqId }, tx))!;
    if ((string)r["status"]! != "OPEN" || c.Now > (DateTime)r["due"]!) throw Err(409, "ERR-RFQ-003", "เลยกำหนดรับใบเสนอราคา");
    if (await Q1(c.Db, "SELECT 1 x FROM rfq_vendor WHERE rfq_id = @rfqId AND vendor_id = @vendorId", new { rfqId, vendorId }, tx) is null) throw Err(422, "ERR-RFQ-002", "ผู้ขายไม่ได้รับเชิญใน RFQ นี้");
    var prItems = await Q(c.Db, "SELECT pr_item_id id, quantity FROM pr_item WHERE pr_id = @prId", new { prId = r["prId"] }, tx);
    if (given.Count != prItems.Count || given.Select(g => g.item).Distinct().Count() != given.Count || !prItems.All(p => given.Any(g => g.item == Convert.ToInt64(p["id"])))) throw Val("items", "must cover every PR item exactly once");
    var total = given.Sum(g => LineAmount((decimal)prItems.First(p => Convert.ToInt64(p["id"]) == g.item)["quantity"]!, g.price));
    await c.Db.ExecuteAsync("UPDATE quotation SET is_active = 0 WHERE rfq_id = @rfqId AND vendor_id = @vendorId AND is_active = 1", new { rfqId, vendorId }, tx);
    var qid = await c.Db.ExecuteScalarAsync<long>("INSERT quotation (rfq_id, vendor_id, total_amount, lead_time_days, is_active, submitted_at) OUTPUT INSERTED.quotation_id VALUES (@rfqId, @vendorId, @total, @lead, 1, @now)", new { rfqId, vendorId, total, lead, now = c.Now }, tx);
    foreach (var g in given) await c.Db.ExecuteAsync("INSERT quotation_item (quotation_id, pr_item_id, unit_price) VALUES (@qid, @item, @price)", new { qid, g.item, g.price }, tx);
    var res = await QuotationRow(c, qid, tx);
    await tx.CommitAsync();
    return (201, res);
});
async Task<Dictionary<string, object?>> QuotationRow(Ctx c, long qid, IDbTransaction? tx = null)
    => (await Q1(c.Db, $"SELECT q.quotation_id quotationId, q.vendor_id vendorId, v.name_th vendorName, q.total_amount totalAmount, q.lead_time_days leadTimeDays, CAST(q.is_active AS BIT) isActive, {Ts("q.submitted_at")} submittedAt FROM quotation q JOIN vendor v ON v.vendor_id = q.vendor_id WHERE q.quotation_id = @qid", new { qid }, tx))!;

Op("GET", "/rfqs/{rfqId}/comparison", new[] { "PROCUREMENT", "PROCUREMENT_HEAD", "COMMITTEE" }, false, async c =>
{
    var rfqId = await RfqExists(c, c.P["rfqId"]);
    var qs = await Q(c.Db, "SELECT quotation_id id FROM quotation WHERE rfq_id = @rfqId AND is_active = 1 ORDER BY quotation_id", new { rfqId });
    var list = new List<Dictionary<string, object?>>();
    foreach (var q in qs)
    {
        var row = await QuotationRow(c, Convert.ToInt64(q["id"]));
        row["itemPrices"] = await Q(c.Db, "SELECT pr_item_id prItemId, unit_price unitPrice FROM quotation_item WHERE quotation_id = @id ORDER BY pr_item_id", new { id = q["id"] });
        list.Add(row);
    }
    var lowest = list.OrderBy(r => (decimal)r["totalAmount"]!).ThenBy(r => Convert.ToInt64(r["quotationId"])).FirstOrDefault();
    return (200, new { rfqId, lowestQuotationId = lowest?["quotationId"], quotations = list });
});

Op("POST", "/rfqs/{rfqId}/award", new[] { "PROCUREMENT" }, true, async c =>
{
    var rfqId = await RfqExists(c, c.P["rfqId"]);
    if (c.Prop("quotationId") is not { ValueKind: JsonValueKind.Number } qj || !qj.TryGetInt64(out var quotationId)) throw Val("quotationId", "integer required");
    var reason = c.Str("reason");
    if (reason is not null && Chars(reason) > 500) throw Val("reason", "maxLength: 500");
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var r = (await Q1(c.Db, "SELECT status FROM rfq WITH (UPDLOCK, ROWLOCK) WHERE rfq_id = @rfqId", new { rfqId }, tx))!;
    if ((string)r["status"]! != "OPEN") throw Err(409, "ERR-STATE-001", "RFQ ไม่อยู่ในสถานะเปิด");
    var active = await Q(c.Db, "SELECT quotation_id id, total_amount total FROM quotation WHERE rfq_id = @rfqId AND is_active = 1", new { rfqId }, tx);
    var win = active.FirstOrDefault(a => Convert.ToInt64(a["id"]) == quotationId);
    if (active.Count < 2 || win is null) throw Err(422, "ERR-RFQ-005", "ต้องมีใบเสนอราคาที่ใช้งานอย่างน้อย 2 ราย และเลือกจากในนั้น");
    var lowest = active.OrderBy(a => (decimal)a["total"]!).ThenBy(a => Convert.ToInt64(a["id"])).First();
    if (Convert.ToInt64(lowest["id"]) != quotationId && (reason is null || Chars(reason) < 20)) throw Err(422, "ERR-RFQ-004", "ไม่เลือกราคาต่ำสุดต้องระบุเหตุผลอย่างน้อย 20 ตัวอักษร", ("reason", "minLength: 20"));
    await c.Db.ExecuteAsync("INSERT award (rfq_id, quotation_id, reason, awarded_by, awarded_at) VALUES (@rfqId, @quotationId, @reason, @uid, @now)", new { rfqId, quotationId, reason, uid = c.U.Id, now = c.Now }, tx);
    await c.Db.ExecuteAsync("UPDATE rfq SET status = 'AWARD_PENDING' WHERE rfq_id = @rfqId", new { rfqId }, tx);
    await c.Db.ExecuteAsync("INSERT approval (doc_type, doc_id, step_no, required_role, decision) VALUES ('AWARD', @rfqId, 1, @role, 'PENDING')",
        new { rfqId, role = (decimal)win["total"]! > 200000m ? "COMMITTEE" : "PROCUREMENT_HEAD" }, tx);
    await Audit(c.Db, tx, c, "RFQ", rfqId, "AWARD", reason);
    var res = await RfqOut(c, rfqId, tx);
    await tx.CommitAsync();
    return (202, res);
});

// ---------------------------------------------------------------------------------------------------- purchase orders and receipts
async Task<Dictionary<string, object?>> PoOut(Ctx c, long id, IDbTransaction? tx = null)
{
    var r = (await Q1(c.Db, $"SELECT o.po_id poId, o.po_no poNo, o.pr_id prId, o.vendor_id vendorId, o.total_amount totalAmount, o.status, v.name_th vendorName, o.rfq_id rfqId, CASE WHEN o.issued_at IS NULL THEN NULL ELSE {Ts("o.issued_at")} END issuedAt FROM purchase_order o JOIN vendor v ON v.vendor_id = o.vendor_id WHERE o.po_id = @id", new { id }, tx))!;
    r["items"] = await Q(c.Db, @"SELECT i.po_item_id poItemId, i.pr_item_id prItemId, pi.description, pi.unit, i.quantity, i.unit_price unitPrice,
        ISNULL((SELECT SUM(g.qty_received) FROM gr_item g WHERE g.po_item_id = i.po_item_id), 0) qtyReceived,
        i.quantity - ISNULL((SELECT SUM(g.qty_received) FROM gr_item g WHERE g.po_item_id = i.po_item_id), 0) qtyRemaining
        FROM po_item i JOIN pr_item pi ON pi.pr_item_id = i.pr_item_id WHERE i.po_id = @id ORDER BY i.po_item_id", new { id }, tx);
    return r;
}
async Task<long> PoExists(Ctx c, long id)
{ if (await Q1(c.Db, "SELECT 1 x FROM purchase_order WHERE po_id = @id", new { id }) is null) throw Err(404, "ERR-NF-001", "ไม่พบ PO"); return id; }

Op("POST", "/purchase-orders", new[] { "PROCUREMENT" }, true, async c =>
{
    var bad = Bad();
    if (c.Prop("prId") is not { ValueKind: JsonValueKind.Number } pj || !pj.TryGetInt64(out var prId)) { bad.Add(("prId", "integer required")); prId = 0; }
    long? rfqIn = null, vendorIn = null;
    if (c.Prop("rfqId") is { } rj) { if (rj.ValueKind == JsonValueKind.Number && rj.TryGetInt64(out var rv)) rfqIn = rv; else bad.Add(("rfqId", "integer")); }
    if (c.Prop("vendorId") is { } vj) { if (vj.ValueKind == JsonValueKind.Number && vj.TryGetInt64(out var vv)) vendorIn = vv; else bad.Add(("vendorId", "integer")); }
    Throw(bad);

    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var pr = await Q1(c.Db, "SELECT status, total_estimated total FROM purchase_request WITH (UPDLOCK, ROWLOCK) WHERE pr_id = @prId", new { prId }, tx);
    if (pr is null) throw Val("prId", "not found");
    var items = await Q(c.Db, "SELECT pr_item_id id, quantity, est_unit_price price FROM pr_item WHERE pr_id = @prId ORDER BY line_no", new { prId }, tx);
    long vendorId; Func<Dictionary<string, object?>, decimal> price;
    if (rfqIn is null)
    {
        if ((string)pr["status"]! != "APPROVED") throw Err(409, "ERR-STATE-002", "PR ยังไม่อยู่ในสถานะอนุมัติ");
        if ((decimal)pr["total"]! > 5000m) throw Err(422, "ERR-PO-001", "วงเงินเกิน 5,000 บาท ต้องผ่านการประกวดราคา");
        if (vendorIn is null) throw Val("vendorId", "required for direct purchase");
        vendorId = vendorIn.Value; price = i => (decimal)i["price"]!;
    }
    else
    {
        var rfq = await Q1(c.Db, "SELECT status, pr_id prId FROM rfq WHERE rfq_id = @id", new { id = rfqIn }, tx);
        if (rfq is null || Convert.ToInt64(rfq["prId"]) != prId) throw Val("rfqId", "not found for this PR");
        if ((string)rfq["status"]! != "AWARDED") throw Err(409, "ERR-STATE-001", "RFQ ยังไม่อยู่ในสถานะ AWARDED");
        var win = (await Q1(c.Db, "SELECT q.quotation_id qid, q.vendor_id vid FROM award a JOIN quotation q ON q.quotation_id = a.quotation_id WHERE a.rfq_id = @id", new { id = rfqIn }, tx))!;
        vendorId = Convert.ToInt64(win["vid"]);
        var prices = (await Q(c.Db, "SELECT pr_item_id id, unit_price price FROM quotation_item WHERE quotation_id = @q", new { q = win["qid"] }, tx)).ToDictionary(x => Convert.ToInt64(x["id"]), x => (decimal)x["price"]!);
        price = i => prices[Convert.ToInt64(i["id"])];
    }
    var vstat = await Q1(c.Db, "SELECT status FROM vendor WHERE vendor_id = @vendorId", new { vendorId }, tx);
    if (vstat is null || (string)vstat["status"]! != "ACTIVE") throw Err(422, "ERR-VND-002", "ผู้ขายไม่พบหรือถูกระงับ");
    var total = items.Sum(i => LineAmount((decimal)i["quantity"]!, price(i)));
    var no = await NextDocNo("PO");
    var id = await c.Db.ExecuteScalarAsync<long>("INSERT purchase_order (po_no, pr_id, rfq_id, vendor_id, total_amount, status, created_by) OUTPUT INSERTED.po_id VALUES (@no, @prId, @rfqIn, @vendorId, @total, 'DRAFT', @uid)", new { no, prId, rfqIn, vendorId, total, uid = c.U.Id }, tx);
    foreach (var i in items) await c.Db.ExecuteAsync("INSERT po_item (po_id, pr_item_id, quantity, unit_price) VALUES (@id, @item, @q, @p)", new { id, item = i["id"], q = i["quantity"], p = price(i) }, tx);
    await c.Db.ExecuteAsync("UPDATE purchase_request SET status = 'ORDERED' WHERE pr_id = @prId", new { prId }, tx);
    await Audit(c.Db, tx, c, "PO", id, "CREATE");
    var res = await PoOut(c, id, tx);
    await tx.CommitAsync();
    return (201, res);
});

Op("GET", "/purchase-orders/{poId}", new[] { "PROCUREMENT", "PROCUREMENT_HEAD", "RECEIVER", "ADMIN" }, false, async c => (200, await PoOut(c, await PoExists(c, c.P["poId"]))));

Op("POST", "/purchase-orders/{poId}/issue", new[] { "PROCUREMENT" }, true, async c =>
{
    var id = await PoExists(c, c.P["poId"]);
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var po = (await Q1(c.Db, "SELECT o.status, v.status vstatus FROM purchase_order o WITH (UPDLOCK, ROWLOCK) JOIN vendor v ON v.vendor_id = o.vendor_id WHERE o.po_id = @id", new { id }, tx))!;
    if ((string)po["status"]! != "DRAFT") throw Err(409, "ERR-STATE-001", "ออกได้เฉพาะ PO ฉบับร่าง");
    if ((string)po["vstatus"]! != "ACTIVE") throw Err(422, "ERR-VND-002", "ผู้ขายถูกระงับ");
    await c.Db.ExecuteAsync("UPDATE purchase_order SET status = 'ISSUED', issued_at = @now WHERE po_id = @id", new { id, now = c.Now }, tx);
    await Audit(c.Db, tx, c, "PO", id, "ISSUE");
    var res = await PoOut(c, id, tx);
    await tx.CommitAsync();
    return (200, res);
});

Op("POST", "/purchase-orders/{poId}/receipts", new[] { "RECEIVER" }, true, async c =>
{
    var poId = await PoExists(c, c.P["poId"]);
    var bad = Bad();
    var given = new List<(long item, decimal got, decimal rej)>();
    var note = c.Str("note"); if (note is { Length: > 500 }) bad.Add(("note", "maxLength: 500"));
    if (c.Prop("items") is not { ValueKind: JsonValueKind.Array } ia || ia.GetArrayLength() < 1) bad.Add(("items", "minItems: 1"));
    else foreach (var it in ia.EnumerateArray())
    {
        decimal rej = 0;
        if (it.ValueKind == JsonValueKind.Object && it.TryGetProperty("poItemId", out var pi) && pi.TryGetInt64(out var pid)
            && it.TryGetProperty("qtyReceived", out var qr) && Dec(qr, 3, out var got) && got >= 0
            && (!it.TryGetProperty("qtyRejected", out var qj) || (Dec(qj, 3, out rej) && rej >= 0))) given.Add((pid, got, rej));
        else bad.Add(("items[]", "poItemId, qtyReceived (>= 0), optional qtyRejected (>= 0) required"));
    }
    Throw(bad);

    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    var po = (await Q1(c.Db, "SELECT status, pr_id prId FROM purchase_order WITH (UPDLOCK, ROWLOCK) WHERE po_id = @poId", new { poId }, tx))!;   // row lock: concurrent receipts queue here (V-12 step 3)
    if ((string)po["status"]! is not ("ISSUED" or "PARTIALLY_RECEIVED")) throw Err(409, "ERR-STATE-001", "รับของได้เฉพาะ PO ที่ออกแล้วและยังรับไม่ครบ");
    var mine = await Q(c.Db, "SELECT i.po_item_id id, i.quantity, ISNULL((SELECT SUM(g.qty_received) FROM gr_item g WHERE g.po_item_id = i.po_item_id), 0) got FROM po_item i WHERE i.po_id = @poId", new { poId }, tx);
    if (given.Select(g => g.item).Distinct().Count() != given.Count || given.Any(g => !mine.Any(m => Convert.ToInt64(m["id"]) == g.item)) || !given.Any(g => g.got > 0)) throw Val("items", "must be distinct items of this PO with at least one quantity > 0");
    foreach (var g in given)
    {
        var m = mine.First(x => Convert.ToInt64(x["id"]) == g.item);
        if ((decimal)m["got"]! + g.got > (decimal)m["quantity"]!) throw Err(422, "ERR-GR-001", "รับเกินจำนวนที่สั่ง");   // rejected quantity is not counted (BR-10)
    }
    var no = await NextDocNo("GR");
    var grId = await c.Db.ExecuteScalarAsync<long>("INSERT goods_receipt (gr_no, po_id, received_by, received_at, note) OUTPUT INSERTED.gr_id VALUES (@no, @poId, @uid, @now, @note)", new { no, poId, uid = c.U.Id, now = c.Now, note }, tx);
    foreach (var g in given) await c.Db.ExecuteAsync("INSERT gr_item (gr_id, po_item_id, qty_received, qty_rejected) VALUES (@grId, @item, @got, @rej)", new { grId, g.item, g.got, g.rej }, tx);
    var open = await c.Db.ExecuteScalarAsync<int>(@"SELECT COUNT(*) FROM po_item i WHERE i.po_id = @poId AND i.quantity > ISNULL((SELECT SUM(g.qty_received) FROM gr_item g WHERE g.po_item_id = i.po_item_id), 0)", new { poId }, tx);
    var status = open == 0 ? "RECEIVED" : "PARTIALLY_RECEIVED";
    await c.Db.ExecuteAsync("UPDATE purchase_order SET status = @status WHERE po_id = @poId", new { status, poId }, tx);
    if (open == 0) await c.Db.ExecuteAsync("UPDATE purchase_request SET status = 'CLOSED' WHERE pr_id = @pr", new { pr = po["prId"] }, tx);
    await Audit(c.Db, tx, c, "PO", poId, "RECEIVE");
    await tx.CommitAsync();
    return (201, new { grId, grNo = no, poStatus = status });
});

// ---------------------------------------------------------------------------------------------------- vendors
const string V_COLS = "v.name_th nameTh, v.tax_id taxId, v.email, v.vendor_id vendorId, v.vendor_code vendorCode, v.status";
Op("GET", "/vendors", new[] { "PROCUREMENT", "PROCUREMENT_HEAD", "ADMIN" }, false, async c =>
{
    var where = new StringBuilder("1=1"); var prm = new DynamicParameters();
    if (c.Query.TryGetValue("q", out var q) && q.Length > 0)
    {
        where.Append(" AND (v.name_th LIKE @q ESCAPE '\\' OR v.vendor_code LIKE @q ESCAPE '\\' OR v.tax_id LIKE @q ESCAPE '\\')");
        prm.Add("q", "%" + q.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_").Replace("[", "\\[") + "%");
    }
    if (c.Query.TryGetValue("status", out var st)) { where.Append(" AND v.status = @st"); prm.Add("st", st); }
    return (200, await Q(c.Db, "SELECT " + V_COLS + " FROM vendor v WHERE " + where + " ORDER BY v.vendor_code", prm));
});

Op("POST", "/vendors", new[] { "PROCUREMENT" }, true, async c =>
{
    var bad = Bad();
    var name = c.Str("nameTh"); if (string.IsNullOrEmpty(name) || name.Length > 200) bad.Add(("nameTh", "required, max 200"));
    var tax = c.Str("taxId"); if (tax is null || tax.Length != 13 || !tax.All(char.IsAsciiDigit)) bad.Add(("taxId", "pattern: 13 digits"));
    var email = c.Str("email"); if (email is not null && (email.Length > 150 || !email.Contains('@'))) bad.Add(("email", "format: email, max 150"));
    Throw(bad);
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    if (await Q1(c.Db, "SELECT 1 x FROM vendor WHERE tax_id = @tax", new { tax }, tx) is not null) throw Err(409, "ERR-VND-001", "เลขผู้เสียภาษีซ้ำกับผู้ขายเดิม");
    int id;
    try { id = await InsertVendor(c, tx, name!, tax!, email); }
    catch (SqlException e) when (e.Number is 2627 or 2601) { throw Err(409, "ERR-VND-001", "เลขผู้เสียภาษีซ้ำกับผู้ขายเดิม"); }   // the unique index is the final arbiter under concurrency (V-13 step 3)
    await c.Db.ExecuteAsync("UPDATE vendor SET vendor_code = 'V' + RIGHT('0000' + CAST(vendor_id AS VARCHAR(10)), 4) WHERE vendor_id = @id", new { id }, tx);   // V-13 step 4
    await Audit(c.Db, tx, c, "VENDOR", id, "CREATE");
    var res = (await Q1(c.Db, "SELECT " + V_COLS + " FROM vendor v WHERE v.vendor_id = @id", new { id }, tx))!;
    await tx.CommitAsync();
    return (201, res);
});
Task<int> InsertVendor(Ctx c, SqlTransaction tx, string name, string tax, string? email) => c.Db.ExecuteScalarAsync<int>("INSERT vendor (vendor_code, name_th, tax_id, email, status, created_at) OUTPUT INSERTED.vendor_id VALUES (LEFT(CONVERT(VARCHAR(36), NEWID()), 15), @name, @tax, @email, 'ACTIVE', @now)", new { name, tax, email, now = c.Now }, tx);

Op("PUT", "/vendors/{vendorId}/status", new[] { "PROCUREMENT_HEAD" }, false, async c =>
{
    var id = c.P["vendorId"];
    var v = await Q1(c.Db, "SELECT 1 x FROM vendor WHERE vendor_id = @id", new { id });
    if (v is null) throw Err(404, "ERR-NF-001", "ไม่พบผู้ขาย");
    var status = c.Str("status"); var reason = c.Str("reason");
    if (status is not ("ACTIVE" or "SUSPENDED")) throw Val("status", "enum: ACTIVE, SUSPENDED");
    if (reason is { Length: > 500 }) throw Val("reason", "maxLength: 500");
    if (status == "SUSPENDED" && string.IsNullOrWhiteSpace(reason)) throw Val("reason", "required when SUSPENDED");
    await using var tx = (SqlTransaction)await c.Db.BeginTransactionAsync();
    await c.Db.ExecuteAsync("UPDATE vendor SET status = @status WHERE vendor_id = @id", new { status, id }, tx);
    await Audit(c.Db, tx, c, "VENDOR", id, "STATUS", reason);
    var res = (await Q1(c.Db, "SELECT " + V_COLS + " FROM vendor v WHERE v.vendor_id = @id", new { id }, tx))!;
    await tx.CommitAsync();
    return (200, res);
});

// ---------------------------------------------------------------------------------------------------- reports and audit
Op("GET", "/reports/spend-summary", new[] { "PROCUREMENT_HEAD", "ADMIN" }, false, async c =>
{
    if (!c.Query.TryGetValue("from", out var f) || !DateOnly.TryParseExact(f, "yyyy-MM-dd", out var from)) throw Val("from", "date required");
    if (!c.Query.TryGetValue("to", out var t) || !DateOnly.TryParseExact(t, "yyyy-MM-dd", out var to)) throw Val("to", "date required");
    if (from > to) throw Val("from", "from <= to");
    var by = c.Query.GetValueOrDefault("groupBy", "department");
    if (by is not ("department" or "vendor" or "month")) throw Val("groupBy", "enum: department, vendor, month");   // V-14 step 3
    var rows = await Q(c.Db, @"SELECT p.pr_id prId, p.total_estimated est, d.name_th dept, CONVERT(CHAR(7), DATEADD(HOUR, 7, p.created_at), 23) mon, o.po_id poId, o.total_amount po, v.name_th vendor
        FROM purchase_request p JOIN department d ON d.department_id = p.department_id
        JOIN purchase_order o ON o.pr_id = p.pr_id AND o.status NOT IN ('DRAFT', 'CANCELLED')
        JOIN vendor v ON v.vendor_id = o.vendor_id
        WHERE p.status NOT IN ('DRAFT', 'CANCELLED') AND CAST(DATEADD(HOUR, 7, p.created_at) AS DATE) BETWEEN @from AND @to",
        new { from = from.ToDateTime(TimeOnly.MinValue), to = to.ToDateTime(TimeOnly.MinValue) });
    var groups = rows.GroupBy(r => (string)r[by == "vendor" ? "vendor" : by == "month" ? "mon" : "dept"]!).OrderBy(g => g.Key, StringComparer.Ordinal)
        .Select(g =>
        {
            var est = g.GroupBy(r => r["prId"]).Sum(x => (decimal)x.First()["est"]!);
            var ord = g.Sum(r => (decimal)r["po"]!);
            return new { group = g.Key, prCount = g.Select(r => r["prId"]).Distinct().Count(), poCount = g.Count(), estimatedTotal = est, orderedTotal = ord, savingVsEstimate = est - ord };
        });
    return (200, new { from = f, to = t, rows = groups });
});

Op("GET", "/audit-logs", new[] { "ADMIN" }, false, async c =>
{
    if (!c.Query.TryGetValue("entity", out var entity) || entity.Length == 0) throw Val("entity", "required");
    if (!c.Query.TryGetValue("entityId", out var eid) || !long.TryParse(eid, out var entityId)) throw Val("entityId", "integer required");
    return (200, await Q(c.Db, $"SELECT audit_id auditId, action, actor_id actorId, detail, {Ts("created_at")} createdAt FROM audit_log WHERE entity = @entity AND entity_id = @entityId ORDER BY created_at, audit_id", new { entity, entityId }));
});

// ---------------------------------------------------------------------------------------------------- test profile (CNV-10)
if (testProfile)
{
    app.MapPost("/__test/reset", async (HttpContext http) =>
    {
        try { await Run(http, new[] { "ADMIN" }, false, async c => { await ResetData(); return (200, new { ok = true }); }); http.Response.ContentType = "application/json"; await http.Response.WriteAsync("{\"ok\":true}"); }
        catch (ApiError e) { await Fail(http, e); }
    });
    app.MapPost("/__test/flush-idempotency", async (HttpContext http) =>
    {
        try { await Run(http, new[] { "ADMIN" }, false, async c => { await redis.GetServer(redis.GetEndPoints()[0]).FlushDatabaseAsync(); return (200, new { ok = true }); }); http.Response.ContentType = "application/json"; await http.Response.WriteAsync("{\"ok\":true}"); }
        catch (ApiError e) { await Fail(http, e); }
    });
}
async Task ResetData()
{
    await using var db = new SqlConnection(adminCs); await db.OpenAsync();
    var tables = new[] { "audit_log", "gr_item", "goods_receipt", "po_item", "purchase_order", "award", "quotation_item", "quotation", "rfq_vendor", "rfq", "approval", "pr_item", "purchase_request", "vendor", "doc_sequence", "app_user", "department" };
    foreach (var t in tables) await db.ExecuteAsync($"DELETE FROM {t}");
    foreach (var t in new[] { "audit_log", "gr_item", "goods_receipt", "po_item", "purchase_order", "quotation_item", "quotation", "rfq", "approval", "pr_item", "purchase_request", "vendor" })
        await db.ExecuteAsync($"DBCC CHECKIDENT ('{t}', RESEED, 0) WITH NO_INFOMSGS");
    // test personas = department and app_user rows of the delivered seed and sample data (no second copy)
    foreach (var (table, file) in new[] { ("department", "seed-data.sql"), ("app_user", "seed-data.sql"), ("app_user", "sample-data.sql") })
    {
        var inserts = File.ReadAllLines("/sql/" + file).Where(l => l.StartsWith($"INSERT {table} ")).ToList();
        if (inserts.Count == 0) continue;
        await db.ExecuteAsync($"SET IDENTITY_INSERT {table} ON; {string.Join("\n", inserts)}; SET IDENTITY_INSERT {table} OFF;");
    }
}

app.Run();

// ---------------------------------------------------------------------------------------------------- types
record User(int Id, int Dept, string Name, string[] Roles);
class ApiError : Exception
{
    public int Status; public string Code; public object? Details;
    public ApiError(int s, string c, string m, object? d = null) : base(m) { Status = s; Code = c; Details = d; }
}
class Ctx
{
    public User U = null!; public DateTime Now; public JsonElement Body; public Dictionary<string, string> Query = new();
    public Dictionary<string, long> P = new(); public HttpRequest Req = null!; public SqlConnection Db = null!;
    public bool Has(string r) => U.Roles.Contains(r);
    public string? Str(string n) => Body.ValueKind == JsonValueKind.Object && Body.TryGetProperty(n, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;
    public JsonElement? Prop(string n) => Body.ValueKind == JsonValueKind.Object && Body.TryGetProperty(n, out var v) && v.ValueKind != JsonValueKind.Null ? v : null;
}

