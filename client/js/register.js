document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerform');
    const registerMsg = document.getElementById('register-msg');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('http://localhost:5000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, username, password })
                });

                // Handle empty response or non-JSON content
                let data;
                try {
                    data = await response.json();
                } catch (err) {
                    data = {};
                }

                if (!response.ok) {
                    registerMsg.textContent = data.message || 'Registration failed, please try again';
                } else {
                    registerMsg.textContent = 'Registration successful 😊';

                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }

            } catch (err) {
                registerMsg.textContent = 'An error occurred: ' + err.message;
            }
        });
    }
});