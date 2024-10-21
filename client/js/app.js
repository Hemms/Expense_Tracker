let sessionId;
document.addEventListener('DOMContentLoaded', () => {
    const token = sessionStorage.getItem('token');

    if (!token) {
        window.location.replace('index.html');
    } else {
        fetchExpenses();
    }

    function fetchExpenses() {
        fetch('http://localhost:5000/api/expenses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(expenses => {
            displayExpenses(expenses);
        })
        .catch(error => {
            console.error('Error fetching expenses:', error);
        });
    }

    function displayExpenses(expenses) {
        const transactionList = document.getElementById('transactionList');
        if (transactionList) {
            transactionList.innerHTML = ''; // Clear existing transactions
            let listItem = '';
            expenses.forEach(expense => {
                listItem += `<tr>
                    <td>${expense?.category}</td>
                    <td>${expense?.amount}</td>
                    <td>${expense?._date}</td>
                    <td>${expense?.description}</td>
                </tr>`;
            });
            transactionList.innerHTML = listItem;
        }
    }
});