const oracledb = require("oracledb");
const { getConnection } = require("../config/db");
const { requireFields, pageOptions, withConnection } = require("../utils/http");
const { assertBranchId } = require("../utils/authorization");

const requestTypes = new Set(["ACCOUNT_FREEZE", "ACCOUNT_UNFREEZE", "STATEMENT", "PROFILE_HELP", "BENEFICIARY_HELP", "LOAN_INFORMATION", "GENERAL_SUPPORT"]);
const statuses = new Set(["OPEN", "IN_PROGRESS", "RESOLVED", "REJECTED", "CANCELLED"]);
function badRequest(message) { const error = new Error(message); error.status = 400; return error; }

async function list(req, res, next) {
  try { await withConnection(getConnection, async (connection) => {
    const { page, pageSize, offset } = pageOptions(req.query); const binds = { offset, pageSize }; let scope = "";
    if (req.user.role === "CUSTOMER") { scope = " AND r.customer_id=:customerId"; binds.customerId = req.user.customerId; }
    else if (["MANAGER", "EMPLOYEE"].includes(req.user.role)) { scope = " AND r.branch_id=:branchId"; binds.branchId = req.user.branchId; }
    if (req.query.status && statuses.has(String(req.query.status).toUpperCase())) { scope += " AND r.status=:status"; binds.status = String(req.query.status).toUpperCase(); }
    const result = await connection.execute(`SELECT r.request_id,r.request_number,r.customer_id,r.branch_id,r.request_type,r.subject,r.description,r.status,r.assigned_to,r.resolution_note,r.created_at,r.updated_at,r.resolved_at,c.first_name||' '||c.last_name customer_name,e.first_name||' '||e.last_name assignee_name,COUNT(*) OVER() total_count FROM service_requests r JOIN customers c ON c.customer_id=r.customer_id LEFT JOIN employees e ON e.employee_id=r.assigned_to WHERE 1=1${scope} ORDER BY r.updated_at DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, binds);
    res.json({ items: result.rows, page, pageSize, total: result.rows[0]?.TOTAL_COUNT || 0 });
  }); } catch (error) { next(error); }
}

async function create(req, res, next) {
  let connection;
  try { if (req.user.role !== "CUSTOMER") throw badRequest("Only customers can create service requests."); requireFields(req.body, ["requestType", "subject", "description"]); const requestType = String(req.body.requestType).toUpperCase(); if (!requestTypes.has(requestType)) throw badRequest("Invalid service request type."); connection = await getConnection(); const branch = await connection.execute("SELECT branch_id FROM accounts WHERE customer_id=:customerId AND status <> 'CLOSED' ORDER BY account_id FETCH FIRST 1 ROW ONLY", { customerId: req.user.customerId }); if (!branch.rows[0]) throw badRequest("A customer account is required before opening a service request."); const result = await connection.execute(`INSERT INTO service_requests(request_number,customer_id,branch_id,request_type,subject,description) VALUES('SR-'||TO_CHAR(SYSTIMESTAMP,'YYYYMMDDHH24MISSFF3')||seq_business_reference.NEXTVAL,:customerId,:branchId,:requestType,:subject,:description) RETURNING request_id,request_number INTO :id,:number`, { customerId: req.user.customerId, branchId: branch.rows[0].BRANCH_ID, requestType, subject: String(req.body.subject).trim(), description: String(req.body.description).trim(), id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, number: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 40 } }); await connection.execute("INSERT INTO audit_log(table_name,record_id,action_name,action_by,new_summary) VALUES('SERVICE_REQUESTS',:id,'CREATE',:actor,:summary)", { id: result.outBinds.id[0], actor: req.user.username, summary: `type=${requestType}` }); await connection.commit(); res.status(201).json({ id: result.outBinds.id[0], requestNumber: result.outBinds.number[0], message: "Service request created." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function assign(req, res, next) {
  let connection;
  try { if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(req.user.role)) throw badRequest("Staff access required."); connection = await getConnection(); const current = await connection.execute("SELECT branch_id,status FROM service_requests WHERE request_id=:id", { id: Number(req.params.id) }); if (!current.rows[0]) return res.status(404).json({ message: "Service request not found." }); assertBranchId(req.user, current.rows[0].BRANCH_ID); const employeeId = req.body.employeeId ? Number(req.body.employeeId) : req.user.employeeId; await connection.execute("UPDATE service_requests SET assigned_to=:employeeId,status=CASE WHEN status='OPEN' THEN 'IN_PROGRESS' ELSE status END,updated_at=SYSTIMESTAMP WHERE request_id=:id", { employeeId, id: Number(req.params.id) }); await connection.commit(); res.json({ message: "Service request assigned." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function updateStatus(req, res, next) {
  let connection;
  try { if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(req.user.role) && req.body.status !== "CANCELLED") throw badRequest("Staff access required."); if (!statuses.has(String(req.body.status || "").toUpperCase())) throw badRequest("Invalid service request status."); connection = await getConnection(); const current = await connection.execute("SELECT branch_id,customer_id,status FROM service_requests WHERE request_id=:id", { id: Number(req.params.id) }); if (!current.rows[0]) return res.status(404).json({ message: "Service request not found." }); if (req.user.role === "CUSTOMER" && (current.rows[0].CUSTOMER_ID !== req.user.customerId || req.body.status !== "CANCELLED" || current.rows[0].STATUS !== "OPEN")) throw badRequest("Customers may cancel only their own open requests."); if (["MANAGER", "EMPLOYEE"].includes(req.user.role)) assertBranchId(req.user, current.rows[0].BRANCH_ID); const status = String(req.body.status).toUpperCase(); await connection.execute("UPDATE service_requests SET status=:status,resolution_note=:note,updated_at=SYSTIMESTAMP,resolved_at=CASE WHEN :status IN ('RESOLVED','REJECTED','CANCELLED') THEN SYSTIMESTAMP ELSE resolved_at END WHERE request_id=:id", { status, note: req.body.note ? String(req.body.note).trim() : null, id: Number(req.params.id) }); await connection.execute("INSERT INTO audit_log(table_name,record_id,action_name,action_by,new_summary) VALUES('SERVICE_REQUESTS',:id,'STATUS_CHANGE',:actor,:summary)", { id: Number(req.params.id), actor: req.user.username, summary: `status=${status}` }); await connection.commit(); res.json({ message: "Service request status updated." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

module.exports = { list, create, assign, updateStatus };
