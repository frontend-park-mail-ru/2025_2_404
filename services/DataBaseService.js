const db = new Dexie("AdNetDB");

db.version(1).stores({
  transactions: '++id, date',
  balance: 'id' 
});

async function saveAllTransactions(transactions) {
  try {
    await db.transactions.clear();
    await db.transactions.bulkAdd(transactions); 
    console.log("Транзакции сохранены в IndexedDB");
  } catch (error) {
    console.error("Ошибка сохранения транзакций:", error);
  }
}

async function getAllTransactions() {
  try {
    return await db.transactions.orderBy('date').reverse().toArray();
  } catch (error) {
    console.error("Ошибка получения транзакций:", error);
    return []; 
  }
}

async function addTransaction(transaction) {
    try {
        await db.transactions.add(transaction);
        console.log("Новая транзакция добавлена в IndexedDB");
    } catch (error) {
        console.error("Ошибка добавления транзакции:", error);
    }
}

async function saveBalance(balanceValue) {
    try {
        await db.balance.put({ id: 1, value: balanceValue });
    } catch(error) {
        console.error("Ошибка сохранения баланса:", error);
    }
}

async function getBalance() {
    try {
        const balanceObj = await db.balance.get(1);
        return balanceObj ? balanceObj.value : 0;
    } catch(error) {
        console.error("Ошибка получения баланса:", error);
        return 0;
    }
}

export const DBService = {
  saveAllTransactions,
  getAllTransactions,
  addTransaction,
  saveBalance,
  getBalance
};