const { getConnection } = require("../config/db");
const { requireFields, pageOptions, withConnection } = require("../utils/http");
const { assertCustomerBranch, setClientIdentifier } = require("../utils/authorization");

async function getAllCustomers(req,res,next){
  try{
    await withConnection(getConnection,async c=>{
      const {page,pageSize,offset}=pageOptions(req.query);
      const binds={search:`%${String(req.query.search||"").trim().toLowerCase()}%`,offset,pageSize};
      let scope='';
      if(req.user.role==='CUSTOMER'){
        scope=' AND customer_id=:customerId';binds.customerId=req.user.customerId;
      }else if(['MANAGER','EMPLOYEE'].includes(req.user.role)){
        scope=' AND (NOT EXISTS(SELECT 1 FROM accounts a WHERE a.customer_id=customers.customer_id) OR EXISTS(SELECT 1 FROM accounts a WHERE a.customer_id=customers.customer_id AND a.branch_id=:branchId))';binds.branchId=req.user.branchId;
      }
      const rows=await c.execute(`SELECT customer_id,first_name,last_name,phone,email,national_id,address,status,created_at,COUNT(*) OVER() total_count FROM customers WHERE (LOWER(first_name||' '||last_name) LIKE :search OR LOWER(phone) LIKE :search OR LOWER(national_id) LIKE :search)${scope} ORDER BY customer_id DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,binds);
      res.json({items:rows.rows,page,pageSize,total:rows.rows[0]?.TOTAL_COUNT||0});
    });
  }catch(e){next(e)}
}

async function addCustomer(req,res,next){let connection;try{requireFields(req.body,['firstName','lastName','dateOfBirth','phone','nationalId','address']);connection=await getConnection();await setClientIdentifier(connection,req.user);const result=await connection.execute(`INSERT INTO customers(first_name,last_name,date_of_birth,gender,phone,email,national_id,address,occupation,annual_income) VALUES(:firstName,:lastName,TO_DATE(:dateOfBirth,'YYYY-MM-DD'),:gender,:phone,:email,:nationalId,:address,:occupation,:annualIncome) RETURNING customer_id INTO :id`,{firstName:req.body.firstName,lastName:req.body.lastName,dateOfBirth:req.body.dateOfBirth,gender:req.body.gender||null,phone:req.body.phone,email:req.body.email||null,nationalId:req.body.nationalId,address:req.body.address,occupation:req.body.occupation||null,annualIncome:Number(req.body.annualIncome||0),id:{dir:3003,type:2010}});await connection.commit();res.status(201).json({id:result.outBinds.id[0],message:'Customer registered.'});}catch(e){if(connection)await connection.rollback();next(e)}finally{if(connection)await connection.close()}}

async function updateCustomer(req,res,next){let connection;try{connection=await getConnection();const id=Number(req.params.id);if(req.user.role==='CUSTOMER'&&id!==req.user.customerId)return res.status(403).json({message:'You may update only your profile.'});await assertCustomerBranch(connection,req.user,id);await setClientIdentifier(connection,req.user);const result=await connection.execute(`UPDATE customers SET phone=:phone,email=:email,address=:address,updated_at=SYSTIMESTAMP WHERE customer_id=:id`,{phone:req.body.phone,email:req.body.email||null,address:req.body.address,id});if(!result.rowsAffected)return res.status(404).json({message:'Customer not found.'});await connection.commit();res.json({message:'Customer updated.'});}catch(e){if(connection)await connection.rollback();next(e)}finally{if(connection)await connection.close()}}

async function setCustomerStatus(req,res,next){let connection;try{if(!['ACTIVE','BLOCKED'].includes(req.body.status)){const e=new Error('Invalid customer status.');e.status=400;throw e}connection=await getConnection();const id=Number(req.params.id);await assertCustomerBranch(connection,req.user,id);await setClientIdentifier(connection,req.user);const result=await connection.execute('UPDATE customers SET status=:status,updated_at=SYSTIMESTAMP WHERE customer_id=:id',{status:req.body.status,id});if(!result.rowsAffected)return res.status(404).json({message:'Customer not found.'});await connection.commit();res.json({message:'Customer status updated.'});}catch(e){if(connection)await connection.rollback();next(e)}finally{if(connection)await connection.close()}}
module.exports={getAllCustomers,addCustomer,updateCustomer,setCustomerStatus};
