const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const mongoose = require('mongoose');
require('dotenv').config()

module.exports = {
    addHouse: async (parent, args, { models, user }) => {
        if (!user) {
            throw new AuthenticationError('You must be signed in to add a house');
        }

        try {
            const newHouse = await models.House.create({
                title: args.title,
                description: args.description || "",
                price: args.price,
                location: args.location,
                houseType: args.houseType,
                images: args.images || "",
                owner: user.id
            });
            await models.User.findByIdAndUpdate(
                user.id,
                { $push: { listings: newHouse._id } }, // Add the house ID to the user's listings array
                { new: true }
            );

            return newHouse;
        } catch (err) {
            console.error('Error adding house:', err);
            throw new Error('Error adding house');
        }
    },

    deleteHouse: async (parent, { houseId }, { models, user }) => {

        if (!user) {
            throw new AuthenticationError('You must be signed in to delete a note');
        }
        console.log("done1")
        const house = await models.House.findById(houseId);

        console.log("done2")
        if (house && String(house.owner) !== user.id) {
            throw new ForbiddenError("You don't have permissions to delete the note");
        }

        try {
            await house.deleteOne();
            await models.User.findByIdAndUpdate(
                user.id,
                { $pull: { listings: houseId } }, // Remove the house ID from the user's listings array
                { new: true }
            );
            console.log("House removed successfully");
            return true;
        } catch (err) {
            console.error("Error removing the house:", err); return false;
        }
    },

    register: async (parent, { username, email, password, role }, { models }) => {
        const existingUser = await models.User.findOne({ email });
        if (existingUser) {
            throw new Error("User with this email already exists.");
        }
        email = email.trim().toLowerCase()

        const hashed = await bcrypt.hash(password, 10);

        try {
            //user is created
            const user = await models.User.create({
                username,
                email,
                password: hashed,
                role
            });

            // create and return the json web token
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,);

            //returns user info along with token
            return { username: user.username, email: user.email, role: user.role, id: user._id, token: token};
        } catch (err) {
            // if there's a problem creating the account, throw an error
            throw new Error(err);
        }
    },

    login: async (parent, { email, password }, { models }) => {
        if (email) { email = email.trim().toLowerCase(); }

        const user = await models.User.findOne({ email });

        if (!user) {
            throw new AuthenticationError('User not found');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new AuthenticationError('Invalid Password');
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        return { ...user._doc, id: user._id, token, };

    },

    bookHouse: async (parent, { houseId }, { user, models }) => {
        if (!user) {
            throw new AuthenticationError('You must be logged in to book a house');
        }

        try {
            // Check if the house is already booked
            const existingBooking = await models.Booking.findOne({ house: houseId });
            if (existingBooking) {
                throw new Error('House is already booked');
            }

            // Validate the house exists
            const house = await models.House.findById(houseId);
            if (!house) {
                throw new Error('House not found');
            }

            // Create a new booking
            const booking = new models.Booking({
                house: houseId,
                user: user.id,
                bookingDate: new Date(),
                status: 'confirmed'
            });

            const savedBooking = await booking.save();

            // Populate the booking with house and user details before returning
            const populatedBooking = await models.Booking.findById(savedBooking._id)
                .populate('house')
                .populate('user');

            return populatedBooking;
        } catch (error) {
            throw new Error(error.message);
        }
    },




}