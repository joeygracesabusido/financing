$(document).ready(function() {
    $('#login-form').submit(function(e) {
        e.preventDefault();

        var username = $('#username').val();
        var password = $('#password').val();
        $('#alert').addClass('hidden').text('');

        $.ajax({
            url: '/api-login/',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: function(data) {
                if (data && data.accessToken) {
                    // Save token
                    localStorage.setItem('accessToken', data.accessToken);

                    // Debug: confirm it's saved
                    console.log('LOGIN SUCCESS - Token saved to localStorage:');
                    console.log('→ First 40 chars:', data.accessToken.substring(0, 40) + '...');
                    console.log('→ Current localStorage value right after save:', 
                                localStorage.getItem('accessToken')?.substring(0, 40) + '...' || 'NOT FOUND YET');

                    // Small delay to ensure storage is flushed before redirect
                    setTimeout(() => {
                        console.log('Redirecting to dashboard.html now');
                        window.location.href = 'dashboard.html';
                    }, 300); // 300ms is usually enough

                } else {
                    $('#alert').removeClass('hidden').text('Login response missing accessToken');
                }
            },
            error: function(xhr) {
                var msg = 'Login failed. Please try again.';
                if (xhr.responseJSON && xhr.responseJSON.detail) {
                    msg = xhr.responseJSON.detail;
                } else if (xhr.status === 401) {
                    msg = 'Incorrect username or password.';
                } else if (xhr.status === 400) {
                    msg = 'Invalid request. Please check your input.';
                }
                $('#alert').removeClass('hidden').text(msg);
            }
        });
    });
});