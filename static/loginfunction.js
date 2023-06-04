const login = async() => {
    var username = document.querySelector('#username').value
    var password = document.querySelector('#password').value
    let alert;

    const search_url = `/api-login/?username1=${username}&password1=${password}`;


    try {
        const responce = await fetch(search_url)
        const data = await responce.json();

        console.log(data)
        
        
        if (responce.status === 200){
        
            // document.querySelector('#alert').innerHTML = 'Login Successful';
            // document.querySelector('#alert').classList.remove('alert-danger');
            // document.querySelector('#alert').classList.add('alert-success');
            window.location.assign("/dashboard/")
        
        }else if (responce.status === 500) {
            
            document.querySelector('#alert').innerHTML = 'Incorrect Password';
            document.querySelector('#alert').classList.remove('alert-success');
            document.querySelector('#alert').classList.add('alert-danger');
        }else{
            document.querySelector('#alert').innerHTML = 'Incorrect Password';
            document.querySelector('#alert').classList.remove('alert-success');
            document.querySelector('#alert').classList.add('alert-danger');
        }
    }catch (error) {
        // console.log('Error:', error);
        document.querySelector('#alert').innerHTML = `No ${username} username in the Database`;
        document.querySelector('#alert').classList.add('alert-danger');
    }
    };

var loginCredential = document.querySelector('#BtnLogin');
loginCredential.addEventListener("click", function() {
    login();
});