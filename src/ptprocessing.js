function clearOldMDTasks () {
    let draftContent = editor.getText();
    const regex = /\s*- \[x\].*/g;
    draftContent = draftContent.replace(regex, "");
    editor.setText(draftContent);
}

function openFile() {
    let fileName = draft.content // Get file name from action
    let system = device.systemName; // Check device - will be macOS or iOS
    let rootPath = "";
    if (system === "macOS"){
        let rootPath = draft.getTemplateTag("macOS-root-path");
        if (rootPath == null || rootPath.trim().length == 0) {
            context.fail("Template Tag 'macOS-root-path'. Typically this is defined in the previous step of this action");
        }
        let fullPath = `${rootPath}/${fileName}`;
        let method = "execute";
        let script = `on execute(full_path)
		tell application "Finder" to open full_path as POSIX file
		end execute`;
        let runner = AppleScript.create(script);
        if (!runner.execute(method, [fullPath])) {
            alert(`Could not open file '${fullPath}' because of: \n` + runner.lastError);
            context.fail(`Unable to open file '${fullPath}'`);
        }
    }
    else {
        rootPath = draft.getTemplateTag("iOS-root-path");
        if (rootPath == null || rootPath.trim().length == 0) {
            context.fail("Template Tag 'iOS-root-path'. Typically this is defined in the previous step of this action");
        }

        url = "shareddocuments://" + rootPath + "/" + fileName
        app.openURL(url, false)
    }
}

function createFlashCards () {
// let workspace = Workspace.find("Flash Cards");
let workspaceName = draft.getTemplateTag("flashcard_workspace");
let workspace = Workspace.find(workspaceName);
let drafts = workspace.query("inbox");
if (drafts.length == 0) {
    let errorMsg = "Tried finding drafts in the Inbox for the workspace \"Flash Cards\" but nothing found. Exiting action";
    alert(errorMsg);
    context.fail(errorMsg);
} else {
    let csvText = "";
    for (let d of drafts) {
        let content = d.content.split("\n");
        console.log(d.content);
        let question = content[0];
        let answer = content[2];
        csvText += "\"" + question + "\"," + answer + "\"" + "\n";
    }

    let fmLocal = FileManager.createCloud(); // Local file in app container
    let filename = draft.getTemplateTag("flashcard_filename");
    let success = fmLocal.writeString("/flash.csv", csvText);
    var prompt = Prompt.create();
    prompt.title = "Archive Flash Cards?";
    prompt.message = `All Flash Cards in the Inbox have been exported to the file "iCloud Drive/Drafts/${filename}". Would you like to archive the drafts?`;
    prompt.isCancellable = false;
    prompt.addButton("Skip");
    prompt.addButton("Archive");

    let choice = prompt.show();

    if (prompt.buttonPressed == "Archive") {
        for (let d of drafts) {
            d.isArchived = true;
            d.update();
        }
    }

}

}