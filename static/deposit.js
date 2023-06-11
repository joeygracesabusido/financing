var underlineButton = document.querySelector('#depositorsList');
underlineButton.addEventListener("click", function(event) {
  event.preventDefault();
  // Add your button functionality here
});



const testgrapql = async() => {
  const graphqlEndpoint = '/graphql';

const query = `
query {
  roles {
    id 
    roles
    approvalAmount
    dateCredited
  }
}
`;

fetch(graphqlEndpoint, {
method: 'POST',
headers: {
  'Content-Type': 'application/json',
},
body: JSON.stringify({ query }),
})
.then(response => response.json())
.then(data => {
  // Handle the response data
  console.log(data);
})
.catch(error => {
  // Handle any errors
  console.error(error);
});
}


var btnInsertTons = document.querySelector('#testGRaph');
btnInsertTons.addEventListener("click", testgrapql);