function replaceVariables() {
    let known_placeholders = {};
    let placeholders = [];

    let draftsContent = editor.getSelectedText();
    let matches = draftsContent.match(/«(.+?)»/g);

    for (let match in matches) {
        let placeholder = matches[match];
        known_placeholders[placeholder] = null;
        placeholders.push(placeholder);
    }

    if (placeholders.length === 0) {
        let alert = Prompt.create();
        alert.title = "No template placeholders were found.";
        alert.body = "If your project text has placeholders (that look like «this»), this script will prompt for values you'd like to substitute for them.";
        let alertCancelled = alert.addButton("Continue Anyway");
        if (alertCancelled === false) {
            cancel("User cancelled the script");
        }
    } else {
        for (let placeholder in known_placeholders) {
            let showPlaceholder = placeholder.replace("«", "");
            showPlaceholder = showPlaceholder.replace("»", "");
            let placeholderQuery = Prompt.create();
            placeholderQuery.title = placeholder;
            placeholderQuery.addTextField("placeholder", "", showPlaceholder);
            placeholderQuery.addButton("OK");
            placeholderQuery.isCancellable = false;
            placeholderQuery.show();

            draftsContent = draftsContent.replace(new RegExp(placeholder, 'g'), placeholderQuery.fieldValues["placeholder"]);
        }
    }

    return draftsContent;
}