const fs = require("fs");
const path = require("path");

function calculateCredit() {
  const creditCardData = JSON.parse(fs.readFileSync(path.join(__dirname, "bank_account_creditCard.json"), "utf8"));
  return creditCardData.reduce((total, payment) => {
    const money = payment.amount.split("$");
    const amount = parseFloat(money[1]);
    return money[0] == "−" ? total - amount : total + amount;
  }, 0.00);
}

function calculateDebit(PREAUTHORIZED = true) {
  let debitCardData = JSON.parse(fs.readFileSync(path.join(__dirname, "bank_account_normal.json"), "utf8"));
  if (!PREAUTHORIZED) {
    debitCardData = debitCardData.filter((value) => !value.description.includes("PREAUTHORIZED DEBIT"));
  }

  return debitCardData.reduce((total, payment) => {
    const amount = parseFloat(payment.cost.slice(1));
    return payment.type === "EARN" ? total + amount : total - amount;
  }, 0);
}

const debitTotal = calculateDebit();
const creditTotal = calculateCredit();
console.log(debitTotal.toFixed(2));
console.log(creditTotal.toFixed(2));
console.log("total : ",(debitTotal+creditTotal).toFixed(2))