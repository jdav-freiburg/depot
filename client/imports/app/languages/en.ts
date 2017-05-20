import * as _ from 'lodash';
import * as moment from 'moment';

export const en = {
  "HOME_PAGE": {
    "TITLE": "Home",
    "WELCOME": "Welcome back!"
  },
  "LOGIN_PAGE": {
    "TITLE": "Login",
    "EMAIL_OR_USERNAME": "E-Mail or Username",
    "PASSWORD": "Password",
    "LOG_IN": "Log In"
  },
  "ITEMS_PAGE": {
    "EXTERNAL_ID": "External ID",
    "NAME": "Name",
    "DESCRIPTION": "Description",
    "LAST_SERVICE": "Last Service",
    "CONDITION": "Condition",
    "CONDITION_COMMENT": "Condition Comment",
    "STATUS": "Status",
    "TAGS": "Tags",
    "FILTER": "Filter"
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
      "MESSAGE": "Do you want to save before leaving?",
      "CANCEL": "Back",
      "LEAVE": "Leave",
      "SAVE": "Save"
    },
    "FILTER": "Filter"
  },
  "RESERVATIONS_PAGE": {
    "TITLE": "Reservations",
    "TYPE": "Type",
    "NAME": "Name",
    "START": "Start",
    "END": "End",
    "USER": "User",
    "GROUP": "Group",
    "CONTACT": "Contact",
    "DELETE": {
      "TITLE": (data) => `Delete ${data.name}?`,
      "MESSAGE": (data) => `Do you really want to delete reservation ${data.name}?`,
      "YES": "Yes",
      "NO": "No"
    },
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
    "SIGN_UP": "Sign Up"
  },
  "USERS_PAGE": {
    "TITLE": "Users",
    "USERNAME": "Username",
    "EMAIL": "E-Mail",
    "FULL_NAME": "Full Name",
    "PHONE": "Phone",
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
    "ROLES": "Roles"
  },
  "SIDEMENU": {
    "USERS": "Users",
    "LOGOUT": "Log Out"
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
      "100": "Ok",
      "50": "Damaged",
      "0": "Broken"
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
  "ROLES": {
    "admin": "Administrator",
    "manager": "Item Manager"
  },
  "ERROR": {
    "GENERAL": (data) => `${data.message}`,
    "Incorrect password": "Incorrect Password",
    "User not found": "User not found"
  }
};
