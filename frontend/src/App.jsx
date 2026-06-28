import { useState, useEffect } from "react"

function App() {
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [txRes, balRes] = await Promise.all([
      fetch("http://localhost:5000/transactions"),
      fetch("http://localhost:5000/balance")
    ])

    const txData = await txRes.json()
    const balData = await balRes.json()

    setTransactions(txData)
    setBalance(balData)
    setLoading(false)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1>IOU Tracker</h1>

      <h2>{balance.summary}</h2>

      <h3>Transactions</h3>
      {transactions.map(tx => (
        <div key={tx.id}>
          <p>{tx.description} — ${tx.amount} — paid by {tx.paid_by}</p>
        </div>
      ))}
    </div>
  )
}

export default App