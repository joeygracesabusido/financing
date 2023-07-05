// var underlineButton = document.querySelector('#depositor-list');
// underlineButton.addEventListener("click", function(event) {
//   event.preventDefault();
//   // Add your button functionality here
// });







               
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




          