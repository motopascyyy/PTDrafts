// Prompt for title of Task in OF with Default being the name of the Draft itself (safe title)
// Copy the contents of the draft to a variable

let ofTaskName = draft.processTemplate("[[safe_title]]");

let draftLink = draft.permalink;
const baseURL = "omnifocus:///add?"

let cb = CallbackURL.create();
cb.baseURL = baseURL;
cb.addParameter("name", ofTaskName);
cb.addParameter("note",draftLink);
cb.waitForResponse = true;

// open and wait for result
let success = cb.open();
if (success) {
    let response = cb.callbackResponse;
    console.log("Taskpaper added to OF");
    draft.append("\n\n[[url:" + response['result'] + "]]");
}
else { // something went wrong or was cancelled
    console.log(cb.status);
    if (cb.status == "cancel") {
        context.cancel();
    }
    else {
        context.fail();
    }
}
