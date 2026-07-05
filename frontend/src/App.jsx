import { useState, useEffect } from "react";
import AddTransaction from "./AddTransaction";

function App(){
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchData()
  }, [])


  async function fetchData(){
    const [res1, res2] = await Promise.all([
      fetch("https://iou-tracker-h8ik.onrender.com/transactions"),
      fetch("https://iou-tracker-h8ik.onrender.com/balance")
    ])

    const data1 = await res1.json()
    const data2 = await res2.json()

    setTransactions(data1)
    setBalance(data2)

    setLoading(false)
  }

  async function handleSettle(id){
    const url = `https://iou-tracker-h8ik.onrender.com/transactions/${id}/settle`

    const response = await fetch(url, {
      method: "PATCH"
    })

    if(response.ok){
      fetchData()
    }
  }  

  async function handleDelete(id){
    const url = `https://iou-tracker-h8ik.onrender.com/transactions/${id}`

    const response = await fetch(url, {
      method: "DELETE"
    })

    if(response.ok){
      fetchData()
    }
  }

  if(loading){
    return <p>Loading...</p>
  }

  async function handleClear(){
    const url = 'https://iou-tracker-h8ik.onrender.com/transaction'
    
    const response = await fetch(url, {
        method: "DELETE"
    })

    if(response.ok){
        fetchData()
    }
  }

  return (
    <div className="container">
      <h1>IOU Tracker</h1>

      <div className="main-layout">
        <div className="left-column">
          <div className="balance-card">
            <p className="balance-label">Current Balance</p>
            <h2 className="balance-amount">${Math.min(balance.balance, 9999999999999999).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            <p className="balance-sub">{balance.summary}</p>
          </div>

          <AddTransaction onAdd={fetchData} />
        </div>

        <div className="right-column">
           <div className = "transaction-header">
                <h3 className="transaction-label">Transactions:</h3>
                <button className = "clearbttn" onClick={() => setShowConfirm(true)}>Clear</button> 
           </div>
            <div className="transaction-card">
                {transactions.map(tx => (
                    <div className="transaction-item" key={tx.id}>
                    <div className="transaction-info">
                        <p className="transaction-desc" style={{textDecoration: tx.settled ? "line-through" : "none", textDecorationColor: tx.settled ? "black" : "transparent", textDecorationThickness: "3px"}}>
                            {tx.description.length > 25 ? tx.description.slice(0, 25) + "..." : tx.description}
                        </p>
                        <p className="transaction-sub" style={{textDecoration: tx.settled ? "line-through" : "none", textDecorationColor: tx.settled ? "black" : "transparent", textDecorationThickness: "3px"}}>
                            Paid by {tx.paid_by === "me" ? "Alex" : "Adrian"} - {new Date(tx.created_at).toLocaleDateString('en-us', {month: 'long', day: 'numeric'})}
                        </p>
                    </div>

                    <p className="transaction-amount">
                        {tx.paid_by === "me" ? "+" : "-"}${Math.min(tx.amount, 99999).toFixed(2)}
                    </p>

                    <div className="transaction-buttons">
                        <button className="settle-button" onClick={() => handleSettle(tx.id)}>Settle</button>
                        <button className="delete-button" onClick={() => handleDelete(tx.id)}>Delete</button>
                    </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>THIS WILL CLEAR ALL TRANSACTIONS</p>
            <p>Are you sure?</p>
            <div className="modal-buttons">
              <button 
                className="confirm-button" onClick={() => {handleClear(); setShowConfirm(false);}}>Yes, Clear</button>
              <button className="cancel-button" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}

export default App