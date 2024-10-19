document.addEventListener('DOMContentLoaded', async () => {
    const historyTable = document.getElementById('historyTable').querySelector('tbody');
    const message = document.getElementById('message');

    try {
        const response = await fetch('http://localhost:5000/api/transactions/history', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            }
        });

        const rawResponse = await response.text();
        console.log('Raw response:', rawResponse);

        let history;
        try {
            history = JSON.parse(rawResponse);
        } catch (error) {
            throw new Error('Invalid JSON response');
        }

        // Check if response is okay and process the data
        if (response.ok) {
            history.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>${transaction.category}</td>
                    <td>${transaction.amount}</td>
                    <td>${transaction.description}</td>
                `;
                historyTable.appendChild(row);
            });
        } else {
            message.textContent = history.message || 'Failed to load transaction history.';
        }
    } catch (error) {
        console.error('Error:', error);
        message.textContent = 'Error: ' + error.message;
    }

    document.getElementById('downloadCSV').addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add table headers
        const headers = Array.from(document.querySelectorAll('#historyTable thead th')).map(th => th.textContent).join(',');
        csvContent += headers + "\r\n";

        // Add table rows
        Array.from(document.querySelectorAll('#historyTable tbody tr')).forEach(row => {
            const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent).join(',');
            csvContent += rowData + "\r\n";
        });

        // Create a link to download the CSV
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'transaction_history.csv');
        document.body.appendChild(link);

        // initiate the download
        link.click();
    });

    // PDF Download using jsPDF
    document.getElementById('downloadPDF').addEventListener('click', () => {
        // Ensure jsPDF is loaded correctly
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            alert('jsPDF is not loaded.');
            return;
        }
    
        const doc = new jsPDF();
    
        // Add title
        doc.text("Transaction History", 10, 10);
    
        let yPosition = 20;
    
        // Get table headers
        doc.text("Date | Category | Amount | Description", 10, yPosition);
        yPosition += 10;
    
        // Get table rows
        document.querySelectorAll('#historyTable tbody tr').forEach((row) => {
            const columns = Array.from(row.querySelectorAll('td')).map(td => td.textContent);
            doc.text(columns.join(' | '), 10, yPosition);
            yPosition += 10;
        });
    
        // Save the PDF
        doc.save('transaction_history.pdf');
    });
    


});