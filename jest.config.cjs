module.exports = {
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    testEnvironment: 'jsdom',
    setupFiles: ['<rootDir>/tests/setup.js'],
};
