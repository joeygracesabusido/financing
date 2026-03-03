import { createClient } from '@apollo/client'
import { onError } from '@apollo/client/link/error'
import { RESTLink } from '@apollo/client/link/rest'

// Use REST API instead of GraphQL
const restLink = new RESTLink({
    uri: '/api',
})

const authLink = ({ headers, forward }) => {
    const token = localStorage.getItem('access_token')
    const newHeaders = { ...headers }
    if (token) {
        newHeaders.authorization = `Bearer ${token}`
    }
    return forward({ ...this.context, headers: newHeaders })
}

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
    link: [errorLink, authLink, restLink],
    cache: new (require('@apollo/client').InMemoryCache)(),
    defaultOptions: {
        watchQuery: { fetchPolicy: 'cache-and-network' },
    },
})
