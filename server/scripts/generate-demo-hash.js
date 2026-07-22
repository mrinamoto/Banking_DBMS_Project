const { hashPassword } = require("../utils/passwords");

const password = process.argv[2];
if (!password) {
  console.error("Usage: npm run demo-hash -- <temporary-demo-password>");
  process.exitCode = 1;
} else {
  hashPassword(password).then((hash) => console.log(hash)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
