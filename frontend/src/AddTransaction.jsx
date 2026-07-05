import { useState } from "react";

function AddTransaction({onAdd}){
    const [description, setDescription] = useState("")
    const [amount, setAmount] = useState("")
    const [personPaid, setPersonPaid] = useState("")


    async function handleSubmit(){
        const url = "https://iou-tracker-h8ik.onrender.com/transactions";
        
        const response = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                description, 
                amount, 
                paid_by: personPaid
            }),            
        })

        if(response.ok){
            setDescription("");
            setAmount("");
            setPersonPaid("me");
            
            onAdd();
        }

       
    }

    return(
    <>
        <div className="add-box">
            <p id = "addTransactionText">Add Transaction</p>
            <input type ="text" value={description} placeholder="Description (max. 25 characters)"id="description" maxLength = {25} onChange={(e) => setDescription(e.target.value)}></input>
            <input type = "number" value={amount} id="amount" placeholder="Amount" maxLength = {25} onChange={(e) => setAmount(e.target.value)}></input>
            <select id="person-option" value = {personPaid} onChange={(e) => setPersonPaid(e.target.value)}>
                <option value ="" disabled>Who Paid?</option>
                <option value={"me"}>Alex</option>
                <option value={"brother"}>Adrian</option>
            </select>
            <button id ="split-button" onClick={() => setAmount(amount / 2)}>Split 50/50</button>
            <button id="submit-button" onClick={handleSubmit}>Submit</button>
        </div>
    </>)

    
}

export default AddTransaction;