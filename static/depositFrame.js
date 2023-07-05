const testgrapql = async () => {
    const graphqlEndpoint = '/graphql';

    const query = `
      query {
        getAccountGrphql {
          id
          accountNumber
          accountName
          status
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
      console.log(data)

          function filterData(searchValue) {
            return data.data.getAccountGrphql.filter(item => {
                const accountName = item.accountName.toLowerCase();
                const accountNumber = item.accountNumber.toLowerCase();
                // const status = item.status.toLowerCase();
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
                const status = document.createElement("td");
                status.textContent = item.status;
                
                

                tr.appendChild(id);
                tr.appendChild(accountNumber);
                tr.appendChild(accountName);
                tr.appendChild(status);
              
                
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
  
  
//   this is for autocomplete of account type
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
  
  //   this is for autocomplete of account type
  $(document).ready(function() {
    $("#personal_info").autocomplete({
      source: function(request, response) {
        const searchPersonalInfo = $("#personal_info").val(); // Get the value of the input field
        const getPersonalInfo = `
          query {
            getPersonalInfoGraphql(searchTerm: "${searchPersonalInfo}") {
                firstName
            }
          }
        `;
  
        $.ajax({
          url: "/graphql",
          method: "POST",
          data: JSON.stringify({ query: getPersonalInfo }),
          contentType: "application/json",
          success: function(data) {
            const fullName = data.data.getPersonalInfoGraphql.map(item => item.firstName);
            response(fullName);
            console.log(data);
          },
          error: function(xhr, status, error) {
            console.error("Request failed:", error);
          }
        });
      }
    });
  });
  
  
// this is to insert type of account
const insertTypeofAccount = async () => {
  var accountTypeCode = document.getElementById('accountTypeCode').value;
  var typeOfAccount = document.getElementById('typeOfAccount').value;
  var typeOfDeposit = document.getElementById('typeOfDeposit').value;
  const graphqlEndpoint = '/graphql';

  const mutation = `
    mutation {
      insertAccountTypeGraphql(
        accountTypeCode: "${accountTypeCode}",
        typeOfAccount: "${typeOfAccount}",
        typeOfDeposit: "${typeOfDeposit}"
      )
    }
  `;

  try {
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation }),
    });

    const responseData = await response.json();
    console.log(responseData)
    if (response.ok && !responseData.hasOwnProperty('data')) {
      window.alert("Your data has been saved");
      
    } else {
      const errorMessage = responseData.data.insertAccountTypeGraphql || "Failed to update access tags";
      throw new Error(errorMessage);
    }
  } catch (error) {
    window.alert("Message: " + error.message);
    console.log(error);
  }
};

const SaveAccountType = document.querySelector('#SaveAccountType');
SaveAccountType.addEventListener('click', insertTypeofAccount);



  
  
  
  
  