import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'

const httpLink = createHttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL || '/graphql',
})

// Attach JWT token to every request
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('access_token')
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    }
})

// Global error handler
const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message }) => {
            console.error(`[GraphQL error]: ${message}`)
            if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('not authenticated')) {
                localStorage.removeItem('access_token')
                localStorage.removeItem('user')
                window.location.href = '/login'
            }
        })
    }
    if (networkError) {
        console.error(`[Network error]: ${networkError}`)
    }
})

export const apolloClient = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: { fetchPolicy: 'cache-and-network' },
    },
})
