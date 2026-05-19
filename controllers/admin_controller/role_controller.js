const db = require("../../db");
const { RolesQuery } = require("../../helper/queries");
const { sendResponse } = require("../../helper/response");

const addRole = async (req, res) => {
  const { role_name, role_code, role_desc, status, permissions } = req.body;
  const connection = await db.getConnection(); 
  try {
     await connection.beginTransaction();
    const [roleresult] = await connection.query(RolesQuery.addinroletable, [
      role_name,
      role_code,
      role_desc,
      status,
    ]);

    const roleId = roleresult.insertId;

    for (const module in permissions) {
      const perm = permissions[module];

      await connection.query(RolesQuery.addinroleaccess, [
        roleId,
        perm.id,
        perm.module,
        perm.view ? "1" : "0",
        perm.add ? "1" : "0",
        perm.edit ? "1" : "0",
        perm.delete ? "1" : "0",
        perm.import ? "1" : "0",
        perm.export ? "1" : "0",
      ]);
    }

    // await conn.commit();
  await connection.commit();
    return res.json({ success: true, message: "Role created successfully" });
  } catch (error) {
    // await conn.rollback();
    return res.status(500).json({ error });
  }
};

const updateRole = async (req, res) => {
  const { role_name, role_code, role_desc, status, permissions } = req.body;
  const { id } = req.params;

  const connection = await db.getConnection(); // for transaction

  try {
    await connection.beginTransaction();

    // ✅ 1. Check role exists
    const [matchId] = await connection.query(
      `SELECT id FROM roles WHERE id = ?`,
      [id],
    );

    if (matchId.length === 0) {
      await connection.rollback();
      return sendResponse(res, 400, "Role not found");
    }

    // ✅ 2. Update role basic info
    await connection.query(
      `UPDATE roles 
       SET role_name = ?, role_code = ?, role_description = ?, status = ? 
       WHERE id = ?`,
      [role_name, role_code, role_desc, status, id],
    );

    // ✅ 3. Delete old permissions
    await connection.query(`DELETE FROM role_access WHERE role_id = ?`, [id]);

    // ✅ 4. Insert new permissions
    for (const module in permissions) {
      const perm = permissions[module];

      await connection.query(
        `INSERT INTO role_access 
        (role_id, module_id, module_name, can_view, can_add, can_update, can_delete, can_import, can_export)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          perm.id,
          perm.module,
          perm.view ? "1" : "0",
          perm.add ? "1" : "0",
          perm.edit ? "1" : "0", // edit → update
          perm.delete ? "1" : "0",
          perm.import ? "1" : "0",
          perm.export ? "1" : "0",
        ],
      );
    }

    // ✅ 5. Commit transaction
    await connection.commit();

    return sendResponse(res, 200, "Role updated successfully");
  } catch (error) {
    await connection.rollback();
    console.error("Update Role Error:", error);
    return sendResponse(res, 500, "Server Error", error);
  } finally {
    connection.release();
  }
};
const GetAllRoles = async (req, res) => {
  try {
    const [result] = await db.query(RolesQuery.GetRoles);

    return sendResponse(res, 200, "Get All Roles Successfully!!", result);
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};

const GetRolesById = async (req, res) => {
  const { id } = req.params;
  try {
    const [matchId] = await db.query(RolesQuery.MatchId, [id]);
    console.log("matchId", !matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Role is not found");
    }
    const [role] = await db.query(RolesQuery.MatchId, [id]);
    const [access] = await db.query(RolesQuery.GetRoleAccess, [id]);
    console.log("access", role);

    const permissions = {};
    access.forEach((row) => {
      permissions[row.module_name] = {
        id: row.module_id,
        module: row.module_name,
        view: row.can_view === "1",
        add: row.can_add === "1",
        edit: row.can_update === "1",
        delete: row.can_delete === "1",
        import: row.can_import === "1",
        export: row.can_export === "1",
      };
    });
    console.log("permissions", permissions);
    return res.status(200).json({
      statuscode: 200,
      message: "Get Role Successfully!!!",
      role_name: role[0].role_name,
      role_type: role[0].role_type, // if exists
      role_code: role[0].role_code,
      role_desc: role[0].role_description,
      status: role[0].status,
      permissions,
    });
  } catch (error) {
    console.log("error", error);
    return sendResponse(res, 500, "Server Error", error);
  }
};
const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    // Check country is exist
    const [matchId] = await db.query(RolesQuery.MatchId, [id]);
    console.log("matchId", matchId);
    if (matchId.length === 0) {
      sendResponse(res, 400, "Role is not found");
    }
    const result = await db.query(RolesQuery.DeleteRole, [id]);
    sendResponse(res, 200, "Role Deleted Successfully!!", {
      canDelete: true,
    });
  } catch (error) {
    console.log("error", error);
    sendResponse(res, 500, "Server Error", error);
  }
};
module.exports = { addRole, GetAllRoles, GetRolesById, updateRole, deleteRole };
