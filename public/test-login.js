// Test login and navigate to books page 4
async function testLogin() {
    try {
        // First login
        const loginResponse = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'xyz@gmail.com',
                password: '123456'
            })
        });
        
        console.log('Login response:', loginResponse.status);
        
        if (loginResponse.ok) {
            // Then navigate to books page 4
            window.location.href = '/books?page=4';
        } else {
            console.error('Login failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function
testLogin();
