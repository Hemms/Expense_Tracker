document.addEventListener('DOMContentLoaded', async () => {
    const transactionsTable = document.getElementById('transactionsTable');
    const message = document.getElementById('message');

    try {
        const response = await fetch('http://localhost:5000/api/expenses', {
            method: 'GET',
            headers: {
                'Authorization':`Bearer ${sessionStorage.getItem('token')}`
            }
        });

        const transactions = await response.json();

        if (response.ok) {
            transactions.forEach(transaction => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${new Date(transaction.transaction_date).toLocaleDateString()}</td>
                    <td>${transaction.category}</td>
                    <td>${transaction.amount}</td>
                    <td>${transaction.description}</td>
                    <td class="actions">
                        <button class="edit" onclick="editTransaction('${transaction.id}')">Edit</button>
                        <button class="delete" onclick="deleteTransaction('${transaction.id}')">Delete</button>
                    </td>
                `;

                transactionsTable.appendChild(row);
            });
        } else {
            message.textContent = transactions.message || 'Failed to load transactions.';
        }
    } catch (error) {
        message.textContent = 'Error: ' + error.message;
    }
});

async function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        try {
            const response = await fetch(`http://localhost:5000/api/expenses/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                location.reload(); // Reload the page to reflect changes
            } else {
                alert('Failed to delete the transaction.');
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}
function editTransaction(id) {
    window.location.href = `/client/add.html?edit=true&id=${id}`;
}