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
                // Assuming the backend returns user data, including a token
                // Store token if needed, e.g., in localStorage
                if (data.access_token) {
                    localStorage.setItem('accessToken', data.access_token);
                }
                window.location.href = 'dashboard.html';
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