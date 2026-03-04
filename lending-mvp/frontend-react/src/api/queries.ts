// This file is deprecated. Please use the new native fetch API clients.
// Migration guide:
// - Customers: Use @/api/customers.ts
// - Users: Use @/api/users.ts  
// - Loans: Use @/api/loans.ts
// - Branches: Use @/api/client.ts (getBranches)
//
// To migrate a page:
// 1. Replace Apollo useQuery/useMutation with fetch() calls
// 2. Use the new API clients in @/api/
// 3. Remove Apollo Client imports
//
// Example migration for a simple query:
// OLD (Apollo):
//   const { data, loading, error } = useQuery(GET_CUSTOMERS)
//   
// NEW (Native fetch):
//   const [data, setData] = useState(null)
//   useEffect(() => {
//     getCustomers().then(setData).catch(console.error)
//   }, [])
