// var underlineButton = document.querySelector('#depositor-list');
// underlineButton.addEventListener("click", function(event) {
//   event.preventDefault();
//   // Add your button functionality here
// });



const testgrapql = async () => {
  const graphqlEndpoint = '/graphql';

  const query = `
    query {
      getAccountGrphql {
        accountName
        accountNumber
        id
      }
    }
  `;

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    // Handle the response data
    console.log(data);
      if (response.status === 200){
        let tableData="";
        data.data.getAccountGrphql.map((values)=>{
            tableData+= ` <tr>
                        
                        <td>${values.id}</td>
                        <td>${values.accountNumber}</td>
                        <td>${values.accountName}</td>
                        
                    </tr>`;
        });
        document.getElementById("table_body_test").innerHTML=tableData;

    }else if (response.status === 401){
        window.alert("Unauthorized Credentials Please Log in")
    }
  } catch (error) {
    // Handle any errors
    console.error(error);
  }
  

};





const btnAccountList = document.querySelector('#SearchActive');
btnAccountList.addEventListener('click', testgrapql);


const btnAccountListModal = document.querySelector('#active-account');
btnAccountListModal.addEventListener('click', testgrapql);


