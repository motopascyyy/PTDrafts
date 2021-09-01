function clearOldMDTasks () {
    let draftContent = editor.getText();
    const regex = /\s*- \[x\].*/g;
    draftContent = draftContent.replace(regex, "");
    editor.setText(draftContent);
}