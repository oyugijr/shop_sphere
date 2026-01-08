const sdk = require('@keverdjs/fraud-sdk');
console.log('SDK exports:', Object.keys(sdk));
console.log('Has Keverd:', !!sdk.Keverd);
console.log('Has keverd:', !!sdk.keverd);
console.log('SDK:', sdk);
