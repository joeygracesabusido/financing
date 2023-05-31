const login = async() => {
    var username = document.querySelector('#username').value
    var password = document.querySelector('#password').value
    let alert;

    const search_url = `/api-login/?username1=${username}&password1=${password}`;


    const responce = await fetch(search_url)
    const data = await responce.json();
    if (responce.status === 200){
       
        document.querySelector('#alert').innerHTML = 'Login Successful';
        document.querySelector('#alert').classList.remove('alert-danger');
        document.querySelector('#alert').classList.add('alert-success');
        
    }else{
        document.querySelector('#alert').innerHTML = 'Invalid Credentials';
        document.querySelector('#alert').classList.remove('alert-success');
        document.querySelector('#alert').classList.add('alert-danger');
    }
};

var loginCredential = document.querySelector('#BtnLogin');
loginCredential.addEventListener("click", function() {
    login();
});