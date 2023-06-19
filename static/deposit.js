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
        id
        accountNumber
        accountName
        
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

        function filterData(searchValue) {
          return data.data.getAccountGrphql.filter(item => {
              const accountName = item.accountName.toLowerCase();
              const accountNumber = item.accountNumber.toLowerCase();
              
              return accountName.includes(searchValue) || accountNumber.includes(searchValue);
          });
      }

      function displayData(filteredData) {
          const tbody = document.querySelector("#table_body_test");
          tbody.innerHTML = "";
          filteredData.forEach(item => {
              const tr = document.createElement("tr");
              const accountName = document.createElement("td");
              accountName.textContent = item.accountName;
              const accountNumber = document.createElement("td");
              accountNumber.textContent = item.accountNumber;
              const id = document.createElement("td");
              id.textContent = item.id;
              
              

              tr.appendChild(id);
              tr.appendChild(accountNumber);
              tr.appendChild(accountName);
             
             
              
              tbody.appendChild(tr);
          });
          
      }

      const searchInput = document.querySelector("#autoSearch_account");
      searchInput.addEventListener("input", event => {
          const searchValue = event.target.value.trim().toLowerCase();
          const filteredData = filterData(searchValue);
          displayData(filteredData);
      });

        } catch (error) {
        // Handle any errors
        console.error(error);
      }
      

};

  


//     // Handle the response data
//     console.log(data);
//       if (response.status === 200){
//         let tableData="";
//         data.data.getAccountGrphql.map((values)=>{
//             tableData+= ` <tr>
                        
//                         <td>${values.id}</td>
//                         <td>${values.accountNumber}</td>
//                         <td>${values.accountName}</td>
                        
//                     </tr>`;
//         });
//         document.getElementById("table_body_test").innerHTML=tableData;

//     }else if (response.status === 401){
//         window.alert("Unauthorized Credentials Please Log in")
//     }
//   } catch (error) {
//     // Handle any errors
//     console.error(error);
//   }
  

// };





const btnAccountList = document.querySelector('#SearchActive');
btnAccountList.addEventListener('click', testgrapql);


const btnAccountListModal = document.querySelector('#active-account');
btnAccountListModal.addEventListener('click', testgrapql);


