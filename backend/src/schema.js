const {gql} = require('apollo-server-express')

module.exports = gql`
 type House { 
    id: ID! 
    title: String! 
    description: String 
    price: Float! 
    location: String! 
    houseType: String! 
    images: String 
    owner: ID! 
    createdAt: String! 
}

type User { 
    id: ID! 
    username: String! 
    email: String! 
    role: String!
    token: String 
    listings: [House!] 
} 
type Booking { 
    id: ID! 
    house: House! 
    user: User! 
    bookingDate: String! 
    status: String 
} 
type Query { 
    getHouses(location: String, priceRange: [Float!], houseType: String): [House!] 
    getHouseById(houseId: ID!): House 
    getUserListings(userId: ID!): [House!] 
    getBookedHouses: [Booking!]!
    getSoldHouses(userId: ID!): [Booking!]!
} 
type Mutation { 
    register(username: String!, email: String!, password: String!, role: String!): User 
    login(email: String!, password: String!): User 
    addHouse( 
        title: String!, 
        description: String, 
        price: Float!, 
        location: String!, 
        houseType: String!, 
        images: String 
    ): House 
    deleteHouse(houseId: ID!): Boolean 
    bookHouse(houseId: ID!): Booking 
} 
`;