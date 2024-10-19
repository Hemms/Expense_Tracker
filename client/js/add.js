document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('transactionForm');
    const message = document.getElementById('message');
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('id'); // Check if the page is being used for editing




    if (transactionId) {
        try {
            const response = await fetch(`http://localhost:5000/api/expenses/${transactionId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            const transaction = await response.json();

            if (response.ok) {
                // Populate the form fields with the existing transaction data
                document.getElementById('amount').value = transaction.amount;
                document.getElementById('category').value = transaction.category;
                document.getElementById('date').value = new Date(transaction.transaction_date).toISOString().split('T')[0];
                document.getElementById('description').value = transaction.description;
            } else {
                message.textContent = 'Failed to load transaction details for editing.';
            }
        } catch (error) {
            message.textContent = 'Error: ' + error.message;
        }
    }

    // Handle form submission for both adding and editing
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const transaction_date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        try {
            let response;
            if (transactionId) {
                // If editing, send a PUT request
                response = await fetch(`http://localhost:5000/api/expenses/${transactionId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ amount, category, transaction_date, description })
                });
            } else {
                // If adding, send a POST request
                response = await fetch('http://localhost:5000/api/expenses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ amount, category, transaction_date, description })
                });
            }

            const result = await response.json();

            if (response.ok) {
                message.textContent = transactionId ? 'Transaction updated successfully!' : 'Expense added successfully!😉';
                form.reset();
                // Redirect to the view page or reload the page
                setTimeout(() => {
                    window.location.href = '/client/view.html'; 
                }, 2000);
            } else {
                message.textContent = result.message || 'Failed to submit transaction.';
            }
        } catch (error) {
            message.textContent = 'Error: ' + error.message;
        }
    });
});