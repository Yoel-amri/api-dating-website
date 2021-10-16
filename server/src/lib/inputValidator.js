function passwordValidator(password) {
    const passReg = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
    return passReg.test(password);
}

function emailValidator(email) {
    const emailReg = /^([a-zA-Z0-9.!#$%&’*+=?^_`{|}~-]{3,})@([a-zA-Z0-9]{3,})(?:\.[a-zA-Z]{2,})*$/;
    return emailReg.test(email)
}

function nameValidator(name) {
    const regex = /^[A-Za-z]{2,15}$/;
    return regex.test(name);
}

function tagValidator(name) {
    const regex = /^[A-Za-z]{3,25}$/;
    return regex.test(name);
}


function validateSignUpInput(input) {
    const errors = {
        firstname: nameValidator(input.firstname),
        lastname: nameValidator(input.lastname),
        username: nameValidator(input.username),
        email: emailValidator(input.email),
        password: passwordValidator(input.password),
        passwordConfirmation: passwordValidator(input.passwordConfirmation)
    };

    let errorsString = '';

    for (key in errors) {
        if (!errors[key])
            errorsString += `${key} Bad format,`
    }
    if (input.password !== input.passwordConfirmation)
        errorsString += 'Passwords do not match.'
    return errorsString;
}

function validateSignInInput(input) {
    const errors = {
        username: nameValidator(input.username),
        password: passwordValidator(input.password),
    };

    let errorsString = '';

    for (key in errors) {
        if (!errors[key])
            errorsString += `${key} Bad format,`
    }
    return errorsString;
}

function validateUpdateInput(input) {
    const errors = {
        firstname: input.firstname === undefined ? true : nameValidator(input.firstname),
        lastname: input.lastname === undefined ? true : nameValidator(input.lastname),
        username: input.username === undefined ? true : nameValidator(input.username),
        email: input.email === undefined ? true : emailValidator(input.email),
        password: input.password === undefined ? true : passwordValidator(input.password),
        passwordConfirmation: input.passwordValidator === undefined ? true : passwordValidator(input.password)
    };

    let errorsString = '';

    for (key in errors) {
        if (!errors[key])
            errorsString += `${key} Bad format,`
    }
    if (input.password !== input.passwordConfirmation)
        errorsString += 'Passwords do not match.'
    return errorsString;
}

function validateResetInput(input) {
    const errors = {
        username: nameValidator(input.username),
        password: passwordValidator(input.password),
        passwordConfirmation: passwordValidator(input.passwordConfirmation)
    };

    let errorsString = '';

    for (key in errors) {
        if (!errors[key])
            errorsString += `${key} Bad format,`
    }
    if (input.password !== input.passwordConfirmation)
        errorsString += 'Passwords do not match.'
    return errorsString;
}

module.exports = {
    tagValidator,
    validateSignUpInput,
    validateUpdateInput,
    validateSignInInput,
    validateResetInput,
    nameValidator
}