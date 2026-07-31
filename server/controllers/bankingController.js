const oracledb=require('oracledb');const {getConnection}=require('../config/db');const {requireFields,pageOptions,withConnection}=require('../utils/http');
const {assertAccountAccess,assertBranchId,assertCustomerBranch,assertLoanAccess,setClientIdentifier}=require('../utils/authorization');
const outString={dir:oracledb.BIND_OUT,type:oracledb.STRING,maxSize:80};
async function transactionReceipt(c,reference){const r=await c.execute(`SELECT t.reference_no,t.transaction_type,t.amount,t.previous_balance,t.new_balance,t.transaction_date,t.status,a.account_number,u.username FROM transactions t JOIN accounts a ON a.account_id=t.account_id LEFT JOIN users u ON u.user_id=t.processed_by WHERE t.reference_no=:reference`,{reference});const row=r.rows[0];return row?{reference:row.REFERENCE_NO,type:row.TRANSACTION_TYPE,amount:row.AMOUNT,previousBalance:row.PREVIOUS_BALANCE,newBalance:row.NEW_BALANCE,paymentTime:row.TRANSACTION_DATE,status:row.STATUS,processedBy:row.USERNAME||'SYSTEM',maskedAccount:`••••${row.ACCOUNT_NUMBER.slice(-4)}`}:null}
async function listBranches(req,res,next){try{await withConnection(getConnection,async c=>{const branchId=['MANAGER','EMPLOYEE'].includes(req.user.role)?req.user.branchId:null;const r=await c.execute(`SELECT branch_id,branch_code,branch_name,city,address,phone,status FROM branches WHERE LOWER(branch_name||' '||branch_code||' '||city) LIKE :search AND (:branchId IS NULL OR branch_id=:branchId) ORDER BY branch_name`,{search:`%${String(req.query.search||'').toLowerCase()}%`,branchId});res.json(r.rows)});}catch(e){next(e)}}
async function createBranch(req,res,next){let c;try{requireFields(req.body,['branchCode','branchName','city','address']);c=await getConnection();await setClientIdentifier(c,req.user);await c.execute(`INSERT INTO branches(branch_code,branch_name,city,address,phone,swift_code) VALUES(:branchCode,:branchName,:city,:address,:phone,:swiftCode)`,{...req.body,phone:req.body.phone||null,swiftCode:req.body.swiftCode||null});await c.commit();res.status(201).json({message:'Branch created.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function listAccounts(req,res,next){try{await withConnection(getConnection,async c=>{const {page,pageSize,offset}=pageOptions(req.query);let scope='';const binds={search:`%${String(req.query.search||'').toLowerCase()}%`,offset,pageSize};if(req.user.role==='CUSTOMER'){scope=' AND a.customer_id=:customerId';binds.customerId=req.user.customerId}else if(['MANAGER','EMPLOYEE'].includes(req.user.role)){scope=' AND a.branch_id=:branchId';binds.branchId=req.user.branchId}const r=await c.execute(`SELECT a.account_id,a.account_number,a.customer_id,c.first_name||' '||c.last_name customer_name,t.type_name,b.branch_name,a.balance,GREATEST(a.balance-t.min_balance,0) available_balance,a.currency,a.status,COUNT(*) OVER() total_count FROM accounts a JOIN customers c ON c.customer_id=a.customer_id JOIN account_types t ON t.account_type_id=a.account_type_id JOIN branches b ON b.branch_id=a.branch_id WHERE LOWER(a.account_number||' '||c.first_name||' '||c.last_name) LIKE :search${scope} ORDER BY a.account_id DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,binds);res.json({items:r.rows,page,pageSize,total:r.rows[0]?.TOTAL_COUNT||0})});}catch(e){next(e)}}
async function openAccount(req,res,next){let c;try{requireFields(req.body,['customerId','branchId','accountTypeId','initialDeposit']);assertBranchId(req.user,req.body.branchId);c=await getConnection();await assertCustomerBranch(c,req.user,Number(req.body.customerId));await setClientIdentifier(c,req.user);const r=await c.execute(`BEGIN pkg_banking_operations.open_account(:customerId,:branchId,:accountTypeId,:initialDeposit,:userId,:accountNumber); END;`,{customerId:Number(req.body.customerId),branchId:Number(req.body.branchId),accountTypeId:Number(req.body.accountTypeId),initialDeposit:Number(req.body.initialDeposit),userId:req.user.id,accountNumber:outString});await c.commit();res.status(201).json({accountNumber:r.outBinds.accountNumber,message:'Account opened.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function transactionOperation(req,res,next){let c;try{const operation=req.params.operation;if(!['deposit','withdraw'].includes(operation)){const e=new Error('Unsupported operation.');e.status=400;throw e}requireFields(req.body,['accountNumber','amount']);c=await getConnection();await assertAccountAccess(c,req.user,req.body.accountNumber);await setClientIdentifier(c,req.user);const call=operation==='deposit'?'deposit':'withdraw';const r=await c.execute(`BEGIN pkg_banking_operations.${call}(:accountNumber,:amount,:userId,:reference); END;`,{accountNumber:req.body.accountNumber,amount:Number(req.body.amount),userId:req.user.id,reference:outString});const receipt=await transactionReceipt(c,r.outBinds.reference);await c.commit();res.json({...receipt,message:`${operation==='deposit'?'Deposit':'Withdrawal'} completed.`});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function transfer(req,res,next){let c;try{requireFields(req.body,['fromAccount','toAccount','amount']);c=await getConnection();await assertAccountAccess(c,req.user,req.body.fromAccount);await setClientIdentifier(c,req.user);const r=await c.execute(`BEGIN pkg_banking_operations.transfer_funds(:fromAccount,:toAccount,:amount,:userId,:ownerId,:reference); END;`,{fromAccount:req.body.fromAccount,toAccount:req.body.toAccount,amount:Number(req.body.amount),userId:req.user.id,ownerId:req.user.role==='CUSTOMER'?req.user.customerId:null,reference:outString});const receipt=await transactionReceipt(c,`${r.outBinds.reference}-D`);await c.commit();res.json({...receipt,reference:r.outBinds.reference,message:'Transfer completed.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function listTransactions(req,res,next){try{await withConnection(getConnection,async c=>{const {page,pageSize,offset}=pageOptions(req.query);const binds={search:`%${String(req.query.search||'').toLowerCase()}%`,type:req.query.type||null,status:req.query.status||null,dateFrom:req.query.dateFrom||null,dateTo:req.query.dateTo||null,offset,pageSize};let scope='';if(req.user.role==='CUSTOMER'){scope=' AND a.customer_id=:customerId';binds.customerId=req.user.customerId}else if(['MANAGER','EMPLOYEE'].includes(req.user.role)){scope=' AND a.branch_id=:branchId';binds.branchId=req.user.branchId}const r=await c.execute(`SELECT t.transaction_id,t.reference_no,t.transaction_type,a.account_number,t.amount,t.previous_balance,t.new_balance,t.status,t.transaction_date,tr.reversal_id,tr.status reversal_status,COUNT(*) OVER() total_count FROM transactions t JOIN accounts a ON a.account_id=t.account_id LEFT JOIN transaction_reversals tr ON tr.original_transaction_id=t.transaction_id WHERE LOWER(t.reference_no) LIKE :search AND (:type IS NULL OR t.transaction_type=:type) AND (:status IS NULL OR t.status=:status) AND (:dateFrom IS NULL OR t.transaction_date>=TO_DATE(:dateFrom,'YYYY-MM-DD')) AND (:dateTo IS NULL OR t.transaction_date<TO_DATE(:dateTo,'YYYY-MM-DD')+1)${scope} ORDER BY t.transaction_date DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,binds);res.json({items:r.rows,page,pageSize,total:r.rows[0]?.TOTAL_COUNT||0})});}catch(e){next(e)}}
async function listLoans(req,res,next){try{await withConnection(getConnection,async c=>{const binds={};let scope='';if(req.user.role==='CUSTOMER'){scope=' WHERE l.customer_id=:customerId';binds.customerId=req.user.customerId}else if(['MANAGER','EMPLOYEE'].includes(req.user.role)){scope=' WHERE a.branch_id=:branchId';binds.branchId=req.user.branchId}const r=await c.execute(`SELECT l.loan_id,l.loan_number,l.customer_id,l.term_months,l.interest_rate,c.first_name||' '||c.last_name customer_name,lt.type_name,l.requested_amount,l.approved_amount,l.monthly_installment,l.outstanding_balance,l.status,l.application_date FROM loans l JOIN customers c ON c.customer_id=l.customer_id JOIN loan_types lt ON lt.loan_type_id=l.loan_type_id JOIN accounts a ON a.account_id=l.disbursement_account_id${scope} ORDER BY l.application_date DESC`,binds);res.json(r.rows)});}catch(e){next(e)}}
async function applyLoan(req,res,next){let c;try{requireFields(req.body,['customerId','loanTypeId','accountId','amount','termMonths']);if(req.user.role==='CUSTOMER'&&Number(req.body.customerId)!==req.user.customerId)return res.status(403).json({message:'You may apply only for yourself.'});c=await getConnection();const accountResult=await c.execute('SELECT account_number FROM accounts WHERE account_id=:id',{id:Number(req.body.accountId)});if(!accountResult.rows[0]){const e=new Error('Account not found.');e.status=400;throw e}await assertAccountAccess(c,req.user,accountResult.rows[0].ACCOUNT_NUMBER,{customerId:Number(req.body.customerId)});await setClientIdentifier(c,req.user);const r=await c.execute(`BEGIN pkg_loan_operations.apply_for_loan(:customerId,:typeId,:accountId,:amount,:months,:number); END;`,{customerId:Number(req.body.customerId),typeId:Number(req.body.loanTypeId),accountId:Number(req.body.accountId),amount:Number(req.body.amount),months:Number(req.body.termMonths),number:outString});await c.commit();res.status(201).json({loanNumber:r.outBinds.number,message:'Loan application submitted.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function decideLoan(req,res,next){let c;try{requireFields(req.body,['decision']);c=await getConnection();await assertLoanAccess(c,req.user,Number(req.params.id));await setClientIdentifier(c,req.user);let data;if(req.body.decision==='APPROVE'){requireFields(req.body,['approvedAmount']);const r=await c.execute(`BEGIN pkg_loan_operations.approve_loan(:id,:amount,:employeeId,:userId,:reference); END;`,{id:Number(req.params.id),amount:Number(req.body.approvedAmount),employeeId:req.user.employeeId,userId:req.user.id,reference:outString});data={reference:r.outBinds.reference,message:'Loan approved and disbursed.'}}else if(req.body.decision==='REJECT'){requireFields(req.body,['reason']);await c.execute(`BEGIN pkg_loan_operations.reject_loan(:id,:reason,:employeeId); END;`,{id:Number(req.params.id),reason:req.body.reason,employeeId:req.user.employeeId});data={message:'Loan rejected.'}}else{const e=new Error('Decision must be APPROVE or REJECT.');e.status=400;throw e}await c.commit();res.json(data);}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function lookups(req,res,next){try{await withConnection(getConnection,async c=>{const branchId=['MANAGER','EMPLOYEE'].includes(req.user.role)?req.user.branchId:null;const [branches,types,loanTypes]=await Promise.all([c.execute(`SELECT branch_id id,branch_name label FROM branches WHERE status='ACTIVE' AND (:branchId IS NULL OR branch_id=:branchId) ORDER BY branch_name`,{branchId}),c.execute(`SELECT account_type_id id,type_name label,min_balance FROM account_types WHERE status='ACTIVE' ORDER BY type_name`),c.execute(`SELECT loan_type_id id,type_name label,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months FROM loan_types WHERE status='ACTIVE' ORDER BY type_name`)]);res.json({branches:branches.rows,accountTypes:types.rows,loanTypes:loanTypes.rows})});}catch(e){next(e)}}
async function listEmployees(req,res,next){try{await withConnection(getConnection,async c=>{const binds={search:`%${String(req.query.search||'').toLowerCase()}%`};let scope='';if(req.user.role==='MANAGER'){scope=' AND e.branch_id=:branchId';binds.branchId=req.user.branchId}const r=await c.execute(`SELECT e.employee_id,e.employee_code,e.first_name||' '||e.last_name employee_name,e.job_title,e.email,e.phone,e.salary,e.status,b.branch_name FROM employees e JOIN branches b ON b.branch_id=e.branch_id WHERE LOWER(e.first_name||' '||e.last_name||' '||e.employee_code) LIKE :search${scope} ORDER BY e.employee_id`,binds);res.json(r.rows)});}catch(e){next(e)}}
async function reports(req,res,next){try{await withConnection(getConnection,async c=>{const binds={branchId:req.user.role==='MANAGER'?req.user.branchId:null};const [branches,accounts,loans,monthly]=await Promise.all([c.execute(`SELECT * FROM vw_branch_performance WHERE (:branchId IS NULL OR branch_id=:branchId) ORDER BY total_balance DESC`,binds),c.execute(`SELECT status label,COUNT(*) value FROM accounts WHERE (:branchId IS NULL OR branch_id=:branchId) GROUP BY status`,binds),c.execute(`SELECT l.status label,COUNT(*) value FROM loans l JOIN accounts a ON a.account_id=l.disbursement_account_id WHERE (:branchId IS NULL OR a.branch_id=:branchId) GROUP BY l.status`,binds),c.execute(`SELECT TO_CHAR(t.transaction_date,'YYYY-MM') month,SUM(CASE WHEN t.transaction_type IN('DEPOSIT','TRANSFER_CREDIT','LOAN_DISBURSEMENT') THEN t.amount ELSE 0 END) credits,SUM(CASE WHEN t.transaction_type IN('WITHDRAWAL','TRANSFER_DEBIT','LOAN_PAYMENT') THEN t.amount ELSE 0 END) debits FROM transactions t JOIN accounts a ON a.account_id=t.account_id WHERE t.transaction_date>=ADD_MONTHS(TRUNC(SYSDATE,'MM'),-5) AND (:branchId IS NULL OR a.branch_id=:branchId) GROUP BY TO_CHAR(t.transaction_date,'YYYY-MM') ORDER BY month`,binds)]);res.json({branches:branches.rows,accountStatus:accounts.rows,loanStatus:loans.rows,monthly:monthly.rows})});}catch(e){next(e)}}
async function audit(req,res,next){try{await withConnection(getConnection,async c=>{const {page,pageSize,offset}=pageOptions(req.query);const r=await c.execute(`SELECT audit_id,table_name,record_id,action_name,action_by,old_summary,new_summary,action_date,COUNT(*) OVER() total_count FROM audit_log WHERE LOWER(table_name||' '||action_name||' '||action_by) LIKE :search ORDER BY action_date DESC OFFSET :offset ROWS FETCH NEXT :pageSize ROWS ONLY`,{search:`%${String(req.query.search||'').toLowerCase()}%`,offset,pageSize});res.json({items:r.rows,page,pageSize,total:r.rows[0]?.TOTAL_COUNT||0})});}catch(e){next(e)}}

async function changeAccountStatus(req,res,next){
  let c;
  try{
    requireFields(req.body,['status']);
    c=await getConnection();
    const result=await c.execute('SELECT account_number FROM accounts WHERE account_id=:id',{id:Number(req.params.id)});
    if(!result.rows[0])return res.status(404).json({message:'Account not found.'});
    await assertAccountAccess(c,req.user,result.rows[0].ACCOUNT_NUMBER);
    await setClientIdentifier(c,req.user);
    await c.execute('BEGIN pkg_banking_operations.change_status(:id,:status); END;',{id:Number(req.params.id),status:req.body.status});
    await c.commit();
    res.json({message:'Account status updated.'});
  }catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}
}

async function payLoan(req,res,next){
  let c;
  try{
    requireFields(req.body,['accountNumber','amount']);
    c=await getConnection();
    const loan=await assertLoanAccess(c,req.user,Number(req.params.id));
    await assertAccountAccess(c,req.user,req.body.accountNumber,{customerId:loan.CUSTOMER_ID});
    await setClientIdentifier(c,req.user);
    const result=await c.execute(
      'BEGIN pkg_loan_operations.record_payment(:loanId,:accountNumber,:amount,:userId,:reference); END;',
      {loanId:Number(req.params.id),accountNumber:req.body.accountNumber,amount:Number(req.body.amount),userId:req.user.id,reference:outString}
    );
    const receipt=await c.execute(
      `SELECT p.amount,p.previous_outstanding,p.new_outstanding,p.payment_date,
              l.status,a.account_number,t.previous_balance,t.new_balance,t.status transaction_status
         FROM loan_payments p
         JOIN loans l ON l.loan_id=p.loan_id
         JOIN accounts a ON a.account_id=p.account_id
         JOIN transactions t ON t.transaction_id=p.transaction_id
        WHERE t.reference_no=:reference`,
      {reference:result.outBinds.reference}
    );
    await c.commit();
    const row=receipt.rows[0];
    res.status(201).json({
      reference:result.outBinds.reference,
      amount:row.AMOUNT,
      previousOutstanding:row.PREVIOUS_OUTSTANDING,
      newOutstanding:row.NEW_OUTSTANDING,
      previousBalance:row.PREVIOUS_BALANCE,
      newBalance:row.NEW_BALANCE,
      loanStatus:row.STATUS,
      status:row.TRANSACTION_STATUS,
      maskedAccount:`••••${row.ACCOUNT_NUMBER.slice(-4)}`,
      paymentTime:row.PAYMENT_DATE,
    });
  }catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}
}

async function loanPayments(req,res,next){
  try{
    await withConnection(getConnection,async c=>{
      await assertLoanAccess(c,req.user,Number(req.params.id));
      const result=await c.execute(
        `SELECT p.payment_id,p.amount,p.previous_outstanding,p.new_outstanding,p.payment_date,
                t.reference_no,a.account_number
           FROM loan_payments p
           JOIN transactions t ON t.transaction_id=p.transaction_id
           JOIN accounts a ON a.account_id=p.account_id
          WHERE p.loan_id=:loanId
          ORDER BY p.payment_date DESC`,
        {loanId:Number(req.params.id)}
      );
      res.json(result.rows.map(row=>({...row,ACCOUNT_NUMBER:`••••${row.ACCOUNT_NUMBER.slice(-4)}`})));
    });
  }catch(e){next(e)}
}

async function createEmployee(req,res,next){
  let c;
  try{
    requireFields(req.body,['branchId','employeeCode','firstName','lastName','nationalId','jobTitle','email','salary']);
    assertBranchId(req.user,req.body.branchId);
    c=await getConnection();
    await setClientIdentifier(c,req.user);
    const result=await c.execute(
      `INSERT INTO employees(branch_id,employee_code,first_name,last_name,national_id,job_title,email,phone,salary)
       VALUES(:branchId,:employeeCode,:firstName,:lastName,:nationalId,:jobTitle,:email,:phone,:salary)
       RETURNING employee_id INTO :id`,
      {...req.body,phone:req.body.phone||null,salary:Number(req.body.salary),id:{dir:oracledb.BIND_OUT,type:oracledb.NUMBER}}
    );
    await c.commit();
    res.status(201).json({id:result.outBinds.id[0],message:'Employee created.'});
  }catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}
}

async function updateEmployee(req,res,next){
  let c;
  try{
    c=await getConnection();
    const current=await c.execute('SELECT branch_id FROM employees WHERE employee_id=:id',{id:Number(req.params.id)});
    if(!current.rows[0])return res.status(404).json({message:'Employee not found.'});
    assertBranchId(req.user,current.rows[0].BRANCH_ID);
    assertBranchId(req.user,req.body.branchId);
    await setClientIdentifier(c,req.user);
    await c.execute(
      `UPDATE employees SET branch_id=:branchId,job_title=:jobTitle,email=:email,phone=:phone,salary=:salary
        WHERE employee_id=:id`,
      {branchId:Number(req.body.branchId),jobTitle:req.body.jobTitle,email:req.body.email,phone:req.body.phone||null,salary:Number(req.body.salary),id:Number(req.params.id)}
    );
    await c.commit();
    res.json({message:'Employee updated.'});
  }catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}
}

async function setEmployeeStatus(req,res,next){
  let c;
  try{
    if(!['ACTIVE','INACTIVE'].includes(req.body.status)){const e=new Error('Invalid employee status.');e.status=400;throw e}
    c=await getConnection();
    const current=await c.execute('SELECT branch_id FROM employees WHERE employee_id=:id',{id:Number(req.params.id)});
    if(!current.rows[0])return res.status(404).json({message:'Employee not found.'});
    assertBranchId(req.user,current.rows[0].BRANCH_ID);
    await setClientIdentifier(c,req.user);
    await c.execute('UPDATE employees SET status=:status WHERE employee_id=:id',{status:req.body.status,id:Number(req.params.id)});
    await c.commit();
    res.json({message:'Employee status updated.'});
  }catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}
}

async function listLoanProducts(req,res,next){try{await withConnection(getConnection,async c=>{const r=await c.execute(`SELECT loan_type_id,type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months,status FROM loan_types ORDER BY type_name`);res.json(r.rows)});}catch(e){next(e)}}
async function createLoanProduct(req,res,next){let c;try{requireFields(req.body,['typeName','shortDescription','minAmount','maxAmount','annualInterestRate','minTermMonths','maxTermMonths']);c=await getConnection();await c.execute(`INSERT INTO loan_types(type_name,short_description,detailed_description,minimum_annual_income,processing_fee_percentage,eligibility_summary,required_document_summary,interest_method,min_amount,max_amount,annual_interest_rate,min_term_months,max_term_months) VALUES(:typeName,:shortDescription,:detailedDescription,:minimumIncome,:processingFee,:eligibility,:documents,:interestMethod,:minAmount,:maxAmount,:rate,:minTerm,:maxTerm)`,{typeName:req.body.typeName,shortDescription:req.body.shortDescription,detailedDescription:req.body.detailedDescription||null,minimumIncome:Number(req.body.minimumIncome||0),processingFee:Number(req.body.processingFee||0),eligibility:req.body.eligibility||null,documents:req.body.documents||null,interestMethod:req.body.interestMethod||'REDUCING_BALANCE',minAmount:Number(req.body.minAmount),maxAmount:Number(req.body.maxAmount),rate:Number(req.body.annualInterestRate),minTerm:Number(req.body.minTermMonths),maxTerm:Number(req.body.maxTermMonths)});await c.commit();res.status(201).json({message:'Loan product created.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function updateLoanProduct(req,res,next){let c;try{c=await getConnection();const result=await c.execute(`UPDATE loan_types SET short_description=:shortDescription,detailed_description=:detailedDescription,minimum_annual_income=:minimumIncome,processing_fee_percentage=:processingFee,eligibility_summary=:eligibility,required_document_summary=:documents,interest_method=:interestMethod,min_amount=:minAmount,max_amount=:maxAmount,annual_interest_rate=:rate,min_term_months=:minTerm,max_term_months=:maxTerm WHERE loan_type_id=:id`,{id:Number(req.params.id),shortDescription:req.body.shortDescription||null,detailedDescription:req.body.detailedDescription||null,minimumIncome:Number(req.body.minimumIncome||0),processingFee:Number(req.body.processingFee||0),eligibility:req.body.eligibility||null,documents:req.body.documents||null,interestMethod:req.body.interestMethod||'REDUCING_BALANCE',minAmount:Number(req.body.minAmount),maxAmount:Number(req.body.maxAmount),rate:Number(req.body.annualInterestRate),minTerm:Number(req.body.minTermMonths),maxTerm:Number(req.body.maxTermMonths)});if(!result.rowsAffected)return res.status(404).json({message:'Loan product not found.'});await c.commit();res.json({message:'Loan product updated.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
async function setLoanProductStatus(req,res,next){let c;try{if(!['ACTIVE','INACTIVE'].includes(req.body.status)){const e=new Error('Invalid loan product status.');e.status=400;throw e}c=await getConnection();const result=await c.execute('UPDATE loan_types SET status=:status WHERE loan_type_id=:id',{status:req.body.status,id:Number(req.params.id)});if(!result.rowsAffected)return res.status(404).json({message:'Loan product not found.'});await c.commit();res.json({message:'Loan product status updated.'});}catch(e){if(c)await c.rollback();next(e)}finally{if(c)await c.close()}}
module.exports={listBranches,createBranch,listAccounts,openAccount,changeAccountStatus,transactionOperation,transfer,listTransactions,listLoans,applyLoan,decideLoan,payLoan,loanPayments,lookups,listEmployees,createEmployee,updateEmployee,setEmployeeStatus,reports,audit,listLoanProducts,createLoanProduct,updateLoanProduct,setLoanProductStatus};
