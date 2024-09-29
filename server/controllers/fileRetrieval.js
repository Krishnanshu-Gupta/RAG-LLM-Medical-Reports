const File = require('../models/file');

async function getFilesByUserId(userId) {
    try {
        // Query the File model to find all files uploaded by the specified user ID
        const files = await File.find({ userId: userId });
        return files;
    } catch (error) {
        // Handle any errors
        console.error("Error fetching files:", error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

module.exports = { getFilesByUserId };