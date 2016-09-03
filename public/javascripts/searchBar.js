function getTextFromBar() {
    return $('#query').val();
}
function redirectToSearch() {
    window.location.href = "/results/" + getTextFromBar();
}
$(document).ready(function () {
    $('#searchbtn').click(redirectToSearch);
    $('#query').bind('keypress', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) {
            e.preventDefault();
            redirectToSearch();
        }
    });
});
