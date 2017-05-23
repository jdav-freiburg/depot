import * as _ from 'lodash';
import * as moment from 'moment';

export const en_us = {
  "TITLE_LONG": "English",
  "TITLE_SHORT": "en-us",
  "HOME_PAGE": {
    "TITLE": "Home",
    "NEW_USER": {
      "HEADER": "New User Registered",
      "HELP": "A new user has registered. If you can authenticate the user, press unlock, so the user is allowed to use the system. Hint: You will be stored as the authenticator.",
      "USERNAME": "Username",
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
    }
  },
  "LOGIN_PAGE": {
    "TITLE": "Login",
    "EMAIL_OR_USERNAME": "E-Mail or Username",
    "PASSWORD": "Password",
    "LOG_IN": "Log In",
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
    "FILE": "Choose file...",
    "FILTER": "Filter",
    "EXTERNAL_ID": "External ID",
    "NAME": "Name",
    "DESCRIPTION": "Description",
    "PURCHASE_DATE": "Purchase Date",
    "LAST_SERVICE": "Last Service",
    "CONDITION": "Condition",
    "CONDITION_COMMENT": "Condition Comment",
    "STATUS": "Status",
    "ITEM_GROUP": "Group",
    "TAGS": "Tags"
  },
  "ITEM_CARD": {
    "EXTERNAL_ID": "External ID",
    "NAME": "Name",
    "DESCRIPTION": "Description",
    "PURCHASE_DATE": "Purchase Date",
    "LAST_SERVICE": "Last Service",
    "CONDITION": "Condition",
    "CONDITION_COMMENT": "Condition Comment",
    "STATUS": "Status",
    "ITEM_GROUP": "Group",
    "TAGS": "Tags",
    "SAVE": {
      "TITLE": "Save",
      "SUBTITLE": "Save Entry",
      "COMMENT_LABEL": "Change Comment",
      "SAVE": "Save",
      "CANCEL": "Cancel"
    },
    "DELETE": {
      "TITLE": (item) => `Delete ${item.name}?`,
      "SUBTITLE": (item) => `Really delete ${item.name}?`,
      "YES": "Delete",
      "NO": "Cancel"
    },
    "CHANGE": {
      "TITLE": "Foreign Changes",
      "MESSAGE": (otherItem) => `There are changes from another source. Override your changes by received changes?`,
      "ACCEPT": "Override",
      "CANCEL": "Keep"
    }
  },
  "RESERVATION_PAGE": {
    "TITLE": (data) => `Reservation - ${data.name}`,
    "TYPE": "Type",
    "NAME": "Name",
    "START": "Start",
    "END": "End",
    "CONTACT": "Contact",
    "ITEMS": "Items",
    "NOT_AVAILABLE": "Not Available",
    "REMOVED": "Removed",
    "ITEMS_REMOVED": (data) => `${_.join(data.items, ', ')} removed from reservation (already reserved).`,
    "LEAVE": {
      "TITLE": "Unsaved changes",
      "SUB_TITLE": "Do you want to save before leaving?",
      "CANCEL": "Back",
      "LEAVE": "Leave",
      "SAVE": "Save"
    },
    "FILTER": "Filter",
    "SAVED": (reservation) => `Saved reservation ${reservation.name}`
  },
  "RESERVATIONS_PAGE": {
    "TITLE": "Reservations",
    "FILTER": "Filter"
  },
  "SIGNUP_PAGE": {
    "TITLE": "Sign Up",
    "USERNAME": "Username",
    "EMAIL": "E-Mail",
    "PASSWORD": "Password",
    "PASSWORD_REPEAT": "Repeat Password",
    "FULL_NAME": "Full Name",
    "PHONE": "Phone",
    "SIGN_UP": "Sign Up",
    "ERROR": {
      "PASSWORD_MINLENGTH": "Password must be at least 6 characters",
      "PASSWORD_MATCH": "Passwords do not match",
    }
  },
  "USERS_PAGE": {
    "TITLE": "Users",
    "USERNAME": "Username",
    "EMAIL": "E-Mail",
    "FULL_NAME": "Full Name",
    "PHONE": "Phone",
    "STATUS": "Status",
    "ROLES": "Roles",
    "FILTER": "Filter"
  },
  "USER_MODAL": {
    "TITLE": (data) => `${data.name}`,
    "ID": "Id",
    "USERNAME": "Username",
    "PERSONAL": "Personal",
    "FULL_NAME": "Full Name",
    "PHONE": "Phone",
    "PICTURE": "Picture",
    "EMAIL": "E-Mail",
    "EMAIL_ADD": "Add E-Mail",
    "PASSWORD": "Password",
    "PASSWORD_OLD": "Current Password",
    "PASSWORD_NEW": "New Password",
    "PASSWORD_NEW_REPEAT": "Repeat New Password",
    "PASSWORD_RANDOM": "Random Password",
    "ROLES": "Roles",
    "STATUS": "Status",
    "ERROR": {
      "PASSWORD_MINLENGTH": "Password must be at least 6 characters",
      "PASSWORD_MATCH": "Passwords do not match",
    }
  },
  "RESERVATION_CARD": {
    "HEADER": "Reservation",
    "ITEMS": "Items",
    "DESCRIPTION": (reservation) => `${reservation.type.text}. From ${moment(reservation.start).format('L')} until ${moment(reservation.end).format('L')}.`,
    "TYPE": "Type",
    "NAME": "Name",
    "START": "Start",
    "END": "End",
    "USER": "User",
    "GROUP": "Group",
    "CONTACT": "Contact",
    "DELETE": {
      "TITLE": (data) => `Delete ${data.name}?`,
      "SUB_TITLE": (data) => `Do you really want to delete reservation ${data.name}?`,
      "YES": "Yes",
      "NO": "No"
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
    "ITEMS_LIST": "Items"
  },
  "TABS": {
    "HOME": "Home",
    "ITEMS": "Items",
    "RESERVATIONS": "Reservations",
    "LOGIN": "Login",
    "SIGNUP": "Sign Up"
  },
  "RESERVATION": {
    "TYPE": {
      "GROUP": "Group",
      "PRIVATE": "Private"
    }
  },
  "ITEM": {
    "STATUS": {
      "PUBLIC": "Public",
      "HIDDEN": "Hidden"
    },
    "CONDITION": {
      "GOOD": "Good",
      "BAD": "Bad",
      "BROKEN": "Broken"
    }
  },
  "ITEM_STATE": {
    "TEXT": (data) => (data.comment?data.comment + "<br>\n":"") + _.join(data.texts, ", <br>\n"),
    "LAST_SERVICE": (data) => `Service at ${moment(data.lastService).toLocaleString()}`,
    "CONDITION_CONDITION_COMMENT": (data) => `Condition: ${data.conditionOption.text} (${data.conditionComment})`,
    "CONDITION": (data) => `Condition: ${data.conditionOption.text}`,
    "CONDITION_COMMENT": (data) => `Condition Comment: ${data.conditionComment}`,
    "NAME": (data) => `New Name: ${data.name}`,
    "DESCRIPTION": (data) => `New Description: ${data.description}`,
    "EXTERNAL_ID": (data) => `New External Id: ${data.externalId}`,
    "TAGS": (data) => `New Tags: ${_.join(data.tags, ', ')}`,
    "STATUS": (data) => `New Status: ${data.statusOption.text}`
  },
  "USER": {
    "STATUS": {
      "NORMAL": "Normal",
      "LOCKED": "Locked",
      "DISABLED": "Disabled",
      "DELETED": "Deleted"
    },
    "ROLES": {
      "ADMIN": "Administrator",
      "MANAGER": "Item Manager"
    }
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
  }
};
