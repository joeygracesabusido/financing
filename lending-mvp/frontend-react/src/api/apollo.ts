import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'

// Use Apollo Client's createHttpLink for REST API
const httpLink = createHttpLink({
    uri: '/graphql',
    credentials: 'include',
})

const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('access_token')
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    }
})

export const apolloClient = new ApolloClient({
    link: [httpLink, authLink],
    cache: new InMemoryCache(),
    defaultOptions: {
        query: { fetchPolicy: 'cache-first' },
    },
})
