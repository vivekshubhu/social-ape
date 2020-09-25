const isEmpty = (string) => {
    if (string.trim() === '') return true;
    else return false;
}

const isValidEmail = (email) => {
    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    else return false;
}


exports.signUpValidate = (data) => {
    
    let errors = {};

    if (isEmpty(data.email)) {
        errors.email = "must not be empty";
    } else if (!isValidEmail(data.email)) {
        errors.email = "must be valid email address";
    }

    if (isEmpty(data.password)) errors.password = "must not be empty";
    if (data.password !== data.confirmPassword) errors.confirmPassword = "passwords must match";
    if (isEmpty(data.handle)) errors.handle = "must not be empty";

    return {
        errors,
        valid:Object.keys(errors).length == 0 ? true : false
    }
}


exports.signinValidate = (email, password) => {
    
    let errors = {};
    if (isEmpty(email)) errors.email = "must not be empty";
    
    if (isEmpty(password)) errors.password = "must not be empty";

    return {
        errors,
        valid:Object.keys(errors).length == 0 ? true : false
    }

}

exports.reduceUserDetails = (data) => {
    let {bio, website, location} = {...data};

    let userDetails = {};
    if(!isEmpty(bio.trim())) userDetails.bio = bio;

    if(!isEmpty(location.trim())) userDetails.location = location;

    if(!isEmpty(website.trim())){
        if(website.trim().substring(0, 4) !== "http"){
            userDetails.website = `http://${website.trim()}`
        }else userDetails = website.trim();
    }
    return userDetails;
}