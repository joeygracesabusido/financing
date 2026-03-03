import { createClient, InMemoryCache, HttpLink } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { setContext } from '@apollo/client/link/context'

// Use REST API with HTTP link
const httpLink = new HttpLink({
    uri: '/api',
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

const errorLink = onError(({ networkError }) => {
    if (networkError) {
        console.error(`[Network error]: ${networkError}`)
        if (networkError.message.toLowerCase().includes('unauthorized') || 
            networkError.message.toLowerCase().includes('not authenticated')) {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
        }
    }
})

export const apolloClient = createClient({
    link: [errorLink, authLink, httpLink],
    cache: new InMemoryCache(),
    defaultOptions: {
        watchQuery: { fetchPolicy: 'cache-and-network' },
    },
})
