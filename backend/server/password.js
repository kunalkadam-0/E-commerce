const bcrypt = require('bcrypt');

async function getHashedPassword() {
    const plainTextPassword = 'Admin123'; // Or whatever password you choose
    const saltRounds = 10;

    try {
        const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
        console.log('Hashed Password:', hashedPassword);
        return hashedPassword;
    } catch (error) {
        console.error('Error hashing password:', error);
        return null;
    }
}

getHashedPassword();