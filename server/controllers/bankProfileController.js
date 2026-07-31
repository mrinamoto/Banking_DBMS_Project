const { getConnection } = require("../config/db");
const { withConnection } = require("../utils/http");

async function getProfile(req, res, next) {
  try {
    await withConnection(getConnection, async (connection) => {
      const result = await connection.execute("SELECT profile_id,bank_name,short_name,head_office_address,support_phone,support_email,website,swift_code,currency,status,updated_at FROM bank_profile WHERE profile_id=1 AND status='ACTIVE'");
      res.json(result.rows[0] || null);
    });
  } catch (error) { next(error); }
}

async function updateProfile(req, res, next) {
  let connection;
  try {
    connection = await getConnection();
    const fields = ["bankName", "shortName", "headOfficeAddress", "supportPhone", "supportEmail", "website", "swiftCode"];
    if (fields.some((field) => req.body[field] !== undefined && String(req.body[field]).trim() === "")) throw Object.assign(new Error("Bank profile fields cannot be blank."), { status: 400 });
    await connection.execute(`UPDATE bank_profile SET bank_name=:bankName,short_name=:shortName,head_office_address=:headOfficeAddress,support_phone=:supportPhone,support_email=:supportEmail,website=:website,swift_code=:swiftCode,updated_at=SYSTIMESTAMP WHERE profile_id=1`, {
      bankName: req.body.bankName, shortName: req.body.shortName, headOfficeAddress: req.body.headOfficeAddress,
      supportPhone: req.body.supportPhone, supportEmail: req.body.supportEmail, website: req.body.website || null, swiftCode: req.body.swiftCode || null,
    });
    await connection.commit();
    res.json({ message: "Bank profile updated." });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) await connection.close(); }
}

module.exports = { getProfile, updateProfile };
