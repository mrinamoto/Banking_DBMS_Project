const { getConnection } = require("../config/db");
const { pageOptions, withConnection } = require("../utils/http");

async function list(req, res, next) {
  try { await withConnection(getConnection, async (connection) => {
    const { page, pageSize, offset } = pageOptions(req.query);
    const result = await connection.execute(`SELECT notification_id,event_type,title,message,entity_type,entity_id,is_read,created_at,read_at,COUNT(*) OVER() total_count FROM notifications WHERE user_id=:userId ORDER BY created_at DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`, { userId: req.user.id, offset, pageSize });
    const unread = await connection.execute("SELECT COUNT(*) count FROM notifications WHERE user_id=:userId AND is_read='N'", { userId: req.user.id });
    res.json({ items: result.rows, page, pageSize, total: result.rows[0]?.TOTAL_COUNT || 0, unread: Number(unread.rows[0]?.COUNT || 0) });
  }); } catch (error) { next(error); }
}

async function markRead(req, res, next) {
  let connection;
  try { connection = await getConnection(); const result = await connection.execute("UPDATE notifications SET is_read='Y',read_at=SYSTIMESTAMP WHERE notification_id=:id AND user_id=:userId", { id: Number(req.params.id), userId: req.user.id }); await connection.commit(); if (!result.rowsAffected) return res.status(404).json({ message: "Notification not found." }); res.json({ message: "Notification marked read." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

async function markAllRead(req, res, next) {
  let connection;
  try { connection = await getConnection(); await connection.execute("UPDATE notifications SET is_read='Y',read_at=SYSTIMESTAMP WHERE user_id=:userId AND is_read='N'", { userId: req.user.id }); await connection.commit(); res.json({ message: "Notifications marked read." }); } catch (error) { if (connection) await connection.rollback(); next(error); } finally { if (connection) await connection.close(); }
}

module.exports = { list, markRead, markAllRead };
