class ApplicationError extends Error{ statusCode = 400; errCode = 'APP_ERROR'; };
exports.ApplicationError = ApplicationError;

exports.AccountExistsException = class AccountExistsException extends ApplicationError{
    statusCode = 400;
    errCode = 'ACC_ALREADY_EXISTS';
    message = "This email is already in use. Did you want to login";
}
exports.InvalidLoginException = class InvalidLoginException extends ApplicationError{
    statusCode = 401;
    errCode = 'UNAUTHORIZED';
    message = "Error. Email and/or password is invalid";
}
exports.UserNotFoundException = class UserNotFoundException extends ApplicationError{
    statusCode = 404;
    errCode = 'USER_NOT_FOUND';
    message = "User not found";
}
exports.OperationNotAllowedException = class OperationNotAllowedException extends ApplicationError{
    statusCode = 403;
    errCode = 'OP_NOT_ALLOWED';
    message = "Error, you do not have the permission to perform this operation";
}
exports.NotMemberOfWorkspaceException = class NotMemberOfWorkspaceException extends ApplicationError{
    statusCode = 409;
    errCode = 'NOT_WKSPA_MEMBER';
    message = "Error. You are not a member of this workspace";
}
exports.NotWorkspaceAdminException = class NotWorkspaceAdminException extends ApplicationError{
    statusCode = 410;
    errCode = 'NOT_WKSPA_ADMIN';
    message = "You need to have admin priviledges in this workspace to perform this action";
}

exports.FundingSourceRequiredException = class FundingSourceRequired extends ApplicationError{
    statusCode = 411;
    errCode = 'NO_PAYMENT_METHOD';
    message = "You need to have at least one payment source before you can update your subscription";
}