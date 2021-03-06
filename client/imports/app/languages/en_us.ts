import * as _ from 'lodash';
import * as moment from 'moment';

export const en_us = {
    "TITLE_LONG": "English",
    "TITLE_SHORT": "en-us",
    "HOME_PAGE": {
        "TITLE": "Quick View",
        "NEW_USER": {
            "HEADER": "New User Registered",
            "HELP": "A new user has registered. If you can authenticate the user, press unlock, so the user is allowed to use the system. Hint: You will be stored as the authenticator.",
            "USER": "User",
            "EMAIL": "E-Mail",
            "PHONE": "Phone",
            "UNLOCK": "Unlock"
        },
        "MESSAGE": {
            "NEW_USER": {
                "AUTHENTICATOR": "Authenticator",
                "USER": "New User",
                "TITLE": "New User"
            },
            "MESSAGE": {
                "NEW_TITLE": "New Global Message",
                "TITLE": "Global Message"
            }
        },
        "DELETE": {
            "TITLE": "Delete?",
            "SUB_TITLE": "Do you really want to delete the global message?",
            "YES": "Yes",
            "NO": "No"
        }
    },
    "LOGIN_PAGE": {
        "TITLE": "Login",
    },
    "LOGIN": {
        "EMAIL_OR_USERNAME": "E-Mail or Username",
        "PASSWORD": "Password",
        "LOG_IN": "Log In",
        "FORGOT_PASSWORD": "Forgot Password",
        "RESEND_EMAIL": "Resend Verification E-Mail",
        "PASSWORD_RESET_REQUEST": {
            "TITLE": "Request Password Reset",
            "MESSAGE": "Shall a password reset link be sent via E-Mail?",
            "EMAIL_OR_USERNAME": "E-Mail or Username",
            "OK": "Ok",
            "CANCEL": "Cancel"
        },
        "PASSWORD_RESET_SUCCESS": {
            "TITLE": "Password Reset Requested",
            "MESSAGE": "Password Reset Link was sent by E-Mail",
            "OK": "Ok"
        },
        "RESEND_EMAIL_REQUEST": {
            "TITLE": "No Verified E-Mail",
            "MESSAGE": "There was no verified E-Mail for this user. Resend verification mail?",
            "EMAIL_OR_USERNAME": "E-Mail oder Benutzername",
            "EMAIL": "E-Mail",
            "OK": "Ok",
            "CANCEL": "Abbruch"
        },
        "RESEND_EMAIL_SUCCESS": {
            "TITLE": "E-Mail sent",
            "MESSAGE": "E-Mail sent",
            "OK": "Ok"
        },
    },
    "ITEM_CARDS_PAGE": {
        "TITLE": "Items",
        "FILTER": "Filter"
    },
    "ITEM_LIST_PAGE": {
        "TITLE": "Items",
        "FILTER": "Filter"
    },
    "ITEMS_IMPORTER_PAGE": {
        "TITLE": "Import Items",
    },
    "ITEM": {
        "FILTER": "Filter",
        "EXTERNAL_ID": "External ID",
        "NAME": "Name",
        "DESCRIPTION": "Description",
        "PURCHASE_DATE": "Purchase Date",
        "LAST_SERVICE": "Last Service",
        "CONDITION": "Condition",
        "CONDITION_COMMENT": "Condition Comment",
        "STATE": "State",
        "ITEM_GROUP": "Group",
        "TAGS": "Tags",
        "PICTURE": "Picture",
        "STATES": {
            "PUBLIC": "Public",
            "HIDDEN": "Hidden"
        },
        "CONDITIONS": {
            "GOOD": "Good",
            "BAD": "Bad",
            "BROKEN": "Broken"
        },
        "FILTER_TAGS": {
            "NAME": "name",
            "DESCRIPTION": "description",
            "TAG": "tag",
            "EXTERNAL_ID": "externalid",
            "SELECTED": "selected\0reserved\0reservated"
        }
    },
    "ITEM_CARD": {
        "EDITOR": "Edit",
        "SAVE": {
            "TITLE": "Save",
            "SUBTITLE": "Save Entry",
            "COMMENT_LABEL": "Change Comment",
            "SAVE": "Save",
            "CANCEL": "Cancel",
            "SUCCESS": "Everything saved"
        },
        "DELETE": {
            "TITLE": (item) => `Delete ${item.name}?`,
            "SUBTITLE": (item) => `Really delete ${item.name}?`,
            "YES": "Delete",
            "NO": "Cancel",
            "SUCCESS": "Item deleted"
        },
        "CHANGE": {
            "TITLE": "Foreign Changes",
            "MESSAGE": (otherItem) => `There are changes from another source. Override your changes by received changes?`,
            "ACCEPT": "Override",
            "CANCEL": "Keep"
        }
    },
    "RESERVATION": {
        "FILTER": "Filter",

        "TYPE": "Type of Journey",
        "NAME": "Name",
        "START": "Start",
        "END": "End",
        "CONTACT": "Contact",
        "ITEMS": "Items",

        "USER": "User",
        "GROUP": "Group",

        "TYPES": {
            "GROUP": "Group",
            "PRIVATE": "Private"
        }
    },
    "RESERVATION_PAGE": {
        "TITLE": (data) => `Reservation - ${data.name}`,
        "NOT_AVAILABLE": "Not Available",
        "SOME_NOT_AVAILABLE": (data) => `${data.total - data.available}/${data.total} not available`,
        "SOME_REMOVED": (data) => `${data.total}/${data.selected + data.total} removed`,
        "REMOVED": "Removed",
        "ITEMS_REMOVED": (data) => `${_.join(data.items, ', ')} removed from reservation (already reserved).`,
        "LEAVE": {
            "TITLE": "Unsaved changes",
            "SUB_TITLE": "Do you want to save before leaving?",
            "CANCEL": "Back",
            "LEAVE": "Leave",
            "SAVE": "Save"
        },
        "SAVED": (reservation) => `Saved reservation ${reservation.name}`
    },
    "RESERVATIONS_PAGE": {
        "TITLE": "Reservations"
    },
    "RESERVATION_CARD": {
        "HEADER": "Reservation",
        "DESCRIPTION": (reservation) => `${reservation.type.text}. From ${moment(reservation.start).format('L')} until ${moment(reservation.end).format('L')}.`,
        "DELETE": {
            "TITLE": (data) => `Delete ${data.name}?`,
            "SUB_TITLE": (data) => `Do you really want to delete reservation ${data.name}?`,
            "YES": "Yes",
            "NO": "No"
        }
    },
    "USER": {
        "FILTER": "Filter",

        "USERNAME": "Username",
        "EMAIL": "E-Mail",
        "PASSWORD": "Password",
        "PASSWORD_REPEAT": "Repeat Password",
        "FULL_NAME": "Full Name",
        "PHONE": "Phone",
        "STATE": "State",
        "ROLES": "Roles",
        "PICTURE": "Picture",

        "STATES": {
            "NORMAL": "Normal",
            "LOCKED": "Locked",
            "DISABLED": "Disabled",
            "DELETED": "Deleted"
        },
        "ROLES_VALUES": {
            "ADMIN": "Administrator",
            "MANAGER": "Item Manager"
        }
    },
    "SIGNUP_PAGE": {
        "TITLE": "Sign Up",
        "SIGN_UP": "Sign Up",
        "SUCCESS": {
            "TITLE": "Registered Successfully",
            "MESSAGE": "You have registered successfully. Within the next few minutes you should receive a verification e-mail. You can login as soon as you have been verified by another user."
        },
        "ERROR": {
            "PASSWORD_MINLENGTH": "Password must be at least 6 characters",
            "PASSWORD_MATCH": "Passwords do not match",
        }
    },
    "USERS_PAGE": {
        "TITLE": "Users",
    },
    "USER_MODAL": {
        "TITLE": (data) => `${data.name}`,
        "PERSONAL": "Personal",
        "EMAIL_ADD": "Add E-Mail",
        "PASSWORD_OLD": "Current Password",
        "PASSWORD_NEW": "New Password",
        "PASSWORD_NEW_REPEAT": "Repeat New Password",
        "PASSWORD_RANDOM": "Random Password",
        "ERROR": {
            "PASSWORD_MINLENGTH": "Password must be at least 6 characters",
            "PASSWORD_MATCH": "Passwords do not match",
        }
    },
    "CALENDAR_ITEMS_PAGE": {
        "FILTER": "Filter",
        "TITLE": "Calendar"
    },
    "VERIFY_EMAIL_PAGE": {
        "TITLE": "Verify E-Mail",
        "VERIFY": "Verify E-Mail",
        "SUCCESS": {
            "TITLE": "E-Mail Verified",
            "MESSAGE": "E-Mail successfully verified",
            "OK": "Ok"
        }
    },
    "RESET_PASSWORD_PAGE": {
        "TITLE": "Change Password",
        "PASSWORD": "New Password",
        "PASSWORD_REPEAT": "Repeat New Password",
        "SAVE": "Save Password",
        "SUCCESS": {
            "TITLE": "Password Changed",
            "MESSAGE": "Password successfully changed",
            "OK": "Ok"
        },
        "ERROR": {
            "PASSWORD_MINLENGTH": "Password must be at least 6 characters",
            "PASSWORD_MATCH": "Passwords do not match",
        }
    },
    "LANGUAGE_SELECT": {
        "TITLE": "Language",
        "OK": "Ok",
        "CANCEL": "Cancel"
    },
    "SIDEMENU": {
        "USERS": "Users",
        "LOGOUT": "Log Out",
        "LANGUAGE": "Language",
        "IMPORT_ITEMS": "Import Items",
        "ITEMS_LIST": "Items",
        "ITEMS_CALENDAR": "Calendar"
    },
    "TABS": {
        "HOME": "Quick View",
        "RESERVATIONS": "Reservations",
        "LOGIN": "Login",
        "SIGNUP": "Sign Up"
    },
    "ITEM_STATE": {
        "TEXT": (data) => (data.comment ? data.comment + "<br>\n" : "") + (_.join(data.texts, ", <br>\n") || ""),
        "LAST_SERVICE": (data) => `Service at ${moment(data.lastService).toLocaleString()}`,
        "CONDITION_CONDITION_COMMENT": (data) => `Condition: ${data.conditionOption.text} (${data.conditionComment})`,
        "CONDITION": (data) => `Condition: ${data.conditionOption.text}`,
        "CONDITION_COMMENT": (data) => `Condition Comment: ${data.conditionComment}`,
        "NAME": (data) => `New Name: ${data.name}`,
        "DESCRIPTION": (data) => `New Description: ${data.description}`,
        "EXTERNAL_ID": (data) => `New External Id: ${data.externalId}`,
        "TAGS": (data) => `New Tags: ${_.join(data.tags, ', ')}`,
        "PICTURE": (data) => `New Picture`,
        "STATE": (data) => `New State: ${data.stateOption.text}`,
        "RESERVATION_NAME": (data) => `Reservation ${data.user ? data.user.fullName : ""} - ${data.type.text} - ${data.reservation.name}`
    },
    "SELECT": {
        "OK": "Ok",
        "CANCEL": "Cancel"
    },
    "ERROR": {
        "GENERAL": (message) => `${message.reason}`,
        "Incorrect password": "Incorrect Password",
        "User not found": "User not found",
        "Username already exists.": "Username already exists",
        "Email already exists.": "Email already exists",
        "user-locked": "You must first be unlocked by another user",
        "user-disabled": "You were disabled",
        "user-email-not-verified": "You must first verify your E-Mail",
        "invalid-token": "Invalid token or token expired",
        "no-valid-email": "There is no verified E-Mail address registered"
    }
};
