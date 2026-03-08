// Experimental
const fs = require("fs");
const path = require("path");

function calculateCredit() {
  const creditCardData = JSON.parse(fs.readFileSync(path.join(__dirname, "credit.json"), "utf8"));
  return creditCardData.reduce((total, payment) => {
    return payment.debit === null ? total + payment.credit : total + 0;
  }, 0);
}

function calculateDebit() {
  let debitCardData = JSON.parse(fs.readFileSync(path.join(__dirname, "debit.json"), "utf8"));
  return debitCardData.reduce((total, payment) => {
    return payment.debit === null ? total + payment.credit : total - payment.debit;
  }, 0);
}

// const debitTotal = calculateDebit();
const creditTotal = calculateCredit();
// console.log(debitTotal.toFixed(2));
console.log(creditTotal.toFixed(2));
// console.log("total : ",(debitTotal+creditTotal).toFixed(2))