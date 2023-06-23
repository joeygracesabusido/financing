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

  






const btnAccountList = document.querySelector('#SearchActive');
btnAccountList.addEventListener('click', testgrapql);


const btnAccountListModal = document.querySelector('#active-account');
btnAccountListModal.addEventListener('click', testgrapql);



               
// this is autocomplete in Branch

// $(document).ready(function() {
  
//   console.log(searchBranch)
//   const searchBranch =  $("#branch").value();
//   const getBranchNamesQuery = `
//     query {
//       searchBranch {searchTerm:"${searchBranch}"}
//       branchName
//       }
//     }
//   `;

//   $("#branch").autocomplete({
//     source: function(request, response) {
//       $.ajax({
//         url: "/graphql",
//         method: "POST",
//         data: JSON.stringify({ query: getBranchNamesQuery }),
//         contentType: "application/json",
        
//         success: function(data) {
//           const branchNames = data.data.searchBranch.map(item => item.branchName);
//           response(branchNames);
//           console.log(data);
//         },
//         error: function(xhr, status, error) {
//           console.error("Request failed:", error);
//         }
//       });
//     }
//   });
// });

$(document).ready(function() {
  $("#branch").autocomplete({
    source: function(request, response) {
      const searchBranch = $("#branch").val(); // Get the value of the input field
      const getBranchNamesQuery = `
        query {
          searchBranch(searchTerm: "${searchBranch}") {
            branchName
          }
        }
      `;

      $.ajax({
        url: "/graphql",
        method: "POST",
        data: JSON.stringify({ query: getBranchNamesQuery }),
        contentType: "application/json",
        success: function(data) {
          const branchNames = data.data.searchBranch.map(item => item.branchName);
          response(branchNames);
          console.log(data);
        },
        error: function(xhr, status, error) {
          console.error("Request failed:", error);
        }
      });
    }
  });
});



$(document).ready(function() {
  $("#account_type").autocomplete({
    source: function(request, response) {
      const searchBranch = $("#account_type").val(); // Get the value of the input field
      const getBranchNamesQuery = `
        query {
          searchAccounttype(searchTerm: "${searchBranch}") {
            typeOfDeposit
          }
        }
      `;

      $.ajax({
        url: "/graphql",
        method: "POST",
        data: JSON.stringify({ query: getBranchNamesQuery }),
        contentType: "application/json",
        success: function(data) {
          const accountType = data.data.searchAccounttype.map(item => item.typeOfDeposit);
          response(accountType);
          console.log(data);
        },
        error: function(xhr, status, error) {
          console.error("Request failed:", error);
        }
      });
    }
  });
});




          