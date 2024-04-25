import { registerUser } from './registerUser'
// TODO: DEPRECATION
// import { login } from './login'

// TODO: DEPRECATION - POTENTIAL
import { validateToken } from './validateToken'
exports.registerUser = registerUser
// exports.login = login
exports.validateToken = validateToken

// TODO: Revisit following links: 
// https://firebase.google.com/docs/functions/organize-functions?gen=2nd#index.js
// https://medium.com/@george43g/organise-firebase-functions-part-1-optimize-cold-start-time-cd36f76d2133
// Try to split the functions and code in microservices like features
